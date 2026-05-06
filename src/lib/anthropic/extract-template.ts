// Smart-intake orchestrator. Takes the questionnaire + extracted file
// payloads, calls Claude Sonnet 4.6, parses + validates the response,
// and returns a populated OutcomeTemplate ready to insert as a draft.
//
// Exposed as an AsyncGenerator so the route handler can fan progress
// events out to the client over SSE without coupling to its transport.

import type { Anthropic } from '@anthropic-ai/sdk'
import { z } from 'zod'

import { getAnthropicClient, SMART_INTAKE_MODEL } from './client'
import {
  buildSystemPrompt,
  buildUserPrompt,
  RETRY_SYSTEM_ADDENDUM,
  type FilePayload,
  type QuestionnaireResponses,
} from './prompts/extract-template'
import { ICON_NAMES } from '@/lib/icons'
import type { ExtractErrorCode } from '@/lib/files/types'
import type { OutcomeTemplate } from '@/lib/types'

// ─── Public types ───────────────────────────────────────────────────────────

export type ExtractionEvent =
  | { stage: 'preparing' }
  | { stage: 'calling_claude'; attempt: 1 | 2 }
  | { stage: 'received_response' }
  | { stage: 'parsing' }
  | { stage: 'retry'; reason: string }
  | { stage: 'validating' }

export type ExtractionResult =
  | {
      ok: true
      template: Partial<OutcomeTemplate>
      ai_suggested_fields: string[]
      usage: {
        input_tokens: number
        output_tokens: number
        latency_ms: number
        model: string
      }
    }
  | {
      ok: false
      code: ExtractErrorCode
      message: string
      details?: string
      retryable: boolean
    }

export interface ExtractInput {
  questionnaire: QuestionnaireResponses
  files: FilePayload[]
  // Allow tests to inject a mocked client.
  client?: Anthropic
}

// ─── Zod schema (permissive — structure-only, not publish-time rules) ───────

const SignalSpec = z.object({
  source: z.enum(['github', 'linear', 'jira', 'slack', 'daily_report', 'ci', 'manual']),
  signature: z.string(),
  required: z.boolean(),
  description: z.string().optional(),
})

const Deliverable = z.object({
  id: z.string(),
  order: z.number(),
  name: z.string(),
  description: z.string().optional(),
  acceptance_criteria: z.array(z.string()),
})

const MilestoneTemplate = z.object({
  id: z.string(),
  order: z.number(),
  name: z.string(),
  duration: z.object({
    min_days: z.number(),
    max_days: z.number(),
    fixed_label: z.string().optional(),
  }),
  description: z.string(),
  acceptance_criteria: z.array(z.string()),
  expected_signals: z.array(SignalSpec),
})

const IntakeField = z.object({
  id: z.string(),
  order: z.number(),
  label: z.string(),
  type: z.enum([
    'text',
    'textarea',
    'email',
    'url',
    'select',
    'multiselect',
    'number',
  ]),
  required: z.boolean(),
  placeholder: z.string().optional(),
  help_text: z.string().optional(),
  options: z.array(z.string()).optional(),
  validation: z.string().optional(),
  maps_to: z.string().optional(),
})

const ExtractedTemplate = z.object({
  slug: z.string(),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  icon: z.string(),
  category: z.string(),
  pricing: z.object({
    model: z.enum(['fixed_range', 'starting_at', 'custom']).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.literal('USD').optional(),
    notes: z.string().optional(),
  }),
  timeline: z.object({
    min_days: z.number().optional(),
    max_days: z.number().optional(),
    unit: z.enum(['business_days', 'calendar_days', 'weeks']).optional(),
    starts_from: z.enum(['kickoff', 'contract_signed', 'intake_completed']).optional(),
    notes: z.string().optional(),
  }),
  deliverables: z.array(Deliverable),
  milestone_templates: z.array(MilestoneTemplate),
  intake_schema: z.object({ fields: z.array(IntakeField) }),
  delivery_config: z
    .object({
      typical_team: z.array(
        z.object({
          role: z.enum([
            'forward_deployed_engineer',
            'product_designer',
            'ai_engineer',
            'qa_engineer',
            'devops_engineer',
            'pm',
          ]),
          count: z.number(),
          seniority: z.enum(['junior', 'mid', 'senior', 'principal', 'staff']),
          allocation_percent: z.number(),
        })
      ),
      ai_agents: z.array(
        z.object({
          tool: z.enum(['claude_code', 'cursor', 'windsurf', 'github_copilot']),
          prompt_library_ref: z.string().optional(),
        })
      ),
      toolchain: z.object({
        language: z.array(z.string()),
        frameworks: z.array(z.string()),
        testing: z.array(z.string()),
        ci_cd: z.array(z.string()),
        hosting: z.array(z.string()),
        monitoring: z.array(z.string()),
      }),
      environment_template_id: z.string().optional(),
      expected_velocity_multiplier: z.number().optional(),
      internal_runbook_url: z.string().optional(),
      internal_notes: z.string().optional(),
    })
    .partial(),
  audit_config_defaults: z.object({
    priority_weights: z.object({
      timeline: z.number(),
      quality: z.number(),
      scope: z.number(),
      communication: z.number(),
      velocity: z.number(),
    }),
    alert_thresholds: z.object({ critical: z.number(), warning: z.number() }),
    report_cadence: z.enum(['daily', 'every_2_days', 'weekly']),
    report_tone: z.enum(['technical', 'executive', 'balanced']),
    pm_review_window_hours: z.number(),
  }),
  guarantees: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      description: z.string().optional(),
      icon: z.string(),
    })
  ),
})

type ExtractedTemplate = z.infer<typeof ExtractedTemplate>

// ─── JSON parsing with markdown-fence tolerance ─────────────────────────────

function extractJsonBlock(raw: string): string {
  // Strip ``` fences (with or without 'json' tag) if Claude included them.
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch) return fenceMatch[1].trim()

  // Fallback: slice from first '{' to last '}'. Handles preamble/trailing text.
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start >= 0 && end > start) return raw.slice(start, end + 1)

  return raw.trim()
}

function tryParse(raw: string): unknown {
  return JSON.parse(extractJsonBlock(raw))
}

// ─── Path computation for ai_suggested_fields ───────────────────────────────

const QUESTIONNAIRE_PATHS = new Set(['title', 'category', 'slug'])

function collectAISuggestedPaths(t: ExtractedTemplate): string[] {
  const paths: string[] = []
  const consider = (path: string, populated: boolean) => {
    if (!populated) return
    if (QUESTIONNAIRE_PATHS.has(path)) return
    paths.push(path)
  }

  consider('subtitle', !!t.subtitle?.trim())
  consider('description', !!t.description?.trim())
  consider('icon', !!t.icon?.trim())
  consider('pricing', !!(t.pricing?.min || t.pricing?.max || t.pricing?.notes))
  consider('timeline', !!(t.timeline?.min_days || t.timeline?.max_days || t.timeline?.notes))
  consider('deliverables', (t.deliverables ?? []).length > 0)
  consider('milestone_templates', (t.milestone_templates ?? []).length > 0)
  consider('intake_schema', (t.intake_schema?.fields ?? []).length > 0)
  consider('delivery_config', !!t.delivery_config && Object.keys(t.delivery_config).length > 0)
  consider('audit_config_defaults', !!t.audit_config_defaults?.priority_weights)
  consider('guarantees', (t.guarantees ?? []).length > 0)

  return paths
}

// ─── Icon coercion (keep AI output renderable on the L1 card) ───────────────

function coerceIcon(name: string | undefined): string {
  if (!name) return 'Sparkles'
  if ((ICON_NAMES as readonly string[]).includes(name)) return name
  // Best-effort match: Claude sometimes returns lowercase or kebab-case
  const normalized = name.replace(/[-_\s]/g, '').toLowerCase()
  const match = (ICON_NAMES as readonly string[]).find(
    (n) => n.toLowerCase() === normalized
  )
  return match ?? 'Sparkles'
}

// ─── The orchestrator ───────────────────────────────────────────────────────

const MAX_TOKENS = 8000

async function callClaude(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string
): Promise<{ text: string; input_tokens: number; output_tokens: number }> {
  const stream = client.messages.stream({
    model: SMART_INTAKE_MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        // Cache the (large, stable) system prompt for ~5 minutes to make
        // back-to-back extractions cheap.
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const finalMessage = await stream.finalMessage()
  const text = finalMessage.content
    .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
    .map((b) => b.text)
    .join('')

  return {
    text,
    input_tokens: finalMessage.usage.input_tokens,
    output_tokens: finalMessage.usage.output_tokens,
  }
}

export async function* extractTemplate(
  input: ExtractInput
): AsyncGenerator<ExtractionEvent, ExtractionResult, void> {
  const startedAt = Date.now()
  let client: Anthropic
  try {
    client = input.client ?? getAnthropicClient()
  } catch (err) {
    return {
      ok: false,
      code: 'AUTH_ERROR',
      message: 'Anthropic API key is not configured.',
      details: err instanceof Error ? err.message : String(err),
      retryable: false,
    }
  }

  yield { stage: 'preparing' }

  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildUserPrompt({
    questionnaire: input.questionnaire,
    files: input.files,
  })

  // ── First attempt ────────────────────────────────────────────────────
  let response: { text: string; input_tokens: number; output_tokens: number }
  try {
    yield { stage: 'calling_claude', attempt: 1 }
    response = await callClaude(client, systemPrompt, userPrompt)
  } catch (err) {
    return apiError(err)
  }

  yield { stage: 'received_response' }
  yield { stage: 'parsing' }

  if (!response.text.trim()) {
    return {
      ok: false,
      code: 'EMPTY_RESPONSE',
      message: 'Claude returned no content.',
      retryable: true,
    }
  }

  let parsed: unknown
  try {
    parsed = tryParse(response.text)
  } catch (err) {
    yield { stage: 'retry', reason: 'JSON parse failed on first attempt' }
    try {
      yield { stage: 'calling_claude', attempt: 2 }
      response = await callClaude(client, systemPrompt + RETRY_SYSTEM_ADDENDUM, userPrompt)
      yield { stage: 'parsing' }
      parsed = tryParse(response.text)
    } catch (err2) {
      return {
        ok: false,
        code: 'INVALID_JSON',
        message: "Claude's response could not be parsed as JSON, even after a retry.",
        details:
          (err2 instanceof Error ? err2.message : String(err2)) +
          ' (first attempt: ' +
          (err instanceof Error ? err.message : String(err)) +
          ')',
        retryable: true,
      }
    }
  }

  // ── Validate ─────────────────────────────────────────────────────────
  yield { stage: 'validating' }

  const validation = ExtractedTemplate.safeParse(parsed)
  if (!validation.success) {
    return {
      ok: false,
      code: 'INVALID_JSON',
      message: 'The extracted JSON did not match the expected template shape.',
      details: validation.error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
        .join('; '),
      retryable: true,
    }
  }

  const tpl = validation.data
  const ai_suggested_fields = collectAISuggestedPaths(tpl)

  // Force draft-only fields (the model occasionally invents these).
  const template: Partial<OutcomeTemplate> = {
    slug: tpl.slug,
    title: tpl.title,
    subtitle: tpl.subtitle,
    description: tpl.description,
    icon: coerceIcon(tpl.icon),
    category: tpl.category,
    pricing: tpl.pricing,
    timeline: tpl.timeline,
    price_range_low: tpl.pricing?.min ?? null,
    price_range_high: tpl.pricing?.max ?? null,
    timeline_range_low: tpl.timeline?.min_days ?? null,
    timeline_range_high: tpl.timeline?.max_days ?? null,
    deliverables: tpl.deliverables,
    milestone_templates: tpl.milestone_templates,
    intake_schema: tpl.intake_schema,
    delivery_config: tpl.delivery_config as OutcomeTemplate['delivery_config'],
    audit_config_defaults: tpl.audit_config_defaults,
    guarantees: tpl.guarantees,
    status: 'draft',
    version: '0.1.0',
    published_at: null,
  }

  return {
    ok: true,
    template,
    ai_suggested_fields,
    usage: {
      input_tokens: response.input_tokens,
      output_tokens: response.output_tokens,
      latency_ms: Date.now() - startedAt,
      model: SMART_INTAKE_MODEL,
    },
  }
}

function apiError(err: unknown): ExtractionResult {
  // Anthropic SDK errors have a status code we can branch on.
  const status = (err as { status?: number })?.status
  if (status === 429) {
    return {
      ok: false,
      code: 'RATE_LIMITED',
      message:
        'Anthropic rate limit reached. Try again in a minute, or use copy-from-template / manual intake.',
      details: err instanceof Error ? err.message : String(err),
      retryable: true,
    }
  }
  if (status === 401 || status === 403) {
    return {
      ok: false,
      code: 'AUTH_ERROR',
      message: 'The Anthropic API rejected our credentials. Check ANTHROPIC_API_KEY.',
      details: err instanceof Error ? err.message : String(err),
      retryable: false,
    }
  }
  return {
    ok: false,
    code: 'API_ERROR',
    message:
      'Calling Claude failed. This is usually transient — retry, or fall back to manual intake.',
    details: err instanceof Error ? err.message : String(err),
    retryable: true,
  }
}
