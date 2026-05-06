// Anthropic SDK singleton. Lazy-initialized so we don't blow up at import
// time when the env var is missing in unrelated contexts (e.g. running the
// extractor smoke test).

import Anthropic from '@anthropic-ai/sdk'

export const SMART_INTAKE_MODEL = 'claude-sonnet-4-6' as const

let client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (client) return client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to .env.local (server-side only).'
    )
  }
  client = new Anthropic({ apiKey })
  return client
}
