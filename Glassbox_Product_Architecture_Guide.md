# Glassbox by FullStack — Product Architecture & Feature Guide

**For Product Managers** | Version 1.0 | April 2026

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [User Journeys](#3-user-journeys)
4. [Public Marketing Site](#4-public-marketing-site)
5. [Customer Onboarding Flow](#5-customer-onboarding-flow)
6. [Dashboard — Overview](#6-dashboard--overview)
7. [Engagements System](#7-engagements-system)
8. [Engagement Detail — Tabs & Features](#8-engagement-detail--tabs--features)
9. [Outcome Catalog & New Engagement Flow](#9-outcome-catalog--new-engagement-flow)
10. [Talent Management](#10-talent-management)
11. [Messages System](#11-messages-system)
12. [Database Schema](#12-database-schema)
13. [Data Model Relationships](#13-data-model-relationships)
14. [Engagement Lifecycle](#14-engagement-lifecycle)
15. [Engagement Modes](#15-engagement-modes)
16. [User Roles & Permissions](#16-user-roles--permissions)
17. [Demo Data & Seeding](#17-demo-data--seeding)
18. [Page Inventory](#18-page-inventory)
19. [Component Inventory](#19-component-inventory)
20. [Future Roadmap Considerations](#20-future-roadmap-considerations)

---

## 1. Product Overview

**Glassbox** is an AI-native service delivery platform built by FullStack Labs. It replaces the traditional, opaque process of procuring engineering services (talent, teams, or project outcomes) with a software-driven experience that provides:

- **Transparent project tracking** — Real-time dashboards showing milestone progress, project health, team velocity, daily reports, and live codebase access
- **Productized outcomes** — Fixed-price, fixed-timeline engineering services that clients can browse, scope, and purchase like SaaS products
- **AI-accelerated delivery** — Every engineer on the platform is measured by an AI Velocity Score (1.8x–2.7x), quantifying how much faster they ship using AI tools
- **Multiple procurement modes** — Individual talent, pre-configured pods, predefined outcomes, or fully custom engagements

### Who Uses Glassbox

| User Type | Description | Access |
|-----------|-------------|--------|
| **Client (Customer)** | Companies buying engineering services from FullStack | Dashboard, engagement tracking, messaging, contract signing |
| **FullStack PM** | Project delivery leads managing engagements | Daily reports, milestone updates, messages (via backend) |
| **FullStack Engineers** | AI-native engineers assigned to engagements | Messages, code delivery (via backend) |
| **FullStack Sales** | Client partners like Tori Ireland | Onboarding codes, relationship management |

### Core Value Proposition

Traditional engineering services: Client signs SOW → work happens in a black box → invoices arrive → hope for the best.

Glassbox: Client signs SOW → selects outcome → signs contract → gets real-time dashboard with milestone tracking, daily PM reports, live codebase access, project documentation, messaging, health scores, AI velocity metrics → pays by milestone → final 25% on acceptance.

---

## 2. Technical Architecture

### Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 (App Router) | Server-side rendering, routing, API routes |
| **Language** | TypeScript (strict mode) | Type safety across all code |
| **Styling** | Tailwind CSS v4 | Utility-first CSS |
| **UI Components** | shadcn/ui via @base-ui/react | Accessible component primitives |
| **Database** | Supabase (PostgreSQL) | Auth, database, RLS policies |
| **Auth** | Supabase Auth | Email/password authentication |
| **Package Manager** | pnpm | Fast, efficient package management |
| **Fonts** | Outfit (headings), Inter (body), JetBrains Mono (data) | Typography system |

### Architecture Pattern

```
┌─────────────────────────────────────────────┐
│                  Browser                      │
├─────────────────────────────────────────────┤
│        Next.js App Router (SSR + CSR)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Marketing │ │   Auth   │ │  Dashboard   │ │
│  │  (public) │ │  (auth)  │ │  (protected) │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
├─────────────────────────────────────────────┤
│           Server Actions (actions.ts)         │
├─────────────────────────────────────────────┤
│      Supabase Client (server + browser)       │
├─────────────────────────────────────────────┤
│   PostgreSQL + Auth + RLS + Realtime          │
└─────────────────────────────────────────────┘
```

### Route Groups

The app uses Next.js route groups to separate concerns:

- `(marketing)` — Public pages (homepage, marketplace, talent browse, pods, custom)
- `(auth)` — Login and signup flows
- `dashboard` — Protected client portal (requires authentication)

### Row Level Security (RLS)

All database tables use Supabase RLS policies to ensure:
- Users can only read their own company's data
- Engagements, milestones, and messages are scoped to the authenticated user's company
- A `get_my_company_id()` SECURITY DEFINER function prevents infinite recursion in RLS policies

---

## 3. User Journeys

### Journey 1: New Customer Onboarding

```
Visit glassbox.fullstack.com
  → Click "New Customer Onboarding"
    → Step 1: Enter 7-digit customer code (from FullStack sales)
    → Step 2: Review & sign Master Services Agreement (embedded PDF)
    → Step 3: Create account (name, company, email, password)
      → Redirected to Dashboard
        → Click "Load demo engagements" OR start new engagement
```

### Journey 2: Browse and Start a New Engagement

```
Dashboard → New Engagement (sidebar or button)
  → Browse outcome catalog (10 productized outcomes + custom)
    → Click an outcome (e.g., "AI Feature Integration")
      → Read description, features, timeline, pricing
        → Fill out intake questionnaire
          → Review & sign Glassbox service contract (embedded PDF)
            → Engagement created → Redirected to engagement dashboard
```

### Journey 3: Track Active Engagement

```
Dashboard → Engagements → Click engagement card
  → Overview tab: health score, progress, milestones, team, scope
  → Milestones tab: detailed milestone tracker with deliverables
  → Project Docs tab: browse project documentation by folder
  → Daily Reports tab: read PM's end-of-day reports, search by keyword
  → Codebase tab: browse live git repository (file tree)
  → Messages tab: threaded conversation with PM and engineers
```

### Journey 4: Manage Talent

```
Dashboard → Talent by FullStack (sidebar)
  → View active engineers (photos, skills, hours, billing)
    → Give Kudos / Feedback / Report Concern
  → Browse suggested engineers → Request Interview
  → Browse suggested pods → Deploy Pod
```

---

## 4. Public Marketing Site

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Homepage with hero, 3D glass box interactions, how it works, AI-native difference, four engagement modes, CTA |
| `/marketplace/outcomes` | Catalog of 10 productized outcomes with category filters |
| `/marketplace/outcomes/[slug]` | Individual outcome detail page with features, timeline, intake form |
| `/marketplace/talent` | Browse available AI-native engineers |
| `/marketplace/pods` | Pre-configured cross-functional teams |
| `/marketplace/custom` | Custom outcome process and examples |

### Homepage Sections (top to bottom)

1. **Hero** — "Engineering Services, redefined as a software platform" with interactive 3D wireframe glass boxes that react to mouse cursor
2. **How Glassbox Works** — 3 steps: Scope Your Need → We Build Using the World's Best AI → You Track Everything
3. **The AI-Native Difference** — Stats grid (2.3x velocity, 1,200+ engagements, 4.9/5 satisfaction, 60% faster)
4. **Four Ways to Get Work Done** — Individual Talent, Predefined Outcomes, Pods, Custom Outcomes
5. **CTA** — "Ready to ship faster?" with signup and catalog buttons

### Navigation

- Header: FullStack logo | Glassbox logo | Existing Customer Login | New Customer Onboarding
- Footer: Services links (Outcomes, Talent, Pods, Custom) | Company links (FullStack.com, Login, Onboarding)

---

## 5. Customer Onboarding Flow

The onboarding is a **3-step process** at `/signup`:

### Step 1: Verify Customer Code
- 7-character alphanumeric code input (auto-advance, paste-friendly)
- Code is provided by FullStack sales team
- "Don't have a code?" prominent CTA card with `new_customer@fullstacklabs.co` email
- For the demo, any 7-character code is accepted

### Step 2: Sign Master Services Agreement
- Embedded PDF viewer of the FullStack MSA (`/msa.pdf`)
- "Sign and Get Access to Glassbox" button at top
- "Open in new tab" button for full-screen reading
- Back button to return to code entry

### Step 3: Create Account
- Full name, company name, work email, password
- Creates auth user via Supabase Auth
- Creates company record and user profile via server action
- Redirects to dashboard

### Existing Customer Login
- Separate `/login` page
- Email + password
- Redirects to dashboard

---

## 6. Dashboard — Overview

**Route:** `/dashboard`

The overview is the main landing page after login. It contains:

### Client Hero Banner
- Company name and "Client Account" label
- FullStack client since date (e.g., "December 2025")
- Active engagements count
- **Account Manager Card** — Tori Ireland's photo (large, square), name, title "Client Partner", "Schedule a call" button

### Special Offer Banner
- Promotional card: "20% off billing rates for React developers"
- Expiry date
- "Browse React Engineers" CTA
- Demonstrates the platform's use as a sales tool

### Shortlisted Talent
- 4 engineer cards (top by AI velocity score)
- Display name, seniority, title, skills, AI velocity score
- "Browse all" link to `/dashboard/talent`

### Active Engagements
- Engagement cards with title, mode badge, status badge
- Compact horizontal milestone timeline (colored dots)
- Milestone progress (x/y completed, percentage)
- Last message preview
- "View all" link to `/dashboard/engagements`
- "Load demo engagements" subtle link at bottom (creates 3 demo engagements)

---

## 7. Engagements System

**Route:** `/dashboard/engagements`

### Engagement List
- Header: "All Engagements" with description explaining milestone-based payment and 25% holdback
- "New Engagement" button
- Grid of engagement cards (3 columns on desktop)

### Engagement Card
Each card shows:
- Title (2-line clamp)
- Mode badge (Outcome, Custom, Talent, Pod) with color coding
- Status badge (Active, In Review, Intake, Scoping, Completed, Cancelled)
- Compact milestone timeline (horizontal dots)
- Progress: "x/y milestones" and percentage
- Last message preview with sender name and relative time

### Engagement Statuses

| Status | Meaning | Color |
|--------|---------|-------|
| `intake` | Form submitted, awaiting PM review | Blue |
| `scoping` | PM is defining scope | Yellow |
| `active` | Work in progress | Green |
| `in_review` | Deliverables under client review | Yellow |
| `completed` | All milestones accepted | Green |
| `cancelled` | Engagement cancelled | Red |

---

## 8. Engagement Detail — Tabs & Features

**Route:** `/dashboard/engagements/[id]`

### Header Section
- Status badge and mode badge
- Engagement title
- Key metrics row: Progress %, AI Velocity, Days Left, Budget
- **Health Ring** — Animated SVG donut chart (0-100 score)
  - ≥80: Green, "Excellent"
  - ≥70: Yellow, "On Track"
  - <70: Red, "At Risk"

### Phase Timeline ("How it unfolds")
- Horizontal milestone sequence with colored dots
- Completed = green with checkmark, In Progress = yellow, In Review = blue, Upcoming = gray outline
- Dates shown under each milestone
- **Flagged milestones**: If description starts with "BLOCKED:", the dot turns red with a flag label (e.g., "Scope Change — Project Delay")

### Tab 1: Overview
Two-column layout (2/3 + 1/3):

**Left column:**
- Overall progress bar with percentage
- Milestone summary list (dot + title + date + status)
- Scope summary text
- Timeline (start date, target end date)

**Right column:**
- Project Delivery Lead card (Carlos Mendez photo, title, "Schedule Project Review" button)
- Engineering Team list (initials, name, role, individual velocity score, team average)
- AI Acceleration card (velocity multiplier with explanation)

### Tab 2: Milestones
- Full milestone tracker component
- Each milestone: title, description, status badge, due date, completion date
- Deliverables list per milestone (name, status: done/pending)

### Tab 3: Project Docs
Two-panel layout:

**Left panel:**
- Folder navigation (6 folders):
  - Architecture & Design (5 docs)
  - Project Management (5 docs)
  - Quality & Testing (3 docs)
  - Security & Compliance (2 docs)
  - Deployment & Ops (3 docs)
  - Handoff & Training (2 docs)
- Search bar (filters across names, descriptions, folders)
- Document count per folder

**Right panel:**
- Document list with columns: Name + description, Type badge (PDF/DOCX/XLSX/PPTX/FIG/MD), Size, Upload date
- Download icon on hover
- 20 realistic demo documents

### Tab 4: Daily Reports
Two-panel layout:

**Left panel:**
- 5 EOD reports from the project lead
- Search bar (filters across summaries, highlights, blockers)
- Date, summary preview, blocker count badge

**Right panel:**
- Full report: date, author, summary narrative
- "Completed Today" section (green dots)
- "Blockers" section (red dots) — only shown if blockers exist
- "Plan for Tomorrow" section (blue dots)

### Tab 5: Codebase
- Git repository browser
- Header: branch name (`main`), commit count (147), branch count (3), last push time
- Column headers: Name, Last commit message, Size
- Expandable file tree (folders: `.github`, `src`, `tests` + root files)
- Click folders to expand/collapse
- Realistic commit messages and file sizes

### Tab 6: Messages
- Threaded message conversation
- System messages (divider style)
- User messages with avatar, name, role badge, timestamp
- Current user messages aligned right with accent styling
- Text input with Enter-to-send, Shift+Enter for newline
- Optimistic UI updates on send

---

## 9. Outcome Catalog & New Engagement Flow

**Route:** `/dashboard/new-engagement`

### Outcome Catalog
- Category filter tabs: All, Build, Automate, Migrate, Optimize
- Grid of outcome cards (10 productized + 1 custom engagement card)
- Each card: icon, category badge, title, subtitle, price range, timeline range, "Learn More" link

### 10 Productized Outcomes

| # | Name | Category | Price | Timeline |
|---|------|----------|-------|----------|
| 1 | MVP Sprint | Build | $15K–$35K | 15–21 days |
| 2 | Automated Testing Setup | Automate | $8K–$20K | 5–10 days |
| 3 | Landing Page & Marketing Site | Build | $5K–$15K | 5–10 days |
| 4 | CI/CD Pipeline Build | Automate | $6K–$18K | 5–10 days |
| 5 | Performance Audit & Fix | Optimize | $8K–$22K | 5–15 days |
| 6 | AI Feature Integration | Build | $20K–$50K | 10–21 days |
| 7 | Agentic Workflow Builder | Automate | $25K–$60K | 15–25 days |
| 8 | AI-SDLC Implementation | Optimize | $15K–$40K | 10–20 days |
| 9 | AI-Ready Data Modernisation | Migrate | $20K–$55K | 15–25 days |
| 10 | AI-Native Experience Build | Build | $30K–$75K | 20–30 days |

### Custom Engagement Card
- Purple accent card (only visible in dashboard catalog)
- Tori Ireland's photo and title
- "Schedule a call with Tori" button

### Outcome Detail Page
**Route:** `/dashboard/new-engagement/[slug]`

Two-column layout (3/5 + 2/5):

**Left column:**
- Breadcrumb navigation
- Category badge, title, subtitle
- Full description
- "What's Included" feature list (green checkmarks)
- "How it unfolds" timeline (5 phases with descriptions)
- **Intake form** → **Contract signing** → **Engagement creation**

**Right column (sticky):**
- Scope estimate card with price range and timeline
- "Start This Project" button (scrolls to form)
- Benefits: 30-day warranty, fixed price, dedicated PM, milestone tracking

### New Engagement Flow

```
Fill intake form (dynamic fields based on outcome template)
  → Click "Continue to Contract"
    → Embedded PDF of outcome-specific Glassbox contract
    → "Open in new tab" button for readability
    → Click "Sign and Start Engagement"
      → Engagement record created (status: intake)
      → System message: "Contract signed"
      → Redirect to engagement detail dashboard
```

Each outcome has its own contract PDF (`FS-GBC-01` through `FS-GBC-10`).

---

## 10. Talent Management

### Browse Talent
**Route:** `/dashboard/talent`

- Public-style talent browse within the dashboard
- Reuses the marketing talent browse component
- Talent cards with search and seniority filter

### Talent by FullStack (My Talent)
**Route:** `/dashboard/my-talent`

**Summary Cards (4):**
- Active Engineers count
- Average AI Velocity
- Monthly Run Rate
- Total Billed to Date

**Active Engineers (3 demo profiles):**
Each card shows:
- Photo (square, 96px)
- Name, title, skills
- AI Velocity badge
- Start date, days active, hours logged
- Hourly rate, total billed
- **Action buttons:**
  - Give Kudos (green) — opens modal with text input
  - Feedback (blue) — opens modal with text input
  - Report Concern (red) — opens modal with text input

**Suggested Engineers (4):**
- Profile cards with initials, name, title, skills, velocity, rate
- "Request Interview" button

**Suggested Pods (3):**

| Pod | Engineers | Monthly Rate | Focus |
|-----|----------|-------------|-------|
| AI Product Pod | 3 | $48,000 | AI features, LLM integration, RAG |
| Full-Stack Growth Pod | 3 | $42,000 | Feature sprints, UI/UX, APIs |
| Platform & DevOps Pod | 2 | $36,000 | Infrastructure, CI/CD, monitoring |

Each pod shows: skills, task list, monthly rate, "Deploy Pod" button

---

## 11. Messages System

**Route:** `/dashboard/messages`

Email-like interface with two panels:

### Left Panel — Folders
- **All Messages** — Global inbox with total count and unread badge
- **Engagement folders** — One per engagement with:
  - Engagement title (truncated)
  - Last message preview
  - Unread count badge (messages from non-current-user in last 7 days)

### Right Panel — Content

**Inbox view (default):**
- All non-system messages across engagements, newest first
- Each row: sender avatar, name, timestamp, engagement name, message preview
- Click to jump to that engagement's thread

**Thread view (click engagement):**
- Breadcrumb: Inbox → Engagement Title
- Full message thread with the `MessageThread` component
- Send input at bottom

---

## 12. Database Schema

### Tables

#### companies
```
id          UUID PRIMARY KEY
name        TEXT NOT NULL
website     TEXT
size        TEXT ('1-10', '11-50', '51-200', '201-500', '500+')
industry    TEXT
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

#### users
```
id          UUID PRIMARY KEY (references auth.users)
company_id  UUID REFERENCES companies
full_name   TEXT NOT NULL
email       TEXT NOT NULL
role        TEXT ('owner', 'admin', 'member')
avatar_url  TEXT
created_at  TIMESTAMPTZ
```

#### outcome_templates
```
id                  UUID PRIMARY KEY
slug                TEXT UNIQUE NOT NULL
title               TEXT NOT NULL
subtitle            TEXT
description         TEXT NOT NULL
category            TEXT ('build', 'automate', 'migrate', 'optimize')
price_range_low     INTEGER (cents)
price_range_high    INTEGER (cents)
timeline_range_low  INTEGER (business days)
timeline_range_high INTEGER (business days)
icon                TEXT
features            JSONB (string array)
intake_schema       JSONB (IntakeSchema)
is_active           BOOLEAN
display_order       INTEGER
created_at          TIMESTAMPTZ
```

#### engagements
```
id                UUID PRIMARY KEY
company_id        UUID REFERENCES companies NOT NULL
template_id       UUID REFERENCES outcome_templates
mode              TEXT ('talent', 'pod', 'predefined_outcome', 'custom_outcome')
title             TEXT NOT NULL
status            TEXT ('intake', 'scoping', 'active', 'in_review', 'completed', 'cancelled')
intake_responses  JSONB
scope_summary     TEXT
price_cents       INTEGER
start_date        DATE
target_end_date   DATE
actual_end_date   DATE
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

**intake_responses JSONB** stores:
- All intake form answers (dynamic per template)
- `contact_email` — client contact
- `contract_signed` — boolean
- `contract_signed_at` — timestamp
- `health_score` — 0-100 project health
- `ai_velocity` — team velocity multiplier
- `project_lead` — { name, title, photo, calendly }
- `team[]` — [{ name, role, velocity, initials }]

#### milestones
```
id              UUID PRIMARY KEY
engagement_id   UUID REFERENCES engagements ON DELETE CASCADE NOT NULL
title           TEXT NOT NULL
description     TEXT
status          TEXT ('upcoming', 'in_progress', 'in_review', 'completed')
deliverables    JSONB (array of { name, description, status })
due_date        DATE
completed_at    TIMESTAMPTZ
display_order   INTEGER NOT NULL
created_at      TIMESTAMPTZ
```

#### messages
```
id                UUID PRIMARY KEY
engagement_id     UUID REFERENCES engagements ON DELETE CASCADE NOT NULL
user_id           UUID REFERENCES auth.users
sender_name       TEXT NOT NULL
sender_role       TEXT ('client', 'pm', 'engineer', 'system')
content           TEXT NOT NULL
is_system_message BOOLEAN DEFAULT FALSE
created_at        TIMESTAMPTZ
```

#### talent_profiles
```
id                  UUID PRIMARY KEY
display_name        TEXT NOT NULL
title               TEXT NOT NULL
seniority           TEXT ('mid', 'senior', 'staff', 'principal')
bio                 TEXT
skills              JSONB (string array)
ai_velocity_score   NUMERIC
years_experience    INTEGER
avatar_url          TEXT
hourly_rate_cents   INTEGER
is_available        BOOLEAN DEFAULT TRUE
highlight_projects  JSONB (array of { title, description, tech[] })
created_at          TIMESTAMPTZ
```

---

## 13. Data Model Relationships

```
companies ──┐
            ├── users (company_id → companies.id)
            ├── engagements (company_id → companies.id)
            │     ├── milestones (engagement_id → engagements.id)
            │     └── messages (engagement_id → engagements.id)
            │
outcome_templates ── engagements (template_id → outcome_templates.id)

talent_profiles (standalone — not linked to engagements in schema)
```

---

## 14. Engagement Lifecycle

```
[Intake Form Submitted]
        │
        ▼
    ┌────────┐
    │ INTAKE │ ← Contract signed, engagement created
    └────────┘
        │ PM reviews scope
        ▼
    ┌─────────┐
    │ SCOPING │ ← PM defines milestones, timeline, team
    └─────────┘
        │ Work begins
        ▼
    ┌────────┐
    │ ACTIVE │ ← Engineers building, daily reports, code commits
    └────────┘
        │ Deliverables submitted
        ▼
    ┌───────────┐
    │ IN REVIEW │ ← Client reviews deliverables
    └───────────┘
        │ All milestones accepted
        ▼
    ┌───────────┐
    │ COMPLETED │ ← Final 25% payment, 30-day warranty begins
    └───────────┘

    [At any point] → CANCELLED
```

### Payment Model
- **Milestone-based**: Client pays as each milestone's deliverables are accepted
- **25% holdback**: Final quarter of payment released on full project acceptance
- **Fixed price**: Predefined outcomes have fixed prices — no scope creep

---

## 15. Engagement Modes

| Mode | Description | Pricing | Procurement |
|------|-------------|---------|-------------|
| **Talent** | Individual AI-native engineer embedded with client team | Hourly or monthly retainer | Browse profiles → request → 2-week trial |
| **Pod** | Pre-configured cross-functional team (2-7 members) | Monthly retainer | Select pod type → configure → deploy |
| **Predefined Outcome** | Productized service from catalog | Fixed price per outcome | Select outcome → fill intake → sign contract |
| **Custom Outcome** | Bespoke engagement scoped collaboratively | Phased fixed-price | Discovery call → proposal → contract → build |

---

## 16. User Roles & Permissions

### Client-Side Roles

| Role | Permissions |
|------|------------|
| **Owner** | Full access, can manage team, view billing, sign contracts |
| **Admin** | View engagements, manage team, cannot sign contracts |
| **Member** | View engagements, send messages |

### FullStack-Side Roles (in messages)

| Role | Display | Color |
|------|---------|-------|
| **PM** | "PM" badge | Green |
| **Engineer** | "Engineer" badge | Purple |
| **System** | Divider-style messages | Gray |
| **Client** | "Client" badge | Blue |

---

## 17. Demo Data & Seeding

### Seed Button
A "Load demo engagements" link at the bottom of `/dashboard/engagements` triggers `seedDemoEngagements()` server action which:
1. Sets company `created_at` to December 2025
2. Deletes any existing demo engagements for the company
3. Creates 3 engagements with milestones and messages

### Demo Engagements

**1. End Client: Hertz — Car Rental App Intelligence Layer on Claude**
- Mode: Custom Outcome | Status: Active | Budget: $185,000
- Timeline: Feb 3 – May 2, 2026
- Health: 84 (Excellent) | Velocity: 2.5x
- 5 milestones (2 completed, 1 in progress, 2 upcoming)
- Team: Marcus Chen, Priya Sharma, Amara Osei
- Lead: Carlos Mendez

**2. Internal Automated Quality Framework**
- Mode: Predefined Outcome | Status: In Review | Budget: $95,000
- Timeline: Jan 13 – Apr 18, 2026
- Health: 91 (Excellent) | Velocity: 2.3x
- 4 milestones (2 completed, 1 in review, 1 upcoming)
- Team: Devon Park, Nadia Torres
- Lead: Carlos Mendez

**3. Enterprise Onboarding Portal MVP**
- Mode: Predefined Outcome | Status: Active | Budget: $125,000
- Timeline: Mar 3 – Apr 25, 2026 (extended from Mar 28 due to scope change)
- Health: 68 (At Risk) | Velocity: 1.9x
- 5 milestones (3 completed, 1 BLOCKED in review, 1 upcoming)
- **Flagged**: "BLOCKED: Scope Change — Project Delay" on Review & Polish milestone
- Team: Jordan Blake, Elena Voss, Kai Nakamura
- Lead: Carlos Mendez

### Seed Data (outcome_templates)
- 10 outcome templates in `supabase/seed.sql`
- 8 talent profiles
- 2 demo companies (Acme Corp, Bloom Health) with engagements

---

## 18. Page Inventory

### Public (Marketing)
| Route | Description |
|-------|-------------|
| `/` | Homepage with glass box hero, how it works, stats, modes, CTA |
| `/marketplace/outcomes` | Outcome catalog with category filters |
| `/marketplace/outcomes/[slug]` | Outcome detail with features, timeline, intake form |
| `/marketplace/talent` | Browse AI-native engineers |
| `/marketplace/pods` | Pre-configured teams (4 pods) |
| `/marketplace/custom` | Custom outcome process and examples |

### Auth
| Route | Description |
|-------|-------------|
| `/login` | Email/password login |
| `/signup` | 3-step onboarding (code → contract → account) |

### Dashboard (Protected)
| Route | Description |
|-------|-------------|
| `/dashboard` | Overview with hero, offer, talent, engagements |
| `/dashboard/engagements` | All engagements list |
| `/dashboard/engagements/[id]` | Engagement detail (6 tabs) |
| `/dashboard/my-talent` | Active talent, suggested engineers, pods |
| `/dashboard/talent` | Browse all available talent |
| `/dashboard/new-engagement` | Outcome catalog for starting new engagement |
| `/dashboard/new-engagement/[slug]` | Outcome detail + intake form + contract signing |
| `/dashboard/messages` | Email-like messaging hub |

---

## 19. Component Inventory

### Layout Components
| Component | Purpose |
|-----------|---------|
| `MarketingHeader` | Fixed header with logos, login/signup CTAs |
| `MarketingFooter` | Footer with service links, company links |
| `DashboardSidebar` | Navigation sidebar (Overview, Engagements, Talent, New, Messages, Settings) |
| `DashboardHeader` | Top bar with page title, notifications, user info, sign out |

### Dashboard Components
| Component | Purpose |
|-----------|---------|
| `EngagementList` | Grid of engagement cards |
| `EngagementCard` | Individual engagement card with timeline |
| `EngagementDetailClient` | Full engagement detail with 6 tabs |
| `MilestoneTracker` | Detailed milestone list with deliverables |
| `MilestoneTimeline` | Horizontal phase indicator (compact or full) |
| `MessageThread` | Threaded conversation with send functionality |
| `StatusBadge` | Colored status badges for engagements and milestones |
| `CompleteSetup` | Company name input for first-time setup |
| `SeedDemoButton` | Creates demo engagement data |

### Marketplace Components
| Component | Purpose |
|-----------|---------|
| `OutcomeCatalog` | Filterable grid of outcome cards + custom engagement card |
| `OutcomeCard` | Individual outcome card |
| `IntakeForm` | Dynamic form → contract signing → engagement creation |
| `ScopeEstimate` | Sticky pricing card with price/timeline ranges |
| `TalentCard` | Engineer profile card with detail sheet |

### Marketing Components
| Component | Purpose |
|-----------|---------|
| `GlassParticles` | Canvas-based 3D wireframe glass boxes with mouse interaction |

---

## 20. Future Roadmap Considerations

Based on the current architecture, these features would be natural extensions:

### Near-Term
- **Real-time notifications** — Supabase Realtime for live message and status updates
- **Settings page** — Company profile, team management, billing preferences
- **Invoice management** — Milestone-based invoicing visible in dashboard
- **Email notifications** — Digest emails for new messages, milestone completions, status changes

### Medium-Term
- **Code review integration** — Pull request activity feed in the Codebase tab
- **Actual git integration** — Connect to real GitHub/GitLab repos instead of demo data
- **Document upload** — Allow clients and PMs to upload files to Project Docs
- **Daily report automation** — PM writes report in a form; system publishes to dashboard
- **Contract e-signature** — Integrate DocuSign or similar for legally binding signatures

### Long-Term
- **AI PM copilot** — AI-generated scope drafts from intake responses
- **Predictive health scoring** — ML model that predicts engagement health from activity patterns
- **Client portal API** — Allow enterprise clients to integrate Glassbox data into their own dashboards
- **Multi-company support** — Users belonging to multiple client companies
- **Billing integration** — Stripe or similar for automated milestone-based billing

---

## Appendix: File Structure

```
src/
├── app/
│   ├── (marketing)/         # Public pages
│   │   ├── page.tsx         # Homepage
│   │   ├── layout.tsx       # Marketing layout (header + footer)
│   │   └── marketplace/
│   │       ├── page.tsx
│   │       ├── outcomes/
│   │       ├── talent/
│   │       ├── pods/
│   │       └── custom/
│   ├── (auth)/              # Auth pages
│   │   ├── layout.tsx       # Centered layout
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/           # Protected dashboard
│   │   ├── layout.tsx       # Sidebar + header layout
│   │   ├── page.tsx         # Overview
│   │   ├── actions.ts       # Server actions (setup, seed)
│   │   ├── engagements/
│   │   ├── messages/
│   │   ├── my-talent/
│   │   ├── talent/
│   │   └── new-engagement/
│   ├── globals.css          # Design system + CSS variables
│   └── layout.tsx           # Root layout (fonts, metadata)
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── layout/              # Header, footer, sidebar
│   ├── dashboard/           # Engagement, milestone, message components
│   ├── marketplace/         # Outcome, intake, talent components
│   └── marketing/           # Glass particles
├── lib/
│   ├── types.ts             # All TypeScript interfaces
│   ├── constants.ts         # Colors, labels, navigation
│   ├── utils.ts             # Formatters, helpers
│   └── supabase/            # Client, server, middleware
public/
├── logo.png                 # Glassbox logo
├── tori.jpeg                # Client partner photo
├── carlos.jpeg              # Project lead photo
├── talent-1/2/3.png         # Active engineer photos
├── msa.pdf                  # Master Services Agreement
└── FS-GBC-*.pdf             # 10 outcome-specific contracts
supabase/
├── migrations/
│   └── 001_initial_schema.sql  # Database schema + RLS policies
└── seed.sql                    # Demo data (templates, talent, engagements)
```

---

*Glassbox by FullStack Labs, Inc.*
*Document generated April 14, 2026*
