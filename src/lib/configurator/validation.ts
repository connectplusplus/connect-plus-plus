// Publish-time validation for the L2 Configurator.
//
// These rules gate the draft → published transition. The "every milestone
// must have ≥1 required signal" rule is the load-bearing one — it's the
// bridge that keeps L1.5 honest. Without it, a Delivery Lead could ship a
// template that looks great at L1 but is unauditable at L1.5.

import type { OutcomeTemplate } from '@/lib/types'

export interface ValidationError {
  rule: string
  message: string
}

export interface ValidationResult {
  ok: boolean
  errors: ValidationError[]
  passed: string[] // human-readable rule names that passed (for the green checks)
}

const RULE_NAMES = {
  title: 'Title is 8–80 characters',
  subtitle: 'Subtitle is 20–140 characters',
  description: 'Description is 80–600 characters',
  pricing: 'Pricing min < max, both > 0',
  timeline: 'Timeline min_days < max_days, both > 0',
  deliverables: 'At least 3 deliverables',
  milestones: 'At least 3 milestones',
  milestoneCriteria: 'Every milestone has ≥1 acceptance criterion',
  milestoneSignals: 'Every milestone has ≥1 expected signal with required=true',
  intakeFields: 'At least 2 intake fields',
  team: 'Delivery config typical_team has ≥1 role',
  alertThresholds: 'audit_config alert_thresholds.critical < .warning',
  priorityWeights: 'audit_config priority_weights all in 1..10',
  guarantees: 'At least 2 guarantees',
} as const

export function validateForPublish(t: OutcomeTemplate): ValidationResult {
  const errors: ValidationError[] = []
  const passed: string[] = []

  function check(rule: keyof typeof RULE_NAMES, ok: boolean, detail?: string) {
    if (ok) {
      passed.push(RULE_NAMES[rule])
    } else {
      errors.push({ rule: RULE_NAMES[rule], message: detail ?? RULE_NAMES[rule] })
    }
  }

  // Marketing copy
  const titleLen = (t.title ?? '').trim().length
  check('title', titleLen >= 8 && titleLen <= 80, `Title is ${titleLen} chars (need 8–80).`)

  const subtitleLen = (t.subtitle ?? '').trim().length
  check(
    'subtitle',
    subtitleLen >= 20 && subtitleLen <= 140,
    `Subtitle is ${subtitleLen} chars (need 20–140).`
  )

  const descLen = (t.description ?? '').trim().length
  check(
    'description',
    descLen >= 80 && descLen <= 600,
    `Description is ${descLen} chars (need 80–600).`
  )

  // Pricing
  const pmin = t.pricing?.min ?? t.price_range_low ?? 0
  const pmax = t.pricing?.max ?? t.price_range_high ?? 0
  check(
    'pricing',
    pmin > 0 && pmax > 0 && pmin < pmax,
    pmin <= 0 || pmax <= 0
      ? 'Both pricing min and max must be > 0.'
      : pmin >= pmax
        ? 'Pricing min must be < max.'
        : undefined
  )

  // Timeline
  const tmin = t.timeline?.min_days ?? t.timeline_range_low ?? 0
  const tmax = t.timeline?.max_days ?? t.timeline_range_high ?? 0
  check(
    'timeline',
    tmin > 0 && tmax > 0 && tmin < tmax,
    tmin <= 0 || tmax <= 0
      ? 'Both timeline min_days and max_days must be > 0.'
      : tmin >= tmax
        ? 'Timeline min_days must be < max_days.'
        : undefined
  )

  // Deliverables
  const deliverables = t.deliverables ?? []
  check(
    'deliverables',
    deliverables.length >= 3,
    `Found ${deliverables.length} deliverable${deliverables.length === 1 ? '' : 's'} (need ≥3).`
  )

  // Milestones
  const milestones = t.milestone_templates ?? []
  check(
    'milestones',
    milestones.length >= 3,
    `Found ${milestones.length} milestone${milestones.length === 1 ? '' : 's'} (need ≥3).`
  )

  // Per-milestone rules
  if (milestones.length > 0) {
    const missingCriteria = milestones.filter((m) => (m.acceptance_criteria ?? []).length === 0)
    check(
      'milestoneCriteria',
      missingCriteria.length === 0,
      missingCriteria.length > 0
        ? `${missingCriteria.length} milestone(s) have no acceptance criteria: ${missingCriteria.map((m) => m.name || m.id).join(', ')}`
        : undefined
    )

    const missingRequiredSignal = milestones.filter(
      (m) => !(m.expected_signals ?? []).some((s) => s.required)
    )
    check(
      'milestoneSignals',
      missingRequiredSignal.length === 0,
      missingRequiredSignal.length > 0
        ? `${missingRequiredSignal.length} milestone(s) lack a required signal: ${missingRequiredSignal.map((m) => m.name || m.id).join(', ')}`
        : undefined
    )
  } else {
    // Roll the per-milestone rules into "fail because there are no milestones"
    check('milestoneCriteria', false, 'No milestones to check.')
    check('milestoneSignals', false, 'No milestones to check.')
  }

  // Intake fields
  const intakeFields = t.intake_schema?.fields ?? []
  check(
    'intakeFields',
    intakeFields.length >= 2,
    `Found ${intakeFields.length} intake field${intakeFields.length === 1 ? '' : 's'} (need ≥2).`
  )

  // Delivery config
  const team = t.delivery_config?.typical_team ?? []
  check('team', team.length >= 1, `typical_team has ${team.length} role(s); need ≥1.`)

  // Audit config
  const audit = t.audit_config_defaults
  const critical = audit?.alert_thresholds?.critical
  const warning = audit?.alert_thresholds?.warning
  check(
    'alertThresholds',
    typeof critical === 'number' && typeof warning === 'number' && critical < warning,
    typeof critical !== 'number' || typeof warning !== 'number'
      ? 'alert_thresholds.critical and .warning must both be set.'
      : critical >= warning
        ? `critical (${critical}) must be less than warning (${warning}).`
        : undefined
  )

  const weights = audit?.priority_weights
  const weightsOk =
    weights !== undefined &&
    (['timeline', 'quality', 'scope', 'communication', 'velocity'] as const).every((k) => {
      const v = weights[k]
      return typeof v === 'number' && v >= 1 && v <= 10
    })
  check('priorityWeights', weightsOk, 'All five priority_weights must be in 1..10.')

  // Guarantees
  const guarantees = t.guarantees ?? []
  check(
    'guarantees',
    guarantees.length >= 2,
    `Found ${guarantees.length} guarantee${guarantees.length === 1 ? '' : 's'} (need ≥2).`
  )

  return { ok: errors.length === 0, errors, passed }
}

// Semver bump used by Phase 5's publish flow. Exposed here so the Review &
// publish UI can preview the next version label.
export function bumpVersion(current: string, kind: 'major' | 'minor' = 'minor'): string {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(current)
  if (!m) return '1.0.0'
  const [maj, min, patch] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (kind === 'major') return `${maj + 1}.0.0`
  return `${maj}.${min + 1}.${patch}`
}
