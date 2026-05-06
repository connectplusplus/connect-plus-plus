# Glassbox

FullStack's AI-native delivery platform. A three-layer product:

- **L1 — Marketplace.** Productized outcomes with fixed pricing and timelines. Public-facing.
- **L1.5 — Glassbox Agent.** Independent AI auditor that watches every active engagement and reports to the client.
- **L2 — Configurator.** Internal tool where Delivery authors and publishes the outcome templates that power L1 and feed L1.5.

Built on Next.js 16, React 19, Supabase, Tailwind v4, shadcn/ui.

---

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

The app expects a Supabase project. Set the env in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
ANTHROPIC_API_KEY=...   # required for the Configurator's smart-intake feature
```

`ANTHROPIC_API_KEY` is server-side only — never prefix it with
`NEXT_PUBLIC_`. Get one at
[console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).

Apply migrations in order:

```bash
# Paste each file's contents into the Supabase SQL editor, wrapped in BEGIN; / COMMIT;
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_internal_layer.sql
supabase/migrations/003_ai_layer.sql
supabase/migrations/004_expand_categories.sql
supabase/migrations/005_l2_configurator.sql
supabase/migrations/006_managed_categories.sql
```

Then optionally run the seed for talent profiles + demo company/engagements:

```bash
# Same pattern: paste supabase/seed.sql into the SQL editor
```

The seed no longer ships outcome templates — those are authored through the
Configurator.

---

## Project surfaces

Three route groups, three audiences:

- **`(marketing)`** — public marketplace. `/marketplace/outcomes`,
  `/marketplace/talent`, `/marketplace/pods`, `/marketplace/custom`. The
  outcomes list and detail pages render whatever templates Delivery has
  published.
- **`dashboard`** — authenticated client surface. `/dashboard/engagements`,
  `/dashboard/messages`, `/dashboard/my-talent`. Where customers see their
  active engagements, daily reports, agent assessments, and milestone progress.
- **`(internal)`** — FullStack employees only. `/internal` overview,
  `/internal/daily-reports` (AI-drafted reports the PM reviews), and the
  L2 Configurator at `/internal/outcomes`.

`(internal)` has its own auth model — `internal_users` table, separate
`/internal-login` page, RLS-gated to FullStack staff. See
[migration 002](supabase/migrations/002_internal_layer.sql) for the rationale.

---

## Internal tooling

- **Daily Reports** — `/internal/daily-reports` — AI-drafted daily reports
  for active engagements. The PM reviews, optionally overrides, and publishes
  to the client.
- **L2 Configurator** — `/internal/outcomes` — author outcome templates that
  power the L1 marketplace and feed the L1.5 audit. See
  [docs/configurator.md](docs/configurator.md) for the full guide.

---

## Glassbox Agent (L1.5)

An independent AI auditor configured per engagement. Lives in
[src/lib/agent/](src/lib/agent/). Pipeline: collect signals → score
deterministically → ask Claude for a written assessment → route to PM
review (or bypass to client when score is critical). API surface at
`/api/agent/{on-demand,run-scheduled,assessments}`. Spec doc:
[glassbox-agent-prompt.md](glassbox-agent-prompt.md).

---

## Scripts

```bash
pnpm dev              # Next.js dev server
pnpm build            # production build
pnpm lint             # ESLint
pnpm test             # Playwright e2e tests (requires test credentials in env)
node scripts/screenshot-walk.mjs   # full-app screenshot walker for design review
```

The e2e test exercises the Configurator's create/edit flow. It needs:

```
TEST_INTERNAL_EMAIL=...
TEST_INTERNAL_PASSWORD=...
```

set in env or `.env.local`. The user must already exist in `internal_users`
with role `pm` or `delivery_lead`.

---

## Reference docs

- [Glassbox_Product_Architecture_Guide.md](Glassbox_Product_Architecture_Guide.md) — full product + tech context
- [glassbox-l2-schema.md](glassbox-l2-schema.md) — L2 Configurator data schema
- [glassbox-agent-prompt.md](glassbox-agent-prompt.md) — Glassbox Agent spec
- [docs/configurator.md](docs/configurator.md) — L2 Configurator user guide
- [update.md](update.md) — delta since the architecture guide
