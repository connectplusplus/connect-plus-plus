-- ─────────────────────────────────────────────────────────────────────────────
-- L2 Configurator: structured outcome templates + per-engagement snapshots
--
-- Promotes outcome_templates from "static seed" to "first-class authored
-- artifact" with the structured fields that L1.5 (Glassbox Agent) reads as
-- expected_signals against acceptance_criteria.
--
-- Three things happen here:
--   1. outcome_templates gains structured columns (status, version, deliverables,
--      milestone_templates, pricing, timeline, delivery_config, audit_config_defaults,
--      guarantees, changelog) plus authorship metadata.
--   2. engagement_configurations is created — the per-engagement snapshot that
--      pins a purchased template's state at intake. Templates can evolve;
--      active engagements must not.
--   3. All existing seeded outcome_templates are deleted. They were dummy
--      catalog entries; real templates will be authored through the Configurator.
--
-- Public catalog reads switch from is_active to status='published'. The legacy
-- is_active column is kept and maintained automatically via trigger so any
-- application code that still reads it continues to behave.
--
-- Intentionally NOT included:
--   - No change to the partner-keyed category enum (migration 004 stays).
--   - No drop of is_active or any other in-use column.
--   - No backfill of engagement.intake_responses → engagement_configurations.
--     Both fields coexist; new engagements use engagement_configurations,
--     old engagements continue to read engagements.intake_responses.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Wipe the dummy catalog ────────────────────────────────────────────────
-- Done first so the new NOT NULL columns can use simple DEFAULTs without backfill.
delete from outcome_templates;

-- ── 2. New columns on outcome_templates ──────────────────────────────────────

alter table outcome_templates
  add column status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  add column version text not null default '1.0.0',
  add column author_id uuid references internal_users(id),
  add column published_at timestamptz,
  add column updated_at timestamptz not null default now(),
  add column pricing jsonb not null default '{}'::jsonb,
  add column timeline jsonb not null default '{}'::jsonb,
  add column deliverables jsonb not null default '[]'::jsonb,
  add column milestone_templates jsonb not null default '[]'::jsonb,
  add column delivery_config jsonb not null default '{}'::jsonb,
  add column audit_config_defaults jsonb not null default '{}'::jsonb,
  add column guarantees jsonb not null default '[]'::jsonb,
  add column changelog jsonb not null default '[]'::jsonb;

-- ── 3. updated_at trigger (matches the pattern from migration 001) ──────────

create trigger update_outcome_templates_updated_at
  before update on outcome_templates
  for each row execute procedure update_updated_at_column();

-- ── 4. is_active ↔ status reconciliation trigger ─────────────────────────────
-- Keeps the legacy is_active column accurate without requiring callers to set
-- it. Public catalog code can read either column and get the same answer.

create or replace function sync_outcome_template_is_active()
returns trigger
language plpgsql
as $$
begin
  new.is_active := (new.status = 'published');
  return new;
end;
$$;

create trigger sync_outcome_templates_is_active
  before insert or update on outcome_templates
  for each row execute procedure sync_outcome_template_is_active();

-- ── 5. Index for catalog filtering ───────────────────────────────────────────

create index idx_outcome_templates_status_category
  on outcome_templates(status, category)
  where status = 'published';

-- ── 6. RLS: public reads only published; internal users read all + write ────

drop policy if exists "Anyone can read active outcome templates" on outcome_templates;

create policy "Public can read published templates"
  on outcome_templates for select
  using (status = 'published');

create policy "Internal users can read all templates"
  on outcome_templates for select
  using (is_internal_user());

create policy "Delivery authors can insert templates"
  on outcome_templates for insert
  with check (
    exists (
      select 1 from internal_users
      where id = auth.uid() and role in ('pm', 'delivery_lead')
    )
  );

create policy "Delivery authors can update templates"
  on outcome_templates for update
  using (
    exists (
      select 1 from internal_users
      where id = auth.uid() and role in ('pm', 'delivery_lead')
    )
  );

-- No DELETE policy. Use status='archived' to retire a template; deletion is
-- blocked so engagement_configurations FKs to source_template_id stay valid.

-- ── 7. engagement_configurations — the snapshot-on-purchase artifact ─────────

create table engagement_configurations (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null unique references engagements(id) on delete cascade,
  source_template_id uuid references outcome_templates(id),  -- nullable for talent/custom modes
  source_template_version text not null,
  payload jsonb not null,                  -- full template snapshot at purchase
  intake_responses jsonb not null default '{}'::jsonb,
  audit_config_overrides jsonb,            -- nullable; per-engagement audit tuning
  created_at timestamptz not null default now()
);

create index idx_engagement_configurations_engagement
  on engagement_configurations(engagement_id);

alter table engagement_configurations enable row level security;

create policy "Clients can read their company's configurations"
  on engagement_configurations for select
  using (
    engagement_id in (
      select id from engagements where company_id = get_my_company_id()
    )
  );

create policy "Internal users can read all configurations"
  on engagement_configurations for select
  using (is_internal_user());

create policy "Internal users can manage all configurations"
  on engagement_configurations for all
  using (is_internal_user())
  with check (is_internal_user());

-- Allow client-driven inserts at intake. Phase 5 will move this server-side
-- with stricter validation; for now match the existing intake-form behaviour.
create policy "Clients can insert configurations for their engagements"
  on engagement_configurations for insert
  with check (
    engagement_id in (
      select id from engagements where company_id = get_my_company_id()
    )
  );

-- ── 8. PMs can read configurations for their assigned engagements ────────────

create policy "PMs can read configurations for assigned engagements"
  on engagement_configurations for select
  using (
    engagement_id in (select id from engagements where pm_user_id = auth.uid())
  );
