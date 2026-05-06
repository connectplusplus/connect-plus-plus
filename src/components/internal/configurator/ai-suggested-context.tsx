'use client'

import { createContext, useCallback, useContext, useState, useTransition } from 'react'
import { Sparkles } from 'lucide-react'
import { dismissAISuggestion } from '@/app/(internal)/internal/outcomes/actions'

interface AISuggestedContextValue {
  // Returns true if this exact path or any ancestor was AI-suggested.
  isSuggested: (path: string) => boolean
  // Returns true only when an exact-match badge should render at this path.
  hasBadge: (path: string) => boolean
  dismiss: (path: string) => void
}

const AISuggestedContext = createContext<AISuggestedContextValue | null>(null)

interface ProviderProps {
  templateId: string
  initialPaths: string[]
  active: boolean
  children: React.ReactNode
}

export function AISuggestedProvider({
  templateId,
  initialPaths,
  active,
  children,
}: ProviderProps) {
  const [paths, setPaths] = useState<string[]>(initialPaths)
  const [, startTransition] = useTransition()

  const isSuggested = useCallback(
    (path: string) => {
      if (!active) return false
      return paths.some((p) => p === path || path.startsWith(p + '.') || p.startsWith(path + '.'))
    },
    [paths, active]
  )

  const hasBadge = useCallback(
    (path: string) => {
      if (!active) return false
      return paths.includes(path)
    },
    [paths, active]
  )

  const dismiss = useCallback(
    (path: string) => {
      // Optimistic update; the server action persists the change.
      setPaths((prev) => prev.filter((p) => p !== path))
      startTransition(async () => {
        const result = await dismissAISuggestion(templateId, path)
        if (result.error) {
          // Roll back if the persist failed.
          setPaths((prev) => (prev.includes(path) ? prev : [...prev, path]))
          console.error('[ai-suggested] dismiss failed:', result.error)
        }
      })
    },
    [templateId]
  )

  return (
    <AISuggestedContext.Provider value={{ isSuggested, hasBadge, dismiss }}>
      {children}
    </AISuggestedContext.Provider>
  )
}

export function useAISuggested(): AISuggestedContextValue {
  const ctx = useContext(AISuggestedContext)
  if (!ctx) {
    return {
      isSuggested: () => false,
      hasBadge: () => false,
      dismiss: () => {},
    }
  }
  return ctx
}

// ─── Badge ───────────────────────────────────────────────────────────────────

export function AISuggestedBadge({ path }: { path: string }) {
  const { hasBadge, dismiss } = useAISuggested()
  if (!hasBadge(path)) return null

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border bg-[#06B6D4]/10 text-[#0891B2] border-[#06B6D4]/30 ml-2 align-middle"
      title="Drafted by AI from your intake. Click ✓ once you've reviewed it."
    >
      <Sparkles size={9} className="shrink-0" />
      AI
      <button
        type="button"
        onClick={() => dismiss(path)}
        className="hover:text-[#0F172A] transition-colors -mr-0.5 leading-none"
        aria-label={`Dismiss AI marker on ${path}`}
      >
        ✓
      </button>
    </span>
  )
}
