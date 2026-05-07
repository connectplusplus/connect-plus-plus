-- ─────────────────────────────────────────────────────────────────────────────
-- SOW Authoring & Two-Step Signature
--
-- Replaces the textarea-and-stub SOW workflow with a real authoring tool:
-- AI-drafted, PM-edited, version-tracked SOWs that flow through Legal
-- signature → Client signature → engagement activation, with a clean
-- revision cycle for either reviewer.
--
-- New lifecycle state:
--   pending_review → awaiting_legal_review → awaiting_signature
--                  → awaiting_kickoff → active
--
-- The SOW row itself carries the finer-grained sub-state (draft,
-- awaiting_legal, rejected_by_legal, awaiting_client, rejected_by_client,
-- signed, superseded, cancelled). The engagement lifecycle stays small.
--
-- Rejected-by-legal stays on the SAME row (Carlos failed an internal
-- review, not the client). Rejected-by-client creates a NEW version
-- (the client saw v1; v2 is a separate document for legal-contract
-- reasons).
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Extend engagements_status_check with awaiting_legal_review ───────────

alter table engagements
  drop constraint if exists engagements_status_check;

alter table engagements
  add constraint engagements_status_check
  check (status in (
    -- Legacy
    'intake', 'scoping',
    -- New five-state lifecycle (010 added awaiting_legal_review)
    'pending_review',
    'awaiting_legal_review',
    'awaiting_signature',
    'awaiting_kickoff',
    -- Shared
    'active', 'in_review', 'completed', 'cancelled'
  ));


-- ── 2. Extend engagement_lifecycle_events.event_type CHECK ──────────────────
-- 008's CHECK constraint was inline-anonymous on the column. Postgres names
-- inline column-level checks `<table>_<column>_check`; we drop with the
-- conventional name (if-exists for safety) and add a fresh named one.

alter table engagement_lifecycle_events
  drop constraint if exists engagement_lifecycle_events_event_type_check;

alter table engagement_lifecycle_events
  add constraint engagement_lifecycle_events_event_type_check
  check (event_type in (
    -- Legacy / pre-SOW (still emitted on old engagements; kept for audit)
    'intake_submitted',
    'sow_sent',
    'sow_revised',
    'signed',                     -- still used for both-parties-signed transition
    'kickoff_scheduled',
    'kickoff_completed',
    'activated',
    'cancelled',
    'returned_to_review',
    -- New SOW workflow events (sprint 010)
    'sow_drafted',                -- PM saved a SOW draft (initial or edit)
    'sow_sent_for_legal',         -- pending_review → awaiting_legal_review
    'sow_legal_approved',         -- awaiting_legal_review → awaiting_signature
    'sow_legal_rejected',         -- awaiting_legal_review → pending_review (same row)
    'sow_sent_to_client',         -- counter-signed PDF in client's hands
    'sow_client_rejected',        -- awaiting_signature → pending_review (new row next)
    'sow_resubmitted'             -- new SOW row created with version_number+1
  ));


-- ── 3. sows table — one row per VERSION ─────────────────────────────────────
-- Active version: latest version_number for engagement_id where
--   status not in ('superseded', 'cancelled').

create table sows (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  version_number int not null,

  status text not null default 'draft' check (status in (
    'draft',
    'awaiting_legal',
    'rejected_by_legal',
    'awaiting_client',
    'rejected_by_client',
    'signed',
    'superseded',
    'cancelled'
  )),

  -- ── Content (Carlos edits; AI fills the first draft) ──────────────
  scope_summary text,
  deliverables jsonb not null default '[]'::jsonb,
    -- [{name, description, acceptance_criteria: [string]}]
  milestones jsonb not null default '[]'::jsonb,
    -- [{name, description, payment_pct, expected_business_days}]
  pricing jsonb not null default '{}'::jsonb,
    -- {total_cents, currency, payment_terms_md}
  timeline_business_days int,
  terms_md text,

  -- ── Provenance ────────────────────────────────────────────────────
  ai_drafted boolean not null default false,
  ai_drafted_fields jsonb not null default '[]'::jsonb,
    -- dot-paths into the SOW content the AI populated. Same shape as
    -- outcome_templates.ai_suggested_fields. Dismissed pills are removed
    -- from this array.
  drafted_by uuid references internal_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- ── Legal review side ─────────────────────────────────────────────
  sent_to_legal_at timestamptz,
  legal_pdf_storage_path text,
  legal_signed_at timestamptz,
  legal_signed_by uuid references internal_users(id),
  legal_rejection_notes text,

  -- ── Client signature side ─────────────────────────────────────────
  sent_to_client_at timestamptz,
  client_pdf_storage_path text,
    -- may equal legal_pdf_storage_path for v1 of this sprint, or be a
    -- separate counter-signed render
  client_signed_at timestamptz,
  client_rejection_notes text,

  unique (engagement_id, version_number)
);

create index idx_sows_engagement on sows(engagement_id);
create index idx_sows_active
  on sows(engagement_id)
  where status not in ('superseded', 'cancelled');


-- updated_at trigger so saves auto-bump the timestamp
create or replace function set_sows_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sows_set_updated_at
  before update on sows
  for each row execute function set_sows_updated_at();


-- ── 4. sows_active view — latest non-superseded version per engagement ─────
-- security_invoker = true so RLS on the underlying sows table applies to
-- queries against the view (Postgres 15+).

create or replace view sows_active
  with (security_invoker = true) as
  select distinct on (engagement_id) *
  from sows
  where status not in ('superseded', 'cancelled')
  order by engagement_id, version_number desc;


-- ── 5. RLS on sows ─────────────────────────────────────────────────────────

alter table sows enable row level security;

-- Internal users (any role) can read all SOWs.
create policy "Internal users can read all sows"
  on sows for select
  using (is_internal_user());

-- Clients can read SOWs for their company's engagements, but only when the
-- SOW has progressed past internal review (no peeking at drafts).
create policy "Clients can read their company's published sows"
  on sows for select
  using (
    status in ('awaiting_client', 'signed')
    and engagement_id in (
      select id from engagements where company_id = get_my_company_id()
    )
  );

-- Internal users can INSERT a SOW for any engagement (PM-or-delivery_lead
-- writes are gated by the assigned-PM check at the action layer; the RLS
-- side only requires they're internal).
create policy "Internal users can insert sows"
  on sows for insert
  with check (is_internal_user());

-- Internal users can UPDATE SOWs for engagements they're assigned to,
-- but only when the SOW is in an editable status. Sent-to-legal and
-- past-that statuses are written by server actions through the broader
-- policy below.
create policy "Assigned PMs can update editable sows"
  on sows for update
  using (
    is_internal_user()
    and engagement_id in (
      select id from engagements where pm_user_id = auth.uid()
    )
    and status in ('draft', 'rejected_by_legal', 'rejected_by_client')
  )
  with check (
    is_internal_user()
    and engagement_id in (
      select id from engagements where pm_user_id = auth.uid()
    )
  );

-- Internal users can UPDATE SOWs in flight (sending to legal, recording
-- signatures, marking superseded, etc). The status field itself enforces
-- the sub-state machine in code.
create policy "Internal users can update sows in flight"
  on sows for update
  using (is_internal_user())
  with check (is_internal_user());

-- No DELETE policy. Versions are append-only.


-- ── 6. sow_drafts_usage — rate-limit + observability ───────────────────────
-- Mirror of smart_intake_usage. One row per /api/internal/engagements/[id]
-- /draft-sow call. Powers the 20/PM/hour rate limiter and the SOW pipeline
-- stats card.

create table sow_drafts_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  engagement_id uuid references engagements(id) on delete set null,
  sow_id uuid references sows(id) on delete set null,

  created_at timestamptz not null default now(),

  model_used text,
  input_tokens int,
  output_tokens int,
  latency_ms int,

  status text not null check (status in ('success', 'error', 'rate_limited')),
  error_code text
);

create index idx_sow_drafts_usage_user_recent
  on sow_drafts_usage(user_id, created_at desc);

create index idx_sow_drafts_usage_recent
  on sow_drafts_usage(created_at desc);

alter table sow_drafts_usage enable row level security;

create policy "Users can read their own sow_drafts_usage"
  on sow_drafts_usage for select
  using (user_id = auth.uid());

create policy "Internal users can read all sow_drafts_usage"
  on sow_drafts_usage for select
  using (is_internal_user());

create policy "Users can insert their own sow_drafts_usage"
  on sow_drafts_usage for insert
  with check (user_id = auth.uid());


-- ── 7. Storage bucket: sow-pdfs ─────────────────────────────────────────────
-- Path scheme: {engagement_id}/{sow_id}/{stage}.pdf
--   stage ∈ {'legal_review','client_signature'}
--
-- Reads are gated through the storage.objects RLS below. The application
-- always fetches signed URLs (15-minute expiry) rather than direct paths.

insert into storage.buckets (id, name, public)
  values ('sow-pdfs', 'sow-pdfs', false)
  on conflict (id) do nothing;

-- Internal users: full read on objects in this bucket
create policy "Internal users can read sow-pdfs"
  on storage.objects for select
  using (
    bucket_id = 'sow-pdfs'
    and is_internal_user()
  );

-- Clients: read only when (a) the engagement belongs to their company AND
-- (b) the SOW row is in awaiting_client or signed status. The path's first
-- segment is engagement_id; the second is sow_id.
create policy "Clients can read their company's published sow-pdfs"
  on storage.objects for select
  using (
    bucket_id = 'sow-pdfs'
    and (
      split_part(name, '/', 1)::uuid in (
        select id from engagements where company_id = get_my_company_id()
      )
    )
    and (
      split_part(name, '/', 2)::uuid in (
        select id from sows where status in ('awaiting_client', 'signed')
      )
    )
  );

-- Internal users (PMs / delivery leads): write/update/delete on this bucket.
-- The application enforces the per-engagement assignment at the action layer.
create policy "Internal users can insert sow-pdfs"
  on storage.objects for insert
  with check (
    bucket_id = 'sow-pdfs'
    and is_internal_user()
  );

create policy "Internal users can update sow-pdfs"
  on storage.objects for update
  using (
    bucket_id = 'sow-pdfs'
    and is_internal_user()
  )
  with check (
    bucket_id = 'sow-pdfs'
    and is_internal_user()
  );
