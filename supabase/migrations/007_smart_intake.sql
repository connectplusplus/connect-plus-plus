-- ─────────────────────────────────────────────────────────────────────────────
-- Smart intake: AI-guided template authoring
--
-- Adds the per-row marker (`ai_suggested_fields`) the editor uses to render
-- cyan "AI-suggested" badges, plus the `smart_intake_usage` table that drives
-- the per-user rate limit (10 calls/hour) and the observability stats card.
--
-- Intentionally NOT included:
--   - Storage of the raw uploaded files. Files are extracted to text
--     server-side and discarded; we don't persist client-uploaded source
--     material. (If we ever need it for audit, that's a separate sprint.)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Per-template marker for AI-populated fields ──────────────────────────
-- jsonb array of dot-paths into the template payload, e.g.
--   ["description", "milestone_templates.0.acceptance_criteria.1", "pricing.min"]
-- The editor reads this to render a cyan "AI-suggested" badge next to each
-- matching field. Dismissing a badge removes its path from the array.

alter table outcome_templates
  add column ai_suggested_fields jsonb not null default '[]'::jsonb;


-- ── 2. Smart-intake usage log ───────────────────────────────────────────────
-- One row per /api/internal/outcomes/extract call. Powers:
--   - The per-user rate limiter (count rows in the last hour).
--   - The "AI extraction" stats card (success rate, avg latency, last 7 days).

create table smart_intake_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references outcome_templates(id) on delete set null,

  created_at timestamptz not null default now(),

  -- Inputs
  file_count int not null default 0,
  total_words int not null default 0,
  model_used text,

  -- Outputs (success path)
  input_tokens int,
  output_tokens int,
  latency_ms int,

  -- Outcome
  status text not null check (status in ('success', 'error', 'rate_limited')),
  error_code text  -- one of the structured codes from FILE_HANDLING spec; null when status='success'
);

create index idx_smart_intake_usage_user_recent
  on smart_intake_usage(user_id, created_at desc);

create index idx_smart_intake_usage_recent
  on smart_intake_usage(created_at desc);


-- ── 3. RLS ───────────────────────────────────────────────────────────────────

alter table smart_intake_usage enable row level security;

-- A user can read their own usage rows.
create policy "Users can read their own usage"
  on smart_intake_usage for select
  using (user_id = auth.uid());

-- Internal users can read everyone's usage (powers the team-wide stats card).
create policy "Internal users can read all usage"
  on smart_intake_usage for select
  using (is_internal_user());

-- Inserts are server-driven via the route handler running as the user.
create policy "Users can insert their own usage"
  on smart_intake_usage for insert
  with check (user_id = auth.uid());
