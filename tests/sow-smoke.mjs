// SOW authoring & two-step signature e2e smoke test
// ─────────────────────────────────────────────────────────────────────────────
// Drives the PM workspace through the full SOW lifecycle against a running
// dev server. Asserts:
//   - "Generate first draft with Glassbox" populates the editor (mocked
//     orchestrator returns the canonical example)
//   - AI pills are visible after the draft completes
//   - "Save draft" persists
//   - "Send for legal review" transitions the engagement → awaiting_legal_review
//   - "Mark legal as signed" transitions → awaiting_signature
//   - "Mark client as signed" transitions → awaiting_kickoff
//
// Mocked: the orchestrator detects SOW_DRAFT_MOCK=1 in the dev server env
// and returns the canonical example instead of calling Anthropic. The test
// runner is responsible for starting the dev server with that env set; this
// script does not start it.
//
// Required env on the runner:
//   PLAYWRIGHT_BASE_URL          (default http://localhost:3000)
//   TEST_INTERNAL_EMAIL          PM account
//   TEST_INTERNAL_PASSWORD
//   TEST_PENDING_ENGAGEMENT_ID   uuid of an engagement assigned to that PM
//                                in pending_review status (no SOW row, or a
//                                SOW row in 'draft' status with empty content)
//
// Required env on the dev server being tested:
//   SOW_DRAFT_MOCK=1
//
// Run: node tests/sow-smoke.mjs

import { chromium } from 'playwright'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const EMAIL = process.env.TEST_INTERNAL_EMAIL
const PASSWORD = process.env.TEST_INTERNAL_PASSWORD
const ENGAGEMENT_ID = process.env.TEST_PENDING_ENGAGEMENT_ID

if (!EMAIL || !PASSWORD) {
  console.log(
    '⏭  Skipping: TEST_INTERNAL_EMAIL / TEST_INTERNAL_PASSWORD not set in env.'
  )
  process.exit(0)
}

if (!ENGAGEMENT_ID) {
  console.log(
    '⏭  Skipping: TEST_PENDING_ENGAGEMENT_ID not set in env. Provide a uuid of an engagement in pending_review assigned to the test PM.'
  )
  process.exit(0)
}

let exitCode = 0
const SUFFIX = Date.now().toString(36)
const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()

// Helper: wait for a status badge / text to appear, with a tighter timeout
// and a clearer failure than .toContain in catch.
async function expectVisible(selectorOrText, opts = {}) {
  const timeout = opts.timeout ?? 10_000
  const message = opts.message ?? `expected visible: ${selectorOrText}`
  await page.locator(selectorOrText).first().waitFor({ state: 'visible', timeout })
  console.log(`✓ ${message}`)
}

try {
  // 1. Sign in ─────────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/internal-login`, { waitUntil: 'networkidle' })
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/internal(?!-login)/, { timeout: 15_000 })
  console.log('✓ logged in')

  // 2. Open engagement ─────────────────────────────────────────────────────
  await page.goto(
    `${BASE_URL}/internal/engagements/${ENGAGEMENT_ID}`,
    { waitUntil: 'networkidle' }
  )
  await expectVisible('text=SOW being prepared', { message: 'engagement is in pending_review' })

  // 3. Generate first draft (or click on the empty-state CTA) ──────────────
  // Empty-state shows a sage "Generate first draft with Glassbox" button.
  // Editor-with-content shows the same button in the panel header.
  const generateButton = page.getByRole('button', { name: /Generate first draft with Glassbox/i }).first()
  if (await generateButton.isVisible().catch(() => false)) {
    await generateButton.click()
    console.log('✓ clicked "Generate first draft" (empty state)')
  } else {
    // SOW row already exists with content; trigger a re-draft.
    const redraftButton = page.getByRole('button', { name: /Re-draft with Glassbox/i }).first()
    if (await redraftButton.isVisible().catch(() => false)) {
      await redraftButton.click()
      console.log('✓ clicked "Re-draft with Glassbox" (existing SOW)')
    } else {
      throw new Error('No drafting button found on the SOW panel.')
    }
  }

  // 4. Wait for the editor to populate ─────────────────────────────────────
  // Mock returns in <1s; real Sonnet takes ~30s. Cap at 60s so the smoke
  // works against either. Looks for the "Save draft" footer + the AI pill.
  await page.waitForSelector('text=Save draft', { timeout: 60_000 })
  console.log('✓ editor rendered after draft')

  // AI pills (sage "AI" badge next to populated field labels). At least one
  // should be visible after an AI fill.
  await expectVisible('text=AI', { message: 'AI-drafted pill visible' })

  // 5. Save draft persists ─────────────────────────────────────────────────
  await page.getByRole('button', { name: /^Save draft$/i }).click()
  await expectVisible('text=Saved', { message: 'save indicator shows "Saved"' })

  // 6. Send for legal review (two-click confirm) ───────────────────────────
  await page.getByRole('button', { name: /Send for legal review/i }).click()
  await page.getByRole('button', { name: /Confirm — send to Legal/i }).click()
  // Engagement should move to awaiting_legal_review. The status badge is
  // updated inside the page; wait for the new label.
  await expectVisible('text=Legal review', {
    message: 'engagement transitioned to awaiting_legal_review',
    timeout: 20_000,
  })

  // 7. Mark legal as signed ────────────────────────────────────────────────
  await page.getByRole('button', { name: /Mark legal as signed/i }).click()
  await expectVisible('text=Awaiting signature', {
    message: 'engagement transitioned to awaiting_signature',
    timeout: 30_000,
  })

  // 8. Mark client as signed ───────────────────────────────────────────────
  await page.getByRole('button', { name: /Mark client as signed/i }).click()
  await expectVisible('text=Kickoff pending', {
    message: 'engagement transitioned to awaiting_kickoff',
    timeout: 30_000,
  })

  console.log('\n✅ SOW smoke passed.')
} catch (err) {
  exitCode = 1
  console.error('\n❌ SOW smoke failed:', err instanceof Error ? err.message : err)
  await page
    .screenshot({ path: `tests/sow-failure-${SUFFIX}.png`, fullPage: true })
    .catch(() => {})
  console.error(`   Screenshot: tests/sow-failure-${SUFFIX}.png`)
} finally {
  await browser.close()
  process.exit(exitCode)
}
