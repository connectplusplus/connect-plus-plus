// SOW drafter orchestrator. Takes the engagement's template snapshot +
// intake responses, calls Claude Sonnet 4.6, parses + validates the
// response, and returns a populated SowContent ready to upsert into the
// sows row.
//
// Exposed as an AsyncGenerator so the route handler can fan progress
// events out to the client over SSE without coupling to its transport.
//
// Mirrors src/lib/anthropic/extract-template.ts: same retry-once-on-bad-
// JSON shape, same Zod validation pattern, same structured error codes,
// same ephemeral cache_control on the system prompt.

import type { Anthropic } from '@anthropic-ai/sdk'
import { z } from 'zod'

import { getAnthropicClient, SOW_DRAFT_MODEL } from './client'
import { CANONICAL_SOW_EXAMPLE_JSON } from './sow-canonical-example'
import {
  buildSystemPrompt,
  buildUserPrompt,
  RETRY_SYSTEM_ADDENDUM,
  type DraftSowUserInput,
} from './prompts/draft-sow'
import type { SowContent } from '@/lib/types'

// ─── Public types ───────────────────────────────────────────────────────────

export type DraftSowErrorCode =
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'API_ERROR'
  | 'EMPTY_RESPONSE'
  | 'INVALID_JSON'

export type DraftSowEvent =
  | { stage: 'preparing' }
  | { stage: 'calling_claude'; attempt: 1 | 2 }
  | { stage: 'received_response' }
  | { stage: 'parsing' }
  | { stage: 'retry'; reason: string }
  | { stage: 'validating' }

export type DraftSowResult =
  | {
      ok: true
      content: SowContent
      // Dot-paths into SowContent that the AI populated. Same convention
      // as smart-intake's ai_suggested_fields. The editor renders an "AI"
      // pill next to each.
      ai_drafted_fields: string[]
      usage: {
        input_tokens: number
        output_tokens: number
        latency_ms: number
        model: string
      }
    }
  | {
      ok: false
      code: DraftSowErrorCode
      message: string
      details?: string
      retryable: boolean
    }

export interface DraftSowInput extends DraftSowUserInput {
  // Allow tests to inject a mocked client.
  client?: Anthropic
}

// ─── Zod schema (structure-only — content quality is the PM's job) ──────────

const Deliverable = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  acceptance_criteria: z.array(z.string().min(1)).min(2),
})

const Milestone = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  payment_pct: z.number().min(0).max(100),
  expected_business_days: z.number().min(0),
})

const Pricing = z.object({
  total_cents: z.number().int().nonnegative(),
  currency: z.literal('USD'),
  payment_terms_md: z.string().min(1),
})

const SowContentSchema = z.object({
  scope_summary: z.string().min(1),
  deliverables: z.array(Deliverable).min(1),
  milestones: z.array(Milestone).min(1),
  pricing: Pricing,
  timeline_business_days: z.number().int().positive(),
  terms_md: z.string().min(1),
})

// ─── JSON parsing with markdown-fence tolerance ─────────────────────────────

function extractJsonBlock(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch) return fenceMatch[1].trim()

  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start >= 0 && end > start) return raw.slice(start, end + 1)

  return raw.trim()
}

function tryParse(raw: string): unknown {
  return JSON.parse(extractJsonBlock(raw))
}

// ─── Provenance: every populated top-level field gets a dot-path ────────────
// We mark all top-level paths as AI-drafted on a successful generation. The
// editor lets Carlos dismiss each pill once he's reviewed the field; the
// dismissal persists as an update to sows.ai_drafted_fields.

const TOP_LEVEL_AI_PATHS = [
  'scope_summary',
  'deliverables',
  'milestones',
  'pricing',
  'timeline_business_days',
  'terms_md',
] as const

// ─── Streaming Claude call ──────────────────────────────────────────────────

const MAX_TOKENS = 6000

async function callClaude(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string
): Promise<{ text: string; input_tokens: number; output_tokens: number }> {
  const stream = client.messages.stream({
    model: SOW_DRAFT_MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        // Cache the (large, stable) system prompt for ~5 minutes so back-
        // to-back redrafts pay near-zero on system content.
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

// ─── The orchestrator ───────────────────────────────────────────────────────

export async function* draftSow(
  input: DraftSowInput
): AsyncGenerator<DraftSowEvent, DraftSowResult, void> {
  const startedAt = Date.now()

  // ── Mock path for e2e tests ─────────────────────────────────────────
  if (process.env.SOW_DRAFT_MOCK === '1') {
    yield { stage: 'preparing' }
    yield { stage: 'calling_claude', attempt: 1 }
    await new Promise((r) => setTimeout(r, 50))
    yield { stage: 'received_response' }
    yield { stage: 'parsing' }
    yield { stage: 'validating' }
    const parsed = JSON.parse(CANONICAL_SOW_EXAMPLE_JSON) as SowContent
    return {
      ok: true,
      content: parsed,
      ai_drafted_fields: [...TOP_LEVEL_AI_PATHS],
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        latency_ms: Date.now() - startedAt,
        model: 'mock',
      },
    }
  }

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
    template_snapshot: input.template_snapshot,
    intake_responses: input.intake_responses,
    company_name: input.company_name,
    contact_name: input.contact_name,
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

  const validation = SowContentSchema.safeParse(parsed)
  if (!validation.success) {
    return {
      ok: false,
      code: 'INVALID_JSON',
      message: 'The drafted SOW JSON did not match the expected SowContent shape.',
      details: validation.error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
        .join('; '),
      retryable: true,
    }
  }

  const content = validation.data

  return {
    ok: true,
    content,
    ai_drafted_fields: [...TOP_LEVEL_AI_PATHS],
    usage: {
      input_tokens: response.input_tokens,
      output_tokens: response.output_tokens,
      latency_ms: Date.now() - startedAt,
      model: SOW_DRAFT_MODEL,
    },
  }
}

function apiError(err: unknown): DraftSowResult {
  const status = (err as { status?: number })?.status
  if (status === 429) {
    return {
      ok: false,
      code: 'RATE_LIMITED',
      message:
        'Anthropic rate limit reached. Try again in a minute, or fall back to manual SOW entry.',
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
      'Calling Claude failed. This is usually transient — retry, or fall back to manual SOW entry.',
    details: err instanceof Error ? err.message : String(err),
    retryable: true,
  }
}
