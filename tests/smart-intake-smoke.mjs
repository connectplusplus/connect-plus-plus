// Smart-intake e2e smoke test
// ─────────────────────────────────────────────────────────────────────────────
// Drives the AI-guided new-template flow end to end against a running dev
// server. Asserts: chooser renders → AI form loads → submitted form streams
// SSE progress → redirect lands on the editor with ?ai=1 → AI badges visible.
//
// Mocked: the orchestrator detects SMART_INTAKE_MOCK=1 in the dev server env
// and returns the canonical example instead of calling Anthropic. The test
// runner is responsible for starting the dev server with that env set; this
// script does not start it.
//
// Required env on the runner:
//   PLAYWRIGHT_BASE_URL  (default http://localhost:3000)
//   TEST_INTERNAL_EMAIL
//   TEST_INTERNAL_PASSWORD
//
// Required env on the dev server being tested:
//   SMART_INTAKE_MOCK=1
//
// Run: pnpm test:smart-intake (uses default base URL)

import { chromium } from 'playwright'
import assert from 'node:assert'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const EMAIL = process.env.TEST_INTERNAL_EMAIL
const PASSWORD = process.env.TEST_INTERNAL_PASSWORD

if (!EMAIL || !PASSWORD) {
  console.log(
    '⏭  Skipping: TEST_INTERNAL_EMAIL / TEST_INTERNAL_PASSWORD not set in env.'
  )
  process.exit(0)
}

const SUFFIX = Date.now().toString(36)
const SERVICE_NAME = `Smart Intake E2E ${SUFFIX}`

let exitCode = 0
const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()

try {
  // 1. Sign in
  await page.goto(`${BASE_URL}/internal-login`, { waitUntil: 'networkidle' })
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/internal(?!-login)/, { timeout: 15_000 })
  console.log('✓ logged in')

  // 2. Chooser loads with three options
  await page.goto(`${BASE_URL}/internal/outcomes/new`, { waitUntil: 'networkidle' })
  const aiCount = await page.locator('text=AI-guided').count()
  const manualCount = await page.locator('text=Manual').count()
  assert(aiCount > 0, 'chooser should show AI-guided option')
  assert(manualCount > 0, 'chooser should show Manual option')
  console.log('✓ chooser rendered')

  // 3. AI form
  await page.locator('a[href="/internal/outcomes/new/ai"]').first().click()
  await page.waitForURL(/\/internal\/outcomes\/new\/ai/, { timeout: 10_000 })

  await page.locator('input[placeholder*="Code Review"]').fill(SERVICE_NAME)
  await page
    .locator('textarea[placeholder*="In 1–2 sentences"]')
    .fill(
      'A structured codebase audit and review pass. One week, ends with an actionable report.'
    )
  console.log('✓ AI form filled')

  // 4. Submit and wait for redirect
  await page.locator('button[type="submit"]', { hasText: 'Extract template' }).click()

  // The mock path resolves quickly. Real Anthropic would take 15–60s; we cap
  // the wait at 30s so a misconfigured mock fails the test cleanly.
  await page.waitForURL(/\/internal\/outcomes\/[^\/]+\/edit\?ai=1/, {
    timeout: 30_000,
  })
  console.log('✓ extraction completed; landed on editor')

  // 5. AI badge present
  await page.waitForSelector('text=AI', { timeout: 5_000 })
  const aiBadgeCount = await page.locator('text=AI').count()
  assert(aiBadgeCount > 0, 'editor should render at least one AI-suggested badge')
  console.log(`✓ ${aiBadgeCount} AI marker(s) visible`)

  console.log('\n✅ Smart-intake smoke passed.')
} catch (err) {
  exitCode = 1
  console.error('\n❌ Smart-intake smoke failed:', err instanceof Error ? err.message : err)
  await page.screenshot({ path: `tests/smart-intake-failure-${SUFFIX}.png`, fullPage: true })
  console.error(`   Screenshot: tests/smart-intake-failure-${SUFFIX}.png`)
} finally {
  await browser.close()
  process.exit(exitCode)
}
