# SOW workflow runbook

How to debug the SOW authoring + signature pipeline shipped in
[migration 010](../supabase/migrations/010_sow_authoring.sql) and the
sprint-sow-authoring branch.

For the lifecycle context (states, transitions, who-can-do-what), see
[lifecycle.md](./lifecycle.md). This file covers the *operational*
questions: what to do when something is broken or stuck.

---

## Quick map

| Where the work happens | What lives there |
|---|---|
| `src/lib/anthropic/draft-sow.ts` | Sonnet 4.6 drafter — async generator with progress events. `SOW_DRAFT_MOCK=1` short-circuits to the canonical example. |
| `src/lib/anthropic/prompts/draft-sow.ts` | System + user prompt builders. Embedded `SCHEMA_TS` is the source of truth for the JSON shape Claude returns. |
| `src/lib/anthropic/sow-canonical-example.ts` | Worked example embedded in the system prompt. Update both the example AND `SCHEMA_TS` when `SowContent` changes. |
| `src/app/api/internal/engagements/[id]/draft-sow/route.ts` | SSE route handler. Auth, rate-limit, get-or-create the SOW row, stream progress, persist the drafted content. |
| `src/lib/sow/render-pdf.ts` | `@react-pdf/renderer` SOW document. Stages: `legal_review`, `client_signature`. |
| `src/lib/sow/storage.ts` | Upload + signed-URL helpers for the `sow-pdfs` bucket. |
| `src/app/(internal)/internal/engagements/[id]/sow-actions.ts` | All server actions: draft / save / send / sign / reject / resubmit / read. |
| `src/app/(internal)/internal/engagements/[id]/sow-authoring-panel.tsx` | Top-level dispatcher by SOW status. |
| `src/app/(internal)/internal/engagements/[id]/sow-signature-panels.tsx` | `AwaitingLegalPanel`, `AwaitingClientPanel`, `SignedSowSummary`. |

---

## "AI drafting is failing for everyone"

Symptoms: PMs hit "Generate first draft" and get an inline error, or the
streaming UI hangs.

**Triage in this order:**

1. **Has the Anthropic API key rotated?** Check the dev/server env for
   `ANTHROPIC_API_KEY`. The smart-intake module shares this key, so if
   smart-intake is also broken, this is the cause.
2. **Are we rate-limited?** Per-PM rate limit is 20/hour. If a single PM
   is hitting it, the inline error says so. If we're hitting Anthropic's
   project-wide limit, the error code returned to the route will be
   `RATE_LIMITED` (a 429 from the Anthropic SDK) and the message will
   mention Anthropic specifically.
3. **Is Claude returning malformed JSON?** Check server logs for
   `[draft-sow] usage log` errors and rows in `sow_drafts_usage` with
   `status='error'` and `error_code='INVALID_JSON'`. The pipeline retries
   once on parse failure; if both attempts fail, the orchestrator returns
   `INVALID_JSON`. Updating the prompt's OUTPUT RULES is usually the fix
   — Claude tends to add markdown fences when the system prompt drifts.
4. **Did `SowContent` change without updating the prompt?** The Zod
   schema in `draft-sow.ts` and the `SCHEMA_TS` string in
   `prompts/draft-sow.ts` must stay in sync with `src/lib/types.ts`.
   Symptom: validation errors with `details` like `"deliverables.0.name:
   Expected string, received undefined"`.

**Checking recent failures:**

```sql
select created_at, user_id, status, error_code, latency_ms
from sow_drafts_usage
where created_at > now() - interval '1 hour'
order by created_at desc
limit 50;
```

**Force-mocking for dev work:** set `SOW_DRAFT_MOCK=1` in `.env.local`.
The orchestrator returns the canonical example without hitting Anthropic.

**Cost:** roughly $0.005–$0.010 per successful draft at Sonnet 4.6
pricing (~600 input + 1900 output tokens, dominated by the cached system
prompt). The 20/PM/hour rate limit caps a runaway PM at ~$2/hour.

---

## "SOW PDF rendering is failing"

The PDF pipeline uses `@react-pdf/renderer` running in pure Node. There
is no headless browser; no font fetches. Failures are usually one of:

1. **Buffer too large for the runtime.** A SOW with many milestones can
   grow past a few hundred KB. Vercel function payload limits sit at
   4.5MB request / 4.5MB response, so we have plenty of headroom.
2. **A new field in `SowContent` is being passed to the renderer with no
   handler.** Add it to `SowDocument` in `render-pdf.ts`.
3. **`renderToBuffer` throws synchronously.** Usually a Style-prop error
   (e.g. an unsupported flexBasis value). The action wraps the call in
   try/catch and returns `PDF rendering failed: <message>`.

**Local sanity check:**

```bash
npx tsx -e "
import { renderSowPdf } from './src/lib/sow/render-pdf';
import { CANONICAL_SOW_EXAMPLE_JSON } from './src/lib/anthropic/sow-canonical-example';
const c = JSON.parse(CANONICAL_SOW_EXAMPLE_JSON);
const buf = await renderSowPdf({
  sow: { version_number: 1, status: 'awaiting_legal', ...c },
  stage: 'legal_review',
  companyName: 'ACME', engagementTitle: 'Smoke',
});
require('node:fs').writeFileSync('/tmp/sow-smoke.pdf', buf);
console.log('OK', buf.length, 'bytes');
"
```

**Server logs to grep for:**
- `[sow] pdf rendered stage=...` — successful renders, with bytes + latency
- `[sow] event=...` — signature actions (one line each)

---

## "A SOW is stuck — manual recovery via SQL"

Find the active SOW row and its sub-state:

```sql
select id, version_number, status, sent_to_legal_at, legal_signed_at,
       sent_to_client_at, client_signed_at, drafted_by
from sows
where engagement_id = '<uuid>'
order by version_number desc;
```

The "active" SOW is the latest non-superseded, non-cancelled version
(also surfaced via the `sows_active` view).

### Engagement says `pending_review` but no SOW row exists

This is normal for legacy engagements that predate migration 010. The
PM's empty-state UI offers "Generate first draft" or "Start blank" —
either creates v1. If the UI is broken and you need to bootstrap by SQL:

```sql
insert into sows (engagement_id, version_number, status, drafted_by)
values ('<eng-uuid>', 1, 'draft', '<pm-uuid>')
returning id;
```

### Engagement is `awaiting_legal_review` but the SOW is still `draft`

Means `sendSowForLegalReview` wrote the SOW transition but the engagement
transition failed and didn't roll back. Move the SOW forward:

```sql
update sows
set status = 'awaiting_legal',
    sent_to_legal_at = now()
where id = '<sow-uuid>';
```

…or roll the engagement back to `pending_review`:

```sql
update engagements set status = 'pending_review', sow_sent_at = null
where id = '<eng-uuid>';
```

The lifecycle event row is preserved either way.

### Legal signed in real life but the action didn't fire

Mark legal signed manually (matches what the UI does):

```sql
update sows
set status = 'awaiting_client',
    legal_signed_at = now(),
    legal_signed_by = '<pm-uuid>'
where id = '<sow-uuid>';

update engagements set status = 'awaiting_signature', sow_sent_at = now()
where id = '<eng-uuid>';

insert into engagement_lifecycle_events
  (engagement_id, event_type, actor_role, actor_user_id, notes)
values ('<eng-uuid>', 'sow_legal_approved', 'pm', '<pm-uuid>',
        'Manually marked legal-signed via runbook');
```

You'll also need to re-render the counter-signed PDF for the client.
The cleanest path is to call `recordLegalSignature` from a one-off script
(it's idempotent for the SOW status transition because the action checks
`status === 'awaiting_legal'`; you'd have to revert that field first).

### Engagement was cancelled mid-flight; cleanup

`cancelEngagementAsPM` already marks in-flight SOW rows `cancelled`. If
that didn't fire (e.g. engagement was cancelled by SQL), do it manually:

```sql
update sows
set status = 'cancelled'
where engagement_id = '<eng-uuid>'
  and status not in ('superseded', 'cancelled', 'signed');
```

`signed` SOWs are NEVER touched — that row is the contract of record.

---

## "I need to find a specific version's PDF"

Storage layout: `sow-pdfs/{engagement_id}/{sow_id}/{stage}.pdf` where
stage is `legal_review` or `client_signature`. The bucket is private;
direct URLs don't work. Generate a signed URL:

```sql
-- find paths for an engagement's versions
select version_number, status,
       legal_pdf_storage_path, client_pdf_storage_path
from sows
where engagement_id = '<eng-uuid>'
order by version_number;
```

Then in the Supabase dashboard, navigate to Storage > `sow-pdfs`, find
the path, and click "Get signed URL" (the dashboard surface). Or in code:

```ts
import { getSowPdfSignedUrl } from '@/lib/sow/storage'
const { url } = await getSowPdfSignedUrl(
  '{engagement_id}/{sow_id}/legal_review.pdf'
)
```

Signed URLs expire after 15 minutes. Don't cache them; refetch on each
click. The version-history flyout in the PM workspace already does this.

---

## "I need to inspect a SOW's content for audit reasons"

```sql
select s.engagement_id, s.version_number, s.status,
       s.scope_summary,
       jsonb_pretty(s.deliverables) as deliverables,
       jsonb_pretty(s.milestones)   as milestones,
       jsonb_pretty(s.pricing)       as pricing,
       s.timeline_business_days,
       s.terms_md,
       s.legal_signed_at, s.client_signed_at
from sows s
where s.id = '<sow-uuid>';
```

Combined with the engagement's lifecycle events:

```sql
select created_at, event_type, actor_role, notes,
       jsonb_pretty(payload) as payload
from engagement_lifecycle_events
where engagement_id = '<eng-uuid>'
order by created_at;
```

…you have the full audit trail for any SOW: when it was drafted, who
edited it, when it was sent for legal, who approved/rejected, when the
client signed, and what changed across versions.

---

## Observability shortcuts

Server logs (one line per event, greppable):

```
[draft-sow] usage log failed: ...
[sow] pdf rendered stage=legal_review v=1 bytes=10535 latency_ms=720
[sow] event=sent_for_legal engagement=... sow=... v=1 pdf_bytes=10535
[sow] event=legal_signed engagement=... sow=... v=1 legal_signer=... pdf_bytes=10535
[sow] event=legal_rejected engagement=... sow=... v=1 notes_chars=120
[sow] event=client_signed engagement=... sow=... v=1 client_signer=... pdf_bytes=10535
[sow] event=client_rejected engagement=... sow=... v=1 notes_chars=88
[sow] event=resubmitted engagement=... prev_sow=... prev_v=1 new_sow=... new_v=2
```

Internal portal home (`/internal`) shows headline numbers for the last
7 days: drafts generated, average latency, sent to legal, signed.

---

## Smoke tests

- **Unit-ish PDF render:** see `tests/sow-smoke.mjs` for the e2e path
  through the PM workspace. Skips when `TEST_INTERNAL_EMAIL` /
  `TEST_INTERNAL_PASSWORD` aren't set, mirroring `smart-intake-smoke.mjs`.
- **AI orchestrator:** the mock path (`SOW_DRAFT_MOCK=1`) returns the
  canonical example without an API call. Useful for offline development
  and for running the e2e smoke in CI without burning Anthropic budget.

---

## Out of scope (so future-you doesn't go looking)

The following are explicitly NOT shipped in this sprint:

- Real DocuSign / HelloSign integration — "Mark as signed" is a manual
  PM action.
- Counter-signed PDFs with real signature glyphs — we render a "Signed
  by [name] on [date]" stamp at the bottom.
- A separate `legal` role on `internal_users` — any internal user can
  mark legal-signed.
- Real-time collaborative editing of a SOW.
- Cross-engagement SOW templates / library.
- Multi-currency or multi-language SOWs.
- Client-uploaded counter-signed PDFs.
