'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, GitBranch } from 'lucide-react'
import type {
  OutcomeTemplate,
  MilestoneTemplate,
  SignalSpec,
  SignalSource,
} from '@/lib/types'
import { ItemControls, Chip, arrayMove, newId } from './_shared'

const SIGNAL_SOURCES: SignalSource[] = [
  'github',
  'linear',
  'jira',
  'slack',
  'daily_report',
  'ci',
  'manual',
]

interface Props {
  template: OutcomeTemplate
  onChange: (patch: Partial<OutcomeTemplate>) => void
}

export function MilestonesEditor({ template, onChange }: Props) {
  const items = template.milestone_templates ?? []

  function update(items: MilestoneTemplate[]) {
    onChange({
      milestone_templates: items.map((m, i) => ({ ...m, order: i + 1 })),
    })
  }

  function add() {
    update([
      ...items,
      {
        id: newId('m'),
        order: items.length + 1,
        name: '',
        duration: { min_days: 1, max_days: 1 },
        description: '',
        acceptance_criteria: [],
        expected_signals: [],
      },
    ])
  }

  function patch(index: number, p: Partial<MilestoneTemplate>) {
    update(items.map((m, i) => (i === index ? { ...m, ...p } : m)))
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
      {items.map((m, i) => (
        <MilestoneCard
          key={m.id}
          milestone={m}
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
        Add milestone
      </Button>

      {items.length < 3 && (
        <p className="text-[#F59E0B] text-xs text-center">
          {3 - items.length} more milestone{3 - items.length === 1 ? '' : 's'} required to publish.
        </p>
      )}
    </div>
  )
}

function MilestoneCard({
  milestone,
  index,
  count,
  onChange,
  onRemove,
  onMove,
}: {
  milestone: MilestoneTemplate
  index: number
  count: number
  onChange: (p: Partial<MilestoneTemplate>) => void
  onRemove: (index: number) => void
  onMove: (from: number, to: number) => void
}) {
  const [criterion, setCriterion] = useState('')

  function addCriterion() {
    const v = criterion.trim()
    if (!v) return
    onChange({ acceptance_criteria: [...(milestone.acceptance_criteria ?? []), v] })
    setCriterion('')
  }

  function removeCriterion(idx: number) {
    onChange({
      acceptance_criteria: (milestone.acceptance_criteria ?? []).filter((_, i) => i !== idx),
    })
  }

  function addSignal() {
    onChange({
      expected_signals: [
        ...(milestone.expected_signals ?? []),
        { source: 'github', signature: '', required: true },
      ],
    })
  }

  function patchSignal(idx: number, p: Partial<SignalSpec>) {
    onChange({
      expected_signals: (milestone.expected_signals ?? []).map((s, i) =>
        i === idx ? { ...s, ...p } : s
      ),
    })
  }

  function removeSignal(idx: number) {
    onChange({
      expected_signals: (milestone.expected_signals ?? []).filter((_, i) => i !== idx),
    })
  }

  const hasRequiredSignal = (milestone.expected_signals ?? []).some((s) => s.required)

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-4">
      <div className="flex items-start gap-3">
        <span className="font-mono-brand text-[10px] text-[#94A3B8] mt-2.5 shrink-0">
          #{index + 1}
        </span>
        <div className="flex-1 min-w-0 space-y-3">
          <Input
            value={milestone.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Milestone name (e.g. Build Phase)"
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] font-medium"
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[#64748B] text-[11px] font-medium">Min days</label>
              <Input
                type="number"
                min={1}
                value={milestone.duration?.min_days ?? ''}
                onChange={(e) =>
                  onChange({
                    duration: {
                      ...milestone.duration,
                      min_days: Number(e.target.value) || 1,
                      max_days: milestone.duration?.max_days ?? 1,
                    },
                  })
                }
                className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#7C3AED] h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#64748B] text-[11px] font-medium">Max days</label>
              <Input
                type="number"
                min={1}
                value={milestone.duration?.max_days ?? ''}
                onChange={(e) =>
                  onChange({
                    duration: {
                      ...milestone.duration,
                      min_days: milestone.duration?.min_days ?? 1,
                      max_days: Number(e.target.value) || 1,
                    },
                  })
                }
                className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#7C3AED] h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#64748B] text-[11px] font-medium">
                Fixed label{' '}
                <span className="text-[#94A3B8] font-normal">(optional)</span>
              </label>
              <Input
                value={milestone.duration?.fixed_label ?? ''}
                onChange={(e) =>
                  onChange({
                    duration: {
                      ...milestone.duration,
                      min_days: milestone.duration?.min_days ?? 1,
                      max_days: milestone.duration?.max_days ?? 1,
                      fixed_label: e.target.value || undefined,
                    },
                  })
                }
                placeholder="Day 3"
                className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] h-8 text-xs"
              />
            </div>
          </div>

          <Textarea
            value={milestone.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="One-line client-facing description"
            rows={2}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] resize-none"
          />
        </div>
        <ItemControls index={index} count={count} onMove={onMove} onRemove={onRemove} />
      </div>

      {/* ── Acceptance criteria + Expected signals (two columns) ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-[#E2E8F0]">
        {/* Left: client-facing acceptance criteria */}
        <div className="space-y-2">
          <p className="text-[#0F172A] text-xs font-semibold">
            Acceptance criteria
            <span className="ml-1.5 text-[#94A3B8] text-[10px] font-normal">· client-facing</span>
          </p>
          <div className="flex flex-wrap gap-1.5 min-h-[28px]">
            {(milestone.acceptance_criteria ?? []).map((c, ci) => (
              <Chip key={ci} tone="purple" onRemove={() => removeCriterion(ci)}>
                {c}
              </Chip>
            ))}
            {(milestone.acceptance_criteria ?? []).length === 0 && (
              <span className="text-[#94A3B8] text-xs italic">None yet</span>
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
              placeholder="Add a criterion"
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

        {/* Right: audit-facing expected signals */}
        <div className="space-y-2">
          <p className="text-[#0F172A] text-xs font-semibold">
            Expected signals
            <span className="ml-1.5 text-[#0891B2] text-[10px] font-medium">· feeds L1.5</span>
          </p>

          {(milestone.expected_signals ?? []).length === 0 && (
            <p className="text-[#94A3B8] text-xs italic">None yet</p>
          )}

          <div className="space-y-2">
            {(milestone.expected_signals ?? []).map((s, si) => (
              <div
                key={si}
                className="bg-[#06B6D4]/5 border border-[#06B6D4]/20 rounded-lg p-2 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <select
                    value={s.source}
                    onChange={(e) =>
                      patchSignal(si, { source: e.target.value as SignalSource })
                    }
                    className="bg-white border border-[#E2E8F0] rounded text-[10px] h-7 px-2 text-[#0F172A] focus:border-[#06B6D4] focus:outline-none font-mono-brand"
                  >
                    {SIGNAL_SOURCES.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={s.signature}
                    onChange={(e) => patchSignal(si, { signature: e.target.value })}
                    placeholder="signature_in_snake_case"
                    className="bg-white border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#06B6D4] h-7 text-xs flex-1 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => removeSignal(si)}
                    className="text-[#94A3B8] hover:text-[#EF4444] transition-colors shrink-0 p-1"
                    aria-label="Remove signal"
                  >
                    ×
                  </button>
                </div>
                <label className="flex items-center gap-1.5 text-[10px] text-[#0891B2] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s.required}
                    onChange={(e) => patchSignal(si, { required: e.target.checked })}
                    className="accent-[#06B6D4]"
                  />
                  required (absence by milestone end = audit flag)
                </label>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addSignal}
            className="text-[#0891B2] text-xs font-semibold flex items-center gap-1 hover:bg-[#06B6D4]/5 rounded px-1.5 py-1"
          >
            <Plus size={11} />
            Add signal
          </button>

          {(milestone.expected_signals ?? []).length > 0 && !hasRequiredSignal && (
            <p className="text-[#F59E0B] text-[11px] mt-1">
              At least one signal must be marked required to publish.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mx-auto mb-3">
        <GitBranch size={20} className="text-[#7C3AED]" />
      </div>
      <h3 className="font-heading font-semibold text-[#0F172A] text-sm mb-1">
        No milestones yet
      </h3>
      <p className="text-[#64748B] text-xs mb-4 max-w-md mx-auto">
        Milestones structure the engagement. Each carries client-facing acceptance criteria
        (purple) and audit-facing expected signals (cyan) — the latter is how the Glassbox
        Agent independently verifies progress at L1.5. You need ≥3 to publish, and every
        milestone must have at least one required signal.
      </p>
      <Button
        type="button"
        onClick={onAdd}
        className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold h-9"
      >
        <Plus size={13} className="mr-1.5" />
        Add the first milestone
      </Button>
    </div>
  )
}
