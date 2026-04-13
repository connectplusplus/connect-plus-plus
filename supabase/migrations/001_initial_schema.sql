-- ─────────────────────────────────────────────────────────────────────────────
-- Connect++ Initial Schema
-- ─────────────────────────────────────────────────────────────────────────────

-- Companies (the customer's organization)
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  size text check (size in ('1-10', '11-50', '51-200', '201-500', '500+')),
  industry text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Users (customer-side users who log into Connect++)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id),
  full_name text not null,
  email text not null unique,
  role text default 'member' check (role in ('owner', 'admin', 'member')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Outcome Templates (the productized service catalog)
create table outcome_templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text not null,
  category text not null check (category in ('build', 'automate', 'migrate', 'optimize')),
  price_range_low integer,           -- in cents
  price_range_high integer,          -- in cents
  timeline_range_low integer,        -- in business days
  timeline_range_high integer,       -- in business days
  icon text,                         -- lucide icon name
  features jsonb default '[]',       -- array of feature strings
  intake_schema jsonb not null,      -- JSON schema defining the intake questionnaire
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- Engagements (an active or completed piece of work)
create table engagements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  template_id uuid references outcome_templates(id), -- null for talent/custom
  mode text not null check (mode in ('talent', 'pod', 'predefined_outcome', 'custom_outcome')),
  title text not null,
  status text default 'intake' check (status in ('intake', 'scoping', 'active', 'in_review', 'completed', 'cancelled')),
  intake_responses jsonb,            -- customer's answers to intake questionnaire
  scope_summary text,                -- PM-validated scope description
  price_cents integer,
  start_date date,
  target_end_date date,
  actual_end_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Milestones (delivery checkpoints within an engagement)
create table milestones (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid references engagements(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'upcoming' check (status in ('upcoming', 'in_progress', 'in_review', 'completed')),
  deliverables jsonb default '[]',   -- array of { name, description, status }
  due_date date,
  completed_at timestamptz,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- Messages (communication hub)
create table messages (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid references engagements(id) on delete cascade not null,
  user_id uuid references users(id),
  sender_name text not null,         -- denormalized for display
  sender_role text default 'client' check (sender_role in ('client', 'pm', 'engineer', 'system')),
  content text not null,
  is_system_message boolean default false,
  created_at timestamptz default now()
);

-- Talent Profiles (engineers available for hire)
create table talent_profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  title text not null,               -- e.g. "Senior Full-Stack Engineer"
  seniority text check (seniority in ('mid', 'senior', 'staff', 'principal')),
  bio text,
  skills jsonb default '[]',         -- array of skill strings
  ai_velocity_score numeric(3,1),    -- e.g. 2.3 (meaning 2.3x)
  years_experience integer,
  avatar_url text,
  hourly_rate_cents integer,
  is_available boolean default true,
  highlight_projects jsonb default '[]', -- array of { title, description, tech }
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

create index engagements_company_id_idx on engagements(company_id);
create index engagements_status_idx on engagements(status);
create index milestones_engagement_id_idx on milestones(engagement_id);
create index milestones_display_order_idx on milestones(engagement_id, display_order);
create index messages_engagement_id_idx on messages(engagement_id);
create index messages_created_at_idx on messages(engagement_id, created_at);
create index outcome_templates_slug_idx on outcome_templates(slug);
create index outcome_templates_category_idx on outcome_templates(category);
create index talent_profiles_available_idx on talent_profiles(is_available);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

alter table companies enable row level security;
alter table users enable row level security;
alter table outcome_templates enable row level security;
alter table engagements enable row level security;
alter table milestones enable row level security;
alter table messages enable row level security;
alter table talent_profiles enable row level security;

-- ── companies ─────────────────────────────────────────────────────────────────
-- Users can read/update their own company
create policy "Users can read their own company"
  on companies for select
  using (
    id in (
      select company_id from users where id = auth.uid()
    )
  );

create policy "Users can update their own company"
  on companies for update
  using (
    id in (
      select company_id from users where id = auth.uid()
    )
  );

create policy "Anyone can insert a company"
  on companies for insert
  with check (true);

-- ── users ─────────────────────────────────────────────────────────────────────
-- Users can read their own record and other users in their company
create policy "Users can read their own profile"
  on users for select
  using (
    id = auth.uid()
    or company_id in (
      select company_id from users where id = auth.uid()
    )
  );

create policy "Users can update their own profile"
  on users for update
  using (id = auth.uid());

create policy "Users can insert their own profile"
  on users for insert
  with check (id = auth.uid());

-- ── outcome_templates ─────────────────────────────────────────────────────────
-- Anyone can read active templates (public catalog)
create policy "Anyone can read active outcome templates"
  on outcome_templates for select
  using (is_active = true);

-- ── engagements ───────────────────────────────────────────────────────────────
-- Users can read engagements belonging to their company
create policy "Users can read their company's engagements"
  on engagements for select
  using (
    company_id in (
      select company_id from users where id = auth.uid()
    )
  );

create policy "Users can insert engagements for their company"
  on engagements for insert
  with check (
    company_id in (
      select company_id from users where id = auth.uid()
    )
    -- Also allow unauthenticated intake submissions
    or auth.uid() is null
  );

create policy "Unauthenticated users can insert intake engagements"
  on engagements for insert
  with check (status = 'intake');

-- ── milestones ────────────────────────────────────────────────────────────────
-- Users can read milestones for their company's engagements
create policy "Users can read milestones for their company's engagements"
  on milestones for select
  using (
    engagement_id in (
      select e.id from engagements e
      join users u on u.company_id = e.company_id
      where u.id = auth.uid()
    )
  );

-- ── messages ──────────────────────────────────────────────────────────────────
-- Users can read and insert messages for their company's engagements
create policy "Users can read messages for their company's engagements"
  on messages for select
  using (
    engagement_id in (
      select e.id from engagements e
      join users u on u.company_id = e.company_id
      where u.id = auth.uid()
    )
  );

create policy "Users can insert messages for their company's engagements"
  on messages for insert
  with check (
    engagement_id in (
      select e.id from engagements e
      join users u on u.company_id = e.company_id
      where u.id = auth.uid()
    )
  );

-- ── talent_profiles ───────────────────────────────────────────────────────────
-- Anyone can read available talent (public catalog)
create policy "Anyone can read available talent profiles"
  on talent_profiles for select
  using (is_available = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Updated_at trigger
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_companies_updated_at
  before update on companies
  for each row execute procedure update_updated_at_column();

create trigger update_engagements_updated_at
  before update on engagements
  for each row execute procedure update_updated_at_column();
