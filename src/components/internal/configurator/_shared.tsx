'use client'

import { ArrowDown, ArrowUp, X } from 'lucide-react'
import { AISuggestedBadge } from './ai-suggested-context'

// Field — label + optional hint, used by every section. The optional `path`
// prop lets the field render an "AI-suggested" badge when smart-intake
// populated this section.
export function Field({
  label,
  hint,
  path,
  children,
}: {
  label: string
  hint?: string
  path?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-semibold text-[#0F172A]">
          {label}
          {path && <AISuggestedBadge path={path} />}
        </label>
        {hint && <p className="text-[#94A3B8] text-xs mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

// Reorder helper used by the list editors that don't have @dnd-kit.
export function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// Generic up/down/remove control row for list-editor items.
export function ItemControls({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number
  count: number
  onMove: (from: number, to: number) => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={() => onMove(index, index - 1)}
        disabled={index === 0}
        className="p-1 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Move up"
        title="Move up"
      >
        <ArrowUp size={12} />
      </button>
      <button
        type="button"
        onClick={() => onMove(index, index + 1)}
        disabled={index === count - 1}
        className="p-1 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Move down"
        title="Move down"
      >
        <ArrowDown size={12} />
      </button>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="p-1 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/5 rounded transition-colors"
        aria-label="Remove"
        title="Remove"
      >
        <X size={12} />
      </button>
    </div>
  )
}

// Purple chip (client-facing acceptance criteria, etc.) and cyan chip
// (audit-facing signals). Both are removable inline.
export function Chip({
  tone,
  children,
  onRemove,
}: {
  tone: 'purple' | 'cyan'
  children: React.ReactNode
  onRemove?: () => void
}) {
  const styles =
    tone === 'cyan'
      ? 'bg-[#06B6D4]/10 text-[#0891B2] border-[#06B6D4]/30'
      : 'bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/30'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${styles}`}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
          aria-label="Remove"
        >
          <X size={10} />
        </button>
      )}
    </span>
  )
}

// Reusable id generator for new list items.
export function newId(prefix: string): string {
  return `${prefix}_${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).slice(0, 8)}`
}
