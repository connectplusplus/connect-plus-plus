# Engagement lifecycle

The path from "client clicks Submit on the intake form" to "engagement is
active and the Glassbox Agent's first run is queued."

This doc covers what's shipping today after the SOW authoring sprint.
For the data schema underneath, see
[supabase/migrations/008_intake_to_kickoff.sql](../supabase/migrations/008_intake_to_kickoff.sql)
and [supabase/migrations/010_sow_authoring.sql](../supabase/migrations/010_sow_authoring.sql).

---

## The state machine

```
[Intake form submitted]
        │
        ▼
   pending_review              — Client: "SOW being prepared (≤1 business day)"
        │                        PM:     "Draft SOW, review with Legal"
        │ PM clicks "Send for legal review"
        ▼
   awaiting_legal_review       — Client: (still sees "SOW being prepared")
        │                        PM:     "Sent to FullStack Legal · awaiting their signature"
        │ Legal counter-signs (or PM marks legal signed manually)
        ▼
   awaiting_signature          — Client: "Review and sign SOW"
        │                        PM:     "Awaiting client signature"
        │ Client e-signs (or PM marks signed manually)
        ▼
   awaiting_kickoff            — Client: "Schedule kickoff with [PM name]"
        │                        PM:     "Schedule kickoff call"
        │ PM completes kickoff AND clicks "Activate engagement"
        ▼
   active                      — Existing engagement flow takes over.
                                  Agent first run scheduled.
```

Bidirectional cases:

- **Legal requested changes.** PM transitions `awaiting_legal_review →
  pending_review`. The same SOW row stays editable (Carlos failed an
  internal review, not the client). The version number does not bump.
- **Client requested revisions.** PM transitions `awaiting_signature →
  pending_review` and creates a NEW SOW version with content cloned from
  the prior version. The client saw v1, so v2 is a separate document for
  legal-contract reasons. (Old engagements that predate 010 still use the
  `returned_to_review` event with no new version row.)
- **Cancellation.** Either party can cancel from any pre-active state.
  Cancellations are soft — the engagement row stays, status becomes
  `cancelled`, lifecycle events preserve the audit trail. Any in-flight
  SOW rows for the engagement are also marked `status='cancelled'`.

The legacy states (`intake`, `scoping`) stay readable so engagements that
predate this sprint don't break. New engagements only use the five-state
lifecycle.

---

## Who can do what

| Action | From state | To state | Actor |
|--------|-----------|----------|-------|
| Submit intake | (none) | `pending_review` | Client |
| Send SOW for legal review | `pending_review` | `awaiting_legal_review` | PM |
| Mark legal as signed | `awaiting_legal_review` | `awaiting_signature` | PM (stub) / e-sign webhook (future) |
| Legal requested changes | `awaiting_legal_review` | `pending_review` | PM (same SOW row stays editable) |
| Mark client as signed | `awaiting_signature` | `awaiting_kickoff` | PM (stub) / e-sign webhook (future) |
| Make changes and resubmit | `awaiting_signature` | `pending_review` | PM (creates new SOW version) |
| Schedule kickoff | `awaiting_kickoff` | `awaiting_kickoff` (no transition) | PM |
| Complete kickoff | `awaiting_kickoff` | `active` | PM |
| Cancel | any pre-active | `cancelled` | Client (own) / PM (any) |

The state machine is encoded in
[src/lib/lifecycle/transitions.ts](../src/lib/lifecycle/transitions.ts) as a
`LEGAL_TRANSITIONS` map. Every server action that changes status routes
through `transitionEngagement()`, which validates the move and writes a
matching lifecycle event.

---

## Lifecycle events

Every state change writes to `engagement_lifecycle_events`:

| Column | Notes |
|--------|-------|
| `id`, `engagement_id`, `created_at` | standard |
| `event_type` | legacy: `intake_submitted`, `sow_sent`, `sow_revised`, `signed`, `kickoff_scheduled`, `kickoff_completed`, `activated`, `cancelled`, `returned_to_review`. SOW workflow (010): `sow_drafted`, `sow_sent_for_legal`, `sow_legal_approved`, `sow_legal_rejected`, `sow_sent_to_client`, `sow_client_rejected`, `sow_resubmitted`. The both-parties-signed transition reuses the existing `signed` event for audit-symmetry. |
| `actor_user_id` | references `auth.users.id`; could be a client OR an internal user |
| `actor_role` | `client` / `pm` / `system` |
| `notes` | free-form; surfaced in the timeline UI |
| `payload` | event-specific extras (SOW URL, revision summary, kickoff date, agent config snapshot, activation checklist) |

The audit trail is queried by both the client-side **Lifecycle** tab on
`/dashboard/engagements/[id]` and the PM-side workspace at
`/internal/engagements/[id]`. Internal-only events (`sow_revised`) are
filtered out for the client audience by the
[LifecycleTimeline](../src/components/lifecycle/lifecycle-timeline.tsx)
component.

---

## The activation moment

`completeKickoff` is the load-bearing action. Concretely, in one server
action transaction:

1. Validates the engagement is currently `awaiting_kickoff` (idempotency
   check).
2. Inserts the `agent_configs` row from the PM's overlay over the template
   defaults. **This is the first time `agent_configs` exists for the
   engagement** — at intake we deliberately don't create one. The PM walks
   the client through the agent setup in the kickoff call before any
   audit-able config is recorded.
3. Transitions `awaiting_kickoff → active` with a patch:
   - `kickoff_completed_at = now()`
   - `start_date = today`
   - `target_end_date = today + template.timeline.max_days`
   - `first_agent_run_at = next 9am business day`
4. Writes two lifecycle events: `kickoff_completed` (with notes + attendees
   payload) and `activated` (with the checklist payload).
5. Posts a system message to the engagement thread.

The "first agent run scheduled" piece is intentionally just a column write.
The cron that picks up `first_agent_run_at` and fires the agent is a
separate sprint (the cron-not-yet-wired note from `update.md`).

---

## SOW workflow

The `pending_review → awaiting_legal_review → awaiting_signature` portion
of the lifecycle is the SOW authoring and two-step signature flow shipped
in [migration 010](../supabase/migrations/010_sow_authoring.sql).

```
[Intake submitted]
        │
        ▼
   pending_review · SOW draft
        │  Carlos clicks "Generate first draft" — Sonnet 4.6 fills the
        │  scope, deliverables, milestones, pricing, timeline, terms.
        │  Carlos edits in the form-on-left + preview-on-right panel.
        │  Save persists; reload preserves; AI-populated fields wear a
        │  small sage "AI" pill until Carlos dismisses each one.
        │
        │  Carlos clicks "Send for legal review"
        ▼
   awaiting_legal_review · SOW awaiting_legal
        │  PDF rendered server-side, uploaded to sow-pdfs bucket.
        │  PM-side: read-only PDF preview + "Mark legal as signed" /
        │  "Legal requested changes" actions.
        │
        │  Legal counter-signs                Legal requested changes
        ▼                                     ▼
   awaiting_signature · SOW awaiting_client   pending_review · SOW rejected_by_legal
        │  Counter-signed PDF rendered,      The same SOW row stays
        │  available to client. PM marks      editable. Version number
        │  client signed manually.            does NOT bump.
        │
        │  Client signs               Client requested revisions
        ▼                             ▼
   awaiting_kickoff · SOW signed     pending_review · new SOW row, version+1
                                     The previous version is marked
                                     `superseded`. Content is cloned so
                                     Carlos doesn't start over.
```

The SOW row's `status` field carries the sub-state. The engagement
lifecycle is intentionally five-state — `rejected_by_legal`,
`awaiting_finalize`, etc. are NOT engagement states.

Versions are append-only. Each row has a unique `(engagement_id,
version_number)`. A view `sows_active` exposes the latest non-superseded,
non-cancelled version per engagement; the application uses that for "the
SOW for engagement X."

Both PDFs (legal-review and client-signature) live in the private
`sow-pdfs` Supabase Storage bucket, path scheme
`{engagement_id}/{sow_id}/{stage}.pdf`. RLS gates client reads to SOWs in
`awaiting_client` or `signed` state. Signed URLs (15-minute expiry) are
the only way the application links to a PDF.

eSignature is stubbed in this sprint: "Mark legal as signed" / "Mark
client as signed" are PM actions. Real DocuSign / HelloSign integration
will replace those buttons with webhook callbacks in a later sprint.

### What Carlos sees, click by click

1. Engagement lands in his queue at `pending_review`. He opens it.
2. The PM workspace shows a SOW authoring panel with two CTAs: **Generate
   first draft with Glassbox** (sage, primary) or **Start blank draft**.
3. Generate streams progress (`Reading template snapshot…` → `Calling
   Claude…` → `Validating output…`) and lands him in the editor with the
   form pre-populated. Each AI-populated field wears a small sage **AI**
   pill. He clicks each pill as he reviews the field.
4. Form-on-left, live HTML preview-on-right. He edits scope, milestones,
   pricing, terms. **Save draft** persists; reload preserves state.
5. **Send for legal review** is a two-click confirm. The PDF renders
   server-side and uploads to `sow-pdfs/{engagement_id}/{sow_id}/legal_review.pdf`.
   Engagement transitions `pending_review → awaiting_legal_review`.
6. The panel switches to **Awaiting Legal**: inline PDF preview + two
   actions, **Mark legal as signed** (sage) and **Legal requested
   changes** (amber). On rejection, the same SOW row stays editable;
   the engagement reverts to `pending_review` and Carlos sees a banner
   with legal's notes above the editor.
7. On legal sign, a counter-signed PDF is rendered (now stamped with
   "Signed by [legal name] on [date]" at the bottom) and uploaded to
   `client_signature.pdf`. Engagement transitions `awaiting_legal_review
   → awaiting_signature`.
8. The panel switches to **Awaiting Client**: the counter-signed PDF +
   **Mark client as signed** (purple) and **Make changes and resubmit**
   (amber, opens a notes textarea). On client signature, a fully-signed
   contract PDF replaces the previous render. Engagement transitions
   `awaiting_signature → awaiting_kickoff`.
9. **Make changes and resubmit** is the asymmetric path: it both records
   the rejection AND immediately creates SOW v(N+1) with content cloned
   from vN. The previous version is marked `superseded`. Carlos lands
   back in the editor on v(N+1).
10. Once the engagement reaches `awaiting_kickoff`, the existing kickoff
    completion modal takes over. The SOW panel collapses to a small
    green "Signed SOW v{N}" card with a download link.

The version pill in the panel header (`SOW v2 · Draft`) opens a
right-side flyout with full version history — every draft, every legal
rejection, every client revision, and links to every archived PDF.

---

## Activation checklist

The kickoff completion modal's step 3 is an **acknowledgment-only**
checklist:

- Engineering team allocated in Connect
- Repo access granted
- CI/CD hooks configured
- Slack channel created
- First sprint scheduled

PMs check off the items they've actually completed. Items left unchecked
appear as a banner on the active engagement detail page until the PM
returns to resolve them. This is intentional — the checklist doesn't gate
activation, but it surfaces what's still pending so it doesn't fall
through the cracks.

---

## SLAs

Driven by [src/lib/lifecycle/sla.ts](../src/lib/lifecycle/sla.ts). Per
status:

| Status | SLA |
|--------|-----|
| `pending_review` | 1 business day from `intake_submitted_at` |
| `awaiting_kickoff` | 2 business days from `signed_at` |

Business days = Mon–Fri, ignoring per-day office hours. A weekend day
counts as zero. Approximation acceptable until the first SLA-driven
decision needs hour-level precision.

---

## Manual-by-design

A few of the steps in this lifecycle are deliberately not automated:

- **SOW generation.** The PM gets a textarea + a stubbed "Send for
  signature" button that sets up a placeholder URL. Real SOW authoring
  (probably AI-assisted, similar to Smart Intake) is a future sprint.
- **E-signature.** The "Mark as signed" button on the awaiting_signature
  panel is manual. Real DocuSign/HelloSign integration is a future sprint;
  the lifecycle event payload already records the SOW URL so swap-in is
  straightforward.
- **L3 activation tasks.** Repo provisioning, talent allocation, env
  spin-up — the kickoff modal's checklist is acknowledgment-only. The
  actual underlying work happens out-of-system.

This is deliberate. Contract review and project kickoff are high-trust
moments where customer confidence depends on a named human being
accountable. We make the manual steps **legible, predictable, and
well-supported** rather than trying to eliminate them.

---

## Debugging a stuck engagement

The `engagement_lifecycle_events` table is the audit log. To see what
happened to a specific engagement:

```sql
select created_at, event_type, actor_role, actor_user_id, notes,
       jsonb_pretty(payload) as payload
from engagement_lifecycle_events
where engagement_id = '<uuid>'
order by created_at;
```

Common stuck states:

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Engagement stuck at `pending_review` for >1 business day | PM hasn't sent SOW | Check `pm_user_id` and ping the PM. If unassigned (legacy), assign one and the queue picks it up. |
| Engagement stuck at `awaiting_signature` | Client hasn't signed; or the e-sign webhook didn't fire (it doesn't yet) | PM uses "Mark as signed manually" |
| `awaiting_kickoff` but "Complete kickoff" disabled | Kickoff isn't scheduled yet, or the scheduled time is in the future | Schedule kickoff in the workspace; button enables once the time has passed |
| `active` but no `agent_configs` row | Should be impossible post-008 (transactional in `completeKickoff`); investigate as a real bug |
| Banner shows "X of N activation tasks pending" but PM thinks they're done | The 'activated' event payload's checklist is the source of truth. Latest `activated` event wins. |

---

## Useful files

- [src/lib/lifecycle/transitions.ts](../src/lib/lifecycle/transitions.ts) — state machine
- [src/lib/lifecycle/events.ts](../src/lib/lifecycle/events.ts) — `recordLifecycleEvent`
- [src/lib/lifecycle/sla.ts](../src/lib/lifecycle/sla.ts) — business-day SLA helpers
- [src/app/(marketing)/marketplace/actions.ts](../src/app/(marketing)/marketplace/actions.ts) — `createEngagementFromTemplate` (intake)
- [src/app/(internal)/internal/engagements/actions.ts](../src/app/(internal)/internal/engagements/actions.ts) — PM transition actions
- [src/app/(internal)/internal/engagements/[id]/kickoff-actions.ts](../src/app/(internal)/internal/engagements/[id]/kickoff-actions.ts) — `completeKickoff`
- [src/components/lifecycle/lifecycle-timeline.tsx](../src/components/lifecycle/lifecycle-timeline.tsx) — shared timeline UI
- [supabase/migrations/008_intake_to_kickoff.sql](../supabase/migrations/008_intake_to_kickoff.sql) — schema + RLS
