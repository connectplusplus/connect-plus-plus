// Shared types for the file-extraction pipeline. Every extractor returns the
// same shape so the dispatcher can apply truncation rules uniformly.

export interface ExtractedFile {
  filename: string
  text: string
  original_word_count: number
  was_truncated: boolean
}

export type ExtractErrorCode =
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'PARSE_FAILED'
  | 'PARSE_EMPTY'
  | 'COMBINED_TOO_LARGE'
  | 'TOO_MANY_FILES'
  | 'AUTH_ERROR'
  | 'API_ERROR'
  | 'RATE_LIMITED'
  | 'INVALID_JSON'
  | 'EMPTY_RESPONSE'

export interface ExtractError {
  code: ExtractErrorCode
  message: string
  filename?: string
  details?: string
  retryable: boolean
}

// Hard limits — exposed as constants so the route handler, the client
// dropzone, and the docs all read from the same source of truth.
export const MAX_FILES = 5
export const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25 MB
export const MAX_WORDS_PER_FILE = 30_000        // ~40K tokens
export const MAX_WORDS_COMBINED = 80_000        // ~100K tokens, leaves Claude headroom
export const MIN_WORDS_FOR_PARSE = 50           // below this we treat as PARSE_EMPTY

export const SUPPORTED_EXTENSIONS = ['txt', 'md', 'pdf', 'docx', 'pptx'] as const
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number]
