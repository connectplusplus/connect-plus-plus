# Glassbox — Sprint 1 Claude Code Prompt
## Internal Auth System + Daily Report Creator

---

## Your mission

You are building Sprint 1 of the Glassbox internal operations layer for FullStack Labs. By the end of this sprint, a FullStack Project Manager can log into a separate internal portal, select an active client engagement, fill in a structured daily report form, and submit it — causing it to appear immediately and live in the client's "Daily Reports" tab in the Glassbox customer portal.

Right now, every daily report the client sees is seeded fake data. After this sprint, it is real.

This is a Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Supabase/PostgreSQL project. Read the existing codebase before writing any code.

---

## Read first — existing codebase

Before writing anything, explore the project to understand what already exists:

```bash
# Get the full picture
find src -type f -name "*.tsx" | head -60
find src -type f -name "*.ts" | head -30
find supabase -type f
cat supabase/migrations/001_initial_schema.sql
cat src/lib/types.ts
cat src/lib/constants.ts
cat src/app/dashboard/engagements/[id]/page.tsx
cat src/components/dashboard/EngagementDetailClient.tsx
```

Pay particular attention to:
- How the existing dashboard route group is structured (`src/app/dashboard/`)
- How Supabase auth is wired (`src/lib/supabase/`)
- How the `DashboardSidebar` and `DashboardHeader` components are built
- How existing server actions work (`src/app/dashboard/actions.ts`)
- The existing `messages` table — daily reports are currently surfaced through this
- The CSS variables and design tokens in `src/app/globals.css`
- The `StatusBadge`, `MilestoneTracker`, and engagement card components for style reference

---

## What you are building

### 1. Internal user system

A new route group `(internal)` at `/internal`, completely separate from the client-facing `/dashboard`. Internal users are FullStack employees — PMs, Delivery Leads, Finance. They have their own login and their own portal.

**Do not modify the existing client auth flow.** The client signup at `/signup` and the client login at `/login` must remain untouched.

Internal users are identified by a `role` field on the existing `users` table OR a new `internal_users` table — evaluate the existing schema and pick the cleanest approach. The internal portal must be protected: only users with an internal role can access it.

For Sprint 1, only one internal role matters: **Project Manager (PM)**.

### 2. Daily report creator

A form PMs use to write and publish daily reports for their active engagements. Fields:

| Field | Type | Notes |
|-------|------|-------|
| Engagement | Select | Dropdown of engagements assigned to this PM. Show client name + engagement title. |
| Report date | Date | Defaults to today. PMs can backfill yesterday. Cannot be future-dated. |
| What we accomplished today | Textarea | Required. Rich enough to be multi-line. Placeholder: "Completed the auth middleware refactor, merged 3 PRs, resolved the Hertz API integration blocker." |
| Blockers | Textarea | Optional. Placeholder: "Waiting on client API credentials for the payment gateway integration." If empty, display "None" to the client. |
| Plan for tomorrow | Textarea | Required. Placeholder: "Begin milestone 3 testing, pair with Marcus on the caching layer." |
| Health score | Slider 1–100 | Maps to the engagement's health display. 85–100 = Excellent, 70–84 = Good, 50–69 = At Risk, below 50 = Critical. Show the label live as the slider moves. |
| AI velocity note | Textarea | Optional. Internal observation about AI tool usage this sprint. Not shown to clients. |

On submit:
- Write to the new `daily_reports` table (spec below)
- Also update the `health_score` field on the engagement record to the submitted value
- Show a success state: "Report published. Your client can see it now."
- Reset the form but keep the same engagement selected (PMs often write reports for multiple days in a catch-up session)

### 3. Wire the client dashboard to read real data

The existing "Daily Reports" tab in the client engagement detail view currently renders seeded fake data. Change it to read from the new `daily_reports` table. The client sees:

- Report date (formatted as "Monday, April 14")
- What we accomplished (full text)
- Blockers — if null/empty, show "No blockers reported"
- Plan for tomorrow (full text)
- Health score reflected in the engagement health badge

The `ai_velocity_note` field is internal only — never expose it to the client.

---

## Database changes

### New table: `daily_reports`

```sql
CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  accomplishments TEXT NOT NULL,
  blockers TEXT,
  plan_tomorrow TEXT NOT NULL,
  health_score INTEGER NOT NULL CHECK (health_score BETWEEN 1 AND 100),
  ai_velocity_note TEXT, -- internal only, never exposed to client RLS
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(engagement_id, report_date) -- one report per engagement per day
);
```

### RLS policies for `daily_reports`

```sql
-- Internal users (PMs) can insert and read all reports
-- Client users can only read reports for their own company's engagements
-- The ai_velocity_note column must never be returned to client-role queries
-- Use the existing get_my_company_id() pattern for client-side scoping
```

Write the actual RLS policies. Study how existing tables like `engagements` and `messages` are protected in the existing migration file. Follow the exact same pattern.

### Internal user role

Examine the existing `users` table schema. Then choose one of:

**Option A** — Add a `role` column to `users`:
```sql
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client' CHECK (role IN ('client', 'pm', 'delivery_lead', 'finance'));
```

**Option B** — Create a separate `internal_users` table linked to `auth.users`:
```sql
CREATE TABLE internal_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('pm', 'delivery_lead', 'finance')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Pick whichever fits cleaner with the existing schema. Document your decision with a comment in the migration file.

### Engagement assignment (minimal for Sprint 1)

PMs need to know which engagements they own. For Sprint 1, add a `pm_user_id` column to the engagements table:

```sql
ALTER TABLE engagements ADD COLUMN pm_user_id UUID REFERENCES users(id);
```

This is intentionally simple. A full staffing system comes in a later sprint. For now, when a PM logs in, they see all engagements where `pm_user_id = their user ID`.

For testing purposes: seed 1–2 internal PM users and assign them to the existing demo engagements.

---

## Route structure to build

```
src/app/
├── (internal)/                    # NEW route group — internal portal
│   ├── layout.tsx                 # Internal layout: InternalSidebar + InternalHeader
│   ├── internal-login/
│   │   └── page.tsx              # Login page for internal users
│   ├── internal/
│   │   ├── page.tsx              # Internal dashboard overview (simple for now)
│   │   └── daily-reports/
│   │       ├── page.tsx          # List of recent reports this PM has submitted
│   │       └── new/
│   │           └── page.tsx      # The daily report creator form
```

The internal URL structure should be `/internal-login` for auth and `/internal/*` for the portal itself.

---

## Design conventions — match existing Glassbox aesthetic exactly

Study the existing components thoroughly before building anything new. The internal portal should look and feel like a sibling of the client dashboard, not a different product.

**Typography:** Outfit for headings, Inter for body, JetBrains Mono for data/metrics. These are already imported via the root layout.

**Colors:** Use only CSS variables from `globals.css`. No hardcoded hex values.

**Sidebar:** Create an `InternalSidebar` component modeled directly on the existing `DashboardSidebar`. Same width, same structure. Navigation items for Sprint 1:
- Overview
- Daily Reports (active for this sprint)
- Engagements (placeholder, disabled)
- Talent (placeholder, disabled)

**Form styling:** The intake form in the marketplace (`src/components/marketplace/IntakeForm.tsx`) has the established form style for Glassbox. Match it exactly: input borders, focus states, label typography, button styling.

**Health score display:** The existing engagement cards show health scores as colored numbers. Use the same color logic in the slider label:
- 85–100: teal/green
- 70–84: neutral
- 50–69: amber
- 1–49: red

**Success states:** After submission, show an inline success card (not a toast, not an alert — an embedded success block within the form area) with the report date and engagement name confirmed. Keep the form visible below it, reset to ready state.

---

## Server actions to create

Create `src/app/(internal)/internal/actions.ts` with:

```typescript
// Get engagements assigned to the current PM
export async function getPMEngagements(): Promise<Engagement[]>

// Submit a daily report
export async function submitDailyReport(data: {
  engagement_id: string
  report_date: string
  accomplishments: string
  blockers: string | null
  plan_tomorrow: string
  health_score: number
  ai_velocity_note: string | null
}): Promise<{ success: boolean; error?: string }>

// Get recent reports submitted by this PM (for the reports list page)
export async function getMyReports(limit?: number): Promise<DailyReport[]>
```

---

## TypeScript types to add

Add to `src/lib/types.ts`:

```typescript
export type InternalUserRole = 'pm' | 'delivery_lead' | 'finance'

export interface InternalUser {
  id: string
  full_name: string
  role: InternalUserRole
  avatar_url?: string
  created_at: string
}

export interface DailyReport {
  id: string
  engagement_id: string
  author_id: string
  report_date: string
  accomplishments: string
  blockers: string | null
  plan_tomorrow: string
  health_score: number
  ai_velocity_note?: string | null // only present for internal users
  created_at: string
  // Joined fields
  engagement?: {
    title: string
    company?: {
      name: string
    }
  }
}

export type HealthScoreLabel = 'Excellent' | 'Good' | 'At Risk' | 'Critical'

export function getHealthLabel(score: number): HealthScoreLabel {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'At Risk'
  return 'Critical'
}
```

---

## Client dashboard change — wire Daily Reports tab

Find the component that renders the "Daily Reports" tab in the engagement detail view. It currently renders seeded/mock data. Change it to:

1. Accept a `dailyReports: DailyReport[]` prop (passed from the server component page)
2. The page fetches reports from the `daily_reports` table filtered by `engagement_id`, ordered by `report_date DESC`
3. Never expose `ai_velocity_note` in the client query — use a Supabase select that explicitly lists columns, omitting that field
4. If `blockers` is null or empty string, render "No blockers reported" in a muted style
5. Show a "No reports yet" empty state if the array is empty (this will be common for new engagements)
6. Keep all existing visual design of the tab intact — only change the data source

---

## Middleware update

The existing `middleware.ts` protects `/dashboard` routes for authenticated client users. Extend it to:

- Protect `/internal/*` routes — redirect to `/internal-login` if not authenticated as an internal user
- Protect `/internal-login` — redirect to `/internal` if already authenticated as an internal user
- Do NOT change any existing client dashboard routing logic

---

## Migration file

Create `supabase/migrations/002_internal_layer.sql` containing all schema changes for this sprint:
- `daily_reports` table with constraints
- `pm_user_id` column on `engagements`
- Internal user role (whichever approach you chose)
- All RLS policies
- Seed data: 2 internal PM users, assign them to the 3 demo engagements

---

## What you are NOT building in Sprint 1

Do not build any of the following — they belong to later sprints:

- Delivery lead or finance admin portals or dashboards
- Milestone submission or acceptance workflows
- Sprint boards or task management
- Billing or invoice features
- Capacity planning
- Jira integration
- Velocity score computation
- Any changes to the public marketing site
- Any changes to the client onboarding flow
- Email notifications

If you find yourself implementing any of the above, stop and return to the Sprint 1 scope.

---

## Success criteria

Sprint 1 is complete when:

1. `pnpm run build` passes with no TypeScript errors
2. An internal PM user can navigate to `/internal-login` and log in with credentials that do not work on the client `/login` page (or vice versa — the roles are enforced)
3. After login, the PM sees their assigned engagements in the daily report form's dropdown
4. The PM can fill out and submit a daily report — all fields validate correctly, health score slider shows live label
5. After submission, the client dashboard's "Daily Reports" tab for that engagement shows the new report with correct date, accomplishments, blockers ("No blockers reported" if empty), and tomorrow's plan — without a page reload being required (the client refreshes and sees it)
6. The `ai_velocity_note` field is provably not accessible via the client dashboard (test with the Supabase client using a client-role session)
7. The engagement's health score on the overview tab updates to reflect the submitted health score
8. The "No reports yet" empty state renders correctly for engagements with no reports
9. All new components match the existing Glassbox design system — same font sizes, same input styles, same color variable usage

---

## Order of operations

Work in this order to avoid getting blocked:

1. Read the full existing codebase (migrations, types, components, actions)
2. Write and apply `002_internal_layer.sql` migration
3. Add new TypeScript types to `types.ts`
4. Update middleware to protect `/internal/*`
5. Build `InternalSidebar` and `InternalHeader` layout components
6. Build `/internal-login` page (reuse Supabase auth, add role check)
7. Build the internal dashboard overview (simple, just a welcome page)
8. Build the daily report server action (`submitDailyReport`, `getPMEngagements`)
9. Build the `/internal/daily-reports/new` page with the full form
10. Build the `/internal/daily-reports` list page
11. Update the client engagement detail to read from `daily_reports` table
12. Test the full flow end-to-end
13. Fix TypeScript errors, run `pnpm run build`

---

## Notes on specific technical decisions

**Supabase column-level security:** Supabase's RLS is row-level, not column-level. To prevent `ai_velocity_note` from reaching clients, use one of:
- A Postgres view (`daily_reports_client_view`) that excludes the column, with RLS on the view
- Or ensure all client-side Supabase queries explicitly select columns by name (never `select('*')`)

The second approach is simpler and acceptable for Sprint 1. Add a comment in the code noting that a view-based approach should be implemented before the first real client uses the platform.

**Health score update:** When a daily report is submitted, update `engagements.health_score` in the same server action, not as a separate database trigger. Triggers are harder to reason about and test. A simple `UPDATE engagements SET health_score = $1 WHERE id = $2` in the action is cleaner.

**Date handling:** Store `report_date` as a SQL `DATE` (no time component). Display using `new Date(report_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })` to avoid timezone edge cases from UTC conversion.
