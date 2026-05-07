'use client'

// The form column of the SOW editor. Mutates a SowContent draft via
// onChange. Renders an AI-drafted pill next to each field label whose
// dot-path is in `aiDraftedFields`; clicking the pill calls
// onDismissAi(path).
//
// The form is deliberately structural: scope, deliverables, milestones,
// pricing, timeline, terms. Validation is light — the action layer
// re-validates before send-for-legal-review.

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AiDraftedPill } from '@/components/sow/ai-drafted-pill'
import type { SowContent, SowDeliverable, SowMilestone } from '@/lib/types'

interface Props {
  content: SowContent
  onChange: (next: SowContent) => void
  aiDraftedFields: string[]
  onDismissAi: (path: string) => void
  disabled?: boolean
}

export function SowFormFields({
  content,
  onChange,
  aiDraftedFields,
  onDismissAi,
  disabled,
}: Props) {
  const isAi = (path: string) => aiDraftedFields.includes(path)

  function patch(part: Partial<SowContent>) {
    onChange({ ...content, ...part })
  }

  // Deliverables ──────────────────────────────────────────────────────
  function patchDeliverable(idx: number, p: Partial<SowDeliverable>) {
    const next = content.deliverables.map((d, i) => (i === idx ? { ...d, ...p } : d))
    patch({ deliverables: next })
  }

  function addDeliverable() {
    patch({
      deliverables: [
        ...content.deliverables,
        { name: '', description: '', acceptance_criteria: [''] },
      ],
    })
  }

  function removeDeliverable(idx: number) {
    patch({ deliverables: content.deliverables.filter((_, i) => i !== idx) })
  }

  // Milestones ────────────────────────────────────────────────────────
  function patchMilestone(idx: number, p: Partial<SowMilestone>) {
    const next = content.milestones.map((m, i) => (i === idx ? { ...m, ...p } : m))
    patch({ milestones: next })
  }

  function addMilestone() {
    patch({
      milestones: [
        ...content.milestones,
        { name: '', description: '', payment_pct: 0, expected_business_days: 1 },
      ],
    })
  }

  function removeMilestone(idx: number) {
    patch({ milestones: content.milestones.filter((_, i) => i !== idx) })
  }

  const milestonePctSum = content.milestones.reduce(
    (s, m) => s + (Number.isFinite(m.payment_pct) ? m.payment_pct : 0),
    0
  )

  return (
    <div className="space-y-7">
      {/* ── Scope summary ─────────────────────────────────────────── */}
      <Section
        title="Scope summary"
        path="scope_summary"
        isAi={isAi('scope_summary')}
        onDismissAi={onDismissAi}
      >
        <Textarea
          value={content.scope_summary}
          onChange={(e) => patch({ scope_summary: e.target.value })}
          placeholder="2–4 short paragraphs. Name the work, explain how it proceeds, point at deliverables and milestones below."
          rows={6}
          disabled={disabled}
          className="bg-[#FAF8F4] border-[#7E8B6A]/30 text-[#1F2A1A] focus:border-[#7E8B6A] resize-y text-sm leading-relaxed"
        />
      </Section>

      {/* ── Deliverables ──────────────────────────────────────────── */}
      <Section
        title="Deliverables"
        path="deliverables"
        isAi={isAi('deliverables')}
        onDismissAi={onDismissAi}
        afterTitle={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addDeliverable}
            disabled={disabled}
            className="text-[#5C6B4D] hover:text-[#1F2A1A] hover:bg-[#7E8B6A]/10 h-7"
          >
            <Plus size={12} className="mr-1" />
            Add deliverable
          </Button>
        }
      >
        <div className="space-y-3">
          {content.deliverables.length === 0 && (
            <p className="text-[#7E8B6A] text-xs italic">
              No deliverables yet. Click &ldquo;Add deliverable&rdquo; to start, or generate a first
              draft above.
            </p>
          )}
          {content.deliverables.map((d, i) => (
            <div
              key={i}
              className="bg-[#FAF8F4] border border-[#7E8B6A]/20 rounded-lg p-3 space-y-2"
            >
              <div className="flex gap-2">
                <Input
                  value={d.name}
                  onChange={(e) => patchDeliverable(i, { name: e.target.value })}
                  placeholder="Deliverable name"
                  disabled={disabled}
                  className="bg-white border-[#7E8B6A]/30 text-[#1F2A1A] focus:border-[#7E8B6A] text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeDeliverable(i)}
                  disabled={disabled}
                  className="text-[#94A3B8] hover:text-[#B91C1C] px-2"
                  aria-label="Remove deliverable"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <Textarea
                value={d.description}
                onChange={(e) => patchDeliverable(i, { description: e.target.value })}
                placeholder="One or two sentences"
                rows={2}
                disabled={disabled}
                className="bg-white border-[#7E8B6A]/30 text-[#1F2A1A] focus:border-[#7E8B6A] resize-none text-xs"
              />
              <div>
                <p className="text-[11px] uppercase tracking-widest font-semibold text-[#5C6B4D] mb-1.5">
                  Acceptance criteria
                </p>
                <div className="space-y-1.5">
                  {d.acceptance_criteria.map((ac, j) => (
                    <div key={j} className="flex gap-2 items-center">
                      <Input
                        value={ac}
                        onChange={(e) => {
                          const next = d.acceptance_criteria.map((v, k) =>
                            k === j ? e.target.value : v
                          )
                          patchDeliverable(i, { acceptance_criteria: next })
                        }}
                        placeholder="Verifiable, binary, client-readable"
                        disabled={disabled}
                        className="bg-white border-[#7E8B6A]/30 text-[#1F2A1A] focus:border-[#7E8B6A] text-xs h-8"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          patchDeliverable(i, {
                            acceptance_criteria: d.acceptance_criteria.filter((_, k) => k !== j),
                          })
                        }
                        disabled={disabled}
                        className="text-[#94A3B8] hover:text-[#B91C1C]"
                        aria-label="Remove acceptance criterion"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      patchDeliverable(i, {
                        acceptance_criteria: [...d.acceptance_criteria, ''],
                      })
                    }
                    disabled={disabled}
                    className="text-[#5C6B4D] text-[11px] font-semibold hover:text-[#1F2A1A]"
                  >
                    + Add criterion
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Milestones ────────────────────────────────────────────── */}
      <Section
        title="Milestones"
        path="milestones"
        isAi={isAi('milestones')}
        onDismissAi={onDismissAi}
        afterTitle={
          <div className="flex items-center gap-3">
            <span
              className={`text-[11px] font-mono ${
                milestonePctSum === 100 ? 'text-[#5C6B4D]' : 'text-[#B91C1C]'
              }`}
            >
              Payment pct sum: {milestonePctSum}%
              {milestonePctSum !== 100 && ' · should equal 100'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addMilestone}
              disabled={disabled}
              className="text-[#5C6B4D] hover:text-[#1F2A1A] hover:bg-[#7E8B6A]/10 h-7"
            >
              <Plus size={12} className="mr-1" />
              Add milestone
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          {content.milestones.length === 0 && (
            <p className="text-[#7E8B6A] text-xs italic">No milestones yet.</p>
          )}
          {content.milestones.map((m, i) => (
            <div
              key={i}
              className="bg-[#FAF8F4] border border-[#7E8B6A]/20 rounded-lg p-3 grid grid-cols-12 gap-2 items-start"
            >
              <Input
                value={m.name}
                onChange={(e) => patchMilestone(i, { name: e.target.value })}
                placeholder="Name"
                disabled={disabled}
                className="col-span-4 bg-white border-[#7E8B6A]/30 text-[#1F2A1A] focus:border-[#7E8B6A] text-sm"
              />
              <Input
                value={m.description}
                onChange={(e) => patchMilestone(i, { description: e.target.value })}
                placeholder="One sentence"
                disabled={disabled}
                className="col-span-5 bg-white border-[#7E8B6A]/30 text-[#1F2A1A] focus:border-[#7E8B6A] text-sm"
              />
              <div className="col-span-1">
                <label className="block text-[10px] text-[#5C6B4D] mb-0.5">Days</label>
                <Input
                  type="number"
                  min={0}
                  value={m.expected_business_days}
                  onChange={(e) =>
                    patchMilestone(i, { expected_business_days: Number(e.target.value) })
                  }
                  disabled={disabled}
                  className="bg-white border-[#7E8B6A]/30 text-[#1F2A1A] focus:border-[#7E8B6A] font-mono text-xs h-8 px-1.5"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] text-[#5C6B4D] mb-0.5">Pay %</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={m.payment_pct}
                  onChange={(e) => patchMilestone(i, { payment_pct: Number(e.target.value) })}
                  disabled={disabled}
                  className="bg-white border-[#7E8B6A]/30 text-[#1F2A1A] focus:border-[#7E8B6A] font-mono text-xs h-8 px-1.5"
                />
              </div>
              <button
                type="button"
                onClick={() => removeMilestone(i)}
                disabled={disabled}
                className="col-span-1 text-[#94A3B8] hover:text-[#B91C1C] mt-5"
                aria-label="Remove milestone"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Pricing ───────────────────────────────────────────────── */}
      <Section
        title="Pricing"
        path="pricing"
        isAi={isAi('pricing')}
        onDismissAi={onDismissAi}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-semibold text-[#5C6B4D] mb-1">
              Total (USD)
            </label>
            <Input
              type="number"
              min={0}
              step={500}
              value={(content.pricing?.total_cents ?? 0) / 100}
              onChange={(e) =>
                patch({
                  pricing: {
                    ...content.pricing,
                    currency: 'USD',
                    total_cents: Math.round(Number(e.target.value) * 100),
                    payment_terms_md: content.pricing?.payment_terms_md ?? '',
                  },
                })
              }
              disabled={disabled}
              className="bg-[#FAF8F4] border-[#7E8B6A]/30 text-[#1F2A1A] focus:border-[#7E8B6A] font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-semibold text-[#5C6B4D] mb-1">
              Currency
            </label>
            <Input
              value="USD"
              disabled
              className="bg-[#FAF8F4]/50 border-[#7E8B6A]/30 text-[#7E8B6A] font-mono text-sm"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-[11px] uppercase tracking-widest font-semibold text-[#5C6B4D] mb-1">
            Payment terms
          </label>
          <Textarea
            value={content.pricing?.payment_terms_md ?? ''}
            onChange={(e) =>
              patch({
                pricing: {
                  ...content.pricing,
                  currency: 'USD',
                  total_cents: content.pricing?.total_cents ?? 0,
                  payment_terms_md: e.target.value,
                },
              })
            }
            placeholder="**Schedule.** Invoices on milestone close. **Net.** Net 15. **Method.** ACH or wire."
            rows={3}
            disabled={disabled}
            className="bg-[#FAF8F4] border-[#7E8B6A]/30 text-[#1F2A1A] focus:border-[#7E8B6A] resize-none text-xs leading-relaxed"
          />
        </div>
      </Section>

      {/* ── Timeline ──────────────────────────────────────────────── */}
      <Section
        title="Timeline"
        path="timeline_business_days"
        isAi={isAi('timeline_business_days')}
        onDismissAi={onDismissAi}
      >
        <div className="flex items-baseline gap-2">
          <Input
            type="number"
            min={0}
            value={content.timeline_business_days || 0}
            onChange={(e) => patch({ timeline_business_days: Number(e.target.value) })}
            disabled={disabled}
            className="w-24 bg-[#FAF8F4] border-[#7E8B6A]/30 text-[#1F2A1A] focus:border-[#7E8B6A] font-mono text-sm"
          />
          <span className="text-[#3D4A33] text-sm">business days, kickoff to handoff</span>
        </div>
      </Section>

      {/* ── Terms ─────────────────────────────────────────────────── */}
      <Section
        title="Terms (markdown)"
        path="terms_md"
        isAi={isAi('terms_md')}
        onDismissAi={onDismissAi}
      >
        <Textarea
          value={content.terms_md}
          onChange={(e) => patch({ terms_md: e.target.value })}
          placeholder="**Change requests.** ... **IP.** ... **Warranty.** 30 days. **Confidentiality.** ..."
          rows={5}
          disabled={disabled}
          className="bg-[#FAF8F4] border-[#7E8B6A]/30 text-[#1F2A1A] focus:border-[#7E8B6A] resize-y text-xs leading-relaxed"
        />
      </Section>
    </div>
  )
}

function Section({
  title,
  path,
  isAi,
  onDismissAi,
  afterTitle,
  children,
}: {
  title: string
  path: string
  isAi: boolean
  onDismissAi: (path: string) => void
  afterTitle?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <header className="flex items-center justify-between mb-2">
        <h3 className="text-[12px] uppercase tracking-widest font-semibold text-[#1F2A1A] flex items-center">
          {title}
          <AiDraftedPill active={isAi} onDismiss={() => onDismissAi(path)} />
        </h3>
        {afterTitle}
      </header>
      {children}
    </section>
  )
}
