// Functional walkthrough of Glassbox — captures every page/workflow into ./screenshots/
// Run: node scripts/screenshot-walk.mjs
// Requires: dev server at http://localhost:3000, Playwright + Chromium installed.

import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.GLASSBOX_BASE || 'http://localhost:3000'
const OUT = path.resolve('screenshots')
const VIEWPORT = { width: 1440, height: 900 }

const CLIENT = {
  email: process.env.CLIENT_EMAIL || 'abhi@fullstacklabs.co',
  password: process.env.CLIENT_PASSWORD || 'Dhruv@123',
}
const INTERNAL = {
  email: process.env.INTERNAL_EMAIL || 'carlos@fullstack.com',
  password: process.env.INTERNAL_PASSWORD || 'carlos123456',
}

let shotCount = 0
async function shoot(page, dir, name) {
  // Let the page settle — network idle + a beat for CSS transitions.
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(700)
  const file = path.join(OUT, dir, `${name}.png`)
  await fs.mkdir(path.dirname(file), { recursive: true })
  await page.screenshot({ path: file, fullPage: true })
  shotCount++
  console.log(`  ✓ [${String(shotCount).padStart(2, '0')}] ${dir}/${name}.png`)
}

async function safe(label, fn) {
  try {
    await fn()
  } catch (err) {
    console.log(`  ✗ ${label}: ${err.message.split('\n')[0]}`)
  }
}

async function login(page, creds, redirectGlob) {
  await page.fill('input[type="email"]', creds.email)
  await page.fill('input[type="password"]', creds.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(redirectGlob, { timeout: 15000 })
}

;(async () => {
  await fs.rm(OUT, { recursive: true, force: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  // ─────────────────────────────────────────────────────────────── 01 Marketing
  console.log('\n▸ 01 Marketing (public)')
  const marketingRoutes = [
    ['/', '01-homepage-hero'],
    ['/marketplace', '02-marketplace-lobby'],
    ['/marketplace/outcomes', '03-outcome-catalog'],
    ['/marketplace/outcomes/mvp-sprint', '04-outcome-detail-mvp-sprint'],
    ['/marketplace/talent', '05-public-talent-browse'],
    ['/marketplace/pods', '06-pods-marketplace'],
    ['/marketplace/custom', '07-custom-outcomes-process'],
  ]
  for (const [route, name] of marketingRoutes) {
    await safe(name, async () => {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
      await shoot(page, '01-marketing', name)
    })
  }

  // ────────────────────────────────────────────────────────────────── 02 Auth
  console.log('\n▸ 02 Auth pages + signup flow')
  await safe('client-login', async () => {
    await page.goto(BASE + '/login')
    await shoot(page, '02-auth', '01-client-login-page')
  })

  await safe('internal-login', async () => {
    await page.goto(BASE + '/internal-login')
    await shoot(page, '02-auth', '02-fullstack-internal-login-page')
  })

  await safe('signup-flow', async () => {
    await page.goto(BASE + '/signup')
    await shoot(page, '02-auth', '03-signup-step-1-customer-code')

    // Fill 7-char demo code — fill each input separately so React state
    // doesn't race with the setTimeout focus-advance handler.
    const codeInputs = page.locator('input[maxlength="1"]')
    const code = 'DEMO123'
    for (let i = 0; i < code.length; i++) {
      await codeInputs.nth(i).fill(code[i])
    }
    await page.waitForTimeout(200)
    await page.getByRole('button', { name: /verify code/i }).click()

    // Step 2 — MSA contract
    await page.waitForSelector('iframe[src="/msa.pdf"]', { timeout: 5000 })
    await page.waitForTimeout(1200)
    await shoot(page, '02-auth', '04-signup-step-2-master-services-agreement')

    await page.getByRole('button', { name: /sign and get access/i }).click()

    // Step 3 — account creation form
    await page.waitForSelector('input[autocomplete="name"]', { timeout: 5000 })
    await page.waitForTimeout(500)
    await shoot(page, '02-auth', '05-signup-step-3-create-account-form')
  })

  // ──────────────────────────────────────────────────── 03 Client Dashboard
  console.log('\n▸ 03 Client dashboard (logged in as ' + CLIENT.email + ')')
  await page.goto(BASE + '/login')
  await login(page, CLIENT, '**/dashboard**')

  await safe('dashboard-overview', async () => {
    await page.goto(BASE + '/dashboard')
    await shoot(page, '03-client-dashboard', '01-dashboard-overview-with-account-manager')
  })

  await safe('engagements-list', async () => {
    await page.goto(BASE + '/dashboard/engagements')
    await shoot(page, '03-client-dashboard', '02-engagements-list-empty-state')

    // Seed demo engagements if none exist
    const seed = page.getByRole('button', { name: /load demo engagements/i })
    if (await seed.count()) {
      console.log('    (seeding demo engagements…)')
      await seed.click()
      await page.waitForTimeout(4000)
      await page.reload()
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
      await shoot(page, '03-client-dashboard', '03-engagements-list-with-demo-data')
    }
  })

  // Drill into first engagement and screenshot each tab
  await safe('engagement-tabs', async () => {
    const firstLink = page.locator('a[href*="/dashboard/engagements/"]').first()
    await firstLink.click()
    await page.waitForURL(/\/dashboard\/engagements\/[^/]+$/, { timeout: 10000 })
    await shoot(page, '03-client-dashboard', '04-engagement-detail-overview-tab')

    const tabs = [
      ['Milestones', '05-engagement-detail-milestones-tab'],
      ['Project Docs', '06-engagement-detail-project-docs-tab'],
      ['Daily Reports', '07-engagement-detail-daily-reports-tab'],
      ['Agent Reports', '08-engagement-detail-agent-reports-tab'],
      ['Codebase', '09-engagement-detail-codebase-tab'],
      ['Messages', '10-engagement-detail-messages-tab'],
    ]
    for (const [label, filename] of tabs) {
      await safe(filename, async () => {
        const tab = page.getByRole('button', { name: new RegExp('^' + label, 'i') }).first()
        await tab.click()
        await page.waitForTimeout(500)
        await shoot(page, '03-client-dashboard', filename)
      })
    }
  })

  const clientRoutes = [
    ['/dashboard/my-talent', '11-my-talent-active-engineers-and-pods'],
    ['/dashboard/talent', '12-talent-browse-in-dashboard'],
    ['/dashboard/new-engagement', '13-new-engagement-outcome-catalog'],
    ['/dashboard/new-engagement/mvp-sprint', '14-new-engagement-detail-with-intake-form'],
    ['/dashboard/messages', '15-messages-inbox-all-engagements'],
  ]
  for (const [route, name] of clientRoutes) {
    await safe(name, async () => {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
      await shoot(page, '03-client-dashboard', name)
    })
  }

  // ──────────────────────────────────────────────────── 04 Internal Portal
  console.log('\n▸ 04 Internal portal (logged in as ' + INTERNAL.email + ')')
  // Clear client session before switching users
  await context.clearCookies()
  await page.goto(BASE + '/internal-login')
  await safe('internal-login-flow', async () => {
    await login(page, INTERNAL, '**/internal**')
  })

  const internalRoutes = [
    ['/internal', '01-internal-portal-dashboard'],
    ['/internal/daily-reports', '02-daily-reports-list-all-engagements'],
    ['/internal/daily-reports/new', '03-daily-report-create-form'],
  ]
  for (const [route, name] of internalRoutes) {
    await safe(name, async () => {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
      await shoot(page, '04-internal-portal', name)
    })
  }

  await browser.close()
  console.log(`\n✅ Done — ${shotCount} screenshots in ${OUT}/`)
})().catch((err) => {
  console.error('\n❌ Walk failed:', err)
  process.exit(1)
})
