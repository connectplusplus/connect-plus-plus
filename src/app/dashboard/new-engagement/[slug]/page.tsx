import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { OutcomeTemplate } from '@/lib/types'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/constants'
import { IntakeForm } from '@/components/marketplace/intake-form'
import { ScopeEstimateSticky } from './scope-estimate-sticky'
import { CheckCircle2, Clock, ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function DashboardNewEngagementDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: template, error } = await supabase
    .from('outcome_templates')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !template) notFound()

  const { data: userProfile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const t = template as OutcomeTemplate
  const categoryColor = CATEGORY_COLORS[t.category]
  const categoryLabel = CATEGORY_LABELS[t.category]

  const timelineSteps = [
    { phase: 'Intake & Scoping', days: '1–2 days', description: 'PM reviews your responses and confirms scope' },
    { phase: 'Kickoff', days: 'Day 3', description: 'Engineering team assembles and work begins' },
    { phase: 'Build Phase', days: `${t.timeline_range_low ?? 5}–${(t.timeline_range_high ?? 10) - 3} days`, description: 'Core development with daily progress updates' },
    { phase: 'Review & Polish', days: '2–3 days', description: 'QA pass, revisions, and final testing' },
    { phase: 'Delivery & Handoff', days: 'Final day', description: 'Deployment, documentation, and 30-day warranty begins' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-8">
        <Link
          href="/dashboard/new-engagement"
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          New Engagement
        </Link>
        <span>/</span>
        <span className="text-white">{t.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* ── Left column ─────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-10">
          <div>
            <div
              className="inline-flex items-center gap-2 border rounded-full px-3 py-1 mb-4 text-xs font-medium"
              style={{ color: categoryColor, borderColor: `${categoryColor}40` }}
            >
              {categoryLabel}
            </div>
            <h1 className="font-heading font-bold text-4xl text-white mb-3">{t.title}</h1>
            {t.subtitle && <p className="text-[#9CA3AF] text-xl">{t.subtitle}</p>}
          </div>

          <p className="text-[#9CA3AF] text-base leading-relaxed">{t.description}</p>

          <div>
            <h2 className="font-heading font-semibold text-xl text-white mb-5">
              What&apos;s Included
            </h2>
            <div className="space-y-3">
              {(t.features ?? []).map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-[#A6F84C] shrink-0 mt-0.5" strokeWidth={2} />
                  <span className="text-[#9CA3AF] text-sm leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>
          </div>

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
                        i === 0 ? 'bg-[#A6F84C]' : 'bg-[#16161C] border-2 border-[#2A2A30]'
                      }`}
                    >
                      {i === 0 && <div className="w-2 h-2 rounded-full bg-[#0B0B0F]" />}
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

          <div id="intake-form" className="pt-4 border-t border-[#2A2A30]">
            <h2 className="font-heading font-semibold text-2xl text-white mb-2">
              Start this project
            </h2>
            <p className="text-[#9CA3AF] text-sm mb-8">
              Fill out the intake form below. Your PM will review your scope within 24 hours.
            </p>
            <IntakeForm template={t} companyId={userProfile?.company_id ?? undefined} />
          </div>
        </div>

        {/* ── Right column — sticky pricing card ───────────────────────────────── */}
        <div className="lg:col-span-2">
          <ScopeEstimateSticky template={t} />
        </div>
      </div>
    </div>
  )
}
