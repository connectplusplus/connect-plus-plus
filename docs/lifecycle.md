# Engagement lifecycle

The path from "client clicks Submit on the intake form" to "engagement is
active and the Glassbox Agent's first run is queued."

This doc covers what's shipping today after the intake-to-kickoff sprint.
For the data schema underneath, see
[supabase/migrations/008_intake_to_kickoff.sql](../supabase/migrations/008_intake_to_kickoff.sql).

---

## The state machine

```
[Intake form submitted]
        │
        ▼
   pending_review        — Client: "SOW being prepared (≤1 business day)"
        │                  PM:     "Action needed → prepare SOW"
        │ PM finalizes SOW, sends to client
        ▼
   awaiting_signature    — Client: "Review and sign SOW"
        │                  PM:     "Awaiting client signature"
        │ Client e-signs (or PM marks signed manually)
        ▼
   awaiting_kickoff      — Client: "Schedule kickoff with [PM name]"
        │                  PM:     "Schedule kickoff call"
        │ PM completes kickoff call AND clicks "Activate engagement"
        ▼
   active                — Existing engagement flow takes over.
                           Agent first run scheduled.
```

Bidirectional cases:

- **Returned to review.** PM transitions `awaiting_signature → pending_review`
  when the client requests scope revisions. The original SOW payload stays
  on its lifecycle event; the new revision is captured by the next
  `sow_sent` event.
- **Cancellation.** Either party can cancel from any pre-active state.
  Cancellations are soft — the engagement row stays, status becomes
  `cancelled`, lifecycle events preserve the audit trail.

The legacy states (`intake`, `scoping`) stay readable so engagements that
predate this sprint don't break. New engagements only use the four-state
lifecycle.

---

## Who can do what

| Action | From state | To state | Actor |
|--------|-----------|----------|-------|
| Submit intake | (none) | `pending_review` | Client |
| Send SOW for signature | `pending_review` | `awaiting_signature` | PM |
| Mark as signed | `awaiting_signature` | `awaiting_kickoff` | PM (stub) / e-sign webhook (future) |
| Return to review | `awaiting_signature` | `pending_review` | PM |
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
| `event_type` | one of: `intake_submitted`, `sow_sent`, `sow_revised`, `signed`, `kickoff_scheduled`, `kickoff_completed`, `activated`, `cancelled`, `returned_to_review` |
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
