-- ─────────────────────────────────────────────────────────────────────────────
-- Customer Intake → Kickoff lifecycle
--
-- Replaces the implicit "engagement created in intake state" flow with an
-- explicit four-state lifecycle:
--
--   pending_review → awaiting_signature → awaiting_kickoff → active
--
-- The original states (intake, scoping) stay readable so engagements that
-- predate this sprint don't break, but new engagements only use the new
-- states. The CHECK constraint accepts both sets.
--
-- This migration is additive: no drops, no renames of in-use columns. Old
-- engagements continue to render and behave as before.
--
-- Adds:
--   - 3 new lifecycle states on engagements.status (pending_review,
--     awaiting_signature, awaiting_kickoff)
--   - Lifecycle timestamp columns (intake_submitted_at, sow_sent_at,
--     signed_at, kickoff_completed_at, first_agent_run_at)
--   - revised_payload jsonb on engagement_configurations (SOW revisions
--     after a 'returned_to_review' transition)
--   - engagement_lifecycle_events table (full audit trail; queried by the
--     client + PM lifecycle timeline UIs)
--   - RLS for client-driven cancellation from pre-active states
--   - RLS for internal-user updates (e.g., PM reassignment)
--
-- Intentionally NOT included:
--   - No SOW table. The SOW is a payload field on the lifecycle event +
--     engagement_configurations.revised_payload; a real document store
--     comes later when SOW authoring is automated.
--   - No e-sign integration columns. The "send for signature" stub stores
--     the URL in the lifecycle event payload.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Extend engagements.status with the new lifecycle states ──────────────

alter table engagements
  drop constraint if exists engagements_status_check;

alter table engagements
  add constraint engagements_status_check
  check (status in (
    -- Legacy states (engagements that predate this sprint)
    'intake',
    'scoping',
    -- New lifecycle states
    'pending_review',
    'awaiting_signature',
    'awaiting_kickoff',
    -- Shared with legacy
    'active',
    'in_review',
    'completed',
    'cancelled'
  ));


-- ── 2. Lifecycle timestamps + first agent run scheduling ────────────────────

alter table engagements
  add column intake_submitted_at timestamptz,
  add column sow_sent_at timestamptz,
  add column signed_at timestamptz,
  add column kickoff_completed_at timestamptz,
  add column first_agent_run_at timestamptz;

-- Backfill: for existing rows, treat created_at as the intake-submitted moment
-- so timeline queries don't show NULL gaps in legacy data.
update engagements
  set intake_submitted_at = created_at
  where intake_submitted_at is null;


-- ── 3. Backfill pm_user_id for any unassigned engagements ───────────────────
-- pm_user_id was added in 002 but the existing engagement-creation path never
-- populated it. Pick the first PM as fallback for legacy rows so the new
-- internal queue UI doesn't choke on null assignees. New engagements always
-- assign at intake time.

update engagements
  set pm_user_id = (
    select id from internal_users
    where role = 'pm'
    order by created_at
    limit 1
  )
  where pm_user_id is null
    and exists (select 1 from internal_users where role = 'pm');


-- ── 4. Revised payload on engagement_configurations ─────────────────────────
-- The original snapshot at intake stays in `payload` (immutable promise).
-- If a PM revises the SOW after a 'returned_to_review' transition, the new
-- snapshot lands in `revised_payload`. Both are kept; the audit trail is
-- the diff between them plus the lifecycle events.

alter table engagement_configurations
  add column revised_payload jsonb;


-- ── 5. Engagement lifecycle events (audit trail) ────────────────────────────

create table engagement_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  event_type text not null check (event_type in (
    'intake_submitted',
    'sow_sent',
    'sow_revised',
    'signed',
    'kickoff_scheduled',
    'kickoff_completed',
    'activated',
    'cancelled',
    'returned_to_review'
  )),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text not null check (actor_role in ('client', 'pm', 'system')),
  notes text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index idx_engagement_lifecycle_events_eng_created
  on engagement_lifecycle_events(engagement_id, created_at);

create index idx_engagement_lifecycle_events_recent
  on engagement_lifecycle_events(created_at desc);


-- ── 6. RLS on lifecycle events ─────────────────────────────────────────────

alter table engagement_lifecycle_events enable row level security;

create policy "Clients can read events for their company's engagements"
  on engagement_lifecycle_events for select
  using (
    engagement_id in (
      select id from engagements where company_id = get_my_company_id()
    )
  );

create policy "Internal users can read all lifecycle events"
  on engagement_lifecycle_events for select
  using (is_internal_user());

create policy "Internal users can write lifecycle events"
  on engagement_lifecycle_events for insert
  with check (is_internal_user());

create policy "Clients can write lifecycle events for their company's engagements"
  on engagement_lifecycle_events for insert
  with check (
    engagement_id in (
      select id from engagements where company_id = get_my_company_id()
    )
  );


-- ── 7. RLS additions on engagements ─────────────────────────────────────────
-- Today's engagements policies (from 001 + 002):
--   - "Users can read their company's engagements" — SELECT
--   - "Users can insert engagements for their company" — INSERT
--   - "PMs can read their assigned engagements" — SELECT (internal)
--   - "PMs can update their assigned engagements" — UPDATE (internal)
--
-- Two gaps for this sprint:
--   a) Internal users (other than the assigned PM) need to update engagements
--      for reassignment, ops corrections, etc.
--   b) Clients need a narrow UPDATE path to cancel pre-active engagements.

create policy "Internal users can update any engagement"
  on engagements for update
  using (is_internal_user())
  with check (is_internal_user());

create policy "Clients can cancel their pre-active engagements"
  on engagements for update
  using (
    company_id = get_my_company_id()
    and status in ('intake', 'scoping', 'pending_review', 'awaiting_signature')
  )
  with check (
    company_id = get_my_company_id()
    and status = 'cancelled'
  );
