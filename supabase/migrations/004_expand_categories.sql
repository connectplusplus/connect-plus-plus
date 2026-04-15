-- ─────────────────────────────────────────────────────────────────────────────
-- Expand outcome_templates.category to include partnership categories.
--
-- Original categories (build / automate / migrate / optimize) are collapsed
-- into a single 'custom' bucket. Adds 8 partner-branded categories.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Drop the old CHECK constraint (name assigned by Postgres from line 34 of
--    001_initial_schema.sql — the `check (category in (...))` in the column def
--    gets named outcome_templates_category_check by convention).
alter table outcome_templates
  drop constraint if exists outcome_templates_category_check;

-- 2. Migrate any existing rows from the old categories to 'custom' before the
--    new CHECK would reject them. Safe to run against a fresh DB too (no-op).
update outcome_templates
  set category = 'custom'
  where category in ('build', 'automate', 'migrate', 'optimize');

-- 3. Add the new CHECK with the full set of allowed values.
alter table outcome_templates
  add constraint outcome_templates_category_check
  check (category in (
    'custom',
    'google_cloud',
    'nvidia',
    'aws',
    'azure',
    'databricks',
    'domo',
    'servicenow',
    'salesforce'
  ));
