# L2 Configurator

The L2 Configurator is the internal-only tool where FullStack's Delivery
organization authors and publishes the outcome templates that power the L1
marketplace and feed the L1.5 audit (Glassbox Agent).

This doc covers what's shipping today after the L2 sprint. For the full
architectural context, see [glassbox-l2-schema.md](../glassbox-l2-schema.md)
and [Glassbox_Product_Architecture_Guide.md](../Glassbox_Product_Architecture_Guide.md).

---

## Who has access

The Configurator lives under [/internal/outcomes](../src/app/(internal)/internal/outcomes/)
and is gated to authenticated users with an `internal_users` row whose
`role` is `pm` or `delivery_lead`. `finance` is intentionally excluded.

Two layers enforce this:

- **App layer** — every Configurator route checks `internal_users.role` and
  redirects non-authors to `/internal`.
- **DB layer** — RLS policies on `outcome_templates` and `outcome_categories`
  also gate write access to those two roles.

See [migration 005](../supabase/migrations/005_l2_configurator.sql) and
[migration 006](../supabase/migrations/006_managed_categories.sql) for the
policy definitions.

---

## The 9 sections

The Configurator's left rail has nine sections, deep-linkable via URL hash
(`#overview`, `#milestones`, etc.). Each section holds part of the L2 schema.

| # | Section | What it authors | Who reads it |
|---|---------|-----------------|--------------|
| 1 | **Overview** | Title, subtitle, description, icon, category | L1 client |
| 2 | **Pricing & Timeline** | Pricing model + range, timeline range, units | L1 client |
| 3 | **Deliverables** | List of deliverables with acceptance criteria | L1 client (names), L1.5 (criteria) |
| 4 | **Milestones** | Phase structure with criteria + expected signals | L1 client + L1.5 audit |
| 5 | **Intake form** | Custom fields the client fills in at purchase | L1 client (form), L2.5 (mapping) |
| 6 | **Delivery config** | Internal team, AI agents, toolchain, env template | L3 only — never surfaces |
| 7 | **Audit config** | Priority weights, alert thresholds, cadence, tone | L1.5 (default `agent_configs`) |
| 8 | **Guarantees** | Client-facing badge list with icons | L1 client |
| 9 | **Review & publish** | Read-only preview + validation panel | The author |

The Milestones section is load-bearing for the L1.5 audit. Acceptance
criteria are client-facing (purple chips). Expected signals are audit-facing
(cyan chips) — each is a `{source, signature, required}` triple, and the
required ones are how the Glassbox Agent verifies the milestone independently.

---

## Editing model

- The shell holds two copies of the template: **`server`** (the row as last
  loaded or saved) and **`local`** (the in-progress edits).
- Changes from any section editor flow through `onChange(patch)` into `local`.
- An `Unsaved changes` pill appears in the top bar when `local` and `server`
  diverge.
- The Save button calls `saveTemplate` with the full editable subset (jsonb
  blobs and the legacy scalar columns). Last-write-wins; conflict detection
  is post-sprint.

---

## Publishing

A draft can be saved at any time. **Publishing is gated by validation.** The
Publish button in the top bar is disabled when:

- There are unsaved changes (save first), or
- One or more publish-time rules fail.

### The publish-time rules

Defined in [src/lib/configurator/validation.ts](../src/lib/configurator/validation.ts):

| Rule | Detail |
|------|--------|
| Title | 8–80 characters |
| Subtitle | 20–140 characters |
| Description | 80–600 characters |
| Pricing | `min < max`, both > 0 |
| Timeline | `min_days < max_days`, both > 0 |
| Deliverables | At least 3 |
| Milestones | At least 3 |
| Per-milestone | Each milestone has ≥1 acceptance criterion |
| Per-milestone | Each milestone has ≥1 expected signal with `required: true` |
| Intake fields | At least 2 |
| Delivery team | `typical_team` has ≥1 role |
| Alert thresholds | `critical < warning` |
| Priority weights | All five in 1..10 |
| Guarantees | At least 2 |

The "every milestone has a required signal" rule is the load-bearing one —
it's what keeps L1.5 honest. Without it, a Delivery Lead could ship a
template that looks great at L1 but is unauditable at L1.5.

### What publishing does

`publishTemplate` (in [actions.ts](../src/app/(internal)/internal/outcomes/actions.ts)):

1. Re-loads the canonical row (validation runs against the stored copy, not
   the editor's in-memory state).
2. Runs `validateForPublish`. If errors, surfaces them per-rule.
3. Bumps the semver version. Minor bump by default (`1.0.0 → 1.1.0`); major
   if the action is called with `breakingChange: true`.
4. Sets `status='published'`, stamps `published_at`.
5. Appends a `ChangelogEntry` to the `changelog` jsonb array:
   `{ version, changed_by, changed_at, notes }`.
6. Revalidates internal and public Next.js caches for the slug.

---

## Draft preview

The top-bar **Preview as client →** button opens
`/marketplace/outcomes/[slug]?draft=1` in a new tab. With the `?draft=1`
query param AND an authenticated internal user, the marketplace detail
route bypasses the `is_active` filter and renders the draft's current
state, with an amber **Draft preview** banner so the difference is unmistakable.

Without an authenticated internal user, `?draft=1` falls through to the
regular published-only path — drafts never leak.

---

## Snapshot-on-purchase

When a client buys an outcome at L1, the Configurator's role ends and
`createEngagementFromTemplate` (in
[(marketing)/marketplace/actions.ts](../src/app/(marketing)/marketplace/actions.ts))
fires four writes:

1. `engagements` — the engagement row, with `template_id`, `intake_responses`,
   and the contact email from the form.
2. `engagement_configurations` — a **snapshot** of the entire template at
   purchase, pinned to the version. This is the artifact L1.5 reads. Future
   edits to the template do not change the snapshot.
3. `agent_configs` — populated from the template's `audit_config_defaults`
   (priority weights, alert thresholds, cadence, tone, PM review window),
   with the client's intake-form selections (success_definition, critical
   requirements, risk areas, etc.) layered on top.
4. `messages` — the initial system message announcing the engagement.

The trust model is: a template can evolve and be republished while older
engagements continue to run against the snapshot they were purchased
against. Active engagements are immutable from the template's perspective.

---

## Categories are managed

Outcome categories used to be a hardcoded enum on `outcome_templates.category`.
They're now a [first-class table](../supabase/migrations/006_managed_categories.sql)
(`outcome_categories`) with `key`, `label`, `color`, `display_order`. The 9
seeded categories preserve their original labels and brand colors.

The "+ Add new category" affordance on the New Template page lets a Delivery
Lead introduce a category inline (e.g., a new partner brand) without a code
deploy. Editing or archiving categories is post-sprint — a category in use
on a published template can't be deleted because of the FK.

---

## Known limitations

- **No multi-author conflict detection.** Two PMs editing the same template
  will last-write-wins.
- **No template-to-engagement diff view.** Once an engagement snapshots a
  template, there's no UI showing how the snapshot differs from the current
  template.
- **No "Breaking change" toggle in the UI.** `publishTemplate` accepts
  `breakingChange`, but the Publish button always sends a minor bump.
- **No release-notes input on publish.** Notes default to `"Published vX.Y.Z"`.
- **No anonymous purchase flow.** `createEngagementFromTemplate` requires
  authentication and a completed company setup. The previously-anonymous
  path was already silently failing on RLS for `messages` and `agent_configs`,
  so this is a correctness fix.
- **No drag-and-drop list reordering.** All list editors use up/down arrow
  buttons. `@dnd-kit/core` is not in the dependency tree by design.
- **L1 catalog filter pills** still iterate the hardcoded `CATEGORY_ORDER`
  rather than the live `outcome_categories` table — Configurator-added
  categories appear correctly on cards but don't get a filter pill.

These are deliberate post-sprint items.

---

## Smart intake

The "+ New template" entry point splits into three paths:

1. **AI-guided** (`/internal/outcomes/new/ai`) — answer 3 questions, optionally
   upload reference materials, get a 70%+ pre-populated draft.
2. **Copy from existing** (`/internal/outcomes/new/copy`) — clone a published
   template as the starting point.
3. **Manual** (`/internal/outcomes/new/manual`) — start from an empty draft.

### What AI-guided extracts

Sonnet 4.6 reads the questionnaire + uploaded files and drafts:

- subtitle + description (long-form)
- icon (chosen from the 20 supported lucide names)
- pricing range + timeline range (rough estimates the user refines)
- deliverables with acceptance criteria
- **milestones with acceptance criteria AND expected signals** (every milestone
  guaranteed ≥1 required signal — the publish-time gate)
- intake_schema fields
- delivery_config (typical_team, ai_agents, toolchain, etc.)
- audit_config_defaults (priority weights, alert thresholds, cadence, tone)
- guarantees

`title` and `category` come verbatim from the questionnaire and are **not**
flagged as AI-suggested.

### File support

| Format | Extension(s) | How |
|--------|-----|-----|
| Plain text | `.txt` | UTF-8, no conversion |
| Markdown | `.md` | UTF-8, treated as text |
| PDF | `.pdf` | text layer extracted server-side via pdf-parse |
| Word | `.docx` | mammoth.extractRawText |
| PowerPoint | `.pptx` | hand-rolled JSZip extractor: slides + speaker notes |

Image-only PDFs and decks dominated by text-as-image yield little or no text;
the form surfaces a `PARSE_EMPTY` error and recommends copy-paste.

### Limits

- Max 5 files per intake
- Max 25 MB per file
- Max 30,000 words per file (truncated past that)
- Max 80,000 words combined across all files (later files truncated first)
- Max 10 smart-intake calls per user per hour (rate-limited via
  `smart_intake_usage`)

### AI-suggested badges

Fields and sections populated by the AI render a small cyan **AI** pill next
to their label when you arrive at the editor with `?ai=1`. Clicking the **✓**
in the badge dismisses it (persisted server-side immediately, so the
dismissal survives navigation).

The current granularity is **section-level** — Pricing, Timeline,
Deliverables, Milestones, Intake form, Delivery config, Audit config, and
Guarantees each get one badge when AI populated them. Overview-level fields
(subtitle, description, icon) get their own per-field badges.

### Errors and fallbacks

Every error has a structured code, a clear human message, and a
collapsible technical-details panel. The most common ones:

| Code | When | What to do |
|------|------|------------|
| `RATE_LIMITED` | >10 calls in last hour | Wait, or use Copy / Manual |
| `AUTH_ERROR` | API key missing or rejected | Set `ANTHROPIC_API_KEY` |
| `INVALID_JSON` | Claude's output couldn't be parsed | Retry; same input often parses on second attempt |
| `PARSE_EMPTY` | File yielded <50 words | Copy-paste content into the questionnaire instead |
| `FILE_TOO_LARGE` | File exceeds 25 MB | Split or trim |
| `API_ERROR` | Network or upstream failure | Retry; if persistent, fall back to Copy / Manual |

The chooser always offers Copy and Manual, so even when AI is down the team
isn't blocked.

### Mock mode for tests

Set `SMART_INTAKE_MOCK=1` in the dev server env to bypass the Anthropic call.
The orchestrator returns the canonical example template (with the
questionnaire's title/category overlaid) so the full UI flow works without
burning API tokens. Used by the e2e test at `tests/smart-intake-smoke.ts`.

## Useful files

- [src/app/(internal)/internal/outcomes/](../src/app/(internal)/internal/outcomes/) — list, new, edit, actions
- [src/components/internal/configurator/](../src/components/internal/configurator/) — section editors
- [src/lib/configurator/validation.ts](../src/lib/configurator/validation.ts) — publish rules + semver helper
- [src/app/(marketing)/marketplace/actions.ts](../src/app/(marketing)/marketplace/actions.ts) — snapshot-on-purchase
- [supabase/migrations/005_l2_configurator.sql](../supabase/migrations/005_l2_configurator.sql) — schema + RLS
- [supabase/migrations/006_managed_categories.sql](../supabase/migrations/006_managed_categories.sql) — categories
