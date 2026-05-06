-- ─────────────────────────────────────────────────────────────────────────────
-- Managed outcome categories
--
-- Up to now, outcome_templates.category was an enum-via-CHECK with 9 baked-in
-- values (custom + 8 partner brands). The Configurator's "+ Add new category"
-- affordance needs to grow that list at runtime, so categories become a
-- first-class table.
--
--   - outcome_categories holds key/label/color/display_order, seeded with the
--     9 existing values (label and brand color preserved from constants.ts).
--   - The CHECK constraint on outcome_templates.category is dropped and
--     replaced with a FK to outcome_categories(key).
--   - RLS: anyone can read; only pm/delivery_lead can insert/update; no delete
--     (categories may be referenced by templates).
-- ─────────────────────────────────────────────────────────────────────────────

create table outcome_categories (
  key text primary key,
  label text not null,
  color text not null,
  display_order integer not null default 0,
  created_by uuid references internal_users(id),
  created_at timestamptz not null default now()
);

create index idx_outcome_categories_display_order
  on outcome_categories(display_order);

-- Seed the 9 known categories. Labels and colors mirror src/lib/constants.ts
-- so existing UI rendering stays identical.
insert into outcome_categories (key, label, color, display_order) values
  ('custom',       'Custom',       '#7C3AED', 0),
  ('google_cloud', 'Google Cloud', '#4285F4', 1),
  ('nvidia',       'NVIDIA',       '#76B900', 2),
  ('aws',          'AWS',          '#FF9900', 3),
  ('azure',        'Azure',        '#0078D4', 4),
  ('databricks',   'Databricks',   '#FF3621', 5),
  ('domo',         'Domo',         '#00A0DF', 6),
  ('servicenow',   'ServiceNow',   '#62D84E', 7),
  ('salesforce',   'Salesforce',   '#00A1E0', 8);

-- Drop the old CHECK constraint that hardcoded the enum.
alter table outcome_templates
  drop constraint if exists outcome_templates_category_check;

-- Replace it with a FK so any new category must exist in outcome_categories.
alter table outcome_templates
  add constraint outcome_templates_category_fkey
    foreign key (category) references outcome_categories(key);

-- RLS
alter table outcome_categories enable row level security;

create policy "Anyone can read outcome categories"
  on outcome_categories for select
  using (true);

create policy "Delivery authors can insert categories"
  on outcome_categories for insert
  with check (
    exists (
      select 1 from internal_users
      where id = auth.uid() and role in ('pm', 'delivery_lead')
    )
  );

create policy "Delivery authors can update categories"
  on outcome_categories for update
  using (
    exists (
      select 1 from internal_users
      where id = auth.uid() and role in ('pm', 'delivery_lead')
    )
  );
-- No DELETE policy. Templates may reference these rows; archiving belongs in
-- a later sprint if it becomes needed.
