# The Glassbox Agent
## An Independent AI Sentinel for Every Client Engagement

---

## What this is — and why it matters

Every Glassbox engagement ships with a personal AI agent configured by the client. This agent is not FullStack's reporting tool. It is the client's independent auditor, embedded inside FullStack's own platform. It monitors the engagement against what was promised in the brief and contract, generates its own assessment completely independently of what the PM reports, and delivers that assessment directly to the client — with only a short PM review window for adding context, not for editing or suppressing findings.

The client can also deploy the agent on-demand, at any time, for an instant independent assessment. No warning. No PM filter. Just the agent's honest read of the state of their project.

This is the moat. Competitors can copy the client portal. They cannot easily copy an architecture that gives the client a trusted AI advocate inside the vendor's own system, backed by months of calibrated assessment history, weighted to the client's own stated priorities.

---

## Read first — existing codebase

```bash
find src -type f -name "*.tsx" | head -60
find src -type f -name "*.ts" | head -30
cat supabase/migrations/001_initial_schema.sql
cat supabase/migrations/002_internal_layer.sql  # from Sprint 1
cat src/lib/types.ts
cat src/app/dashboard/new-engagement/[slug]/page.tsx
cat src/components/marketplace/IntakeForm.tsx
cat src/app/dashboard/engagements/[id]/page.tsx
cat src/components/dashboard/EngagementDetailClient.tsx
```

Pay particular attention to the engagement creation flow — the agent configuration is added as a final step before contract signing.

---

## Part 1: Agent Configuration (Client-Facing — During Engagement Creation)

### Where it lives

The agent configuration is added as a new step in the existing engagement creation flow, between the intake questionnaire and contract signing. It is not hidden in settings. It is foregrounded as a feature: "Configure your Glassbox Agent."

### The configuration parameters

These are what the client controls. Every parameter has a sensible default so the client can skip and accept defaults, or invest time in calibrating to their needs.

```typescript
interface GlassboxAgentConfig {
  
  // ── WHAT SUCCESS LOOKS LIKE ──────────────────────────────────────────
  // The agent reads this on every assessment and checks current state against it.
  // This is the client's north star, in their own words.
  
  brief: {
    success_definition: string
    // "What does a successful completion of this project look like to you?"
    // Free text, 2-5 sentences. Required. The agent quotes this back in reports.
    
    critical_requirements: string[]
    // Non-negotiables. If any are at risk, agent flags CRITICAL regardless
    // of overall score. Up to 5 items.
    // e.g. ["HIPAA compliance at every milestone", "99.9% uptime for payment APIs"]
    
    risk_areas: string[]
    // Things the client is most worried about. Agent monitors these explicitly.
    // Up to 5 items.
    // e.g. ["Third-party API integration timeline", "Mobile performance on low-end devices"]
  }
  
  // ── WHAT TO MONITOR ──────────────────────────────────────────────────
  // Client controls which signals the agent watches.
  // All default to true. Client can disable signals they don't care about.
  
  monitoring: {
    milestone_adherence: boolean    // Default: true
    // Is the team hitting milestones on schedule vs. contract dates?
    
    scope_fidelity: boolean         // Default: true  
    // Are deliverables matching the original brief, or drifting?
    
    code_activity: boolean          // Default: true
    // Is there consistent commit activity? (requires GitHub/GitLab connection)
    
    quality_metrics: boolean        // Default: true
    // Test coverage, bug rates, CI pass rates (requires repo connection)
    
    budget_adherence: boolean       // Default: true
    // Is spend on track vs. contracted budget?
    
    pm_communication_quality: boolean  // Default: true
    // Are PM reports substantive, frequent, and specific?
    // Agent evaluates report quality, not just frequency.
    
    blocker_resolution_time: boolean   // Default: true
    // How quickly are blockers being cleared?
    
    team_velocity_trend: boolean    // Default: false
    // Is AI-augmented velocity improving, stable, or declining?
  }
  
  // ── PRIORITY WEIGHTS ─────────────────────────────────────────────────
  // The agent weights its health score according to what THIS client cares about.
  // Slider from 1-10. Defaults shown. Must be set consciously.
  
  priority_weights: {
    timeline:      number  // Default: 8  — "Is it on schedule?"
    quality:       number  // Default: 7  — "Is the code good?"
    scope:         number  // Default: 9  — "Are we getting what we asked for?"
    communication: number  // Default: 5  — "Is the PM keeping us informed?"
    velocity:      number  // Default: 4  — "Is the team moving fast?"
  }
  
  // ── ALERT BEHAVIOR ────────────────────────────────────────────────────
  // When the agent should interrupt vs. save it for the next scheduled report.
  
  alerts: {
    critical_health_threshold: number  // Default: 60
    // Agent sends immediate alert (bypassing PM review window) if score drops below this.
    
    milestone_slip_days: number        // Default: 3
    // Days of slippage before triggering an unscheduled alert.
    
    no_commit_alert_hours: number      // Default: 72
    // Hours of zero git activity before agent flags concern.
    // Only active if code_activity monitoring is enabled.
    
    blocker_alert_hours: number        // Default: 48
    // Hours a milestone can be BLOCKED before immediate alert.
    
    pm_silence_alert_hours: number     // Default: 48
    // Hours without a PM report before agent flags communication gap.
  }
  
  // ── REPORT BEHAVIOR ───────────────────────────────────────────────────
  
  reporting: {
    cadence: 'daily' | 'every_2_days' | 'weekly'  // Default: 'daily'
    
    tone: 'technical' | 'executive' | 'balanced'
    // technical: includes raw metrics, percentages, specific commit/coverage data
    // executive: summary-first, risks highlighted, minimal raw data
    // balanced: both (default)
    
    include_raw_signals: boolean  // Default: true
    // Show the underlying data (milestone %, health score history, etc.) to client
    
    on_demand_enabled: boolean    // Default: true
    // Can client invoke agent any time for an instant independent assessment?
    
    pm_review_window_hours: number  // Default: 4
    // How long PM has to add context before report auto-sends. Range: 1-24.
    // If critical threshold breached: window is 0 (alert goes direct to client).
    
    escalation_contacts: string[]  // Default: []
    // Additional email addresses to notify on CRITICAL alerts.
  }
}
```

### The configuration UI

In the engagement creation flow, after the intake questionnaire, show a dedicated "Your Glassbox Agent" step:

```
─────────────────────────────────────────────────────────────────
  Your Glassbox Agent                              Step 3 of 4

  Every engagement includes a dedicated AI agent that 
  independently monitors your project and reports directly 
  to you — uncensored by your project team.

  ┌─ What does success look like? ──────────────────────────┐
  │  In your own words, describe what a successful outcome  │
  │  means for this project.                                │
  │                                                         │
  │  [________________________________]                     │
  │                                                         │
  │  Critical requirements (up to 5)     [+ Add]           │
  │  Things that must never fail:                          │
  │  • [_________________________] ×                       │
  └─────────────────────────────────────────────────────────┘

  ┌─ What matters most to you? ─────────────────────────────┐
  │  Drag to weight what the agent prioritizes.            │
  │                                                         │
  │  Timeline adherence    ████████── 8/10                 │
  │  Scope fidelity        █████████─ 9/10                 │
  │  Code quality          ███████─── 7/10                 │
  │  Communication         █████───── 5/10                 │
  │  Team velocity         ████────── 4/10                 │
  └─────────────────────────────────────────────────────────┘

  ┌─ Alert me immediately if... ────────────────────────────┐
  │  Health score drops below    [ 60 ] ────────────────── │
  │  Milestone slips by          [ 3 ] days               │
  │  No commits for              [ 72 ] hours              │
  │  PM silent for               [ 48 ] hours              │
  └─────────────────────────────────────────────────────────┘

  ┌─ Report preferences ────────────────────────────────────┐
  │  Cadence       [Daily ▾]                               │
  │  Tone          [Balanced ▾]                            │
  │  PM review     [4 hours] before auto-send              │
  │  On-demand     [Enabled ✓]                             │
  └─────────────────────────────────────────────────────────┘

  [Use defaults]                        [Continue →]
─────────────────────────────────────────────────────────────────
```

---

## Part 2: Database Schema

Create `supabase/migrations/003_glassbox_agent.sql`:

```sql
-- ── AGENT CONFIGURATION ──────────────────────────────────────────────────

CREATE TABLE agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL UNIQUE REFERENCES engagements(id) ON DELETE CASCADE,
  
  -- Brief
  success_definition TEXT NOT NULL,
  critical_requirements TEXT[] DEFAULT '{}',
  risk_areas TEXT[] DEFAULT '{}',
  
  -- Monitoring toggles
  monitor_milestone_adherence BOOLEAN DEFAULT true,
  monitor_scope_fidelity BOOLEAN DEFAULT true,
  monitor_code_activity BOOLEAN DEFAULT true,
  monitor_quality_metrics BOOLEAN DEFAULT true,
  monitor_budget_adherence BOOLEAN DEFAULT true,
  monitor_pm_communication BOOLEAN DEFAULT true,
  monitor_blocker_resolution BOOLEAN DEFAULT true,
  monitor_velocity_trend BOOLEAN DEFAULT false,
  
  -- Priority weights (1-10)
  weight_timeline INTEGER DEFAULT 8 CHECK (weight_timeline BETWEEN 1 AND 10),
  weight_quality INTEGER DEFAULT 7 CHECK (weight_quality BETWEEN 1 AND 10),
  weight_scope INTEGER DEFAULT 9 CHECK (weight_scope BETWEEN 1 AND 10),
  weight_communication INTEGER DEFAULT 5 CHECK (weight_communication BETWEEN 1 AND 10),
  weight_velocity INTEGER DEFAULT 4 CHECK (weight_velocity BETWEEN 1 AND 10),
  
  -- Alert thresholds
  alert_critical_threshold INTEGER DEFAULT 60,
  alert_milestone_slip_days INTEGER DEFAULT 3,
  alert_no_commit_hours INTEGER DEFAULT 72,
  alert_blocker_hours INTEGER DEFAULT 48,
  alert_pm_silence_hours INTEGER DEFAULT 48,
  
  -- Report preferences
  report_cadence TEXT DEFAULT 'daily' CHECK (report_cadence IN ('daily', 'every_2_days', 'weekly')),
  report_tone TEXT DEFAULT 'balanced' CHECK (report_tone IN ('technical', 'executive', 'balanced')),
  include_raw_signals BOOLEAN DEFAULT true,
  on_demand_enabled BOOLEAN DEFAULT true,
  pm_review_window_hours INTEGER DEFAULT 4 CHECK (pm_review_window_hours BETWEEN 1 AND 24),
  escalation_contacts TEXT[] DEFAULT '{}',
  
  -- Metadata
  configured_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ── AGENT ASSESSMENTS ────────────────────────────────────────────────────

CREATE TABLE agent_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  agent_config_id UUID NOT NULL REFERENCES agent_configs(id),
  
  -- Trigger
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'scheduled',      -- regular cadence
    'on_demand',      -- client invoked
    'alert_threshold', -- health crossed critical threshold
    'milestone_slip', -- milestone slippage detected
    'blocker_alert',  -- milestone blocked too long
    'pm_silence'      -- PM hasn't reported in too long
  )),
  triggered_by UUID REFERENCES users(id),  -- for on_demand: who clicked
  
  -- Signals collected (stored as JSONB for flexibility)
  signals_snapshot JSONB NOT NULL,  -- full EngagementSignals at time of assessment
  
  -- Agent's independent scoring (never derived from PM score)
  component_scores JSONB NOT NULL,
  -- {
  --   timeline: { score: 72, weight: 8, finding: "..." },
  --   quality:  { score: 88, weight: 7, finding: "..." },
  --   scope:    { score: 91, weight: 9, finding: "..." },
  --   communication: { score: 65, weight: 5, finding: "..." },
  --   velocity: { score: 78, weight: 4, finding: "..." }
  -- }
  
  weighted_score INTEGER NOT NULL,            -- the agent's computed health score
  pm_submitted_score INTEGER,                 -- what PM submitted (for comparison)
  score_divergence INTEGER,                   -- weighted_score - pm_submitted_score
  
  -- Contract compliance
  critical_requirements_status JSONB,
  -- [{ requirement: "...", status: "met"|"at_risk"|"breached", detail: "..." }]
  
  scope_drift_detected BOOLEAN DEFAULT false,
  scope_drift_detail TEXT,
  
  -- Agent's written assessment (Claude-generated, client-facing)
  headline TEXT NOT NULL,          -- 1-sentence summary
  executive_summary TEXT NOT NULL, -- 2-3 sentence overview
  findings JSONB NOT NULL,
  -- [{ 
  --   category: "timeline"|"quality"|"scope"|"communication"|"velocity"|"critical",
  --   severity: "positive"|"neutral"|"concern"|"critical",
  --   title: "...",
  --   detail: "...",
  --   data_source: "milestone_completion_rate" | "commit_frequency" | etc.,
  --   pm_context: null  -- filled in during PM review
  -- }]
  
  recommendation TEXT NOT NULL,    -- what agent recommends client do/watch
  
  -- PM review pipeline
  status TEXT DEFAULT 'pending_pm_review' CHECK (status IN (
    'generating',
    'pending_pm_review',  -- sent to PM, waiting
    'pm_reviewed',        -- PM added context, ready to send
    'auto_sent',          -- PM window expired, sent automatically
    'sent_to_client',     -- delivered
    'on_demand_sent'      -- on-demand assessments skip PM review
  )),
  
  pm_review_deadline TIMESTAMPTZ,   -- when auto-send triggers
  pm_response TEXT,                 -- PM's general response (not editing agent text)
  pm_reviewed_at TIMESTAMPTZ,
  pm_reviewed_by UUID REFERENCES users(id),
  
  -- Delivery
  sent_to_client_at TIMESTAMPTZ,
  client_viewed_at TIMESTAMPTZ,
  
  -- AI metadata
  model_used TEXT DEFAULT 'claude-opus-4-5',
  generation_duration_ms INTEGER,
  tokens_used INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_assessments_engagement ON agent_assessments(engagement_id);
CREATE INDEX idx_agent_assessments_status ON agent_assessments(status);
CREATE INDEX idx_agent_assessments_created ON agent_assessments(created_at DESC);


-- ── AGENT ALERTS ─────────────────────────────────────────────────────────

CREATE TABLE agent_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES agent_assessments(id),
  
  alert_type TEXT NOT NULL,         -- mirrors trigger_type
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  
  -- Who gets notified
  notified_client BOOLEAN DEFAULT false,
  notified_pm BOOLEAN DEFAULT false,
  notified_escalation_contacts BOOLEAN DEFAULT false,
  
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ── RLS POLICIES ──────────────────────────────────────────────────────────

ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_alerts ENABLE ROW LEVEL SECURITY;

-- Clients can read and update their own engagement's agent config
CREATE POLICY "client_read_own_agent_config" ON agent_configs
  FOR SELECT TO authenticated
  USING (
    engagement_id IN (
      SELECT e.id FROM engagements e
      JOIN companies c ON e.company_id = c.id
      JOIN users u ON u.company_id = c.id
      WHERE u.id = auth.uid() AND u.role = 'client'
    )
  );

CREATE POLICY "client_update_own_agent_config" ON agent_configs
  FOR UPDATE TO authenticated
  USING (
    engagement_id IN (
      SELECT e.id FROM engagements e
      JOIN companies c ON e.company_id = c.id
      JOIN users u ON u.company_id = c.id
      WHERE u.id = auth.uid() AND u.role = 'client'
    )
  );

-- Clients can read their assessments (sent ones only — not pending PM review)
CREATE POLICY "client_read_sent_assessments" ON agent_assessments
  FOR SELECT TO authenticated
  USING (
    status IN ('sent_to_client', 'on_demand_sent', 'auto_sent')
    AND engagement_id IN (
      SELECT e.id FROM engagements e
      JOIN companies c ON e.company_id = c.id
      JOIN users u ON u.company_id = c.id
      WHERE u.id = auth.uid() AND u.role = 'client'
    )
  );

-- Internal users have full access
CREATE POLICY "internal_full_agent_access" ON agent_configs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pm', 'delivery_lead', 'finance')));

CREATE POLICY "internal_full_assessment_access" ON agent_assessments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pm', 'delivery_lead', 'finance')));
```

---

## Part 3: The Signal Collector

Build `src/lib/agent/collectSignals.ts`:

The signal collector gathers every available data point about an engagement. It must be entirely independent of any PM-submitted narrative — it reads only raw database state.

```typescript
export async function collectEngagementSignals(
  engagementId: string,
  supabase: SupabaseClient
): Promise<EngagementSignals> {
  
  // Parallel queries — do not await sequentially
  const [
    engagementResult,
    milestonesResult,
    reportsResult,
    messagesResult,
    costsResult,
    agentHistoryResult
  ] = await Promise.all([
    
    // Core engagement data
    supabase
      .from('engagements')
      .select(`*, companies(name), milestones(*, milestone_deliverables(*))`)
      .eq('id', engagementId)
      .single(),
    
    // Milestone breakdown
    supabase
      .from('milestones')
      .select('*, milestone_deliverables(*)')
      .eq('engagement_id', engagementId)
      .order('display_order'),
    
    // Recent PM reports (last 14 days)
    supabase
      .from('daily_reports')
      .select('report_date, health_score, accomplishments, blockers, plan_tomorrow, created_at')
      .eq('engagement_id', engagementId)
      .gte('report_date', new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0])
      .order('report_date', { ascending: false }),
    
    // Message activity (last 7 days)
    supabase
      .from('messages')
      .select('created_at, sender_role')
      .eq('engagement_id', engagementId)
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    
    // Cost/budget data
    supabase
      .from('engagement_costs')
      .select('billed_amount, labor_cost, gross_margin_pct, period_end')
      .eq('engagement_id', engagementId)
      .order('period_end', { ascending: false })
      .limit(3),
    
    // Previous agent assessments (for trend)
    supabase
      .from('agent_assessments')
      .select('weighted_score, pm_submitted_score, created_at, trigger_type')
      .eq('engagement_id', engagementId)
      .in('status', ['sent_to_client', 'on_demand_sent', 'auto_sent'])
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  const engagement = engagementResult.data
  const milestones = milestonesResult.data ?? []
  const reports = reportsResult.data ?? []
  const messages = messagesResult.data ?? []
  const costs = costsResult.data ?? []
  const agentHistory = agentHistoryResult.data ?? []

  // ── Timeline calculations ───────────────────────────────────────────
  const startDate = new Date(engagement.start_date)
  const endDate = new Date(engagement.end_date)
  const today = new Date()
  const daysTotal = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000)
  const daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / 86400000))
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / 86400000))
  const percentThroughTimeline = Math.min(1, daysElapsed / daysTotal)
  const isOverdue = today > endDate

  // ── Milestone calculations ──────────────────────────────────────────
  const milestoneCounts = {
    total: milestones.length,
    completed: milestones.filter(m => m.status === 'completed').length,
    in_review: milestones.filter(m => m.status === 'in_review').length,
    in_progress: milestones.filter(m => m.status === 'in_progress').length,
    blocked: milestones.filter(m => m.status === 'blocked').length,
    upcoming: milestones.filter(m => m.status === 'upcoming').length,
  }
  
  const percentMilestonesComplete = milestones.length > 0 
    ? milestoneCounts.completed / milestones.length 
    : 0
    
  // Where should we be based purely on timeline position?
  const expectedMilestonePercent = percentThroughTimeline
  const milestoneVariance = percentMilestonesComplete - expectedMilestonePercent

  const currentMilestone = milestones.find(m => 
    m.status === 'in_progress' || m.status === 'blocked' || m.status === 'in_review'
  )

  // ── PM communication quality ────────────────────────────────────────
  const daysSinceLastReport = reports.length > 0
    ? Math.floor((today.getTime() - new Date(reports[0].report_date).getTime()) / 86400000)
    : 999
  
  // Evaluate PM report quality: are they specific? length? declining?
  const recentReportLengths = reports.slice(0, 5).map(r => 
    (r.accomplishments?.length ?? 0) + (r.plan_tomorrow?.length ?? 0)
  )
  const avgReportLength = recentReportLengths.length > 0
    ? recentReportLengths.reduce((a, b) => a + b, 0) / recentReportLengths.length
    : 0
  const reportQualityScore = Math.min(100, avgReportLength / 5) // 500+ chars = 100 quality

  // ── Health trend (from agent history, NOT PM scores) ───────────────
  let agentScoreTrend: 'improving' | 'stable' | 'declining' | 'no_data' = 'no_data'
  if (agentHistory.length >= 3) {
    const recent = agentHistory[0].weighted_score
    const older = agentHistory[2].weighted_score
    const diff = recent - older
    agentScoreTrend = diff > 5 ? 'improving' : diff < -5 ? 'declining' : 'stable'
  }

  // ── Budget analysis ─────────────────────────────────────────────────
  const totalBilled = costs.reduce((sum, c) => sum + (c.billed_amount ?? 0), 0)
  const budgetUtilizationRate = engagement.budget > 0 ? totalBilled / engagement.budget : 0
  const expectedBudgetRate = percentThroughTimeline
  const budgetVariance = budgetUtilizationRate - expectedBudgetRate // positive = overspending

  // ── Blocker analysis ────────────────────────────────────────────────
  const blockedMilestones = milestones.filter(m => m.status === 'blocked')
  const longestBlockerHours = blockedMilestones.length > 0
    ? Math.max(...blockedMilestones.map(m => 
        (today.getTime() - new Date(m.updated_at).getTime()) / 3600000
      ))
    : 0

  return {
    engagement: {
      id: engagement.id,
      title: engagement.title,
      status: engagement.status,
      mode: engagement.mode,
      budget: engagement.budget,
      start_date: engagement.start_date,
      end_date: engagement.end_date,
      company_name: engagement.companies?.name
    },
    timeline: {
      days_total: daysTotal,
      days_elapsed: daysElapsed,
      days_remaining: daysRemaining,
      percent_through: percentThroughTimeline,
      is_overdue: isOverdue,
      days_overdue: isOverdue ? Math.abs(daysRemaining) : undefined
    },
    milestones: {
      ...milestoneCounts,
      percent_complete: percentMilestonesComplete,
      expected_percent_complete: expectedMilestonePercent,
      variance: milestoneVariance,
      current_milestone: currentMilestone ? {
        title: currentMilestone.title,
        status: currentMilestone.status,
        is_blocked: currentMilestone.status === 'blocked',
        deliverables_total: currentMilestone.milestone_deliverables?.length ?? 0,
        deliverables_completed: currentMilestone.milestone_deliverables?.filter(
          (d: any) => d.completed
        ).length ?? 0,
        hours_blocked: currentMilestone.status === 'blocked' ? longestBlockerHours : 0
      } : undefined
    },
    communication: {
      days_since_last_pm_report: daysSinceLastReport,
      pm_report_quality_score: reportQualityScore,
      recent_message_count: messages.length,
      client_messages_count: messages.filter(m => m.sender_role === 'client').length,
      pm_health_score_trend: reports.length >= 2
        ? reports[0].health_score - reports[Math.min(reports.length-1, 4)].health_score
        : 0,
      last_pm_report_health: reports[0]?.health_score ?? null
    },
    budget: {
      total_contracted: engagement.budget,
      total_billed: totalBilled,
      utilization_rate: budgetUtilizationRate,
      expected_rate: expectedBudgetRate,
      variance: budgetVariance,
      is_over_budget: budgetVariance > 0.1 // >10% over expected burn
    },
    agent_history: {
      assessments_count: agentHistory.length,
      last_score: agentHistory[0]?.weighted_score ?? null,
      score_trend: agentScoreTrend,
      last_pm_score_divergence: agentHistory[0]
        ? (agentHistory[0].weighted_score ?? 0) - (agentHistory[0].pm_submitted_score ?? 0)
        : null
    }
  }
}
```

---

## Part 4: The Independent Scoring Algorithm

This runs BEFORE the Claude call. It produces a component-by-component score weighted by the client's own priority weights. It is deterministic, auditable, and never fails.

Build `src/lib/agent/scoreEngine.ts`:

```typescript
export function computeIndependentScore(
  signals: EngagementSignals,
  config: GlassboxAgentConfig
): ComponentScores {
  
  const components: ComponentScores = {}
  
  // ── TIMELINE SCORE ────────────────────────────────────────────────
  if (config.monitoring.milestone_adherence) {
    let score = 100
    const variance = signals.milestones.variance // negative = behind
    
    if (variance < 0) {
      // Behind schedule: -2 points per % behind, max -40
      score += Math.max(-40, variance * 200) // variance is 0-1, so *200 for scale
    }
    if (signals.timeline.is_overdue) {
      score -= Math.min(30, signals.timeline.days_overdue! * 3)
    }
    if (signals.milestones.blocked > 0) {
      score -= 20
    }
    // Bonus for being ahead
    if (variance > 0.1) score = Math.min(100, score + 5)
    
    components.timeline = {
      score: Math.max(0, Math.min(100, Math.round(score))),
      weight: config.priority_weights.timeline,
      finding: buildTimelineFinding(signals)
    }
  }
  
  // ── SCOPE/QUALITY SCORE ───────────────────────────────────────────
  if (config.monitoring.scope_fidelity || config.monitoring.quality_metrics) {
    let score = 85 // neutral start (we have limited quality signals without git)
    
    // Penalize if milestones are in_review too long (quality concern)
    if (signals.milestones.in_review > 1) score -= 10
    
    // Blocker duration is a proxy for quality issues
    if (signals.milestones.current_milestone?.hours_blocked) {
      const blockedDays = signals.milestones.current_milestone.hours_blocked / 24
      score -= Math.min(20, blockedDays * 5)
    }
    
    components.quality = {
      score: Math.max(0, Math.min(100, Math.round(score))),
      weight: config.priority_weights.quality,
      finding: buildQualityFinding(signals)
    }
  }
  
  // ── SCOPE ADHERENCE SCORE ─────────────────────────────────────────
  // For now: proxy from deliverable completion ratios and milestone status
  // When git is connected: compare committed code to spec
  {
    let score = 90
    const currentM = signals.milestones.current_milestone
    if (currentM) {
      const deliverableRatio = currentM.deliverables_total > 0
        ? currentM.deliverables_completed / currentM.deliverables_total
        : null
      if (deliverableRatio !== null && deliverableRatio < signals.timeline.percent_through * 0.9) {
        score -= 15
      }
    }
    
    components.scope = {
      score: Math.max(0, Math.min(100, Math.round(score))),
      weight: config.priority_weights.scope,
      finding: buildScopeFinding(signals)
    }
  }
  
  // ── COMMUNICATION SCORE ───────────────────────────────────────────
  if (config.monitoring.pm_communication) {
    let score = 100
    
    // Days without PM report
    const silence = signals.communication.days_since_last_pm_report
    if (silence > 1) score -= silence * 8  // -8 per day of silence
    
    // Report quality
    const quality = signals.communication.pm_report_quality_score
    if (quality < 50) score -= 20
    else if (quality < 30) score -= 35
    
    components.communication = {
      score: Math.max(0, Math.min(100, Math.round(score))),
      weight: config.priority_weights.communication,
      finding: buildCommunicationFinding(signals)
    }
  }
  
  // ── VELOCITY SCORE ────────────────────────────────────────────────
  if (config.monitoring.velocity_trend) {
    let score = 75 // neutral without git data
    if (signals.agent_history.score_trend === 'improving') score = 85
    if (signals.agent_history.score_trend === 'declining') score = 60
    
    components.velocity = {
      score: Math.max(0, Math.min(100, Math.round(score))),
      weight: config.priority_weights.velocity,
      finding: buildVelocityFinding(signals)
    }
  }
  
  // ── WEIGHTED COMPOSITE ────────────────────────────────────────────
  const totalWeight = Object.values(components).reduce((sum, c) => sum + c.weight, 0)
  const weightedSum = Object.values(components).reduce((sum, c) => sum + c.score * c.weight, 0)
  const compositeScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50
  
  return { components, compositeScore }
}
```

---

## Part 5: The Agent Claude Call

This is where the assessment becomes readable, specific, and calibrated to THIS client's brief.

Build `src/lib/agent/generateAssessment.ts`:

```typescript
export async function generateAgentAssessment(
  signals: EngagementSignals,
  config: GlassboxAgentConfig,
  componentScores: ComponentScores
): Promise<AgentAssessmentDraft> {
  
  const priorityDescription = buildPriorityDescription(config.priority_weights)
  const criticalReqsText = config.brief.critical_requirements.join('\n- ')
  const riskAreasText = config.brief.risk_areas.join('\n- ')
  
  const systemPrompt = `You are the Glassbox Agent — an independent AI auditor embedded in a software delivery platform. You work exclusively for the client, not the engineering firm. Your role is to give an honest, data-grounded, specific assessment of whether a software project is on track to deliver what was promised.

You have access to real engagement data. You do NOT have access to the project manager's narrative — you assess from signals only. You are not here to be diplomatic on behalf of the firm. You are here to give the client an accurate, useful read of their project.

Your tone should be: ${config.reporting.tone === 'technical' ? 'precise and data-forward — include specific numbers, percentages, and metrics' : config.reporting.tone === 'executive' ? 'clear and summary-forward — lead with risk and recommendation, data in support' : 'balanced — lead with clear summary, support with specific data'}.

Never be vague. Never say "the project is progressing." Say specifically what is and isn't on track.`

  const userPrompt = `Assess this software engagement. Client's success definition and their stated priorities must drive your assessment.

═══ CLIENT'S SUCCESS DEFINITION ═══
${config.brief.success_definition}

═══ NON-NEGOTIABLE REQUIREMENTS ═══
${criticalReqsText || 'None specified'}

═══ CLIENT'S RISK AREAS ═══
${riskAreasText || 'None specified'}

═══ WHAT THIS CLIENT CARES ABOUT MOST ═══
${priorityDescription}

═══ ENGAGEMENT SIGNALS ═══
${JSON.stringify(signals, null, 2)}

═══ COMPONENT SCORES (pre-computed) ═══
${JSON.stringify(componentScores, null, 2)}

Your assessment must:
1. Check each critical requirement explicitly — status: met / at_risk / breached
2. Reference the client's stated risk areas if any signals touch them
3. Identify findings in order of severity — lead with the most important
4. Be specific: cite actual numbers (milestone %, days elapsed, etc.)
5. Give one clear recommendation — what should the client do or watch

Respond ONLY with valid JSON in exactly this format:
{
  "health_score": <integer, informed by component scores but using your judgment>,
  "headline": "<one sentence — the most important thing to know right now>",
  "executive_summary": "<2-3 sentences — overall state of the project>",
  "critical_requirements_status": [
    { "requirement": "...", "status": "met|at_risk|breached", "detail": "..." }
  ],
  "findings": [
    {
      "category": "timeline|quality|scope|communication|velocity|critical",
      "severity": "positive|neutral|concern|critical",
      "title": "<short finding title>",
      "detail": "<specific, data-grounded explanation>",
      "data_source": "<what signal this comes from>"
    }
  ],
  "recommendation": "<one clear action or watch item for the client>",
  "scope_drift_detected": <boolean>,
  "scope_drift_detail": "<if true, specific description of drift — otherwise null>"
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-opus-4-5',  // Opus for the agent — this is the quality bar
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  })

  const data = await response.json()
  const startTime = Date.now()
  
  try {
    const draft = JSON.parse(data.content[0].text)
    return {
      ...draft,
      model_used: 'claude-opus-4-5',
      generation_duration_ms: Date.now() - startTime,
      tokens_used: data.usage?.input_tokens + data.usage?.output_tokens
    }
  } catch (e) {
    throw new Error(`Agent assessment JSON parse failed: ${data.content[0].text}`)
  }
}
```

---

## Part 6: The Full Agent Run Pipeline

Build `src/lib/agent/runAgent.ts`:

```typescript
export async function runGlassboxAgent(
  engagementId: string,
  triggerType: AgentTriggerType,
  triggeredBy?: string
): Promise<{ assessmentId: string; status: string }> {
  
  const supabase = createServerSupabaseClient()
  
  // 1. Load agent config
  const { data: config } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('engagement_id', engagementId)
    .single()
  
  if (!config) throw new Error('No agent config for this engagement')
  
  // 2. Create assessment record (status: generating)
  const { data: assessment } = await supabase
    .from('agent_assessments')
    .insert({
      engagement_id: engagementId,
      agent_config_id: config.id,
      trigger_type: triggerType,
      triggered_by: triggeredBy,
      status: 'generating'
    })
    .select()
    .single()
  
  try {
    // 3. Collect signals
    const signals = await collectEngagementSignals(engagementId, supabase)
    
    // 4. Compute deterministic scores
    const componentScores = computeIndependentScore(signals, config)
    
    // 5. Generate AI assessment
    const draft = await generateAgentAssessment(signals, config, componentScores)
    
    // 6. Check alert thresholds
    const isCritical = draft.health_score < config.alert_critical_threshold
    const hasCriticalBreach = draft.critical_requirements_status?.some(
      (r: any) => r.status === 'breached'
    )
    const triggerImmediateAlert = isCritical || hasCriticalBreach
    
    // 7. Determine pipeline
    const isOnDemand = triggerType === 'on_demand'
    const reviewDeadline = isOnDemand || triggerImmediateAlert
      ? null  // no PM window for on-demand or critical alerts
      : new Date(Date.now() + config.pm_review_window_hours * 3600000)
    
    const initialStatus = isOnDemand 
      ? 'on_demand_sent'
      : triggerImmediateAlert 
        ? 'sent_to_client'  // bypass PM for critical
        : 'pending_pm_review'
    
    // 8. Update assessment with results
    await supabase
      .from('agent_assessments')
      .update({
        signals_snapshot: signals,
        component_scores: componentScores.components,
        weighted_score: componentScores.compositeScore,
        critical_requirements_status: draft.critical_requirements_status,
        scope_drift_detected: draft.scope_drift_detected,
        scope_drift_detail: draft.scope_drift_detail,
        headline: draft.headline,
        executive_summary: draft.executive_summary,
        findings: draft.findings,
        recommendation: draft.recommendation,
        status: initialStatus,
        pm_review_deadline: reviewDeadline,
        model_used: draft.model_used,
        generation_duration_ms: draft.generation_duration_ms,
        tokens_used: draft.tokens_used
      })
      .eq('id', assessment.id)
    
    // 9. Notify PM (if pending review) or mark sent
    if (initialStatus === 'pending_pm_review') {
      await notifyPMOfPendingReview(assessment.id, engagementId, reviewDeadline!, supabase)
    } else {
      await markAssessmentSentToClient(assessment.id, supabase)
    }
    
    // 10. Create alert record if critical
    if (triggerImmediateAlert) {
      await supabase.from('agent_alerts').insert({
        engagement_id: engagementId,
        assessment_id: assessment.id,
        alert_type: hasCriticalBreach ? 'critical_requirement_breach' : 'health_threshold',
        severity: 'critical',
        title: hasCriticalBreach 
          ? 'Critical requirement breached' 
          : `Health score dropped to ${draft.health_score}`,
        detail: draft.headline,
        notified_client: true
      })
    }
    
    return { assessmentId: assessment.id, status: initialStatus }
    
  } catch (error) {
    await supabase
      .from('agent_assessments')
      .update({ status: 'generating' })  // will need manual retry
      .eq('id', assessment.id)
    throw error
  }
}
```

---

## Part 7: PM Review Interface (Internal Portal)

When an assessment is `pending_pm_review`, the PM gets notified and sees a new UI in their internal portal: the agent report with the ability to add context notes.

Build `/internal/agent-reviews/[assessmentId]/page.tsx`:

```
────────────────────────────────────────────────────────────────────────
  ⬡ Glassbox Agent Report — Hertz Car Rental AI         PENDING YOUR REVIEW

  This report was generated independently and will be sent to the client
  in 3h 42m unless you add context first. You cannot edit agent findings.
  You can add notes to any finding to provide context.

  ┌─ Agent Assessment ─────────────────────────────────────────────────┐
  │                                                                     │
  │  HEADLINE                                                           │
  │  "Milestone 3 is 11 days behind expected completion; scope is      │
  │  intact but timeline requires immediate attention."                 │
  │                                                                     │
  │  HEALTH SCORE    72  Good        Your last submitted score: 81     │
  │                                  ↑ Divergence: 9 points            │
  │                                                                     │
  │  FINDINGS                                                           │
  │                                                                     │
  │  ⚠ CONCERN — Timeline: Milestone 3 is 11 days behind              │
  │    "The engagement is 68% through its timeline but only 52%         │
  │    of milestones are complete. At current velocity, completion       │
  │    date slips from May 2 to approximately May 13."                  │
  │    Source: milestone completion rate vs. timeline position           │
  │                                                                     │
  │    [+ Add PM context]  ← expands inline                            │
  │    ┌─────────────────────────────────────────────────────────────┐ │
  │    │ The April 10 scope change (approved by client) added 3      │ │
  │    │ deliverables to Milestone 3, accounting for ~8 days of the  │ │
  │    │ 11-day slip. Net unplanned slippage is ~3 days.             │ │
  │    └───────────────────────────────────────── [Save context] ───┘ │
  │                                                                     │
  │  ✓ POSITIVE — Scope Fidelity: All deliverables match brief         │
  │    "Comparison of committed deliverables to original brief shows    │
  │    full alignment. No scope drift detected."                         │
  │    [+ Add PM context]                                              │
  │                                                                     │
  │  ⚠ CONCERN — Communication: No PM report for 2 days              │
  │    "Last daily report submitted 48 hours ago. Client's configured   │
  │    alert threshold is 48 hours — this is at threshold."            │
  │    [+ Add PM context]                                              │
  │                                                                     │
  │  RECOMMENDATION                                                     │
  │  "Request a revised timeline from your PM with specific recovery    │
  │  plan for the 11-day slippage, distinguishing scope-change impact   │
  │  from delivery velocity issues."                                    │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘

  ┌─ Your response (optional) ─────────────────────────────────────────┐
  │  Add a general response that appears alongside the agent report:   │
  │  [_____________________________________________________________]   │
  └─────────────────────────────────────────────────────────────────────┘

  [Send to client now]            [Report auto-sends in 3h 42m]
────────────────────────────────────────────────────────────────────────
```

**Critical UI rules for the PM review:**
- The agent's `headline`, `executive_summary`, `findings`, and `recommendation` are displayed read-only — no edit controls
- PM can add a context note to each individual finding (stored in `findings[n].pm_context`)
- PM can write a general `pm_response` at the bottom
- A timer shows the auto-send deadline
- The health score divergence is always shown — PM cannot hide it
- Findings the PM did NOT add context to are visible to the client as unanswered

---

## Part 8: Client-Facing Agent Report

In the client dashboard, agent assessments appear as a distinct report type in a new "Agent Reports" tab on the engagement detail page. This tab is separate from the PM "Daily Reports" tab — the client always knows what came from the agent vs. what came from the PM.

```
Engagement Detail Tabs:
[Overview] [Milestones] [Project Docs] [Daily Reports] [Agent Reports] [Codebase] [Messages]
                                                                          ↑ NEW
```

The agent report card visual language is intentionally different from PM report cards:
- Left border: `var(--color-border-info)` (blue) instead of neutral
- Header: "Glassbox Agent · Independent Assessment" with the ⬡ agent icon
- Health score shows BOTH the agent score AND the last PM score if they differ by more than 5 points
- PM context notes appear indented below the relevant finding, labeled "PM added context"
- Findings the PM left unanswered appear with a subtle "No PM response" label

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⬡ Glassbox Agent · Independent Assessment       April 14, 2026    │
│  Scheduled report · Delivered after PM review                       │
│─────────────────────────────────────────────────────────────────────│
│  "Milestone 3 is 11 days behind expected completion; scope is       │
│  intact but timeline requires immediate attention."                  │
│                                                                      │
│  Agent score: 72   PM score: 81   ← 9 point divergence             │
│─────────────────────────────────────────────────────────────────────│
│  ⚠ Timeline: Milestone 3 is 11 days behind                         │
│  At current velocity, completion slips from May 2 to ~May 13.       │
│                                                                      │
│    ┌─ PM context ─────────────────────────────────────────────────┐ │
│    │ The April 10 scope change added 3 deliverables to M3,        │ │
│    │ accounting for ~8 of the 11-day slip. Net unplanned: ~3 days.│ │
│    └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ✓ Scope: All deliverables match original brief                     │
│    No scope drift detected.                          No PM response  │
│                                                                      │
│  ⚠ Communication: No PM report for 2 days                          │
│    At your configured 48-hour alert threshold.       No PM response  │
│─────────────────────────────────────────────────────────────────────│
│  RECOMMENDATION                                                      │
│  Request revised timeline distinguishing scope-change from velocity. │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Part 9: On-Demand Assessment

The "Deploy Agent" button is always present on any active engagement in the client dashboard. It sits in the engagement header, alongside the health score.

```
Hertz — Car Rental AI Layer                [Health: 72]  [⬡ Get assessment]
```

On click:
1. Show confirmation: "Your Glassbox Agent will analyze this engagement now. Results will appear in Agent Reports in approximately 60 seconds. Your PM will be notified simultaneously."
2. Call the `runGlassboxAgent` server action with `trigger_type: 'on_demand'`, `triggered_by: clientUserId`
3. Show a loading state on the Agent Reports tab: "Agent is analyzing your engagement..."
4. Use Supabase Realtime to push the completed assessment to the client without a page reload
5. PM receives a notification: "[Client name] ran an on-demand agent assessment. View report."

On-demand assessments skip the PM review window entirely. The PM can still add context after the fact, but the client sees the raw assessment first. This is intentional — on-demand means the client wanted an unfiltered read.

---

## Part 10: Scheduled Agent Runner

The agent must run on schedule without manual triggering. Build a Next.js API route that functions as a cron endpoint:

`src/app/api/agent/run-scheduled/route.ts`

```typescript
// Called by a cron job (Vercel Cron, Supabase Edge Functions, or external cron)
// Runs every hour, checks which engagements are due for a scheduled assessment

export async function POST(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const supabase = createAdminSupabaseClient()
  
  // Find engagements due for assessment based on cadence
  const dueEngagements = await findEngagementsDueForAssessment(supabase)
  
  // Run agent for each (with concurrency limit)
  const results = await Promise.allSettled(
    dueEngagements.map(e => runGlassboxAgent(e.id, 'scheduled'))
  )
  
  return Response.json({ 
    processed: dueEngagements.length,
    succeeded: results.filter(r => r.status === 'fulfilled').length 
  })
}
```

Also build alert monitoring — a separate cron that checks thresholds even between scheduled assessments:
`src/app/api/agent/check-alerts/route.ts`

---

## Route structure additions

```
src/app/
├── (internal)/
│   └── internal/
│       ├── agent-reviews/              # PM review queue
│       │   ├── page.tsx               # All pending reviews
│       │   └── [assessmentId]/
│       │       └── page.tsx           # Individual review interface
├── dashboard/
│   └── engagements/
│       └── [id]/
│           └── page.tsx               # Add Agent Reports tab
├── api/
│   └── agent/
│       ├── run-scheduled/
│       │   └── route.ts              # Cron endpoint
│       ├── check-alerts/
│       │   └── route.ts              # Alert monitoring
│       └── on-demand/
│           └── route.ts              # Client on-demand trigger
```

---

## New TypeScript types

Add to `src/lib/types.ts`:

```typescript
export type AgentTriggerType = 
  | 'scheduled' 
  | 'on_demand' 
  | 'alert_threshold' 
  | 'milestone_slip' 
  | 'blocker_alert' 
  | 'pm_silence'

export type AssessmentStatus = 
  | 'generating'
  | 'pending_pm_review'
  | 'pm_reviewed'
  | 'auto_sent'
  | 'sent_to_client'
  | 'on_demand_sent'

export interface AgentFinding {
  category: 'timeline' | 'quality' | 'scope' | 'communication' | 'velocity' | 'critical'
  severity: 'positive' | 'neutral' | 'concern' | 'critical'
  title: string
  detail: string
  data_source: string
  pm_context: string | null  // added during PM review
}

export interface AgentAssessment {
  id: string
  engagement_id: string
  trigger_type: AgentTriggerType
  status: AssessmentStatus
  weighted_score: number
  pm_submitted_score: number | null
  score_divergence: number | null
  headline: string
  executive_summary: string
  findings: AgentFinding[]
  recommendation: string
  critical_requirements_status: Array<{
    requirement: string
    status: 'met' | 'at_risk' | 'breached'
    detail: string
  }>
  scope_drift_detected: boolean
  scope_drift_detail: string | null
  pm_response: string | null
  pm_review_deadline: string | null
  sent_to_client_at: string | null
  created_at: string
}

export interface GlassboxAgentConfig {
  id: string
  engagement_id: string
  success_definition: string
  critical_requirements: string[]
  risk_areas: string[]
  // ... (all fields from schema above)
  priority_weights: {
    timeline: number
    quality: number
    scope: number
    communication: number
    velocity: number
  }
}
```

---

## Order of operations

Build in this exact sequence to avoid getting blocked:

1. Read full existing codebase (migrations, types, components, actions)
2. Write and apply `003_glassbox_agent.sql` migration
3. Add all new TypeScript types
4. Build `collectSignals.ts` — test with real engagement data before proceeding
5. Build `scoreEngine.ts` — unit test the algorithm against known scenarios
6. Build `generateAssessment.ts` — test Claude API call with sample signals
7. Build `runAgent.ts` — the full pipeline orchestrator
8. Build the agent configuration UI step in the engagement creation flow
9. Build `/internal/agent-reviews` PM review queue and individual review page
10. Add "Agent Reports" tab to client engagement detail
11. Build the on-demand "Deploy Agent" button + Supabase Realtime listener
12. Build `/api/agent/run-scheduled` and `/api/agent/check-alerts` cron endpoints
13. Test the full pipeline: config → scheduled run → PM review → client delivery
14. Test on-demand: client clicks → agent runs → appears without reload
15. Test alert threshold: manually drop health below threshold → verify immediate send
16. `pnpm run build` — fix all TypeScript errors

---

## What you are NOT building in this sprint

- GitHub/GitLab webhook integration (code_activity and quality_metrics monitoring will return neutral scores until git is connected — this is acceptable and noted in the UI)
- Email delivery of assessments (in-portal delivery only for now)
- Mobile push notifications
- Agent calibration/feedback system (client rating assessments)
- Historical trend charts in the agent report view
- Multi-language support for reports

---

## Success criteria

This sprint is complete when:

1. A client creating a new engagement reaches a "Configure your Glassbox Agent" step with all configuration options working
2. An agent config is saved to the database and associated with the engagement
3. Calling `runGlassboxAgent(engagementId, 'scheduled')` produces a real assessment using real engagement signals and a Claude Opus call
4. The PM sees the assessment in `/internal/agent-reviews` with the read-only finding display and context-adding UI
5. The PM can add context to individual findings; those context notes appear in the client report labeled "PM added context"
6. After the PM review window (or immediately for on-demand), the assessment appears in the client's "Agent Reports" tab
7. Findings the PM did not respond to show "No PM response" in the client view
8. Score divergence between agent and PM is visible to the client when it exists
9. The "⬡ Get assessment" button in the client dashboard triggers an on-demand run and the result appears via Supabase Realtime without page reload
10. PM is notified simultaneously when client runs on-demand
11. If Claude API fails, the assessment falls back to component scores only with a note that "AI narrative generation failed — raw scores shown"
12. `pnpm run build` passes with no TypeScript errors
