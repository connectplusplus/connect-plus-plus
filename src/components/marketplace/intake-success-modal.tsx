'use client'

import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'

interface Props {
  pmName: string | null
  engagementId: string
  engagementRef: string
  templateTitle: string
}

// Three-step "concierge briefing" shown on intake submission. Calm, named
// humans, predictable timelines. No countdown urgency; this is a high-trust
// purchase moment.
export function IntakeSuccessModal({ pmName, engagementId, engagementRef, templateTitle }: Props) {
  const pm = pmName ?? 'Your project manager'

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 max-w-lg w-full shadow-2xl my-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} className="text-[#10B981]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-[#0F172A] text-lg leading-tight">
              Your project is in motion.
            </h3>
            <p className="text-[#94A3B8] text-xs mt-0.5">
              Reference{' '}
              <span className="font-mono-brand text-[#64748B]">{engagementRef}</span>
            </p>
          </div>
        </div>

        <ol className="space-y-4 mb-6">
          <Step
            n={1}
            timing="Within 1 business day"
            body={
              <>
                <strong className="text-[#0F172A] font-medium">{pm}</strong> is preparing a
                Statement of Work with final pricing and scope for{' '}
                <span className="text-[#0F172A]">{templateTitle}</span>. You&apos;ll get an
                email when it&apos;s ready to review.
              </>
            }
          />
          <Step
            n={2}
            timing="When you're ready"
            body={
              <>
                Review the SOW and e-sign. Takes about 5 minutes — you can ask for revisions
                before signing.
              </>
            }
          />
          <Step
            n={3}
            timing="Within 2 business days of signing"
            body={
              <>
                Schedule a kickoff call with {pm}. We&apos;ll walk through the build plan,
                configure your Glassbox Agent, and assemble your team.
              </>
            }
          />
        </ol>

        <Link
          href={`/dashboard/engagements/${engagementId}`}
          className="inline-flex items-center gap-1.5 text-[#7C3AED] text-sm font-semibold hover:underline"
        >
          Track progress on your dashboard
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}

function Step({
  n,
  timing,
  body,
}: {
  n: number
  timing: string
  body: React.ReactNode
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="font-mono-brand text-[10px] uppercase tracking-widest font-semibold text-[#7C3AED] bg-[#7C3AED]/10 rounded-full w-6 h-6 inline-flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest font-medium text-[#94A3B8] mb-0.5">
          {timing}
        </p>
        <p className="text-[#64748B] text-sm leading-relaxed">{body}</p>
      </div>
    </li>
  )
}
