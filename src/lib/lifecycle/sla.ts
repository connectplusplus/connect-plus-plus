// Business-hours SLA helpers for the PM action queue.
//
// Intentionally approximate: counts weekdays only (Mon–Fri), ignores
// per-day office hours, defaults to PT for any time math we DO need to do.
// Documented limitation; rewrite when first SLA-driven decision needs
// hour-level precision.

import type { EngagementStatus } from '@/lib/types'

// Mon=1 ... Fri=5; Sat=6, Sun=0.
function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
}

// Count weekdays between two timestamps, fractional. Same-day returns 0.
// Counts a weekend day at zero.
export function businessDaysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso)
  const to = new Date(toIso)
  if (to <= from) return 0

  let days = 0
  const cursor = new Date(from)
  cursor.setHours(0, 0, 0, 0)
  const toMid = new Date(to)
  toMid.setHours(0, 0, 0, 0)

  while (cursor < toMid) {
    if (!isWeekend(cursor)) days++
    cursor.setDate(cursor.getDate() + 1)
  }
  // Add the fractional day for `to`'s same-day portion if `to` falls on a weekday.
  if (!isWeekend(to)) {
    const sameDayMs = to.getTime() - toMid.getTime()
    days += sameDayMs / (24 * 60 * 60 * 1000)
  }
  return days
}

// SLA per status. Numbers are business days.
export const SLA_BUSINESS_DAYS: Partial<Record<EngagementStatus, number>> = {
  pending_review: 1,
  awaiting_kickoff: 2,
}

export interface SlaState {
  business_days_elapsed: number
  business_days_total: number
  business_days_remaining: number
  status: 'on_track' | 'due_soon' | 'overdue'
}

export function computeSla(
  engagement_status: EngagementStatus,
  state_entered_at: string | null | undefined,
  now: string = new Date().toISOString()
): SlaState | null {
  const total = SLA_BUSINESS_DAYS[engagement_status]
  if (!total || !state_entered_at) return null

  const elapsed = businessDaysBetween(state_entered_at, now)
  const remaining = total - elapsed

  let status: SlaState['status'] = 'on_track'
  if (remaining < 0) status = 'overdue'
  else if (remaining < 0.25) status = 'due_soon'  // last 2 hours of the SLA day

  return {
    business_days_elapsed: elapsed,
    business_days_total: total,
    business_days_remaining: remaining,
    status,
  }
}

export function formatSlaLabel(sla: SlaState): string {
  if (sla.status === 'overdue') {
    const days = Math.abs(sla.business_days_remaining)
    return days < 1
      ? `Overdue by ${Math.round(days * 8)}h`
      : `Overdue by ${days.toFixed(1)} business day${days >= 1.05 ? 's' : ''}`
  }
  if (sla.business_days_remaining < 1) {
    return `${Math.round(sla.business_days_remaining * 8)}h remaining`
  }
  return `${sla.business_days_remaining.toFixed(1)} business days remaining`
}
