# Test fixtures

Sample inputs for the smart-intake extractor pipeline.

## What's here

- `sample-scope.txt` — plain-text 1-page scope document for a "Code Review Service" outcome
- `sample-scope.md` — same content rendered as Markdown

These fixtures back the extractor smoke test (`tests/extractor-smoke.mjs`).

## Why no PDF / DOCX / PPTX

Generating valid OOXML or PDF binaries from scratch in a few lines of code
isn't realistic — every shortcut produces a file that some downstream
parser rejects. Rather than commit large pre-existing binaries, the
extractors for those formats are verified manually:

1. Run `pnpm dev`.
2. Navigate to the AI intake form (post Phase 4).
3. Upload a real-world sample of each format.
4. Check the response from `/api/internal/outcomes/extract`.

If we end up needing automated tests against these formats, the right
move is to commit a single 1-page sample of each (under ~50 KB total).
