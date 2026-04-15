# Glassbox — Sprint 1 v2: AI-Driven Daily Report System
## The PM Reviews, The AI Writes

---

## The core idea

The daily report form is not a form. It is a review interface.

When Carlos opens the daily report for an engagement, Glassbox has already done the work. It has pulled every available signal from the engagement — milestone status, task completion rates, what changed since yesterday's report, how far through the timeline the project is vs. where it should be — and generated a full draft report with a health score and written reasoning. Carlos reads it, adjusts anything that needs a human eye, adds his own comments, and publishes in under 60 seconds.

There is no blank form. There is no manual health score entry. The AI fills everything. Carlos is the editor, not the author.

This is the "human in the loop" model: AI does the analysis and drafting, human provides judgment and context, system publishes to the client.

---

## Read first — existing codebase

Before writing anything, explore the project:

```bash
find src -type f -name "*.tsx" | head -60
find src -type f -name "*.ts" | head -30
find supabase -type f
cat supabase/migrations/001_initial_schema.sql
cat src/lib/types.ts
cat src/lib/constants.ts
cat src/app/dashboard/actions.ts
cat src/components/dashboard/EngagementDetailClient.tsx
```

Understand the existing engagement data model deeply — every field on `engagements`, `milestones`, `milestone_deliverables`, and `messages` is an input signal for the AI health scoring algorithm.

---

## What you are building

### 1. Internal user system

A new route group `(internal)` at `/internal`, completely separate from the client-facing `/dashboard`. Internal users are FullStack employees — PMs, Delivery Leads, Finance. They have their own login and portal.

**Do not touch the existing client auth flow.** The client signup at `/signup` and client login at `/login` remain untouched.

Add a `role` column to the existing `users` table:
```sql
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client' 
  CHECK (role IN ('client', 'pm', 'delivery_lead', 'finance'));
```

Add `pm_user_id` to engagements so PMs see their assigned projects:
```sql
ALTER TABLE engagements ADD COLUMN pm_user_id UUID REFERENCES users(id);
```

### 2. The engagement signal collector

Before generating anything, the system needs to collect all available signals for an engagement. Build a server-side function `collectEngagementSignals(engagementId)` that returns:

```typescript
interface EngagementSignals {
  engagement: {
    title: string
    status: string
    budget: number
    start_date: string
    end_date: string
    current_health_score: number
    mode: string // 'custom_outcome' | 'predefined_outcome' | 'talent' | 'pod'
  }
  timeline: {
    days_total: number
    days_elapsed: number
    days_remaining: number
    percent_through: number          // e.g. 0.62 = 62% through the timeline
    expected_completion_date: string
    is_overdue: boolean
    days_overdue?: number
  }
  milestones: {
    total: number
    completed: number
    in_review: number
    in_progress: number
    blocked: number
    upcoming: number
    percent_complete: number         // by count
    expected_percent_complete: number // based on timeline position
    variance: number                 // actual - expected (negative = behind)
    current_milestone?: {
      title: string
      status: string
      due_date: string
      days_until_due: number
      deliverables_total: number
      deliverables_completed: number
      is_blocked: boolean
      blocked_reason?: string
    }
  }
  recent_activity: {
    last_report_date: string | null
    last_report_health: number | null
    health_trend: 'improving' | 'stable' | 'declining' | 'no_data'
    days_since_last_report: number
    last_message_date: string | null
    recent_messages_count: number    // messages in last 7 days
  }
  team: {
    size: number
    lead_name: string
    members: string[]
  }
}
```

Write real SQL to gather this data. Do not hardcode or mock any of it. Every field should come from the actual database state of the engagement at the moment the PM opens the report page.

### 3. The AI health scoring algorithm

This is the core of Sprint 1. Build a server action `generateEngagementReport(engagementId)` that:

**Step 1 — collect signals** using `collectEngagementSignals()` above.

**Step 2 — compute a deterministic baseline score** before calling the AI. This ensures the score is grounded in data even if the AI call fails:

```typescript
function computeBaselineScore(signals: EngagementSignals): number {
  let score = 100

  // Timeline adherence (max -30 points)
  // If milestone completion % is behind expected % by the timeline position:
  const milestoneVariance = signals.milestones.variance // negative = behind
  if (milestoneVariance < 0) {
    // -1.5 points per percentage point behind
    score += Math.max(-30, milestoneVariance * 1.5)
  }

  // Blocked milestone (-20 points)
  if (signals.milestones.blocked > 0) {
    score -= 20
  }

  // Overdue engagement (-15 points, escalating)
  if (signals.timeline.is_overdue) {
    score -= Math.min(15, signals.timeline.days_overdue! * 2)
  }

  // Declining health trend (-10 points)
  if (signals.recent_activity.health_trend === 'declining') {
    score -= 10
  }

  // No recent reporting (-5 points if no report in 3+ days)
  if (signals.recent_activity.days_since_last_report > 3) {
    score -= 5
  }

  // Bonus: ahead of schedule (+5 points)
  if (milestoneVariance > 10) {
    score += 5
  }

  return Math.max(1, Math.min(100, Math.round(score)))
}
```

**Step 3 — call Claude to generate the full report draft.** Use the Anthropic API directly from the server action:

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: `You are the AI delivery intelligence engine for Glassbox by FullStack Labs. 
You analyze software project data and generate concise, professional daily reports for Project Managers to review and send to clients.

Your reports are factual, specific, and written in first-person plural ("We completed...", "We are...").
Never use vague language. Reference specific milestones, deliverables, and blockers by name.
Never mention AI, scores, or internal systems in client-visible text.
Keep each section to 2-4 sentences maximum.`,
    messages: [{
      role: 'user',
      content: `Generate a daily project report draft based on this engagement data:

${JSON.stringify(signals, null, 2)}

Baseline health score computed from metrics: ${baselineScore}/100

Respond with ONLY a JSON object (no markdown, no explanation) in this exact format:
{
  "health_score": <integer 1-100, informed by but not required to exactly match baseline>,
  "health_reasoning": "<2-3 sentences explaining the score for the PM — specific, data-driven, mentions key factors>",
  "accomplishments": "<what the team accomplished today/recently — specific, references milestone names and deliverables>",
  "blockers": "<current blockers if any, or null if none>",
  "plan_tomorrow": "<concrete plan for the next working day — references upcoming deliverables>",
  "ai_velocity_note": "<internal observation about delivery efficiency, AI tool usage patterns, or process observations — PM only, not client-facing>"
}`
    }]
  })
})

const data = await response.json()
const reportDraft = JSON.parse(data.content[0].text)
```

**Step 4 — return the complete draft** to the client component:

```typescript
return {
  signals,
  baselineScore,
  draft: {
    health_score: reportDraft.health_score,
    health_reasoning: reportDraft.health_reasoning,
    accomplishments: reportDraft.accomplishments,
    blockers: reportDraft.blockers,
    plan_tomorrow: reportDraft.plan_tomorrow,
    ai_velocity_note: reportDraft.ai_velocity_note,
  },
  generated_at: new Date().toISOString()
}
```

### 4. The review interface

The UI that Carlos sees is not a blank form. It is a pre-filled review interface. Here is the experience:

**On page load:**
- Show a "Generating report..." loading state with a brief explanation ("Glassbox is analyzing 12 signals across this engagement")
- Call `generateEngagementReport()` as a server action triggered on mount
- When complete, populate all fields with the AI-generated draft

**Health score display (the signature feature):**

The health score is not a slider Carlos drags. It is an AI-computed number, shown prominently, with an expandable reasoning panel. Carlos can override it if needed, but the default is the AI's assessment.

```
┌─────────────────────────────────────────────────────┐
│  Health Score                                        │
│                                                      │
│  [  78  ]  Good        ← large, colored number      │
│                                                      │
│  ▼ AI reasoning (expandable)                        │
│  "Milestone 3 is 8 days behind the expected         │
│  completion rate for this point in the timeline.    │
│  The scope change approved on April 10 accounts     │
│  for 5 of those days. Active velocity is strong     │
│  — 2.3x AI-augmented throughput — preventing        │
│  further slippage."                                  │
│                                                      │
│  Override: [slider appears only if PM clicks        │
│  "Override AI score"]                               │
└─────────────────────────────────────────────────────┘
```

**Each text field:**
- Pre-filled with AI draft text
- Fully editable — Carlos can rewrite any section
- Show a subtle "AI generated" indicator on each field that disappears once Carlos edits it
- No asterisks or "required" labels — the AI has already filled everything

**The publish button:**
- Label: "Publish to Client" (not "Submit")
- On click: save to `daily_reports` table, update engagement health score, show success state
- Success state shows: engagement name, report date, a preview of what the client will see

**The multi-engagement workflow (Carlos manages multiple projects):**

Carlos should be able to generate and review reports for all his engagements in one session, not navigate to a separate form per engagement. Design the page so:

- An engagement selector at the top (same as before)
- Switching engagement: ask "Save draft for [current engagement]?" → if yes, store as draft in localStorage → load new engagement and generate its report
- A "Pending reports" indicator showing which engagements don't have today's report yet
- After publishing one report, automatically prompt: "3 other engagements need today's report. Generate next?" with one-click to move to the next one

**Draft persistence:**
- Auto-save edits to localStorage every 30 seconds (keyed by `engagement_id + report_date`)
- On page load, check for a saved draft — if found, show "Resume draft from [time]" vs "Generate fresh"
- Drafts expire after 24 hours

### 5. The signals panel (PM-only visibility)

Alongside the report form, show Carlos the raw signals that drove the AI's assessment. This is not client-facing — it's Carlos's situational awareness. Show it in a collapsible side panel or below the form:

```
Engagement signals — April 14, 2026

Timeline          62% through, 58% complete  ⚠ 4% behind
Milestones        3 complete, 1 in progress, 1 blocked
Current milestone Milestone 3: API Integration
                  Due in 6 days · 4/7 deliverables done
Health trend      Stable (was 81 → 80 → 78)
Last report       Yesterday (1 day ago)
Team velocity     2.3x AI-augmented
```

Each signal row is color-coded: green (on track), amber (minor concern), red (at risk). This gives Carlos the context to make informed edits to the AI draft if needed.

---

## Database changes

Create `supabase/migrations/002_internal_layer.sql`:

```sql
-- Role system
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client' 
  CHECK (role IN ('client', 'pm', 'delivery_lead', 'finance'));

-- PM assignment
ALTER TABLE engagements ADD COLUMN pm_user_id UUID REFERENCES users(id);

-- Daily reports
CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- AI generation metadata
  baseline_score_computed INTEGER,        -- the deterministic algorithm score
  ai_score_suggested INTEGER,             -- what Claude recommended
  ai_reasoning TEXT,                      -- Claude's reasoning (PM-visible only)
  ai_generated_at TIMESTAMPTZ,           -- when the draft was generated
  
  -- Published content (what client sees)
  accomplishments TEXT NOT NULL,
  blockers TEXT,
  plan_tomorrow TEXT NOT NULL,
  health_score INTEGER NOT NULL CHECK (health_score BETWEEN 1 AND 100),
  
  -- Internal only
  ai_velocity_note TEXT,
  pm_override_reason TEXT,               -- if PM changed the AI health score, why
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(engagement_id, report_date)
);

-- RLS: clients can read their reports but never see AI metadata columns
-- Use explicit column selection in all client-side queries (never select *)
-- Internal users (pm, delivery_lead, finance) can read all
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_read_own_reports" ON daily_reports
  FOR SELECT TO authenticated
  USING (
    engagement_id IN (
      SELECT e.id FROM engagements e
      JOIN companies c ON e.company_id = c.id
      JOIN users u ON u.company_id = c.id
      WHERE u.id = auth.uid() AND u.role = 'client'
    )
  );

CREATE POLICY "internal_full_access" ON daily_reports
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('pm', 'delivery_lead', 'finance')
    )
  );

-- Seed: create 2 PM users and assign to demo engagements
-- (Use the existing demo engagement IDs from the seed data)
```

---

## TypeScript types to add

Add to `src/lib/types.ts`:

```typescript
export type InternalUserRole = 'pm' | 'delivery_lead' | 'finance'

export interface EngagementSignals {
  engagement: {
    title: string
    status: string
    budget: number
    start_date: string
    end_date: string
    current_health_score: number
    mode: string
  }
  timeline: {
    days_total: number
    days_elapsed: number
    days_remaining: number
    percent_through: number
    is_overdue: boolean
    days_overdue?: number
  }
  milestones: {
    total: number
    completed: number
    in_review: number
    in_progress: number
    blocked: number
    upcoming: number
    percent_complete: number
    expected_percent_complete: number
    variance: number
    current_milestone?: {
      title: string
      status: string
      due_date: string
      days_until_due: number
      deliverables_total: number
      deliverables_completed: number
      is_blocked: boolean
      blocked_reason?: string
    }
  }
  recent_activity: {
    last_report_date: string | null
    last_report_health: number | null
    health_trend: 'improving' | 'stable' | 'declining' | 'no_data'
    days_since_last_report: number
    recent_messages_count: number
  }
  team: {
    size: number
    lead_name: string
    members: string[]
  }
}

export interface ReportDraft {
  health_score: number
  health_reasoning: string         // PM-only, never sent to client
  accomplishments: string
  blockers: string | null
  plan_tomorrow: string
  ai_velocity_note: string | null  // PM-only
}

export interface GeneratedReport {
  signals: EngagementSignals
  baselineScore: number
  draft: ReportDraft
  generated_at: string
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
  // Internal fields — only present for PM sessions
  ai_reasoning?: string
  ai_velocity_note?: string
  baseline_score_computed?: number
  ai_score_suggested?: number
  created_at: string
}

export type HealthLabel = 'Excellent' | 'Good' | 'At Risk' | 'Critical'

export function getHealthLabel(score: number): HealthLabel {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'At Risk'
  return 'Critical'
}

export function getHealthColor(score: number): string {
  if (score >= 85) return 'var(--color-text-success)'
  if (score >= 70) return 'var(--color-text-primary)'
  if (score >= 50) return 'var(--color-text-warning)'
  return 'var(--color-text-danger)'
}
```

---

## Route structure

```
src/app/
├── (internal)/
│   ├── layout.tsx                       # InternalSidebar + InternalHeader
│   ├── internal-login/
│   │   └── page.tsx
│   ├── internal/
│   │   ├── page.tsx                     # Overview: pending reports across all engagements
│   │   └── daily-reports/
│   │       ├── page.tsx                 # Published reports history
│   │       └── new/
│   │           └── page.tsx             # The AI-driven review interface
```

---

## Server actions

Create `src/app/(internal)/internal/actions.ts`:

```typescript
// Collect all signals for an engagement (pure data, no AI)
export async function collectEngagementSignals(
  engagementId: string
): Promise<EngagementSignals>

// Generate a full AI report draft for an engagement
// Calls collectEngagementSignals + baseline score + Claude API
export async function generateEngagementReport(
  engagementId: string
): Promise<GeneratedReport>

// Get engagements assigned to the current PM with today's report status
export async function getPMEngagements(): Promise<Array<{
  engagement: Engagement
  has_todays_report: boolean
  last_report_date: string | null
  last_report_health: number | null
}>>

// Publish a reviewed report (writes to DB, updates engagement health score)
export async function publishDailyReport(data: {
  engagement_id: string
  report_date: string
  accomplishments: string
  blockers: string | null
  plan_tomorrow: string
  health_score: number
  ai_velocity_note: string | null
  ai_reasoning: string | null
  baseline_score_computed: number
  ai_score_suggested: number
  pm_override_reason?: string
}): Promise<{ success: boolean; report_id?: string; error?: string }>

// Get published reports for this PM (history view)
export async function getMyPublishedReports(limit?: number): Promise<DailyReport[]>
```

---

## The review page — component architecture

```
NewDailyReportPage (server component)
└── DailyReportReview (client component)
    ├── EngagementSelector
    │   └── PendingReportsBadge (count of engagements missing today's report)
    ├── ReportGenerationLoader (shown while fetching)
    │   └── "Analyzing 12 engagement signals..."
    ├── SignalsPanel (collapsible, PM-only)
    │   └── SignalRow × N (color-coded per status)
    ├── HealthScoreDisplay
    │   ├── ScoreNumber (large, colored by range)
    │   ├── HealthLabel
    │   ├── ReasoningPanel (expandable, AI reasoning text)
    │   └── OverrideToggle → ScoreSlider (only if PM clicks override)
    ├── ReportFieldEditor × 4
    │   ├── accomplishments (label: "What we accomplished")
    │   ├── blockers (label: "Blockers", nullable)
    │   ├── plan_tomorrow (label: "Plan for tomorrow")
    │   └── ai_velocity_note (label: "AI velocity note", internal badge)
    │       Each field shows "AI generated" indicator until edited
    ├── MultiEngagementNav
    │   └── "2 more engagements need today's report → Generate next"
    └── PublishButton
        └── SuccessState (inline, shows client preview)
```

---

## Client dashboard — wire Daily Reports tab

The "Daily Reports" tab in the client engagement detail must read from `daily_reports`. The client query must explicitly select only safe columns:

```typescript
const { data } = await supabase
  .from('daily_reports')
  .select(`
    id,
    report_date,
    accomplishments,
    blockers,
    plan_tomorrow,
    health_score
  `)
  .eq('engagement_id', engagementId)
  .order('report_date', { ascending: false })
```

Never select `ai_reasoning`, `ai_velocity_note`, `baseline_score_computed`, or `ai_score_suggested` in client-facing queries.

If `blockers` is null or empty: render "No blockers reported" in muted text.
If no reports exist: render a "Reports will appear here once your PM begins daily check-ins" empty state.

The `health_score` on the engagement overview tab should update when a report is published (the `publishDailyReport` action updates `engagements.health_score`).

---

## Middleware

Protect `/internal/*` — redirect to `/internal-login` if not authenticated as an internal role.
Protect `/internal-login` — redirect to `/internal` if already authenticated as internal.
Do not change any existing client routing.

---

## Error handling for AI generation

The AI generation can fail (API timeout, parse error, network). Handle gracefully:

```typescript
try {
  const aiDraft = await callClaudeForDraft(signals, baselineScore)
  return { signals, baselineScore, draft: aiDraft, generated_at: ... }
} catch (error) {
  // Fall back to structured but non-AI draft
  return {
    signals,
    baselineScore,
    draft: {
      health_score: baselineScore,
      health_reasoning: 'Score computed from milestone progress and timeline data.',
      accomplishments: '', // PM must fill
      blockers: null,
      plan_tomorrow: '',   // PM must fill
      ai_velocity_note: null
    },
    generated_at: ...,
    fallback: true  // UI shows "AI generation failed — manual entry mode"
  }
}
```

If in fallback mode, show a non-blocking warning banner and let Carlos fill the fields manually. The form still works — it just loses the AI pre-fill.

---

## Internal dashboard overview page

`/internal` is Carlos's home. For Sprint 1 it shows one thing clearly: **which engagements need today's report and which are done**.

```
Good morning, Carlos.

Today's reports                     April 14, 2026

✓  Hertz — Car Rental Intelligence    Published · Health 84
⚡  Internal QA Framework             [Generate Report →]
⚡  Enterprise Onboarding Portal      [Generate Report →]
```

Clicking "Generate Report →" navigates to `/internal/daily-reports/new?engagement=[id]` which pre-selects that engagement and immediately begins generation.

---

## Success criteria

Sprint 1 is complete when:

1. `pnpm run build` passes with no TypeScript errors
2. A PM can log in at `/internal-login` with internal credentials
3. The internal overview shows all assigned engagements with today's report status
4. Clicking "Generate Report" for an engagement loads the review page and displays a loading state, then populates all fields with AI-generated content within ~5 seconds
5. The health score shows a number, label, and expandable AI reasoning specific to that engagement's actual data (milestone %, timeline position, trend)
6. Every field is editable — Carlos can change any AI-generated text
7. The "AI generated" indicator appears on unedited fields and disappears when Carlos edits them
8. The override toggle reveals a slider for health score adjustment
9. Publishing writes to `daily_reports`, updates engagement health score, shows inline success
10. The multi-engagement prompt appears after publishing ("2 more engagements need reports")
11. The client "Daily Reports" tab shows the published report without `ai_reasoning` or `ai_velocity_note`
12. If the Claude API call fails, the form enters manual mode with a warning — it does not crash
13. Drafts persist in localStorage across page refreshes for 24 hours

---

## Order of operations

1. Read full existing codebase
2. Write and apply `002_internal_layer.sql`
3. Add TypeScript types to `types.ts`
4. Update middleware
5. Build `InternalSidebar`, `InternalHeader` layout components
6. Build `/internal-login` page
7. Implement `collectEngagementSignals()` — pure DB queries, test it returns real data
8. Implement `computeBaselineScore()` — deterministic algorithm, unit-testable
9. Implement `generateEngagementReport()` — wraps signals + baseline + Claude API call
10. Build `HealthScoreDisplay` component (score + reasoning + override toggle)
11. Build `SignalsPanel` component  
12. Build `ReportFieldEditor` with "AI generated" indicator
13. Build the full `/internal/daily-reports/new` review page
14. Build `getPMEngagements()` with report status
15. Build `/internal` overview page
16. Build `/internal/daily-reports` history page
17. Implement `publishDailyReport()` action
18. Wire client dashboard Daily Reports tab to real data
19. Add localStorage draft persistence
20. Add error handling / fallback mode
21. Test full flow end-to-end
22. `pnpm run build` — fix all TypeScript errors

---

## What you are NOT building in Sprint 1

- Milestone submission or acceptance workflows
- Sprint boards or task management
- Billing or invoice features
- Capacity planning or engineer assignment UI
- Jira integration
- GitHub/GitLab PR data (velocity score uses milestone/task data only for now)
- Email notifications
- Delivery lead or finance portals
- Any changes to the public marketing site
- Any changes to client onboarding

---

## Design notes

Match the existing Glassbox aesthetic precisely. Study `globals.css`, `DashboardSidebar`, and the engagement card components before building anything visual. The internal portal is a sibling of the client dashboard — same fonts, same CSS variables, same component patterns. It should feel like the same product, just with more information visible.

The health score reasoning panel is the signature UI element of this sprint. Give it appropriate visual weight — it should feel like a thoughtful analysis, not a tooltip. Consider a subtle left-border accent in the health score color, generous padding, and the AI reasoning text in a slightly muted but readable style.
