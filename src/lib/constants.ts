import type { OutcomeCategory, EngagementMode, EngagementStatus, MilestoneStatus, SenderRole } from './types'

// ─── Brand Colors ─────────────────────────────────────────────────────────────
export const COLORS = {
  bgPrimary: '#0B0B0F',
  bgSecondary: '#111116',
  surface: '#16161C',
  surfaceElevated: '#1E1E24',
  border: '#2A2A30',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  accent: '#A6F84C',
  accentHover: '#BCFF6E',
  accentPressed: '#8FD940',
  accentText: '#0B0B0F',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#60A5FA',
} as const

// ─── Mode Badge Colors ─────────────────────────────────────────────────────────
export const MODE_COLORS: Record<EngagementMode, string> = {
  talent: '#A78BFA',
  pod: '#F472B6',
  predefined_outcome: '#A6F84C',
  custom_outcome: '#FB923C',
}

export const MODE_LABELS: Record<EngagementMode, string> = {
  talent: 'Talent',
  pod: 'Pod',
  predefined_outcome: 'Outcome',
  custom_outcome: 'Custom',
}

// ─── Status Colors ────────────────────────────────────────────────────────────
export const MILESTONE_STATUS_COLORS: Record<MilestoneStatus, string> = {
  upcoming: '#6B7280',
  in_progress: '#A6F84C',
  in_review: '#FBBF24',
  completed: '#34D399',
}

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  upcoming: 'Upcoming',
  in_progress: 'In Progress',
  in_review: 'In Review',
  completed: 'Completed',
}

export const ENGAGEMENT_STATUS_LABELS: Record<EngagementStatus, string> = {
  intake: 'Intake',
  scoping: 'Scoping',
  active: 'Active',
  in_review: 'In Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const ENGAGEMENT_STATUS_COLORS: Record<EngagementStatus, string> = {
  intake: '#60A5FA',
  scoping: '#FBBF24',
  active: '#A6F84C',
  in_review: '#FBBF24',
  completed: '#34D399',
  cancelled: '#F87171',
}

// ─── Sender Role Labels ───────────────────────────────────────────────────────
export const SENDER_ROLE_LABELS: Record<SenderRole, string> = {
  client: 'Client',
  pm: 'PM',
  engineer: 'Engineer',
  system: 'System',
}

export const SENDER_ROLE_COLORS: Record<SenderRole, string> = {
  client: '#60A5FA',
  pm: '#A6F84C',
  engineer: '#A78BFA',
  system: '#6B7280',
}

// ─── Category Labels ──────────────────────────────────────────────────────────
export const CATEGORY_LABELS: Record<OutcomeCategory, string> = {
  build: 'Build',
  automate: 'Automate',
  migrate: 'Migrate',
  optimize: 'Optimize',
}

export const CATEGORY_COLORS: Record<OutcomeCategory, string> = {
  build: '#60A5FA',
  automate: '#A78BFA',
  migrate: '#F472B6',
  optimize: '#FBBF24',
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export const DASHBOARD_NAV = [
  { label: 'Overview', href: '/dashboard', icon: 'Home' },
  { label: 'Engagements', href: '/dashboard/engagements', icon: 'Layers' },
  { label: 'Marketplace', href: '/marketplace/outcomes', icon: 'Store' },
  { label: 'Messages', href: '/dashboard/messages', icon: 'MessageCircle' },
  { label: 'Settings', href: '/dashboard/settings', icon: 'Settings' },
] as const
