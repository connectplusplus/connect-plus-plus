-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 1: Internal Operations Layer
--
-- Decision: Using a separate `internal_users` table rather than adding an
-- internal role to the existing `users` table. Rationale:
--   - The existing `users.role` column stores client-side roles (owner/admin/member)
--   - Internal users (PMs, delivery leads, finance) are FullStack employees,
--     not client personnel — they should not be scoped to a single company
--   - A separate table keeps the client and internal auth systems cleanly separated
--   - Internal users still reference auth.users for Supabase Auth
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Internal users ───────────────────────────────────────────────────────────

create table internal_users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('pm', 'delivery_lead', 'finance')),
  avatar_url text,
  created_at timestamptz default now()
);

alter table internal_users enable row level security;

-- Internal users can read their own record
create policy "Internal users can read their own record"
  on internal_users for select
  using (id = auth.uid());

-- Internal users can read other internal users (for team views in later sprints)
create policy "Internal users can read all internal users"
  on internal_users for select
  using (
    auth.uid() in (select id from internal_users)
  );

-- ── Helper: check if current user is an internal user ────────────────────────

create or replace function is_internal_user()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from internal_users where id = auth.uid())
$$;

-- ── PM assignment on engagements ─────────────────────────────────────────────

alter table engagements add column pm_user_id uuid references internal_users(id);

create index engagements_pm_user_id_idx on engagements(pm_user_id);

-- Internal users (PMs) can read all engagements assigned to them
create policy "PMs can read their assigned engagements"
  on engagements for select
  using (pm_user_id = auth.uid());

-- PMs can update engagements assigned to them (e.g., health_score)
create policy "PMs can update their assigned engagements"
  on engagements for update
  using (pm_user_id = auth.uid());

-- ── Daily reports ────────────────────────────────────────────────────────────

create table daily_reports (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  author_id uuid not null references internal_users(id),
  report_date date not null default current_date,
  accomplishments text not null,
  blockers text,                     -- null = no blockers
  plan_tomorrow text not null,
  health_score integer not null check (health_score between 1 and 100),
  ai_velocity_note text,            -- internal only, never exposed to client RLS
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(engagement_id, report_date) -- one report per engagement per day
);

create index daily_reports_engagement_id_idx on daily_reports(engagement_id);
create index daily_reports_author_id_idx on daily_reports(author_id);
create index daily_reports_report_date_idx on daily_reports(engagement_id, report_date desc);

alter table daily_reports enable row level security;

-- PMs can insert reports for engagements assigned to them
create policy "PMs can insert daily reports"
  on daily_reports for insert
  with check (
    author_id = auth.uid()
    and engagement_id in (
      select id from engagements where pm_user_id = auth.uid()
    )
  );

-- PMs can read all their own reports
create policy "PMs can read their own reports"
  on daily_reports for select
  using (author_id = auth.uid());

-- PMs can update their own reports (for corrections)
create policy "PMs can update their own reports"
  on daily_reports for update
  using (author_id = auth.uid());

-- Client users can read reports for their company's engagements
-- NOTE: ai_velocity_note is accessible at the row level; column-level filtering
-- is enforced in the application layer by explicitly selecting columns.
-- A view-based approach should be implemented before first real client usage.
create policy "Clients can read reports for their company engagements"
  on daily_reports for select
  using (
    engagement_id in (
      select id from engagements where company_id = get_my_company_id()
    )
  );

-- ── Allow PMs to read milestones and messages for assigned engagements ───────

create policy "PMs can read milestones for assigned engagements"
  on milestones for select
  using (
    engagement_id in (select id from engagements where pm_user_id = auth.uid())
  );

create policy "PMs can read messages for assigned engagements"
  on messages for select
  using (
    engagement_id in (select id from engagements where pm_user_id = auth.uid())
  );

-- PMs can insert messages for assigned engagements
create policy "PMs can insert messages for assigned engagements"
  on messages for insert
  with check (
    engagement_id in (select id from engagements where pm_user_id = auth.uid())
  );

-- PMs can read company info for assigned engagements (for report dropdown)
create policy "PMs can read companies for assigned engagements"
  on companies for select
  using (
    id in (select company_id from engagements where pm_user_id = auth.uid())
  );
