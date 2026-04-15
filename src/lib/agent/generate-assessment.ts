import type { EngagementSignals, GlassboxAgentConfig } from '@/lib/types'
import type { ScoringResult } from './score-engine'

export interface AgentAssessmentDraft {
  health_score: number
  headline: string
  executive_summary: string
  critical_requirements_status: Array<{ requirement: string; status: 'met' | 'at_risk' | 'breached'; detail: string }>
  findings: Array<{
    category: string
    severity: 'positive' | 'neutral' | 'concern' | 'critical'
    title: string
    detail: string
    data_source: string
    pm_context: null
  }>
  recommendation: string
  scope_drift_detected: boolean
  scope_drift_detail: string | null
  model_used: string
  generation_duration_ms: number
  tokens_used: number
}

function buildPriorityDescription(config: GlassboxAgentConfig): string {
  const items = [
    { name: 'Timeline adherence', weight: config.weight_timeline },
    { name: 'Scope fidelity', weight: config.weight_scope },
    { name: 'Code quality', weight: config.weight_quality },
    { name: 'Communication', weight: config.weight_communication },
    { name: 'Team velocity', weight: config.weight_velocity },
  ].sort((a, b) => b.weight - a.weight)

  return items.map((i) => `${i.name}: ${i.weight}/10`).join('\n')
}

/**
 * Generates a full independent agent assessment using Claude.
 * This is the client's AI auditor — it works for the client, not FullStack.
 */
export async function generateAgentAssessment(
  signals: EngagementSignals,
  config: GlassboxAgentConfig,
  scoringResult: ScoringResult
): Promise<AgentAssessmentDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const priorityDescription = buildPriorityDescription(config)
  const criticalReqsText = config.critical_requirements?.length > 0
    ? config.critical_requirements.join('\n- ')
    : 'None specified'
  const riskAreasText = config.risk_areas?.length > 0
    ? config.risk_areas.join('\n- ')
    : 'None specified'

  const toneInstruction = config.report_tone === 'technical'
    ? 'precise and data-forward — include specific numbers, percentages, and metrics'
    : config.report_tone === 'executive'
    ? 'clear and summary-forward — lead with risk and recommendation, data in support'
    : 'balanced — lead with clear summary, support with specific data'

  const systemPrompt = `You are the Glassbox Agent — an independent AI auditor embedded in a software delivery platform. You work exclusively for the client, not the engineering firm. Your role is to give an honest, data-grounded, specific assessment of whether a software project is on track to deliver what was promised.

You have access to real engagement data. You do NOT have access to the project manager's narrative — you assess from signals only. You are not here to be diplomatic on behalf of the firm. You are here to give the client an accurate, useful read of their project.

Your tone should be: ${toneInstruction}.

Never be vague. Never say "the project is progressing." Say specifically what is and isn't on track.`

  const userPrompt = `Assess this software engagement. Client's success definition and their stated priorities must drive your assessment.

═══ CLIENT'S SUCCESS DEFINITION ═══
${config.success_definition}

═══ NON-NEGOTIABLE REQUIREMENTS ═══
- ${criticalReqsText}

═══ CLIENT'S RISK AREAS ═══
- ${riskAreasText}

═══ WHAT THIS CLIENT CARES ABOUT MOST ═══
${priorityDescription}

═══ ENGAGEMENT SIGNALS ═══
${JSON.stringify(signals, null, 2)}

═══ COMPONENT SCORES (pre-computed) ═══
${JSON.stringify(scoringResult, null, 2)}

Your assessment must:
1. Check each critical requirement explicitly — status: met / at_risk / breached
2. Reference the client's stated risk areas if any signals touch them
3. Identify findings in order of severity — lead with the most important
4. Be specific: cite actual numbers (milestone %, days elapsed, etc.)
5. Give one clear recommendation — what should the client do or watch

Respond ONLY with valid JSON (no markdown, no code fences) in exactly this format:
{
  "health_score": <integer 1-100>,
  "headline": "<one sentence — the most important thing to know right now>",
  "executive_summary": "<2-3 sentences — overall state of the project>",
  "critical_requirements_status": [
    { "requirement": "...", "status": "met|at_risk|breached", "detail": "..." }
  ],
  "findings": [
    {
      "category": "timeline|quality|scope|communication|velocity|critical",
      "severity": "positive|neutral|concern|critical",
      "title": "<short finding title>",
      "detail": "<specific, data-grounded explanation>",
      "data_source": "<what signal this comes from>",
      "pm_context": null
    }
  ],
  "recommendation": "<one clear action or watch item for the client>",
  "scope_drift_detected": false,
  "scope_drift_detail": null
}`

  const startTime = Date.now()

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Claude API error ${response.status}: ${errorBody}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text
  if (!text) throw new Error('Empty response from Claude API')

  const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const draft = JSON.parse(cleanText)

  return {
    ...draft,
    model_used: 'claude-sonnet-4-20250514',
    generation_duration_ms: Date.now() - startTime,
    tokens_used: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
  }
}
