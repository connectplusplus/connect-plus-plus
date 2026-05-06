# Smart-intake runbook

Operational reference for when the L2 Configurator's AI-guided intake breaks
or someone reports it isn't working. See [docs/configurator.md](./configurator.md)
for what the feature does and how it's structured.

---

## When the team reports "AI intake is broken"

### 1. Check the obvious

- **Is `ANTHROPIC_API_KEY` set?**
  - Local dev: `grep ANTHROPIC_API_KEY .env.local`
  - Production: check the deployment platform's env config.
  - The route returns `AUTH_ERROR` with a specific message when the key is
    missing or rejected; the user sees this in the form's error card.

- **Is Anthropic up?** [status.anthropic.com](https://status.anthropic.com).
  Sonnet 4.6 outages surface as `API_ERROR` in the form.

- **Has the team's account hit a rate limit at Anthropic's end?**
  Default tier is 60 RPM on Sonnet 4.6. Surfaces as `RATE_LIMITED` (status
  429). The `details` panel includes the full Anthropic error.

### 2. Check the per-user rate limit

Glassbox's own limit is 10 smart-intake calls per user per hour, enforced via
the `smart_intake_usage` table. To see who's been busy:

```sql
select user_id, count(*) as calls
from smart_intake_usage
where created_at > now() - interval '1 hour'
group by user_id
order by calls desc;
```

Surfaces as `RATE_LIMITED` for the offending user.

### 3. Inspect the recent runs

The `smart_intake_usage` table is the audit log. Last 7 days, all users:

```sql
select created_at, user_id, status, error_code,
       file_count, total_words, input_tokens, output_tokens, latency_ms
from smart_intake_usage
where created_at > now() - interval '7 days'
order by created_at desc;
```

Failures cluster by `error_code`. Look for patterns:

- `INVALID_JSON` repeatedly → the system prompt drifted from `OutcomeTemplate`
  in [src/lib/types.ts](../src/lib/types.ts). Update
  [src/lib/anthropic/prompts/extract-template.ts](../src/lib/anthropic/prompts/extract-template.ts)'s
  `SCHEMA_TS` block to match.
- `PARSE_EMPTY` repeatedly → users uploading image-heavy PDFs/decks. Confirm
  the docs/configurator.md file-support guidance is being followed.
- `API_ERROR` with no obvious cause → probably an Anthropic-side hiccup.
  Check status page; let it ride.
- `RATE_LIMITED` from a single user → educate them or raise their cap.

### 4. Specific failure modes and what to do

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Every extraction returns `INVALID_JSON` after retry | The model is consistently producing markdown-wrapped or non-JSON output. Schema in the prompt may have drifted. | Re-run `pnpm build` to confirm types still type-check, then audit `SCHEMA_TS` and the canonical example against `src/lib/types.ts`. |
| Form spinner hangs past 90s with no event | Vercel function timeout (default 60s) hit, or the SSE stream is being buffered by a proxy. | Confirm `maxDuration = 60` in `route.ts`. Check deployment platform — Vercel hobby's 10s cap will absolutely break this; needs Pro or another platform. |
| First extraction works, subsequent ones fail with `RATE_LIMITED` | Per-user limit hit or Anthropic tier limit hit. | Wait, or use Copy / Manual paths in the meantime. |
| Files upload successfully but extraction returns generic content | The PDF/DOCX/PPTX text layer is poor. | Have user copy-paste the relevant section into the questionnaire's "Anything else important" instead. |
| User sees `AUTH_ERROR` but the key is set | Key is malformed, expired, or has insufficient permissions. | Rotate via console.anthropic.com, redeploy. |

### 5. Bypass the AI path entirely

If Claude is down, the chooser at `/internal/outcomes/new` still offers:

- **Copy from existing** — clones a published template
- **Manual** — empty draft, edit by hand

Both work without `ANTHROPIC_API_KEY`. Tell the team to use those until the
Anthropic side recovers.

---

## Inspecting a specific extraction

The `smart_intake_usage` row links to the resulting template:

```sql
select su.created_at, su.status, su.error_code,
       su.input_tokens, su.output_tokens, su.latency_ms,
       ot.slug, ot.status as template_status, ot.title
from smart_intake_usage su
left join outcome_templates ot on ot.id = su.template_id
where su.created_at > now() - interval '24 hours'
order by su.created_at desc;
```

For successful runs the `template_id` is set; for errors it's null. The
template's `ai_suggested_fields` array shows which sections came from AI vs.
the user's edits since.

---

## Mock mode (for testing / demos)

`SMART_INTAKE_MOCK=1` in the dev server env bypasses the Anthropic call and
returns the canonical example. Useful for:

- E2E tests (CI doesn't burn API tokens)
- Demos without a key
- Reproducing UI behavior without waiting 30s

To run locally with the mock:

```bash
SMART_INTAKE_MOCK=1 pnpm dev
```

Confirm via `smart_intake_usage.model_used`: mocked rows show `'mock'` rather
than `'claude-sonnet-4-6'`.

---

## Cost ballpark

A typical extraction at Sonnet 4.6 pricing runs roughly **$0.10–$0.15** per
template (5K-token system prompt cached after first call in the same hour,
~30K tokens of file content, ~5K tokens of JSON output). Internal-only, low
volume — total cost should be on the order of single-digit dollars per week.

Watch for runaway usage in `smart_intake_usage` if anything looks off.
