import Link from 'next/link'
import {
  ArrowRight,
  Zap,
  Users,
  Package,
  Wrench,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  return (
    <div className="bg-[#0B0B0F] text-white">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#A6F84C 1px, transparent 1px), linear-gradient(90deg, #A6F84C 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#A6F84C] opacity-[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 border border-[#2A2A30] bg-[#16161C] rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-[#A6F84C] rounded-full animate-pulse" />
              <span className="text-[#A6F84C] text-xs font-semibold tracking-wide uppercase">
                The future of engineering services is here
              </span>
            </div>

            <h1 className="font-heading font-bold text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6">
              Engineering outcomes,
              <br />
              <span className="text-[#A6F84C]">not headcount.</span>
            </h1>

            <p className="text-[#9CA3AF] text-lg md:text-xl leading-relaxed max-w-2xl mb-10">
              Glassbox by FullStack is a revolutionary platform that transforms traditional
              engineering services engagements into transparent, AI-powered outcomes. This is the
              future of sourcing.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/marketplace/outcomes">
                <Button
                  size="lg"
                  className="bg-[#A6F84C] text-[#0B0B0F] hover:bg-[#BCFF6E] font-semibold text-base px-8 h-12 w-52 transition-colors duration-150"
                >
                  Browse Outcomes
                </Button>
              </Link>
              <span className="text-[#6B7280] text-sm font-medium uppercase tracking-wide">or</span>
              <Link href="/marketplace/talent">
                <Button
                  size="lg"
                  className="bg-[#0B0B0F] text-[#A6F84C] border border-[#A6F84C] hover:bg-[#A6F84C]/10 font-semibold text-base px-8 h-12 w-52 transition-colors duration-150"
                >
                  Explore Talent
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>



      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section className="bg-[#1E1E24] py-24">
        <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[#A6F84C] text-sm font-semibold tracking-widest uppercase mb-4">
            The Engineering Services Industry, redefined as a software platform
          </p>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-4">
            How Glassbox Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Scope Your Need',
              description:
                'Answer a short intake questionnaire. Our AI generates a scope draft in minutes, not weeks.',
              icon: '🎯',
            },
            {
              step: '02',
              title: 'We Build Using the World\'s Best AI',
              description:
                'AI-accelerated engineers ship 2–3x faster than traditional teams without compromising quality.',
              icon: '🚀',
            },
            {
              step: '03',
              title: 'You Track Everything',
              description:
                'Real-time milestone tracking, a shared message thread, and live status — complete transparency.',
              icon: '📊',
            },
          ].map((item, i) => (
            <div key={i} className="relative">
              {i < 2 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-[#3A3A42] to-transparent z-10" />
              )}
              <div className="bg-[#2A2A32] border border-[#3A3A42] rounded-xl p-6 h-full hover:border-[#A6F84C]/30 transition-colors duration-150">
                <div className="text-2xl mb-3">{item.icon}</div>
                <div className="text-[#A6F84C] font-mono-brand text-xs font-medium mb-2 tracking-wider">
                  {item.step}
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-[#B0B0B8] text-sm leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ── The Four Modes ──────────────────────────────────────────────────── */}
      <section className="section-padding bg-[#111116]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
              Four ways to get work done
            </h2>
            <p className="text-[#9CA3AF] text-lg max-w-xl mx-auto">
              Every team is different. Choose the procurement mode that fits your project.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Talent */}
            <Link href="/marketplace/talent" className="group block">
              <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-8 h-full hover:border-[#A78BFA]/40 hover:-translate-y-0.5 transition-all duration-150">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#1E1E24] flex items-center justify-center">
                    <Users size={22} className="text-[#A78BFA]" strokeWidth={1.5} />
                  </div>
                  <span
                    className="text-xs font-medium border rounded-full px-2.5 py-1"
                    style={{ color: '#A78BFA', borderColor: '#A78BFA40' }}
                  >
                    Talent
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-xl mb-3">Individual Talent</h3>
                <p className="text-[#9CA3AF] text-sm leading-relaxed mb-6">
                  Hire a single AI-accelerated engineer — full-stack, mobile, ML, or DevOps — and
                  embed them directly with your team. Every engineer comes with an AI Velocity Score.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {['React', 'Node.js', 'Python', 'Go', 'iOS', 'DevOps'].map((s) => (
                    <span key={s} className="text-xs bg-[#1E1E24] text-[#9CA3AF] rounded px-2 py-1">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center text-[#A6F84C] text-sm font-semibold group-hover:gap-2 gap-1 transition-all duration-150">
                  Explore engineers <ChevronRight size={14} />
                </div>
              </div>
            </Link>

            {/* Predefined Outcomes */}
            <Link href="/marketplace/outcomes" className="group block">
              <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-8 h-full hover:border-[#A6F84C]/40 hover:-translate-y-0.5 transition-all duration-150">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#1E1E24] flex items-center justify-center">
                    <Package size={22} className="text-[#A6F84C]" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-medium border rounded-full px-2.5 py-1 text-[#A6F84C] border-[#A6F84C40]">
                    Outcomes
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-xl mb-3">Predefined Outcomes</h3>
                <p className="text-[#9CA3AF] text-sm leading-relaxed mb-6">
                  Productized services at fixed prices. MVP Sprint, CI/CD Pipeline, Automated
                  Testing — scoped, priced, and timelines defined upfront. No surprises.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {['MVP Sprint', 'CI/CD Pipeline', 'Test Coverage', 'Perf Audit'].map((s) => (
                    <span key={s} className="text-xs bg-[#1E1E24] text-[#9CA3AF] rounded px-2 py-1">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center text-[#A6F84C] text-sm font-semibold group-hover:gap-2 gap-1 transition-all duration-150">
                  Browse outcomes <ChevronRight size={14} />
                </div>
              </div>
            </Link>

            {/* Pods — coming soon */}
            <div className="relative group block">
              <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-8 h-full opacity-60">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#1E1E24] flex items-center justify-center">
                    <Zap size={22} className="text-[#F472B6]" strokeWidth={1.5} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium border rounded-full px-2.5 py-1 text-[#F472B6] border-[#F472B640]">
                      Pods
                    </span>
                    <Badge className="bg-[#1E1E24] text-[#6B7280] border border-[#2A2A30] text-xs">
                      Coming Soon
                    </Badge>
                  </div>
                </div>
                <h3 className="font-heading font-semibold text-xl mb-3">Pods</h3>
                <p className="text-[#9CA3AF] text-sm leading-relaxed">
                  Cross-functional teams — engineering, design, PM — assembled for your project.
                  Full product teams on demand, fully AI-accelerated.
                </p>
              </div>
            </div>

            {/* Custom Outcomes — coming soon */}
            <div className="relative group block">
              <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-8 h-full opacity-60">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#1E1E24] flex items-center justify-center">
                    <Wrench size={22} className="text-[#FB923C]" strokeWidth={1.5} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium border rounded-full px-2.5 py-1 text-[#FB923C] border-[#FB923C40]">
                      Custom
                    </span>
                    <Badge className="bg-[#1E1E24] text-[#6B7280] border border-[#2A2A30] text-xs">
                      Coming Soon
                    </Badge>
                  </div>
                </div>
                <h3 className="font-heading font-semibold text-xl mb-3">Custom Outcomes</h3>
                <p className="text-[#9CA3AF] text-sm leading-relaxed">
                  Bring your own spec. Our AI PM works with you to define scope, timeline, and price
                  — then assembles the right team to execute it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why FullStack ────────────────────────────────────────────────────── */}
      <section className="section-padding max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6">
              The AI-native difference
            </h2>
            <p className="text-[#9CA3AF] text-lg leading-relaxed mb-8">
              Every engineer on Glassbox works with AI as a core part of their workflow. Not as a
              gimmick — as a force multiplier. The result: faster delivery, lower cost, higher
              quality.
            </p>
            <ul className="space-y-4">
              {[
                'AI Velocity Scores on every engineer profile (1.8x – 2.7x)',
                'Real-time milestone tracking — no status-update theater',
                'Fixed prices on Predefined Outcomes — no scope creep surprises',
                '30-day post-delivery warranty on all outcome engagements',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-[#A6F84C] mt-0.5 shrink-0" strokeWidth={2} />
                  <span className="text-[#9CA3AF] text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Average velocity multiplier', value: '2.3x', sub: 'vs traditional engineering' },
              { label: 'Outcome engagements shipped', value: '1,200+', sub: 'across 47 categories' },
              { label: 'Client satisfaction', value: '4.9/5', sub: 'across 600+ companies' },
              { label: 'Faster time to first ship', value: '60%', sub: 'vs traditional procurement' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-6">
                <div className="font-mono-brand font-semibold text-3xl text-[#A6F84C] mb-1">
                  {stat.value}
                </div>
                <div className="text-white text-sm font-medium mb-1">{stat.label}</div>
                <div className="text-[#6B7280] text-xs">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ──────────────────────────────────────────────────────── */}
      <section className="section-padding bg-[#111116] border-t border-[#2A2A30]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-heading font-bold text-4xl md:text-5xl mb-6">
            Ready to ship faster?
          </h2>
          <p className="text-[#9CA3AF] text-lg mb-10">
            Join 600+ companies that have switched from traditional outsourcing to AI-native
            engineering outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-[#A6F84C] text-[#0B0B0F] hover:bg-[#BCFF6E] font-semibold text-base px-10 h-12 group"
              >
                Start your first project
                <ArrowRight size={16} className="ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <Link href="/marketplace/outcomes">
              <Button
                size="lg"
                variant="outline"
                className="border-[#2A2A30] text-white hover:bg-[#1E1E24] font-semibold text-base px-10 h-12"
              >
                Browse the catalog
              </Button>
            </Link>
          </div>
          <p className="text-[#6B7280] text-xs mt-6">No commitment required. First scope estimate is free.</p>
        </div>
      </section>
    </div>
  )
}
