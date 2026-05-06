'use client'

import { Check, X, Clock, DollarSign } from 'lucide-react'
import { IconByName } from '@/components/ui/icon-by-name'
import { categoryColor, categoryLabel } from '@/lib/constants'
import { validateForPublish, bumpVersion } from '@/lib/configurator/validation'
import type { OutcomeTemplate } from '@/lib/types'

interface Props {
  template: OutcomeTemplate
  dirty: boolean
}

export function ReviewPublish({ template, dirty }: Props) {
  const result = validateForPublish(template)
  const nextVersion = bumpVersion(template.version ?? '1.0.0')
  const catColor = categoryColor(template.category)
  const catLabel = categoryLabel(template.category)

  const priceMin = template.pricing?.min ?? template.price_range_low
  const priceMax = template.pricing?.max ?? template.price_range_high
  const tlMin = template.timeline?.min_days ?? template.timeline_range_low
  const tlMax = template.timeline?.max_days ?? template.timeline_range_high

  return (
    <div className="space-y-6">
      {/* ── Validation panel ────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-sm text-[#0F172A]">
              Publish checklist
            </h3>
            <p className="text-[#64748B] text-xs mt-0.5">
              {result.ok
                ? `All checks pass. Next version: v${nextVersion}.`
                : `${result.errors.length} issue${result.errors.length === 1 ? '' : 's'} blocks publishing.`}
            </p>
          </div>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              result.ok
                ? 'bg-[#10B981]/10 text-[#10B981]'
                : 'bg-[#F59E0B]/10 text-[#F59E0B]'
            }`}
          >
            {result.ok ? 'Ready' : 'Not ready'}
          </span>
        </div>

        <ul className="divide-y divide-[#E2E8F0]">
          {result.passed.map((label) => (
            <li
              key={`p-${label}`}
              className="flex items-start gap-2 px-4 py-2 text-xs"
            >
              <Check size={13} className="text-[#10B981] mt-0.5 shrink-0" />
              <span className="text-[#64748B]">{label}</span>
            </li>
          ))}
          {result.errors.map((e) => (
            <li
              key={`e-${e.rule}`}
              className="flex items-start gap-2 px-4 py-2 text-xs bg-[#FEF3C7]/30"
            >
              <X size={13} className="text-[#F59E0B] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[#0F172A] font-medium">{e.rule}</p>
                {e.message !== e.rule && (
                  <p className="text-[#64748B]">{e.message}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {dirty && (
        <p className="text-[#F59E0B] text-xs">
          You have unsaved changes — save before publishing so the validator runs against the
          stored copy.
        </p>
      )}

      {/* ── L1 client-view preview ──────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E2E8F0]">
          <h3 className="font-heading font-semibold text-sm text-[#0F172A]">
            Client view preview
          </h3>
          <p className="text-[#64748B] text-xs mt-0.5">
            Approximation of what the client sees on the marketplace detail page.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] flex items-center justify-center shrink-0">
              <IconByName
                name={template.icon}
                size={22}
                strokeWidth={1.5}
                className="text-[#7C3AED]"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span
                className="inline-block text-[10px] font-medium border rounded-full px-2 py-0.5 mb-1.5"
                style={{ color: catColor, borderColor: `${catColor}40` }}
              >
                {catLabel}
              </span>
              <h2 className="font-heading font-bold text-xl text-[#0F172A] leading-tight">
                {template.title || <span className="text-[#94A3B8] italic">Untitled</span>}
              </h2>
              {template.subtitle && (
                <p className="text-[#64748B] text-sm mt-1">{template.subtitle}</p>
              )}
            </div>
          </div>

          {template.description && (
            <p className="text-[#64748B] text-sm leading-relaxed">{template.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-[#64748B]">
            {priceMin && priceMax && (
              <span className="flex items-center gap-1.5">
                <DollarSign size={12} />
                <span className="font-mono-brand">
                  ${(priceMin / 100).toLocaleString()}–${(priceMax / 100).toLocaleString()}
                </span>
              </span>
            )}
            {tlMin && tlMax && (
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                <span className="font-mono-brand">
                  {tlMin}–{tlMax} {template.timeline?.unit?.replace('_', ' ') ?? 'business days'}
                </span>
              </span>
            )}
          </div>

          {(template.deliverables ?? []).length > 0 && (
            <PreviewSection title="What's included">
              <ul className="space-y-1.5">
                {(template.deliverables ?? []).map((d) => (
                  <li key={d.id} className="flex items-start gap-2 text-xs">
                    <Check size={12} className="text-[#7C3AED] mt-0.5 shrink-0" />
                    <span className="text-[#64748B]">
                      {d.name || <span className="italic">Unnamed deliverable</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </PreviewSection>
          )}

          {(template.milestone_templates ?? []).length > 0 && (
            <PreviewSection title="How it unfolds">
              <ul className="space-y-2">
                {(template.milestone_templates ?? []).map((m) => (
                  <li key={m.id} className="text-xs">
                    <p className="font-medium text-[#0F172A]">
                      {m.name || <span className="italic text-[#94A3B8]">Unnamed</span>}{' '}
                      <span className="text-[#94A3B8] font-normal">
                        · {m.duration?.fixed_label ?? `${m.duration?.min_days}–${m.duration?.max_days} days`}
                      </span>
                    </p>
                    {m.description && (
                      <p className="text-[#64748B] mt-0.5">{m.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </PreviewSection>
          )}

          {(template.guarantees ?? []).length > 0 && (
            <PreviewSection title="Guarantees">
              <div className="flex flex-wrap gap-2">
                {(template.guarantees ?? []).map((g) => (
                  <span
                    key={g.id}
                    className="inline-flex items-center gap-1.5 text-xs text-[#0F172A] bg-[#F1F5F9] px-2.5 py-1 rounded-lg"
                  >
                    <IconByName
                      name={g.icon}
                      size={12}
                      strokeWidth={1.5}
                      className="text-[#7C3AED]"
                    />
                    {g.label}
                  </span>
                ))}
              </div>
            </PreviewSection>
          )}
        </div>
      </div>
    </div>
  )
}

function PreviewSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2 pt-3 border-t border-[#F1F5F9]">
      <p className="text-[10px] uppercase tracking-widest font-medium text-[#94A3B8]">
        {title}
      </p>
      {children}
    </div>
  )
}
