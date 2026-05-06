'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, FileQuestion } from 'lucide-react'
import type {
  OutcomeTemplate,
  IntakeField,
  IntakeFieldType,
  IntakeSchema,
} from '@/lib/types'
import { ItemControls, arrayMove, newId } from './_shared'

const FIELD_TYPES: IntakeFieldType[] = [
  'text',
  'textarea',
  'email',
  'url',
  'select',
  'multiselect',
  'number',
]

const NEEDS_OPTIONS: ReadonlySet<IntakeFieldType> = new Set<IntakeFieldType>(['select', 'multiselect'])

interface Props {
  template: OutcomeTemplate
  onChange: (patch: Partial<OutcomeTemplate>) => void
}

export function IntakeFormEditor({ template, onChange }: Props) {
  const fields = template.intake_schema?.fields ?? []

  function update(next: IntakeField[]) {
    const ordered = next.map((f, i) => ({ ...f, order: i + 1 }))
    const schema: IntakeSchema = { fields: ordered }
    onChange({ intake_schema: schema })
  }

  function add() {
    update([
      ...fields,
      {
        id: newId('if'),
        order: fields.length + 1,
        label: '',
        type: 'text',
        required: false,
      },
    ])
  }

  function patch(index: number, p: Partial<IntakeField>) {
    update(fields.map((f, i) => (i === index ? { ...f, ...p } : f)))
  }

  function remove(index: number) {
    update(fields.filter((_, i) => i !== index))
  }

  function move(from: number, to: number) {
    update(arrayMove(fields, from, to))
  }

  if (fields.length === 0) return <EmptyState onAdd={add} />

  return (
    <div className="space-y-4">
      <p className="text-[#94A3B8] text-xs">
        Output JSON renders inside the existing IntakeForm component on the marketplace
        detail page. Fields show in this order on the client.
      </p>

      {fields.map((f, i) => (
        <FieldCard
          key={f.id ?? f.key ?? i}
          field={f}
          index={i}
          count={fields.length}
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
        Add intake field
      </Button>

      {fields.length < 2 && (
        <p className="text-[#F59E0B] text-xs text-center">
          {2 - fields.length} more intake field{2 - fields.length === 1 ? '' : 's'} required to publish.
        </p>
      )}
    </div>
  )
}

function FieldCard({
  field,
  index,
  count,
  onChange,
  onRemove,
  onMove,
}: {
  field: IntakeField
  index: number
  count: number
  onChange: (p: Partial<IntakeField>) => void
  onRemove: (index: number) => void
  onMove: (from: number, to: number) => void
}) {
  const [option, setOption] = useState('')
  const needsOptions = NEEDS_OPTIONS.has(field.type)

  function addOption() {
    const v = option.trim()
    if (!v) return
    onChange({ options: [...(field.options ?? []), v] })
    setOption('')
  }

  function removeOption(idx: number) {
    onChange({ options: (field.options ?? []).filter((_, i) => i !== idx) })
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className="font-mono-brand text-[10px] text-[#94A3B8] mt-2.5 shrink-0">
          #{index + 1}
        </span>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-7 space-y-1">
              <label className="text-[#64748B] text-[11px] font-medium">Label</label>
              <Input
                value={field.label}
                onChange={(e) => onChange({ label: e.target.value })}
                placeholder="Repository URL"
                className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] h-9"
              />
            </div>
            <div className="col-span-3 space-y-1">
              <label className="text-[#64748B] text-[11px] font-medium">Type</label>
              <select
                value={field.type}
                onChange={(e) => {
                  const next = e.target.value as IntakeFieldType
                  // Drop options when type no longer supports them.
                  if (NEEDS_OPTIONS.has(next)) {
                    onChange({ type: next })
                  } else {
                    onChange({ type: next, options: undefined })
                  }
                }}
                className="w-full h-9 px-2 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-xs focus:border-[#7C3AED] focus:outline-none transition-colors font-mono-brand"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-1 flex flex-col">
              <label className="text-[#64748B] text-[11px] font-medium">Required</label>
              <label className="flex items-center justify-center h-9 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!field.required}
                  onChange={(e) => onChange({ required: e.target.checked })}
                  className="accent-[#7C3AED] w-4 h-4"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[#64748B] text-[11px] font-medium">Placeholder</label>
              <Input
                value={field.placeholder ?? ''}
                onChange={(e) => onChange({ placeholder: e.target.value || undefined })}
                placeholder="https://github.com/your-org/your-repo"
                className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#64748B] text-[11px] font-medium">
                Help text <span className="text-[#94A3B8] font-normal">(shown beneath)</span>
              </label>
              <Input
                value={field.help_text ?? ''}
                onChange={(e) => onChange({ help_text: e.target.value || undefined })}
                placeholder="Optional clarification"
                className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[#64748B] text-[11px] font-medium">
                maps_to <span className="text-[#94A3B8] font-normal">(L2.5)</span>
              </label>
              <Input
                value={field.maps_to ?? ''}
                onChange={(e) => onChange({ maps_to: e.target.value || undefined })}
                placeholder="engagement.repository_url"
                className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#7C3AED] h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#64748B] text-[11px] font-medium">
                Validation <span className="text-[#94A3B8] font-normal">(regex or named)</span>
              </label>
              <Input
                value={field.validation ?? ''}
                onChange={(e) => onChange({ validation: e.target.value || undefined })}
                placeholder="https?://.+"
                className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#7C3AED] h-9 text-xs"
              />
            </div>
          </div>

          {needsOptions && (
            <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
              <p className="text-[#0F172A] text-xs font-semibold">Options</p>
              <div className="flex flex-wrap gap-1.5">
                {(field.options ?? []).map((o, oi) => (
                  <span
                    key={oi}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]"
                  >
                    {o}
                    <button
                      type="button"
                      onClick={() => removeOption(oi)}
                      className="hover:text-[#EF4444] transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {(field.options ?? []).length === 0 && (
                  <span className="text-[#94A3B8] text-xs italic">No options yet</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => setOption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addOption()
                    }
                  }}
                  placeholder="Add option and press Enter"
                  className="bg-white border-[#E2E8F0] text-[#0F172A] h-8 text-xs focus:border-[#7C3AED]"
                />
                <button
                  type="button"
                  onClick={addOption}
                  disabled={!option.trim()}
                  className="text-[#7C3AED] text-xs font-semibold px-2 h-8 rounded hover:bg-[#7C3AED]/5 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          )}
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
        <FileQuestion size={20} className="text-[#7C3AED]" />
      </div>
      <h3 className="font-heading font-semibold text-[#0F172A] text-sm mb-1">
        No intake fields yet
      </h3>
      <p className="text-[#64748B] text-xs mb-4 max-w-md mx-auto">
        Intake fields are what the client fills in at purchase. Output renders inside the
        existing marketplace IntakeForm component. You need ≥2 to publish.
      </p>
      <Button
        type="button"
        onClick={onAdd}
        className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold h-9"
      >
        <Plus size={13} className="mr-1.5" />
        Add the first field
      </Button>
    </div>
  )
}
