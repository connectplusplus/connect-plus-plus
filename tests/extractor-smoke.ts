// Smart-intake extractor smoke test
// ─────────────────────────────────────────────────────────────────────────────
// Verifies the per-format extractors and the truncation rules without
// hitting the route handler or the network. Run via `pnpm test:extractors`.
//
// Limitations: only txt and md fixtures are committed. PDF, DOCX, and PPTX
// extractors are verified manually during dev — see test-fixtures/README.md.

// Run via `pnpm test:extractors` — uses tsx so the TypeScript imports below
// resolve directly without a build step.

import assert from 'node:assert'
import fs from 'node:fs/promises'
import path from 'node:path'

import { extractFile, extractBatch } from '../src/lib/files/extract-text.ts'
import {
  applyCombinedCap,
  applyPerFileCap,
  countWords,
} from '../src/lib/files/truncate.ts'

const FIXTURES = path.resolve('test-fixtures')

async function fixtureFile(name) {
  const buffer = await fs.readFile(path.join(FIXTURES, name))
  // Polyfill the File constructor for Node — it accepts an array of BlobParts
  // and a name. Node 20+ has it globally; older Node would need a shim.
  return new File([buffer], name)
}

const checks = []

function check(name, fn) {
  checks.push({ name, fn })
}

// ── countWords ──────────────────────────────────────────────────────────────
check('countWords: basic', () => {
  assert.strictEqual(countWords('hello world'), 2)
  assert.strictEqual(countWords('  hello   world  '), 2)
  assert.strictEqual(countWords(''), 0)
  assert.strictEqual(countWords('one'), 1)
})

// ── txt extractor ───────────────────────────────────────────────────────────
check('extractFile: sample-scope.txt', async () => {
  const result = await extractFile(await fixtureFile('sample-scope.txt'))
  assert('extracted' in result, `txt extraction returned an error: ${JSON.stringify(result)}`)
  const { extracted } = result
  assert.strictEqual(extracted.filename, 'sample-scope.txt')
  assert.strictEqual(extracted.was_truncated, false)
  assert.ok(extracted.original_word_count > 100, 'expected >100 words')
  assert.ok(extracted.text.includes('Code Review Service'))
  assert.ok(extracted.text.includes('Glassbox Agent'))
})

// ── md extractor ────────────────────────────────────────────────────────────
check('extractFile: sample-scope.md', async () => {
  const result = await extractFile(await fixtureFile('sample-scope.md'))
  assert('extracted' in result, `md extraction returned an error: ${JSON.stringify(result)}`)
  const { extracted } = result
  assert.strictEqual(extracted.filename, 'sample-scope.md')
  assert.ok(extracted.text.includes('# Code Review Service'))
  assert.ok(extracted.original_word_count > 50)
})

// ── unsupported format ──────────────────────────────────────────────────────
check('extractFile: rejects unsupported extension', async () => {
  const file = new File(['some content'], 'thing.xls')
  const result = await extractFile(file)
  assert('error' in result)
  assert.strictEqual(result.error.code, 'UNSUPPORTED_FORMAT')
  assert.strictEqual(result.error.retryable, false)
})

// ── parse-empty path ────────────────────────────────────────────────────────
check('extractFile: PARSE_EMPTY for too-short content', async () => {
  const file = new File(['just a few words here'], 'tiny.txt')
  const result = await extractFile(file)
  assert('error' in result)
  assert.strictEqual(result.error.code, 'PARSE_EMPTY')
})

// ── per-file truncation ─────────────────────────────────────────────────────
check('applyPerFileCap: respects MAX_WORDS_PER_FILE', () => {
  const big = {
    filename: 'big.txt',
    text: 'word '.repeat(35_000).trim(),
    original_word_count: 35_000,
    was_truncated: false,
  }
  const out = applyPerFileCap(big)
  assert.strictEqual(out.was_truncated, true)
  assert.strictEqual(countWords(out.text), 30_000)
})

// ── combined truncation ─────────────────────────────────────────────────────
check('applyCombinedCap: truncates later files first', () => {
  const make = (name, words) => ({
    filename: name,
    text: 'word '.repeat(words).trim(),
    original_word_count: words,
    was_truncated: false,
  })
  const result = applyCombinedCap([
    make('a.txt', 60_000),
    make('b.txt', 30_000), // would push combined to 90K, over the 80K cap
  ])
  assert.strictEqual(result.truncated_filenames.length, 1)
  assert.strictEqual(result.truncated_filenames[0], 'b.txt')
  // First file should be untouched.
  assert.strictEqual(result.files[0].was_truncated, false)
  // Second file should be truncated to fit.
  assert.strictEqual(result.files[1].was_truncated, true)
  const totalWords = result.files.reduce((s, f) => s + countWords(f.text), 0)
  assert.ok(totalWords <= 80_000, `combined ${totalWords} should be ≤ 80K`)
})

// ── batch error: too many files ─────────────────────────────────────────────
check('extractBatch: too many files', async () => {
  const files = Array.from(
    { length: 6 },
    (_, i) => new File(['content '.repeat(100)], `f${i}.txt`)
  )
  const result = await extractBatch(files)
  assert('error' in result)
  assert.strictEqual(result.error.code, 'TOO_MANY_FILES')
})

// ─────────────────────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  let passed = 0
  let failed = 0

  for (const { name, fn } of checks) {
    try {
      await fn()
      console.log(`✓ ${name}`)
      passed++
    } catch (err) {
      console.error(`✗ ${name}`)
      console.error('  ', err instanceof Error ? err.message : err)
      failed++
    }
  }

  console.log(`\n${passed}/${checks.length} passed`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
