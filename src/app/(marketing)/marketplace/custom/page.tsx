import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Wrench, CheckCircle2, ExternalLink, ArrowRight, Clock, DollarSign, Shield } from 'lucide-react'

const EXAMPLES = [
  {
    title: 'Enterprise AI Transformation',
    description: 'Complete AI strategy, implementation, and change management across multiple teams and business units.',
    timeline: '3–6 months',
    range: '$150K–$500K',
  },
  {
    title: 'Legacy System Modernization',
    description: 'Migrate a monolithic application to a modern, cloud-native architecture with zero downtime.',
    timeline: '4–8 months',
    range: '$200K–$750K',
  },
  {
    title: 'Product Build — Full Lifecycle',
    description: 'Design, build, and launch a complete SaaS product from concept to production with ongoing support.',
    timeline: '3–6 months',
    range: '$100K–$400K',
  },
  {
    title: 'Compliance & Security Overhaul',
    description: 'SOC2, HIPAA, or GDPR compliance implementation across your entire engineering stack.',
    timeline: '2–4 months',
    range: '$80K–$250K',
  },
]

const PROCESS = [
  { step: '01', title: 'Discovery Call', description: 'We listen to your challenge. 30-minute call with a FullStack Client Partner to understand the scope, constraints, and goals.' },
  { step: '02', title: 'Scope & Proposal', description: 'Within 48 hours, we deliver a detailed scope document with milestones, team composition, timeline, and fixed-price estimate.' },
  { step: '03', title: 'Contract & Kickoff', description: 'Sign the Glassbox service contract. Your dedicated team is assembled and work begins within one week.' },
  { step: '04', title: 'Phased Delivery', description: 'Milestone-based delivery with full transparency on the Glassbox dashboard. You pay as deliverables are accepted.' },
  { step: '05', title: 'Handoff & Warranty', description: 'Production deployment, documentation, team training, and 30-day post-delivery warranty.' },
]

export default function CustomOutcomesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <nav className="flex items-center gap-2 text-sm text-[#94A3B8] mb-10">
          <Link href="/" className="flex items-center gap-1.5 hover:text-[#0F172A] transition-colors">
            <ArrowLeft size={14} />
            Home
          </Link>
          <span>/</span>
          <span className="text-[#0F172A]">Custom Outcomes</span>
        </nav>

        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 border border-[#FB923C]/30 rounded-full px-3 py-1 mb-6">
            <Wrench size={12} className="text-[#FB923C]" />
            <span className="text-[#FB923C] text-xs font-medium">Bespoke Engagements</span>
          </div>
          <h1 className="font-heading font-bold text-4xl md:text-5xl text-[#0F172A] mb-4">
            Custom Outcomes
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed">
            When your project doesn't fit a predefined outcome, we scope it collaboratively. You bring the
            challenge — we bring the AI-native engineering team, the delivery framework, and full Glassbox
            transparency. Every custom engagement gets the same milestone tracking, daily reports, and
            quality guarantees as our productized outcomes.
          </p>
        </div>

        {/* Key benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: DollarSign, title: 'Fixed-Price Milestones', description: 'No hourly billing surprises. Every milestone is scoped and priced upfront. You pay as deliverables are accepted, with the final 25% on project completion.', color: '#10B981' },
            { icon: Clock, title: 'AI-Accelerated Delivery', description: 'Every engineer on your team ships 2–3x faster than traditional delivery. Our AI Velocity Score measures this — it\'s not marketing, it\'s instrumented.', color: '#7C3AED' },
            { icon: Shield, title: 'Full Transparency', description: 'Real-time dashboard with milestone status, daily PM reports, live codebase access, project documentation, and a direct communication channel.', color: '#3B82F6' },
          ].map((benefit) => (
            <div key={benefit.title} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${benefit.color}10` }}>
                <benefit.icon size={18} style={{ color: benefit.color }} />
              </div>
              <h3 className="font-heading font-semibold text-[#0F172A] text-base mb-2">{benefit.title}</h3>
              <p className="text-[#64748B] text-sm leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="font-heading font-bold text-2xl text-[#0F172A] mb-8">How Custom Engagements Work</h2>
          <div className="space-y-6">
            {PROCESS.map((item, i) => (
              <div key={item.step} className="flex items-start gap-5">
                <div className="w-10 h-10 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-mono-brand font-bold text-sm shrink-0">
                  {item.step}
                </div>
                <div className="pb-6 border-b border-[#E2E8F0] flex-1">
                  <h3 className="font-heading font-semibold text-[#0F172A] text-base mb-1">{item.title}</h3>
                  <p className="text-[#64748B] text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example projects */}
        <div className="mb-16">
          <h2 className="font-heading font-bold text-2xl text-[#0F172A] mb-2">Example Custom Projects</h2>
          <p className="text-[#64748B] text-sm mb-8">These are representative scopes — every custom engagement is unique.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXAMPLES.map((ex) => (
              <div key={ex.title} className="bg-white border border-[#E2E8F0] rounded-xl p-6 hover:border-[#FB923C]/30 transition-colors">
                <h3 className="font-heading font-semibold text-[#0F172A] text-base mb-2">{ex.title}</h3>
                <p className="text-[#64748B] text-sm leading-relaxed mb-4">{ex.description}</p>
                <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                  <span className="flex items-center gap-1"><Clock size={12} /> {ex.timeline}</span>
                  <span className="flex items-center gap-1"><DollarSign size={12} /> {ex.range}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-[#FB923C]/5 via-[#F97316]/5 to-[#EC4899]/5 border border-[#FB923C]/20 rounded-xl p-8 text-center">
          <h3 className="font-heading font-bold text-2xl text-[#0F172A] mb-3">Ready to discuss your project?</h3>
          <p className="text-[#64748B] text-sm mb-6 max-w-lg mx-auto">
            Schedule a 30-minute discovery call with a FullStack Client Partner. We'll understand your challenge
            and have a scoped proposal back to you within 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:new_customer@fullstacklabs.co?subject=Custom%20Outcome%20Inquiry"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#7C3AED] text-white font-semibold text-sm rounded-lg hover:bg-[#8B5CF6] transition-colors"
            >
              <ExternalLink size={13} />
              Contact FullStack to get onboarded
            </a>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#7C3AED] border border-[#7C3AED]/30 font-semibold text-sm rounded-lg hover:bg-[#7C3AED]/5 transition-colors"
            >
              Start onboarding
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
