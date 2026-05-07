'use client'

// Small sage pill marking a field as AI-populated. Click to dismiss.
//
// Per the sprint's style notes: 10–11px, sage background, NOT cyan, NOT a
// banner, NOT bold. This is a provenance marker, not a celebration.

interface Props {
  // Whether this field path is currently in the SOW's ai_drafted_fields.
  // If false, the pill renders nothing.
  active: boolean
  onDismiss: () => void
}

export function AiDraftedPill({ active, onDismiss }: Props) {
  if (!active) return null
  return (
    <button
      type="button"
      onClick={onDismiss}
      title="Drafted by Glassbox. Click to mark as reviewed."
      className="inline-flex items-center gap-1 ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] tracking-widest uppercase border border-[#7E8B6A]/30 bg-[#7E8B6A]/10 text-[#5C6B4D] hover:bg-[#7E8B6A]/20 transition-colors leading-none align-middle"
    >
      AI
    </button>
  )
}
