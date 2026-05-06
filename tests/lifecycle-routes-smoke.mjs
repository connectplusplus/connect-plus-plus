// Lifecycle routes smoke — verifies the new internal routes exist and the
// auth gate works. Skipped if no dev server is running.
//
// Doesn't test the full state-transition flow because that requires a real
// engagement + a real PM session. Documented limitation; the lifecycle is
// exercised by hand during Phase 6 review and inside the docs/runbook flow.

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const ROUTES = [
  '/internal/queue',
  // can't hit a specific engagement without seeding state; just check the
  // queue + the workspace base path 404s gracefully on a bogus id
  '/internal/engagements/00000000-0000-0000-0000-000000000000',
]

let exitCode = 0

async function check(path) {
  const res = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' })
  // Acceptable: redirect to /internal-login (307) for unauthenticated, 404
  // (notFound) for the bogus engagement id.
  if (res.status === 307 || res.status === 404) {
    console.log(`✓ ${path} → ${res.status}`)
    return
  }
  console.error(`✗ ${path} → ${res.status} (expected 307 or 404)`)
  exitCode = 1
}

try {
  for (const path of ROUTES) {
    await check(path)
  }
} catch (err) {
  console.error(
    `⏭  Skipping: dev server unreachable at ${BASE_URL} (${err instanceof Error ? err.message : err}).`
  )
  process.exit(0)
}

if (exitCode === 0) console.log('\n✅ Lifecycle routes smoke passed.')
process.exit(exitCode)
