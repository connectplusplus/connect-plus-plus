// Word-count + truncation helpers shared across extractors and the
// dispatcher. Everything is deliberately simple: words are
// whitespace-separated tokens, and truncation slices on the same boundary.

import { MAX_WORDS_COMBINED, MAX_WORDS_PER_FILE } from './types'
import type { ExtractedFile } from './types'

export function countWords(text: string): number {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

// Truncate a single file to MAX_WORDS_PER_FILE words. Returns the file
// (possibly with `was_truncated: true` and a shortened `text`).
export function applyPerFileCap(file: ExtractedFile): ExtractedFile {
  if (file.original_word_count <= MAX_WORDS_PER_FILE) return file
  const words = file.text.trim().split(/\s+/)
  const truncated = words.slice(0, MAX_WORDS_PER_FILE).join(' ')
  return {
    ...file,
    text: truncated,
    was_truncated: true,
  }
}

// Truncate the combined payload to MAX_WORDS_COMBINED words. Earlier files
// (in upload order) take precedence — later files get truncated first.
// Returns the (possibly modified) files plus the names of any that were
// shortened or dropped to fit.
export function applyCombinedCap(files: ExtractedFile[]): {
  files: ExtractedFile[]
  truncated_filenames: string[]
} {
  const truncated_filenames: string[] = []
  let used = 0
  const out: ExtractedFile[] = []

  for (const file of files) {
    const fileWords = countWords(file.text)
    const remaining = MAX_WORDS_COMBINED - used

    if (remaining <= 0) {
      // No budget left at all. Drop this file's text but keep the entry
      // so the user sees we received it.
      truncated_filenames.push(file.filename)
      out.push({ ...file, text: '', was_truncated: true })
      continue
    }

    if (fileWords <= remaining) {
      out.push(file)
      used += fileWords
      continue
    }

    // Partial truncation.
    const words = file.text.trim().split(/\s+/)
    const slice = words.slice(0, remaining).join(' ')
    out.push({
      ...file,
      text: slice,
      was_truncated: true,
    })
    used += remaining
    truncated_filenames.push(file.filename)
  }

  return { files: out, truncated_filenames }
}
