// PDF extractor backed by pdf-parse v2 (class-based API on top of pdfjs-dist).
//
// pdf-parse pulls in pdfjs which is heavy; importing lazily keeps the rest
// of the app cold-start fast.

import { countWords } from '../truncate'
import type { ExtractedFile } from '../types'

export async function extractPdf(buffer: Buffer, filename: string): Promise<ExtractedFile> {
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: new Uint8Array(buffer) })

  let text: string
  try {
    const result = await parser.getText()
    text = (result.text ?? '')
      // pdfjs occasionally emits doubled or mismatched whitespace at line
      // and page boundaries — normalize before we count words.
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  } finally {
    await parser.destroy().catch(() => {})
  }

  return {
    filename,
    text,
    original_word_count: countWords(text),
    was_truncated: false,
  }
}
