// DOCX extractor backed by mammoth.extractRawText. We don't preserve
// formatting — Claude doesn't need bold or headings to understand a scope
// doc.

import { countWords } from '../truncate'
import type { ExtractedFile } from '../types'

export async function extractDocx(buffer: Buffer, filename: string): Promise<ExtractedFile> {
  const { default: mammoth } = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })

  const text = (result.value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return {
    filename,
    text,
    original_word_count: countWords(text),
    was_truncated: false,
  }
}
