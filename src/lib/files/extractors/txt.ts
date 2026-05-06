// Plain-text extractor — handles .txt and .md identically.
// We don't strip Markdown formatting because Claude reads MD natively.

import { countWords } from '../truncate'
import type { ExtractedFile } from '../types'

export async function extractTxt(buffer: Buffer, filename: string): Promise<ExtractedFile> {
  const text = buffer.toString('utf8').replace(/\r\n/g, '\n').trim()
  return {
    filename,
    text,
    original_word_count: countWords(text),
    was_truncated: false,
  }
}
