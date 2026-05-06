'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { IconByName } from '@/components/ui/icon-by-name'
import { ICON_NAMES } from '@/lib/icons'
import { categoryLabel } from '@/lib/constants'
import type { OutcomeTemplate, OutcomeCategoryRow } from '@/lib/types'
import { Field } from './_shared'

interface Props {
  template: OutcomeTemplate
  categories: OutcomeCategoryRow[]
  onChange: (patch: Partial<OutcomeTemplate>) => void
}

export function OverviewEditor({ template, categories, onChange }: Props) {
  return (
    <div className="space-y-6">
      <Field
        label="Title"
        hint="The headline shown on the marketplace card and detail page. 8–80 chars to publish."
      >
        <Input
          value={template.title ?? ''}
          onChange={(e) => onChange({ title: e.target.value })}
          maxLength={80}
          placeholder="Automated Testing Setup"
          className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED]"
        />
        <CharCount value={template.title ?? ''} min={8} max={80} />
      </Field>

      <Field
        label="Subtitle"
        hint="One-line value prop. 20–140 chars."
        path="subtitle"
      >
        <Input
          value={template.subtitle ?? ''}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          maxLength={140}
          placeholder="Ship with confidence — full test coverage in 1–2 weeks"
          className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED]"
        />
        <CharCount value={template.subtitle ?? ''} min={20} max={140} />
      </Field>

      <Field
        label="Description"
        hint="The full marketing paragraph. Markdown is allowed. 80–600 chars."
        path="description"
      >
        <Textarea
          value={template.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={5}
          maxLength={600}
          placeholder="We analyze your codebase and build a comprehensive automated test suite — unit, integration, and end-to-end — integrated into your CI pipeline…"
          className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] resize-none"
        />
        <CharCount value={template.description ?? ''} min={80} max={600} />
      </Field>

      <Field
        label="Icon"
        hint={`Pick one of the ${ICON_NAMES.length} icons supported by the marketplace card.`}
        path="icon"
      >
        <div className="grid grid-cols-10 gap-2">
          {ICON_NAMES.map((name) => {
            const active = template.icon === name
            return (
              <button
                key={name}
                type="button"
                onClick={() => onChange({ icon: name })}
                title={name}
                className={`aspect-square rounded-lg border flex items-center justify-center transition-colors ${
                  active
                    ? 'bg-[#7C3AED]/10 border-[#7C3AED] text-[#7C3AED]'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] hover:text-[#0F172A]'
                }`}
              >
                <IconByName name={name} size={16} strokeWidth={1.5} />
              </button>
            )
          })}
        </div>
        {template.icon && (
          <p className="text-[#94A3B8] text-xs">
            Selected: <span className="font-mono-brand">{template.icon}</span>
          </p>
        )}
      </Field>

      <Field
        label="Category"
        hint="Drives the L1 catalog filter pill. Add new categories from the New Template page."
      >
        <select
          value={template.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="w-full h-10 px-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#7C3AED] focus:outline-none transition-colors appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
          }}
        >
          {categories.length === 0 ? (
            <option value={template.category}>{categoryLabel(template.category)}</option>
          ) : (
            categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))
          )}
        </select>
      </Field>
    </div>
  )
}

function CharCount({ value, min, max }: { value: string; min: number; max: number }) {
  const len = value.length
  const tooShort = len > 0 && len < min
  const tooLong = len > max
  const ok = len >= min && len <= max
  return (
    <p
      className={`font-mono-brand text-[11px] text-right ${
        ok ? 'text-[#10B981]' : tooShort || tooLong ? 'text-[#F59E0B]' : 'text-[#94A3B8]'
      }`}
    >
      {len} / {max}
      {tooShort && ` (min ${min})`}
    </p>
  )
}
