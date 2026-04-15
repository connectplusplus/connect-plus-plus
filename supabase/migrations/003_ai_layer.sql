-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 1 V2: AI-Driven Report System + Glassbox Agent Foundation
--
-- Adds AI metadata to daily_reports, creates agent configuration and
-- assessment tables for the Glassbox Agent system.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── AI metadata columns on daily_reports ──────────────────────────────────

alter table daily_reports add column baseline_score_computed integer;
alter table daily_reports add column ai_score_suggested integer;
alter table daily_reports add column ai_reasoning text;
alter table daily_reports add column ai_generated_at timestamptz;
alter table daily_reports add column pm_override_reason text;

-- ── Glassbox Agent Configuration ─────────────────────────────────────────

create table agent_configs (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null unique references engagements(id) on delete cascade,

  -- Brief: what success looks like (client's words)
  success_definition text not null,
  critical_requirements text[] default '{}',
  risk_areas text[] default '{}',

  -- Monitoring toggles
  monitor_milestone_adherence boolean default true,
  monitor_scope_fidelity boolean default true,
  monitor_code_activity boolean default true,
  monitor_quality_metrics boolean default true,
  monitor_budget_adherence boolean default true,
  monitor_pm_communication boolean default true,
  monitor_blocker_resolution boolean default true,
  monitor_velocity_trend boolean default false,

  -- Priority weights (1-10)
  weight_timeline integer default 8 check (weight_timeline between 1 and 10),
  weight_quality integer default 7 check (weight_quality between 1 and 10),
  weight_scope integer default 9 check (weight_scope between 1 and 10),
  weight_communication integer default 5 check (weight_communication between 1 and 10),
  weight_velocity integer default 4 check (weight_velocity between 1 and 10),

  -- Alert thresholds
  alert_critical_threshold integer default 60,
  alert_milestone_slip_days integer default 3,
  alert_no_commit_hours integer default 72,
  alert_blocker_hours integer default 48,
  alert_pm_silence_hours integer default 48,

  -- Report preferences
  report_cadence text default 'daily' check (report_cadence in ('daily', 'every_2_days', 'weekly')),
  report_tone text default 'balanced' check (report_tone in ('technical', 'executive', 'balanced')),
  include_raw_signals boolean default true,
  on_demand_enabled boolean default true,
  pm_review_window_hours integer default 4 check (pm_review_window_hours between 1 and 24),
  escalation_contacts text[] default '{}',

  -- Metadata
  configured_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Agent Assessments ────────────────────────────────────────────────────

create table agent_assessments (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  agent_config_id uuid not null references agent_configs(id),

  -- Trigger
  trigger_type text not null check (trigger_type in (
    'scheduled', 'on_demand', 'alert_threshold',
    'milestone_slip', 'blocker_alert', 'pm_silence'
  )),
  triggered_by uuid,

  -- Signals snapshot
  signals_snapshot jsonb not null,

  -- Agent's independent scoring
  component_scores jsonb not null,
  weighted_score integer not null,
  pm_submitted_score integer,
  score_divergence integer,

  -- Contract compliance
  critical_requirements_status jsonb,
  scope_drift_detected boolean default false,
  scope_drift_detail text,

  -- Agent's written assessment (Claude-generated, client-facing)
  headline text not null,
  executive_summary text not null,
  findings jsonb not null,
  recommendation text not null,

  -- PM review pipeline
  status text default 'pending_pm_review' check (status in (
    'generating', 'pending_pm_review', 'pm_reviewed',
    'auto_sent', 'sent_to_client', 'on_demand_sent'
  )),
  pm_review_deadline timestamptz,
  pm_response text,
  pm_reviewed_at timestamptz,
  pm_reviewed_by uuid,

  -- Delivery
  sent_to_client_at timestamptz,
  client_viewed_at timestamptz,

  -- AI metadata
  model_used text default 'claude-sonnet-4-20250514',
  generation_duration_ms integer,
  tokens_used integer,

  created_at timestamptz default now()
);

create index idx_agent_assessments_engagement on agent_assessments(engagement_id);
create index idx_agent_assessments_status on agent_assessments(status);
create index idx_agent_assessments_created on agent_assessments(created_at desc);

-- ── Agent Alerts ─────────────────────────────────────────────────────────

create table agent_alerts (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  assessment_id uuid references agent_assessments(id),

  alert_type text not null,
  severity text not null check (severity in ('warning', 'critical')),
  title text not null,
  detail text not null,

  notified_client boolean default false,
  notified_pm boolean default false,
  notified_escalation_contacts boolean default false,

  acknowledged_at timestamptz,
  acknowledged_by uuid,

  created_at timestamptz default now()
);

-- ── RLS for agent tables ─────────────────────────────────────────────────

alter table agent_configs enable row level security;
alter table agent_assessments enable row level security;
alter table agent_alerts enable row level security;

-- Clients can read their own engagement's agent config
create policy "client_read_own_agent_config" on agent_configs
  for select using (
    engagement_id in (
      select id from engagements where company_id = get_my_company_id()
    )
  );

-- Clients can update their own agent config
create policy "client_update_own_agent_config" on agent_configs
  for update using (
    engagement_id in (
      select id from engagements where company_id = get_my_company_id()
    )
  );

-- Clients can insert agent config for their engagements
create policy "client_insert_agent_config" on agent_configs
  for insert with check (
    engagement_id in (
      select id from engagements where company_id = get_my_company_id()
    )
  );

-- Clients can read sent assessments only (not pending PM review)
create policy "client_read_sent_assessments" on agent_assessments
  for select using (
    status in ('sent_to_client', 'on_demand_sent', 'auto_sent')
    and engagement_id in (
      select id from engagements where company_id = get_my_company_id()
    )
  );

-- Clients can read alerts for their engagements
create policy "client_read_alerts" on agent_alerts
  for select using (
    engagement_id in (
      select id from engagements where company_id = get_my_company_id()
    )
  );

-- PMs can manage agent configs for assigned engagements
create policy "pm_manage_agent_configs" on agent_configs
  for all using (
    engagement_id in (select id from engagements where pm_user_id = auth.uid())
  );

-- PMs can manage assessments for assigned engagements
create policy "pm_manage_assessments" on agent_assessments
  for all using (
    engagement_id in (select id from engagements where pm_user_id = auth.uid())
  );

-- PMs can manage alerts for assigned engagements
create policy "pm_manage_alerts" on agent_alerts
  for all using (
    engagement_id in (select id from engagements where pm_user_id = auth.uid())
  );
