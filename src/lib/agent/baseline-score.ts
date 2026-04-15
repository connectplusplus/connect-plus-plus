import type { EngagementSignals } from '@/lib/types'

/**
 * Computes a deterministic health score from engagement signals.
 * This runs before the AI call and provides a grounded baseline
 * even if the Claude API fails.
 */
export function computeBaselineScore(signals: EngagementSignals): number {
  let score = 100

  // ── Timeline adherence (max -30 points) ────────────────────────────────
  // If milestone completion % is behind expected % by timeline position
  const milestoneVariance = signals.milestones.variance // negative = behind
  if (milestoneVariance < 0) {
    // -1.5 points per percentage point behind schedule
    score += Math.max(-30, milestoneVariance * 1.5)
  }

  // ── Blocked milestone (-20 points) ─────────────────────────────────────
  if (signals.milestones.blocked > 0) {
    score -= 20
  }

  // ── Overdue engagement (-15 points, escalating) ────────────────────────
  if (signals.timeline.is_overdue && signals.timeline.days_overdue) {
    score -= Math.min(15, signals.timeline.days_overdue * 2)
  }

  // ── Declining health trend (-10 points) ────────────────────────────────
  if (signals.recent_activity.health_trend === 'declining') {
    score -= 10
  }

  // ── No recent reporting (-5 points if no report in 3+ days) ────────────
  if (signals.recent_activity.days_since_last_report > 3) {
    score -= 5
  }

  // ── Current milestone at risk ──────────────────────────────────────────
  if (signals.milestones.current_milestone) {
    const cm = signals.milestones.current_milestone
    // Deliverable completion rate below 50% with less than 3 days to due
    if (cm.days_until_due < 3 && cm.deliverables_total > 0) {
      const completionRate = cm.deliverables_completed / cm.deliverables_total
      if (completionRate < 0.5) {
        score -= 10
      }
    }
  }

  // ── Bonus: ahead of schedule (+5 points) ───────────────────────────────
  if (milestoneVariance > 10) {
    score += 5
  }

  // ── Bonus: strong completion rate (+3 points) ──────────────────────────
  if (signals.milestones.percent_complete > 75 && !signals.timeline.is_overdue) {
    score += 3
  }

  return Math.max(1, Math.min(100, Math.round(score)))
}
