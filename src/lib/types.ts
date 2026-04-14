// ─── Database Types ───────────────────────────────────────────────────────────

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+'

export interface Company {
  id: string
  name: string
  website: string | null
  size: CompanySize | null
  industry: string | null
  created_at: string
  updated_at: string
}

export type UserRole = 'owner' | 'admin' | 'member'

export interface User {
  id: string
  company_id: string | null
  full_name: string
  email: string
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export type OutcomeCategory = 'build' | 'automate' | 'migrate' | 'optimize'

export interface IntakeField {
  key: string
  type: 'text' | 'textarea' | 'select' | 'multiselect'
  label: string
  placeholder?: string
  options?: string[]
  required?: boolean
}

export interface IntakeSchema {
  fields: IntakeField[]
}

export interface OutcomeTemplate {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string
  category: OutcomeCategory
  price_range_low: number | null   // in cents
  price_range_high: number | null  // in cents
  timeline_range_low: number | null  // in business days
  timeline_range_high: number | null // in business days
  icon: string | null
  features: string[]
  intake_schema: IntakeSchema
  is_active: boolean
  display_order: number
  created_at: string
}

export type EngagementMode = 'talent' | 'pod' | 'predefined_outcome' | 'custom_outcome'
export type EngagementStatus = 'intake' | 'scoping' | 'active' | 'in_review' | 'completed' | 'cancelled'

export interface Engagement {
  id: string
  company_id: string
  template_id: string | null
  mode: EngagementMode
  title: string
  status: EngagementStatus
  intake_responses: Record<string, unknown> | null
  scope_summary: string | null
  price_cents: number | null
  start_date: string | null
  target_end_date: string | null
  actual_end_date: string | null
  created_at: string
  updated_at: string
  // Joined
  outcome_templates?: OutcomeTemplate
}

export type MilestoneStatus = 'upcoming' | 'in_progress' | 'in_review' | 'completed'

export interface Deliverable {
  name: string
  description: string
  status: 'pending' | 'done'
}

export interface Milestone {
  id: string
  engagement_id: string
  title: string
  description: string | null
  status: MilestoneStatus
  deliverables: Deliverable[]
  due_date: string | null
  completed_at: string | null
  display_order: number
  created_at: string
}

export type SenderRole = 'client' | 'pm' | 'engineer' | 'system'

export interface Message {
  id: string
  engagement_id: string
  user_id: string | null
  sender_name: string
  sender_role: SenderRole
  content: string
  is_system_message: boolean
  created_at: string
}

export type Seniority = 'mid' | 'senior' | 'staff' | 'principal'

export interface HighlightProject {
  title: string
  description: string
  tech: string[]
}

export interface TalentProfile {
  id: string
  display_name: string
  title: string
  seniority: Seniority
  bio: string | null
  skills: string[]
  ai_velocity_score: number | null
  years_experience: number | null
  avatar_url: string | null
  hourly_rate_cents: number | null
  is_available: boolean
  highlight_projects: HighlightProject[]
  created_at: string
}

// ─── Internal User Types ─────────────────────────────────────────────────────

export type InternalUserRole = 'pm' | 'delivery_lead' | 'finance'

export interface InternalUser {
  id: string
  full_name: string
  email: string
  role: InternalUserRole
  avatar_url: string | null
  created_at: string
}

export interface DailyReport {
  id: string
  engagement_id: string
  author_id: string
  report_date: string
  accomplishments: string
  blockers: string | null
  plan_tomorrow: string
  health_score: number
  ai_velocity_note?: string | null // only present for internal users
  created_at: string
  updated_at: string
  // Joined fields
  engagement?: {
    title: string
    company_id: string
    companies?: {
      name: string
    }
  }
  author?: {
    full_name: string
  }
}

export type HealthScoreLabel = 'Excellent' | 'Good' | 'At Risk' | 'Critical'

export function getHealthLabel(score: number): HealthScoreLabel {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'At Risk'
  return 'Critical'
}

export function getHealthColor(score: number): string {
  if (score >= 85) return '#10B981'
  if (score >= 70) return '#64748B'
  if (score >= 50) return '#F59E0B'
  return '#EF4444'
}

// ─── UI Types ─────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string
  href: string
  icon?: string
}
