import type { OutcomeCategory, EngagementMode, EngagementStatus, MilestoneStatus, SenderRole } from './types'

// ─── Brand Colors ─────────────────────────────────────────────────────────────
export const COLORS = {
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  accent: '#7C3AED',
  accentHover: '#8B5CF6',
  accentPressed: '#6D28D9',
  accentText: '#FFFFFF',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#60A5FA',
} as const

// ─── Mode Badge Colors ─────────────────────────────────────────────────────────
export const MODE_COLORS: Record<EngagementMode, string> = {
  talent: '#EC4899',
  pod: '#EC4899',
  predefined_outcome: '#7C3AED',
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
  in_progress: '#7C3AED',
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
  active: '#7C3AED',
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
  pm: '#7C3AED',
  engineer: '#EC4899',
  system: '#6B7280',
}

// ─── Category Labels ──────────────────────────────────────────────────────────
// Custom covers all bespoke FullStack outcomes; the rest are partnership categories
// keyed to the partner's brand.
export const CATEGORY_LABELS: Record<OutcomeCategory, string> = {
  custom: 'Custom',
  google_cloud: 'Google Cloud',
  nvidia: 'NVIDIA',
  aws: 'AWS',
  azure: 'Azure',
  databricks: 'Databricks',
  domo: 'Domo',
  servicenow: 'ServiceNow',
  salesforce: 'Salesforce',
}

// Colors use each partner's primary brand color so the category badge reads as a
// "powered by" signal; Custom falls back to the Glassbox brand purple.
export const CATEGORY_COLORS: Record<OutcomeCategory, string> = {
  custom: '#7C3AED',
  google_cloud: '#4285F4',
  nvidia: '#76B900',
  aws: '#FF9900',
  azure: '#0078D4',
  databricks: '#FF3621',
  domo: '#00A0DF',
  servicenow: '#62D84E',
  salesforce: '#00A1E0',
}

// Preferred display order for the category filter pills (used by the catalog UI).
export const CATEGORY_ORDER: OutcomeCategory[] = [
  'custom',
  'google_cloud',
  'nvidia',
  'aws',
  'azure',
  'databricks',
  'domo',
  'servicenow',
  'salesforce',
]

// ─── Navigation ───────────────────────────────────────────────────────────────
export const DASHBOARD_NAV = [
  { label: 'Overview', href: '/dashboard', icon: 'Home' },
  { label: 'Engagements', href: '/dashboard/engagements', icon: 'Layers' },
  { label: 'Marketplace', href: '/marketplace/outcomes', icon: 'Store' },
  { label: 'Messages', href: '/dashboard/messages', icon: 'MessageCircle' },
  { label: 'Settings', href: '/dashboard/settings', icon: 'Settings' },
] as const
