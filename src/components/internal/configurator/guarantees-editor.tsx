'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, ShieldCheck } from 'lucide-react'
import { IconByName } from '@/components/ui/icon-by-name'
import { ICON_NAMES } from '@/lib/icons'
import type { OutcomeTemplate, Guarantee } from '@/lib/types'
import { ItemControls, arrayMove, newId } from './_shared'

interface Props {
  template: OutcomeTemplate
  onChange: (patch: Partial<OutcomeTemplate>) => void
}

export function GuaranteesEditor({ template, onChange }: Props) {
  const items = template.guarantees ?? []

  function update(items: Guarantee[]) {
    onChange({ guarantees: items })
  }

  function add() {
    update([
      ...items,
      { id: newId('g'), label: '', icon: 'ShieldCheck' },
    ])
  }

  function patch(index: number, p: Partial<Guarantee>) {
    update(items.map((g, i) => (i === index ? { ...g, ...p } : g)))
  }

  function remove(index: number) {
    update(items.filter((_, i) => i !== index))
  }

  function move(from: number, to: number) {
    update(arrayMove(items, from, to))
  }

  if (items.length === 0) return <EmptyState onAdd={add} />

  return (
    <div className="space-y-4">
      {items.map((g, i) => (
        <GuaranteeCard
          key={g.id}
          guarantee={g}
          index={i}
          count={items.length}
          onChange={(p) => patch(i, p)}
          onRemove={remove}
          onMove={move}
        />
      ))}

      <Button
        type="button"
        onClick={add}
        variant="ghost"
        className="w-full border border-dashed border-[#E2E8F0] text-[#7C3AED] hover:bg-[#7C3AED]/5 h-11"
      >
        <Plus size={14} className="mr-1.5" />
        Add guarantee
      </Button>

      {items.length < 2 && (
        <p className="text-[#F59E0B] text-xs text-center">
          {2 - items.length} more guarantee{2 - items.length === 1 ? '' : 's'} required to publish.
        </p>
      )}
    </div>
  )
}

function GuaranteeCard({
  guarantee,
  index,
  count,
  onChange,
  onRemove,
  onMove,
}: {
  guarantee: Guarantee
  index: number
  count: number
  onChange: (p: Partial<Guarantee>) => void
  onRemove: (index: number) => void
  onMove: (from: number, to: number) => void
}) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-1">
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="w-10 h-10 rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] flex items-center justify-center hover:border-[#7C3AED] transition-colors text-[#7C3AED]"
            title={`Icon: ${guarantee.icon}`}
          >
            <IconByName name={guarantee.icon} size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <Input
            value={guarantee.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="30-day post-delivery warranty"
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] font-medium"
          />
          <Textarea
            value={guarantee.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value || undefined })}
            placeholder="Optional supporting copy"
            rows={2}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] resize-none"
          />
        </div>

        <ItemControls index={index} count={count} onMove={onMove} onRemove={onRemove} />
      </div>

      {showPicker && (
        <div className="grid grid-cols-10 gap-2 pt-2 border-t border-[#E2E8F0]">
          {ICON_NAMES.map((name) => {
            const active = guarantee.icon === name
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onChange({ icon: name })
                  setShowPicker(false)
                }}
                title={name}
                className={`aspect-square rounded-lg border flex items-center justify-center transition-colors ${
                  active
                    ? 'bg-[#7C3AED]/10 border-[#7C3AED] text-[#7C3AED]'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] hover:text-[#0F172A]'
                }`}
              >
                <IconByName name={name} size={14} strokeWidth={1.5} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mx-auto mb-3">
        <ShieldCheck size={20} className="text-[#7C3AED]" />
      </div>
      <h3 className="font-heading font-semibold text-[#0F172A] text-sm mb-1">
        No guarantees yet
      </h3>
      <p className="text-[#64748B] text-xs mb-4 max-w-sm mx-auto">
        Guarantees show as small badges in the L1 sidebar. You need ≥2 to publish.
      </p>
      <Button
        type="button"
        onClick={onAdd}
        className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold h-9"
      >
        <Plus size={13} className="mr-1.5" />
        Add the first guarantee
      </Button>
    </div>
  )
}
