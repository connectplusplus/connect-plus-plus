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

export type OutcomeCategory =
  | 'custom'
  | 'google_cloud'
  | 'nvidia'
  | 'aws'
  | 'azure'
  | 'databricks'
  | 'domo'
  | 'servicenow'
  | 'salesforce'

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
  // AI metadata — only present for internal users
  ai_velocity_note?: string | null
  ai_reasoning?: string | null
  baseline_score_computed?: number | null
  ai_score_suggested?: number | null
  ai_generated_at?: string | null
  pm_override_reason?: string | null  // internal only
  pm_notes?: string | null            // visible to client — PM's added context
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
  internal_users?: {
    full_name: string
  }
}

// ─── Engagement Signals (for AI analysis) ───────────────────────────────────

export interface EngagementSignals {
  engagement: {
    title: string
    status: string
    budget: number | null
    start_date: string | null
    end_date: string | null
    current_health_score: number
    mode: string
  }
  timeline: {
    days_total: number
    days_elapsed: number
    days_remaining: number
    percent_through: number
    is_overdue: boolean
    days_overdue?: number
  }
  milestones: {
    total: number
    completed: number
    in_review: number
    in_progress: number
    blocked: number
    upcoming: number
    percent_complete: number
    expected_percent_complete: number
    variance: number
    current_milestone?: {
      title: string
      status: string
      due_date: string | null
      days_until_due: number
      deliverables_total: number
      deliverables_completed: number
      is_blocked: boolean
      blocked_reason?: string
    }
  }
  recent_activity: {
    last_report_date: string | null
    last_report_health: number | null
    health_trend: 'improving' | 'stable' | 'declining' | 'no_data'
    days_since_last_report: number
    last_message_date: string | null
    recent_messages_count: number
  }
  team: {
    size: number
    lead_name: string
    members: string[]
  }
}

export interface ReportDraft {
  health_score: number
  health_reasoning: string
  accomplishments: string
  blockers: string | null
  plan_tomorrow: string
  ai_velocity_note: string | null
}

export interface GeneratedReport {
  signals: EngagementSignals
  baselineScore: number
  draft: ReportDraft
  generated_at: string
  fallback?: boolean
}

// ─── Glassbox Agent Types ───────────────────────────────────────────────────

export interface GlassboxAgentConfig {
  id: string
  engagement_id: string
  success_definition: string
  critical_requirements: string[]
  risk_areas: string[]
  monitor_milestone_adherence: boolean
  monitor_scope_fidelity: boolean
  monitor_code_activity: boolean
  monitor_quality_metrics: boolean
  monitor_budget_adherence: boolean
  monitor_pm_communication: boolean
  monitor_blocker_resolution: boolean
  monitor_velocity_trend: boolean
  weight_timeline: number
  weight_quality: number
  weight_scope: number
  weight_communication: number
  weight_velocity: number
  alert_critical_threshold: number
  alert_milestone_slip_days: number
  alert_no_commit_hours: number
  alert_blocker_hours: number
  alert_pm_silence_hours: number
  report_cadence: 'daily' | 'every_2_days' | 'weekly'
  report_tone: 'technical' | 'executive' | 'balanced'
  include_raw_signals: boolean
  on_demand_enabled: boolean
  pm_review_window_hours: number
  escalation_contacts: string[]
  configured_by: string | null
  created_at: string
  updated_at: string
}

export type AgentTriggerType = 'scheduled' | 'on_demand' | 'alert_threshold' | 'milestone_slip' | 'blocker_alert' | 'pm_silence'

export interface AgentAssessment {
  id: string
  engagement_id: string
  agent_config_id: string
  trigger_type: AgentTriggerType
  triggered_by: string | null
  signals_snapshot: EngagementSignals
  component_scores: Record<string, { score: number; weight: number; finding: string }>
  weighted_score: number
  pm_submitted_score: number | null
  score_divergence: number | null
  critical_requirements_status: Array<{ requirement: string; status: 'met' | 'at_risk' | 'breached'; detail: string }> | null
  scope_drift_detected: boolean
  scope_drift_detail: string | null
  headline: string
  executive_summary: string
  findings: Array<{
    category: string
    severity: 'positive' | 'neutral' | 'concern' | 'critical'
    title: string
    detail: string
    data_source: string
    pm_context: string | null
  }>
  recommendation: string
  status: string
  pm_review_deadline: string | null
  pm_response: string | null
  pm_reviewed_at: string | null
  sent_to_client_at: string | null
  client_viewed_at: string | null
  model_used: string
  generation_duration_ms: number | null
  tokens_used: number | null
  created_at: string
}

// ─── Health Score Helpers ────────────────────────────────────────────────────

export type HealthScoreLabel = 'Excellent' | 'Good' | 'At Risk' | 'Critical'

export function getHealthLabel(score: number): HealthScoreLabel {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'At Risk'
  return 'Critical'
}

export function getHealthColor(score: number): string {
  if (score >= 85) return '#10B981'
  if (score >= 70) return '#7C3AED'
  if (score >= 50) return '#F59E0B'
  return '#EF4444'
}

// ─── UI Types ─────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string
  href: string
  icon?: string
}
