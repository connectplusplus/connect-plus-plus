import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { OutcomeTemplate } from '@/lib/types'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/constants'
import { OutcomeDetailClient } from './outcome-detail-client'
import type { Metadata } from 'next'
import { CheckCircle2, Clock } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('outcome_templates')
    .select('title, subtitle')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Outcome — Glassbox' }
  return {
    title: `${data.title} — Glassbox`,
    description: data.subtitle ?? undefined,
  }
}

export default async function OutcomeDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: template, error } = await supabase
    .from('outcome_templates')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !template) {
    notFound()
  }

  const t = template as OutcomeTemplate
  const categoryColor = CATEGORY_COLORS[t.category]
  const categoryLabel = CATEGORY_LABELS[t.category]

  // Build timeline steps from timeline range
  const timelineSteps = [
    { phase: 'Intake & Scoping', days: '1–2 days', description: 'PM reviews your responses and confirms scope' },
    { phase: 'Kickoff', days: 'Day 3', description: 'Engineering team assembles and work begins' },
    { phase: 'Build Phase', days: `${t.timeline_range_low ?? 5}–${(t.timeline_range_high ?? 10) - 3} days`, description: 'Core development with daily progress updates' },
    { phase: 'Review & Polish', days: '2–3 days', description: 'QA pass, revisions, and final testing' },
    { phase: 'Delivery & Handoff', days: 'Final day', description: 'Deployment, documentation, and 30-day warranty begins' },
  ]

  return (
    <div className="min-h-screen bg-[#0B0B0F]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* ── Left column (60%) ──────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-10">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-[#6B7280]">
              <a href="/marketplace/outcomes" className="hover:text-white transition-colors">
                Outcomes
              </a>
              <span>/</span>
              <span className="text-white">{t.title}</span>
            </nav>

            {/* Header */}
            <div>
              <div
                className="inline-flex items-center gap-2 border rounded-full px-3 py-1 mb-4 text-xs font-medium"
                style={{ color: categoryColor, borderColor: `${categoryColor}40` }}
              >
                {categoryLabel}
              </div>
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-white mb-3">
                {t.title}
              </h1>
              {t.subtitle && (
                <p className="text-[#9CA3AF] text-xl">{t.subtitle}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-[#9CA3AF] text-base leading-relaxed">{t.description}</p>
            </div>

            {/* What's Included */}
            <div>
              <h2 className="font-heading font-semibold text-xl text-white mb-5">
                What&apos;s Included
              </h2>
              <div className="space-y-3">
                {(t.features ?? []).map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2
                      size={16}
                      className="text-[#A6F84C] shrink-0 mt-0.5"
                      strokeWidth={2}
                    />
                    <span className="text-[#9CA3AF] text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline visualization */}
            <div>
              <h2 className="font-heading font-semibold text-xl text-white mb-5">
                How it unfolds
              </h2>
              <div className="relative">
                <div className="absolute left-[11px] top-4 bottom-4 w-px bg-[#2A2A30]" />
                <div className="space-y-6">
                  {timelineSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-4 relative">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                          i === 0
                            ? 'bg-[#A6F84C]'
                            : 'bg-[#16161C] border-2 border-[#2A2A30]'
                        }`}
                      >
                        {i === 0 && (
                          <div className="w-2 h-2 rounded-full bg-[#0B0B0F]" />
                        )}
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-white font-medium text-sm">{step.phase}</span>
                          <span className="flex items-center gap-1 text-[#6B7280] text-xs">
                            <Clock size={11} strokeWidth={1.5} />
                            {step.days}
                          </span>
                        </div>
                        <p className="text-[#9CA3AF] text-sm">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Intake form — rendered client-side */}
            <div id="intake-form" className="pt-4 border-t border-[#2A2A30]">
              <h2 className="font-heading font-semibold text-2xl text-white mb-2">
                Start this project
              </h2>
              <p className="text-[#9CA3AF] text-sm mb-8">
                Fill out the intake form below. Our AI PM will review your scope within 24 hours
                and follow up with questions.
              </p>
              <OutcomeDetailClient template={t} />
            </div>
          </div>

          {/* ── Right column (40%) — sticky pricing card ──────────────────── */}
          <div className="lg:col-span-2">
            <OutcomeDetailClient template={t} pricingOnly />
          </div>
        </div>
      </div>
    </div>
  )
}
