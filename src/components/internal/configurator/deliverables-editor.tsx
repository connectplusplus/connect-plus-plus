'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, Package } from 'lucide-react'
import type { OutcomeTemplate, DeliverableSpec } from '@/lib/types'
import { ItemControls, Chip, arrayMove, newId } from './_shared'

interface Props {
  template: OutcomeTemplate
  onChange: (patch: Partial<OutcomeTemplate>) => void
}

export function DeliverablesEditor({ template, onChange }: Props) {
  const items = template.deliverables ?? []

  function update(items: DeliverableSpec[]) {
    onChange({ deliverables: items.map((d, i) => ({ ...d, order: i + 1 })) })
  }

  function add() {
    update([
      ...items,
      {
        id: newId('d'),
        order: items.length + 1,
        name: '',
        acceptance_criteria: [],
      },
    ])
  }

  function patch(index: number, p: Partial<DeliverableSpec>) {
    update(items.map((d, i) => (i === index ? { ...d, ...p } : d)))
  }

  function remove(index: number) {
    update(items.filter((_, i) => i !== index))
  }

  function move(from: number, to: number) {
    update(arrayMove(items, from, to))
  }

  if (items.length === 0) {
    return (
      <EmptyState onAdd={add} />
    )
  }

  return (
    <div className="space-y-4">
      {items.map((d, i) => (
        <DeliverableCard
          key={d.id}
          deliverable={d}
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
        Add deliverable
      </Button>

      {items.length < 3 && (
        <p className="text-[#F59E0B] text-xs text-center">
          {3 - items.length} more deliverable{3 - items.length === 1 ? '' : 's'} required to publish.
        </p>
      )}
    </div>
  )
}

function DeliverableCard({
  deliverable,
  index,
  count,
  onChange,
  onRemove,
  onMove,
}: {
  deliverable: DeliverableSpec
  index: number
  count: number
  onChange: (p: Partial<DeliverableSpec>) => void
  onRemove: (index: number) => void
  onMove: (from: number, to: number) => void
}) {
  const [criterion, setCriterion] = useState('')

  function addCriterion() {
    const v = criterion.trim()
    if (!v) return
    onChange({ acceptance_criteria: [...(deliverable.acceptance_criteria ?? []), v] })
    setCriterion('')
  }

  function removeCriterion(idx: number) {
    onChange({
      acceptance_criteria: (deliverable.acceptance_criteria ?? []).filter((_, i) => i !== idx),
    })
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className="font-mono-brand text-[10px] text-[#94A3B8] mt-2.5 shrink-0">
          #{index + 1}
        </span>
        <div className="flex-1 min-w-0 space-y-3">
          <Input
            value={deliverable.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Deliverable name (e.g. Codebase audit & test strategy)"
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED]"
          />
          <Textarea
            value={deliverable.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value || undefined })}
            placeholder="Optional longer detail (one short paragraph)"
            rows={2}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] resize-none"
          />

          <div className="space-y-2">
            <p className="text-[#0F172A] text-xs font-semibold">Acceptance criteria</p>
            <div className="flex flex-wrap gap-1.5">
              {(deliverable.acceptance_criteria ?? []).map((c, ci) => (
                <Chip key={ci} tone="purple" onRemove={() => removeCriterion(ci)}>
                  {c}
                </Chip>
              ))}
              {(deliverable.acceptance_criteria ?? []).length === 0 && (
                <span className="text-[#94A3B8] text-xs">No criteria yet.</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={criterion}
                onChange={(e) => setCriterion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCriterion()
                  }
                }}
                placeholder="Add a criterion and press Enter"
                className="bg-white border-[#E2E8F0] text-[#0F172A] h-8 text-xs focus:border-[#7C3AED]"
              />
              <button
                type="button"
                onClick={addCriterion}
                disabled={!criterion.trim()}
                className="text-[#7C3AED] text-xs font-semibold px-2 h-8 rounded hover:bg-[#7C3AED]/5 disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>
        <ItemControls index={index} count={count} onMove={onMove} onRemove={onRemove} />
      </div>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mx-auto mb-3">
        <Package size={20} className="text-[#7C3AED]" />
      </div>
      <h3 className="font-heading font-semibold text-[#0F172A] text-sm mb-1">
        No deliverables yet
      </h3>
      <p className="text-[#64748B] text-xs mb-4 max-w-sm mx-auto">
        Deliverables describe what the client receives. Each one carries acceptance criteria —
        explicit checks the L1.5 Agent uses to verify completion. You need ≥3 to publish.
      </p>
      <Button
        type="button"
        onClick={onAdd}
        className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold h-9"
      >
        <Plus size={13} className="mr-1.5" />
        Add the first deliverable
      </Button>
    </div>
  )
}
