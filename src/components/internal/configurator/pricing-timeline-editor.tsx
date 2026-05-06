'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { OutcomeTemplate, PricingSpec, TimelineSpec } from '@/lib/types'
import { Field } from './_shared'
import { AISuggestedBadge } from './ai-suggested-context'

// Pricing is stored in cents (matching the legacy price_range_low/high columns).
// The editor surfaces dollars for legibility and converts on the way in/out.
const dollarsToCents = (d: string) => {
  const n = Number(d.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100)
}
const centsToDollars = (c: number | undefined) =>
  c === undefined || c === null ? '' : (c / 100).toString()

interface Props {
  template: OutcomeTemplate
  onChange: (patch: Partial<OutcomeTemplate>) => void
}

export function PricingTimelineEditor({ template, onChange }: Props) {
  const pricing: PricingSpec = template.pricing ?? {}
  const timeline: TimelineSpec = template.timeline ?? {}

  // Hydrate from legacy scalar columns when the jsonb is empty.
  const pricingMin = pricing.min ?? template.price_range_low ?? undefined
  const pricingMax = pricing.max ?? template.price_range_high ?? undefined
  const timelineMin = timeline.min_days ?? template.timeline_range_low ?? undefined
  const timelineMax = timeline.max_days ?? template.timeline_range_high ?? undefined

  function patchPricing(p: Partial<PricingSpec>) {
    const next = { ...pricing, ...p, currency: 'USD' as const }
    onChange({
      pricing: next,
      // keep the legacy scalar columns in sync — Phase 4.2 spec requirement
      price_range_low: next.min ?? null,
      price_range_high: next.max ?? null,
    })
  }

  function patchTimeline(p: Partial<TimelineSpec>) {
    const next = { ...timeline, ...p }
    onChange({
      timeline: next,
      timeline_range_low: next.min_days ?? null,
      timeline_range_high: next.max_days ?? null,
    })
  }

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <h2 className="font-heading font-semibold text-base text-[#0F172A]">
          Pricing
          <AISuggestedBadge path="pricing" />
        </h2>

        <Field label="Pricing model" hint="Drives how the price range shows on the marketplace card.">
          <select
            value={pricing.model ?? 'fixed_range'}
            onChange={(e) => patchPricing({ model: e.target.value as PricingSpec['model'] })}
            className="w-full h-10 px-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#7C3AED] focus:outline-none transition-colors appearance-none"
            style={selectArrow}
          >
            <option value="fixed_range">Fixed range — “$X–$Y”</option>
            <option value="starting_at">Starting at — “from $X”</option>
            <option value="custom">Custom — quoted per engagement</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Min (USD)" hint="Lower bound of the range.">
            <Input
              type="text"
              inputMode="decimal"
              value={centsToDollars(pricingMin)}
              onChange={(e) => patchPricing({ min: dollarsToCents(e.target.value) })}
              placeholder="8000"
              className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#7C3AED]"
            />
          </Field>
          <Field label="Max (USD)" hint="Upper bound of the range.">
            <Input
              type="text"
              inputMode="decimal"
              value={centsToDollars(pricingMax)}
              onChange={(e) => patchPricing({ max: dollarsToCents(e.target.value) })}
              placeholder="20000"
              className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#7C3AED]"
            />
          </Field>
        </div>

        <Field label="Notes" hint="Optional caveat shown alongside the range, e.g. “Fixed price — no scope creep.”">
          <Input
            value={pricing.notes ?? ''}
            onChange={(e) => patchPricing({ notes: e.target.value })}
            placeholder="Fixed price — no scope creep surprises"
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED]"
          />
        </Field>
      </section>

      <section className="space-y-5 pt-2 border-t border-[#E2E8F0]">
        <h2 className="font-heading font-semibold text-base text-[#0F172A] pt-4">
          Timeline
          <AISuggestedBadge path="timeline" />
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Min days">
            <Input
              type="number"
              min={1}
              value={timelineMin ?? ''}
              onChange={(e) => patchTimeline({ min_days: Number(e.target.value) || undefined })}
              placeholder="5"
              className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#7C3AED]"
            />
          </Field>
          <Field label="Max days">
            <Input
              type="number"
              min={1}
              value={timelineMax ?? ''}
              onChange={(e) => patchTimeline({ max_days: Number(e.target.value) || undefined })}
              placeholder="10"
              className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#7C3AED]"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Unit">
            <select
              value={timeline.unit ?? 'business_days'}
              onChange={(e) => patchTimeline({ unit: e.target.value as TimelineSpec['unit'] })}
              className="w-full h-10 px-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#7C3AED] focus:outline-none transition-colors appearance-none"
              style={selectArrow}
            >
              <option value="business_days">Business days</option>
              <option value="calendar_days">Calendar days</option>
              <option value="weeks">Weeks</option>
            </select>
          </Field>
          <Field label="Starts from">
            <select
              value={timeline.starts_from ?? 'kickoff'}
              onChange={(e) => patchTimeline({ starts_from: e.target.value as TimelineSpec['starts_from'] })}
              className="w-full h-10 px-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#7C3AED] focus:outline-none transition-colors appearance-none"
              style={selectArrow}
            >
              <option value="kickoff">Kickoff</option>
              <option value="contract_signed">Contract signed</option>
              <option value="intake_completed">Intake completed</option>
            </select>
          </Field>
        </div>

        <Field label="Notes" hint="Shown beneath the timeline range on the marketplace detail page.">
          <Textarea
            value={timeline.notes ?? ''}
            onChange={(e) => patchTimeline({ notes: e.target.value })}
            placeholder="Business days from kickoff"
            rows={2}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] resize-none"
          />
        </Field>
      </section>
    </div>
  )
}

const selectArrow = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat' as const,
  backgroundPosition: 'right 12px center',
}
