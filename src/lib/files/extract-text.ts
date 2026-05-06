// Dispatcher that turns an uploaded File into either an ExtractedFile or
// a structured ExtractError. Format detection is by file extension —
// content-sniffing isn't worth the complexity here.

import { extractTxt } from './extractors/txt'
import { extractPdf } from './extractors/pdf'
import { extractDocx } from './extractors/docx'
import { extractPptx } from './extractors/pptx'
import { applyPerFileCap, applyCombinedCap } from './truncate'
import {
  MAX_FILE_BYTES,
  MAX_FILES,
  MIN_WORDS_FOR_PARSE,
  SUPPORTED_EXTENSIONS,
  type ExtractedFile,
  type ExtractError,
  type SupportedExtension,
} from './types'

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx < 0 ? '' : filename.slice(idx + 1).toLowerCase()
}

function isSupported(ext: string): ext is SupportedExtension {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)
}

async function dispatch(
  buffer: Buffer,
  filename: string,
  ext: SupportedExtension
): Promise<ExtractedFile> {
  switch (ext) {
    case 'txt':
    case 'md':
      return extractTxt(buffer, filename)
    case 'pdf':
      return extractPdf(buffer, filename)
    case 'docx':
      return extractDocx(buffer, filename)
    case 'pptx':
      return extractPptx(buffer, filename)
  }
}

// Extract text from a single uploaded File. Returns the extracted file
// (with truncation flag set if it exceeded the per-file cap), or an
// ExtractError describing why we couldn't.
export async function extractFile(
  file: File
): Promise<{ extracted: ExtractedFile } | { error: ExtractError }> {
  if (file.size > MAX_FILE_BYTES) {
    return {
      error: {
        code: 'FILE_TOO_LARGE',
        message: `${file.name} exceeds the 25 MB limit. Try splitting it or attaching the most relevant section.`,
        filename: file.name,
        retryable: false,
      },
    }
  }

  const ext = getExtension(file.name)
  if (!isSupported(ext)) {
    return {
      error: {
        code: 'UNSUPPORTED_FORMAT',
        message: `${file.name}: only ${SUPPORTED_EXTENSIONS.join(', ')} files are supported.`,
        filename: file.name,
        retryable: false,
      },
    }
  }

  let buffer: Buffer
  try {
    buffer = Buffer.from(await file.arrayBuffer())
  } catch (err) {
    return {
      error: {
        code: 'PARSE_FAILED',
        message: `${file.name} could not be read.`,
        filename: file.name,
        details: err instanceof Error ? err.message : String(err),
        retryable: true,
      },
    }
  }

  let extracted: ExtractedFile
  try {
    extracted = await dispatch(buffer, file.name, ext)
  } catch (err) {
    return {
      error: {
        code: 'PARSE_FAILED',
        message: `${file.name} could not be parsed. The file may be corrupt or in an unsupported variant of its format.`,
        filename: file.name,
        details: err instanceof Error ? err.message : String(err),
        retryable: false,
      },
    }
  }

  if (extracted.original_word_count < MIN_WORDS_FOR_PARSE) {
    return {
      error: {
        code: 'PARSE_EMPTY',
        message: `We couldn't extract meaningful text from ${file.name}. If this is a scanned document or image-heavy file, try copy-pasting the relevant content instead.`,
        filename: file.name,
        details: `Extracted only ${extracted.original_word_count} words.`,
        retryable: false,
      },
    }
  }

  return { extracted: applyPerFileCap(extracted) }
}

// Process a batch of uploaded files. Returns either the per-file results
// (mix of successes and errors) plus combined-truncation metadata, or a
// single batch-level error if the count exceeds the limit.
export async function extractBatch(files: File[]): Promise<
  | {
      results: Array<{ extracted: ExtractedFile } | { error: ExtractError }>
      combined_truncated_filenames: string[]
    }
  | { error: ExtractError }
> {
  if (files.length > MAX_FILES) {
    return {
      error: {
        code: 'TOO_MANY_FILES',
        message: `Maximum ${MAX_FILES} files per intake. Remove some before continuing.`,
        retryable: false,
      },
    }
  }

  const perFile = await Promise.all(files.map(extractFile))

  const successful = perFile.flatMap((r) => ('extracted' in r ? [r.extracted] : []))
  const { files: capped, truncated_filenames } = applyCombinedCap(successful)

  // Splice the capped files back into the per-file result list, preserving
  // the original ordering so the caller can correlate by index with the
  // uploaded files array.
  let cappedIdx = 0
  const results = perFile.map((r) => {
    if ('error' in r) return r
    return { extracted: capped[cappedIdx++] }
  })

  return { results, combined_truncated_filenames: truncated_filenames }
}
