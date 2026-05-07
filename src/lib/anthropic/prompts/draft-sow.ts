// System + user prompts for the SOW drafting call.
//
// Mirrors the structure of prompts/extract-template.ts: a stable, large
// SCHEMA_TS / RULES / WORKED_EXAMPLE / OUTPUT_RULES system prompt that's
// marked for ephemeral prompt caching, plus a user prompt that varies per
// engagement.
//
// We embed the SowContent shape as a TypeScript string rather than reading
// it dynamically from src/lib/types.ts. This is the same choice the smart-
// intake module makes: the embedded shape is what the canonical example
// and the validator are tied to, and dynamic AST extraction would be a
// larger change for no immediate gain. Whenever SowContent moves in
// types.ts, update SCHEMA_TS here and the canonical example to match.

import { CANONICAL_SOW_EXAMPLE_JSON } from '../sow-canonical-example'
import type { OutcomeTemplate } from '@/lib/types'

const SCHEMA_TS = `
// The shape Claude must output. Matches src/lib/types.ts SowContent.
interface SowContent {
  scope_summary: string;             // 2–4 paragraphs; Markdown-friendly but no headers
  deliverables: SowDeliverable[];    // ≥3 entries
  milestones: SowMilestone[];        // ≥3 entries; payment_pct sums to exactly 100
  pricing: SowPricing;
  timeline_business_days: number;    // total elapsed business days, kickoff to handoff
  terms_md: string;                  // 4–8 line markdown snippet (see OUTPUT RULES)
}

interface SowDeliverable {
  name: string;                      // 5–80 chars, client-facing
  description: string;               // 1–3 sentences
  acceptance_criteria: string[];     // ≥2 items, verifiable, binary, client-readable
}

interface SowMilestone {
  name: string;                      // a named outcome, not a task list
  description: string;               // one client-facing sentence
  payment_pct: number;               // 0–100; all milestones sum to exactly 100
  expected_business_days: number;    // duration of this milestone
}

interface SowPricing {
  total_cents: number;               // single fixed price; CENTS as integer
  currency: 'USD';                   // USD only in this sprint
  payment_terms_md: string;          // markdown — schedule, net terms, method
}
`.trim()

const OUTPUT_RULES = `
OUTPUT RULES

1. Output ONLY valid JSON matching the SowContent shape above. No
   markdown fences, no commentary, no preamble, no trailing text.
2. Pricing must be a single fixed price (not a range). Default to the
   midpoint of the template's pricing range, rounded to the nearest $500
   ($50,000 cents). Convert to CENTS as an integer in pricing.total_cents.
   currency MUST be "USD".
3. timeline_business_days defaults to the template's timeline_range_high
   (be conservative — under-promise). Match the unit in the template; if
   the template uses calendar_days or weeks, convert to business days
   before populating timeline_business_days.
4. Every milestone MUST have a non-zero payment_pct, and the sum across
   all milestones MUST be exactly 100. Distribute proportionally to
   inferred effort, weighted slightly toward the end. The FINAL milestone
   MUST receive at least 30%.
5. Every deliverable MUST have at least 2 acceptance_criteria entries,
   each verifiable and binary. Bad: "high quality". Good: "≥80% test
   coverage on new code per CI report".
6. terms_md is a 4–8 line markdown snippet covering, in order:
   change requests; intellectual property; warranty (default 30 days);
   confidentiality; governing law (omit if the template has no
   jurisdiction signal). Use the template's \`guarantees\` field if
   present to reinforce warranty/quality language.
7. scope_summary is 2–4 short paragraphs, NO markdown headers. The first
   paragraph names the work. The middle paragraph(s) explain how it
   proceeds. The last paragraph points the reader at the deliverables
   and milestones below.
8. payment_terms_md is markdown. At minimum cover: payment schedule
   (tie to milestone payment_pct), net terms (default Net 15), late
   fees, and payment method (ACH/wire).
9. NEVER invent details that aren't supported by the template snapshot or
   intake responses. If the template is silent on something (e.g.
   governing law), prefer to omit rather than guess.
`.trim()

const RULES_OF_THUMB = `
RULES OF THUMB

A good acceptance criterion is:
  - Verifiable: someone can check whether it happened
  - Binary: it's done or it isn't
  - Client-readable: written in the client's language, not engineering jargon

A good milestone is:
  - A named outcome, not a task list ("Build phase — unit and integration",
    not "PR #1, PR #2, PR #3")
  - Has a duration matched to its scope
  - Payment_pct reflects the relative client value of the milestone, with
    a tilt toward the end (final milestone ≥ 30%)

A good deliverable is:
  - Something the client receives at end of engagement
  - Distinct from milestones (which are time-bounded phases of work)
  - Has acceptance_criteria the engagement audit can verify
`.trim()

export function buildSystemPrompt(): string {
  return [
    'You are an expert at drafting Statements of Work for engineering services engagements. Your output is reviewed and edited by a Project Manager at FullStack Labs before any client sees it. Your goal is a complete, valid SowContent JSON object that the PM can polish in minutes — not a pristine final contract.',
    '',
    'TYPESCRIPT SCHEMA',
    '',
    SCHEMA_TS,
    '',
    'WORKED EXAMPLE',
    '',
    'A complete, well-formed SowContent looks exactly like this (drafted from the seeded "automated-testing-setup" template at the midpoint of its pricing range):',
    '',
    CANONICAL_SOW_EXAMPLE_JSON,
    '',
    OUTPUT_RULES,
    '',
    RULES_OF_THUMB,
    '',
    'Output the JSON object now. Nothing else.',
  ].join('\n')
}

export interface DraftSowUserInput {
  template_snapshot: Partial<OutcomeTemplate>
  intake_responses: Record<string, unknown>
  company_name: string
  contact_name?: string
}

export function buildUserPrompt(input: DraftSowUserInput): string {
  const lines: string[] = []
  const tpl = input.template_snapshot

  lines.push('ENGAGEMENT CONTEXT')
  lines.push('==================')
  lines.push(`Client company: ${input.company_name}`)
  if (input.contact_name) lines.push(`Primary contact: ${input.contact_name}`)
  lines.push('')

  lines.push('TEMPLATE SNAPSHOT')
  lines.push('=================')
  lines.push(`Title: ${tpl.title ?? '(missing)'}`)
  if (tpl.subtitle) lines.push(`Subtitle: ${tpl.subtitle}`)
  if (tpl.description) lines.push(`Description: ${tpl.description}`)
  if (tpl.category) lines.push(`Category: ${tpl.category}`)

  if (tpl.pricing) {
    const min = tpl.pricing.min ?? tpl.price_range_low ?? null
    const max = tpl.pricing.max ?? tpl.price_range_high ?? null
    const notes = tpl.pricing.notes ?? null
    lines.push(
      `Pricing range: ${min !== null ? `$${(min / 100).toLocaleString()}` : '?'} – ${max !== null ? `$${(max / 100).toLocaleString()}` : '?'} ${tpl.pricing.currency ?? 'USD'}`
    )
    if (notes) lines.push(`Pricing notes: ${notes}`)
  } else if (tpl.price_range_low !== undefined || tpl.price_range_high !== undefined) {
    lines.push(
      `Pricing range: $${((tpl.price_range_low ?? 0) / 100).toLocaleString()} – $${((tpl.price_range_high ?? 0) / 100).toLocaleString()} USD`
    )
  }

  if (tpl.timeline) {
    lines.push(
      `Timeline range: ${tpl.timeline.min_days ?? '?'} – ${tpl.timeline.max_days ?? '?'} ${tpl.timeline.unit ?? 'business_days'} from ${tpl.timeline.starts_from ?? 'kickoff'}`
    )
    if (tpl.timeline.notes) lines.push(`Timeline notes: ${tpl.timeline.notes}`)
  } else if (tpl.timeline_range_low !== undefined || tpl.timeline_range_high !== undefined) {
    lines.push(
      `Timeline range: ${tpl.timeline_range_low ?? '?'} – ${tpl.timeline_range_high ?? '?'} business days`
    )
  }

  if (tpl.deliverables && tpl.deliverables.length > 0) {
    lines.push('')
    lines.push('Template deliverables (use as a starting point — refine for this engagement):')
    for (const d of tpl.deliverables) {
      lines.push(`  - ${d.name}${d.description ? ` — ${d.description}` : ''}`)
      for (const ac of d.acceptance_criteria ?? []) {
        lines.push(`      · ${ac}`)
      }
    }
  }

  if (tpl.milestone_templates && tpl.milestone_templates.length > 0) {
    lines.push('')
    lines.push('Template milestones (use as a starting point):')
    for (const m of tpl.milestone_templates) {
      lines.push(
        `  - ${m.name} (${m.duration?.min_days ?? '?'}–${m.duration?.max_days ?? '?'} business days) — ${m.description}`
      )
    }
  }

  if (tpl.guarantees && tpl.guarantees.length > 0) {
    lines.push('')
    lines.push('Template guarantees (reinforce in terms_md where relevant):')
    for (const g of tpl.guarantees) {
      lines.push(`  - ${g.label}${g.description ? ` — ${g.description}` : ''}`)
    }
  }

  // Intake responses are arbitrary key/value JSON; render as a block so
  // Claude can pick up specific anchors (e.g. budget hints, environment
  // details, code-handling preferences) the client provided.
  const intakeKeys = Object.keys(input.intake_responses ?? {})
  if (intakeKeys.length > 0) {
    lines.push('')
    lines.push('INTAKE RESPONSES')
    lines.push('================')
    lines.push('The client supplied these answers during marketplace intake. Use them to')
    lines.push('tailor scope, deliverables, and timing. Do not invent details not present here.')
    lines.push('')
    for (const key of intakeKeys) {
      const value = (input.intake_responses as Record<string, unknown>)[key]
      lines.push(`${key}: ${formatIntakeValue(value)}`)
    }
  }

  return lines.join('\n')
}

function formatIntakeValue(value: unknown): string {
  if (value === null || value === undefined) return '(not provided)'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map((v) => String(v)).join(', ')
  return JSON.stringify(value)
}

// Used by the retry path when the first response was unparseable.
export const RETRY_SYSTEM_ADDENDUM =
  '\n\nYour previous response could not be parsed as valid JSON. Output ONLY the JSON object, with no markdown fences or commentary, no preamble, no trailing text.'
