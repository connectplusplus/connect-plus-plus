import type { EngagementSignals, GlassboxAgentConfig } from '@/lib/types'

export interface ComponentScore {
  score: number
  weight: number
  finding: string
}

export interface ScoringResult {
  components: Record<string, ComponentScore>
  compositeScore: number
}

/**
 * Computes an independent, weighted health score per the client's priorities.
 * This runs BEFORE the Claude call. It is deterministic, auditable, and never fails.
 * Each component produces a 0-100 score weighted by the client's configured priorities.
 */
export function computeIndependentScore(
  signals: EngagementSignals,
  config: GlassboxAgentConfig
): ScoringResult {
  const components: Record<string, ComponentScore> = {}

  // ── TIMELINE SCORE ─────────────────────────────────────────────────────
  {
    let score = 100
    const variance = signals.milestones.variance // negative = behind (percentage points)

    if (variance < 0) {
      // Behind schedule: -1.5 points per percentage point behind, max -40
      score += Math.max(-40, variance * 1.5)
    }
    if (signals.timeline.is_overdue && signals.timeline.days_overdue) {
      score -= Math.min(30, signals.timeline.days_overdue * 3)
    }
    if (signals.milestones.blocked > 0) {
      score -= 20
    }
    // Bonus for being ahead
    if (variance > 10) score = Math.min(100, score + 5)

    const finding = buildTimelineFinding(signals)

    components.timeline = {
      score: Math.max(0, Math.min(100, Math.round(score))),
      weight: config.weight_timeline,
      finding,
    }
  }

  // ── QUALITY SCORE ──────────────────────────────────────────────────────
  {
    let score = 85 // neutral start — limited signals without git integration

    // Penalize if milestones stuck in review (quality concern — back-and-forth)
    if (signals.milestones.in_review > 1) score -= 10

    // Current milestone deliverable completion rate
    if (signals.milestones.current_milestone) {
      const cm = signals.milestones.current_milestone
      if (cm.deliverables_total > 0) {
        const rate = cm.deliverables_completed / cm.deliverables_total
        if (rate < 0.3 && cm.days_until_due < 5) score -= 15
      }
      if (cm.is_blocked) score -= 15
    }

    components.quality = {
      score: Math.max(0, Math.min(100, Math.round(score))),
      weight: config.weight_quality,
      finding: buildQualityFinding(signals),
    }
  }

  // ── SCOPE ADHERENCE SCORE ──────────────────────────────────────────────
  {
    let score = 90 // default assumption: scope is intact
    const cm = signals.milestones.current_milestone

    if (cm && cm.deliverables_total > 0) {
      const deliverableRatio = cm.deliverables_completed / cm.deliverables_total
      // If deliverable completion is significantly behind timeline position
      if (deliverableRatio < signals.timeline.percent_through * 0.7) {
        score -= 15
      }
    }

    // Blocked milestones may indicate scope issues
    if (signals.milestones.blocked > 0) score -= 10

    components.scope = {
      score: Math.max(0, Math.min(100, Math.round(score))),
      weight: config.weight_scope,
      finding: buildScopeFinding(signals),
    }
  }

  // ── COMMUNICATION SCORE ────────────────────────────────────────────────
  {
    let score = 100

    const silence = signals.recent_activity.days_since_last_report
    if (silence > 1) score -= silence * 8 // -8 per day of silence
    if (silence > 5) score -= 20 // additional penalty for extended silence

    // Recent message activity
    if (signals.recent_activity.recent_messages_count === 0) score -= 10

    components.communication = {
      score: Math.max(0, Math.min(100, Math.round(score))),
      weight: config.weight_communication,
      finding: buildCommunicationFinding(signals),
    }
  }

  // ── VELOCITY SCORE ─────────────────────────────────────────────────────
  if (config.monitor_velocity_trend) {
    let score = 75 // neutral without git data
    if (signals.recent_activity.health_trend === 'improving') score = 85
    if (signals.recent_activity.health_trend === 'declining') score = 60

    components.velocity = {
      score: Math.max(0, Math.min(100, Math.round(score))),
      weight: config.weight_velocity,
      finding: buildVelocityFinding(signals),
    }
  }

  // ── WEIGHTED COMPOSITE ─────────────────────────────────────────────────
  const totalWeight = Object.values(components).reduce((sum, c) => sum + c.weight, 0)
  const weightedSum = Object.values(components).reduce((sum, c) => sum + c.score * c.weight, 0)
  const compositeScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50

  return { components, compositeScore }
}

// ── Finding text generators ──────────────────────────────────────────────────

function buildTimelineFinding(s: EngagementSignals): string {
  const pctThrough = Math.round(s.timeline.percent_through * 100)
  const pctComplete = s.milestones.percent_complete

  if (s.timeline.is_overdue) {
    return `Engagement is ${s.timeline.days_overdue} days past the target end date. ${pctComplete}% of milestones completed.`
  }
  if (s.milestones.variance < -10) {
    return `${pctThrough}% through the timeline but only ${pctComplete}% of milestones complete — ${Math.abs(s.milestones.variance)}% behind expected pace.`
  }
  if (s.milestones.variance > 5) {
    return `On track: ${pctComplete}% milestones complete at ${pctThrough}% through the timeline. ${s.timeline.days_remaining} days remaining.`
  }
  return `${pctComplete}% of milestones complete, ${pctThrough}% through the timeline. ${s.milestones.blocked > 0 ? `${s.milestones.blocked} milestone(s) blocked.` : 'No blockers.'}`
}

function buildQualityFinding(s: EngagementSignals): string {
  if (s.milestones.current_milestone?.is_blocked) {
    return `Current milestone (${s.milestones.current_milestone.title}) is blocked. ${s.milestones.current_milestone.deliverables_completed}/${s.milestones.current_milestone.deliverables_total} deliverables completed.`
  }
  if (s.milestones.in_review > 1) {
    return `${s.milestones.in_review} milestones currently in review — extended review cycles may indicate quality iterations.`
  }
  return `Quality signals are within expected range. ${s.milestones.completed}/${s.milestones.total} milestones accepted without issues.`
}

function buildScopeFinding(s: EngagementSignals): string {
  const cm = s.milestones.current_milestone
  if (cm && cm.deliverables_total > 0) {
    const rate = Math.round((cm.deliverables_completed / cm.deliverables_total) * 100)
    return `Current milestone "${cm.title}" has ${cm.deliverables_completed}/${cm.deliverables_total} deliverables completed (${rate}%). ${cm.is_blocked ? 'BLOCKED — may indicate scope or dependency issues.' : 'Scope appears aligned with plan.'}`
  }
  return `${s.milestones.completed} of ${s.milestones.total} milestones delivered. Scope tracking against contracted deliverables.`
}

function buildCommunicationFinding(s: EngagementSignals): string {
  const days = s.recent_activity.days_since_last_report
  if (days === 0) return 'PM reported today. Communication is current.'
  if (days === 1) return 'Last PM report was yesterday. Communication is current.'
  if (days <= 3) return `Last PM report was ${days} days ago. Within acceptable range.`
  return `No PM report for ${days} days. Communication gap detected — client may lack visibility into project status.`
}

function buildVelocityFinding(s: EngagementSignals): string {
  const trend = s.recent_activity.health_trend
  if (trend === 'improving') return 'Health trend is improving over recent reports. Delivery velocity appears to be increasing.'
  if (trend === 'declining') return 'Health trend is declining over recent reports. Delivery velocity may be slowing.'
  if (trend === 'stable') return 'Health trend is stable. Consistent delivery velocity observed.'
  return 'Insufficient data to determine velocity trend.'
}
