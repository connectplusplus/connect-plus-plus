import type { EngagementSignals, ReportDraft, GeneratedReport } from '@/lib/types'
import { collectEngagementSignals } from './collect-signals'
import { computeBaselineScore } from './baseline-score'
import type { SupabaseClient } from '@supabase/supabase-js'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `You are the AI delivery intelligence engine for Glassbox by FullStack Labs.
You analyze software project data and generate concise, professional daily reports for Project Managers to review and send to clients.

Your reports are factual, specific, and written in first-person plural ("We completed...", "We are...").
Never use vague language. Reference specific milestones, deliverables, and blockers by name.
Never mention AI, scores, or internal systems in client-visible text.
Keep each section to 2-4 sentences maximum.
If a milestone is blocked, explain the impact clearly.
If the project is ahead of schedule, acknowledge it specifically.`

async function callClaudeForDraft(
  signals: EngagementSignals,
  baselineScore: number
): Promise<ReportDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Generate a daily project report draft based on this engagement data:

${JSON.stringify(signals, null, 2)}

Baseline health score computed from metrics: ${baselineScore}/100

Respond with ONLY a JSON object (no markdown, no code fences, no explanation) in this exact format:
{
  "health_score": <integer 1-100, informed by but not required to exactly match baseline>,
  "health_reasoning": "<2-3 sentences explaining the score for the PM — specific, data-driven, mentions key factors>",
  "accomplishments": "<what the team accomplished today/recently — specific, references milestone names and deliverables>",
  "blockers": "<current blockers if any, or null if none>",
  "plan_tomorrow": "<concrete plan for the next working day — references upcoming deliverables>",
  "ai_velocity_note": "<internal observation about delivery efficiency, AI tool usage patterns, or process observations — PM only, not client-facing>"
}`
      }],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Claude API error ${response.status}: ${errorBody}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text

  if (!text) throw new Error('Empty response from Claude API')

  // Parse JSON — handle potential markdown fences
  const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const reportDraft = JSON.parse(cleanText) as ReportDraft

  // Validate required fields
  if (!reportDraft.health_score || !reportDraft.accomplishments || !reportDraft.plan_tomorrow) {
    throw new Error('Incomplete report draft from Claude')
  }

  return {
    health_score: Math.max(1, Math.min(100, Math.round(reportDraft.health_score))),
    health_reasoning: reportDraft.health_reasoning ?? 'Score based on engagement metrics.',
    accomplishments: reportDraft.accomplishments,
    blockers: reportDraft.blockers || null,
    plan_tomorrow: reportDraft.plan_tomorrow,
    ai_velocity_note: reportDraft.ai_velocity_note || null,
  }
}

/**
 * Generates a full AI-driven report draft for an engagement.
 * Collects signals → computes baseline → calls Claude → returns complete draft.
 * Falls back to manual mode if AI generation fails.
 */
export async function generateEngagementReport(
  engagementId: string,
  supabase: SupabaseClient
): Promise<GeneratedReport> {
  // Step 1: Collect all signals
  const signals = await collectEngagementSignals(engagementId, supabase)

  // Step 2: Compute deterministic baseline score
  const baselineScore = computeBaselineScore(signals)

  // Step 3: Call Claude for the full draft
  try {
    const draft = await callClaudeForDraft(signals, baselineScore)
    return {
      signals,
      baselineScore,
      draft,
      generated_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[AI Report Generation] Failed:', error)

    // Fallback: structured but non-AI draft
    return {
      signals,
      baselineScore,
      draft: {
        health_score: baselineScore,
        health_reasoning: `Score of ${baselineScore} computed from milestone progress (${signals.milestones.percent_complete}% complete vs ${signals.milestones.expected_percent_complete}% expected) and timeline data.`,
        accomplishments: '',
        blockers: signals.milestones.blocked > 0
          ? `${signals.milestones.blocked} milestone(s) currently blocked.`
          : null,
        plan_tomorrow: '',
        ai_velocity_note: null,
      },
      generated_at: new Date().toISOString(),
      fallback: true,
    }
  }
}
