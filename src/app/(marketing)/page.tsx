import Link from 'next/link'
import {
  ArrowRight,
  Zap,
  Users,
  Package,
  Wrench,
  CheckCircle2,
  ChevronRight,
  Hexagon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlassParticles } from '@/components/marketing/glass-particles'

export default function HomePage() {
  return (
    <div className="bg-white text-[#0F172A]">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-white to-[#EEF2FF]">
        {/* Glass particles — interactive background */}
        <GlassParticles />

        {/* Subtle gradient mesh */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#7C3AED] opacity-[0.04] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#EC4899] opacity-[0.04] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-[#3B82F6] opacity-[0.03] rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-32" style={{ zIndex: 2 }}>
          <div className="max-w-4xl" data-hero-content>
            <div className="inline-flex items-center gap-2 border border-[#E2E8F0] bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-8 shadow-sm">
              <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-pulse" />
              <span className="text-[#7C3AED] text-xs font-semibold tracking-wide uppercase">
                The future of engineering services is here
              </span>
            </div>

            <h1 className="font-heading font-bold text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6">
              Engineering Services,
              <br />
              <span className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#EC4899] bg-clip-text text-transparent">redefined as a software platform.</span>
            </h1>

            <p className="text-[#64748B] text-lg md:text-xl leading-relaxed max-w-2xl mb-10">
              At FullStack, we wrote the book on Nearshore Engineering Talent. Now we are
              rewriting the rules of the game with Glassbox, the industry&apos;s first transparent,
              AI-native, outcomes platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/marketplace/outcomes">
                <Button
                  size="lg"
                  className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold text-base px-8 h-12 w-52 transition-colors duration-150 shadow-lg shadow-[#7C3AED]/20"
                >
                  Browse Outcomes
                </Button>
              </Link>
              <span className="text-[#94A3B8] text-sm font-medium uppercase tracking-wide">or</span>
              <Link href="/marketplace/talent">
                <Button
                  size="lg"
                  className="bg-white/80 backdrop-blur-sm text-[#7C3AED] border border-[#7C3AED]/30 hover:bg-[#7C3AED]/10 font-semibold text-base px-8 h-12 w-52 transition-colors duration-150"
                >
                  Explore Talent
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>



      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section className="bg-[#F1F5F9] py-24">
        <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-[#0F172A] leading-tight mb-4">
            With Glassbox, Speed is built in.<br />
            <span className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#EC4899] bg-clip-text text-transparent">Not Optional.</span>
          </h2>
          <p className="text-[#64748B] text-lg md:text-xl mt-6">
            How Glassbox by FullStack works
          </p>
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
              <div className="bg-[#EFF6FF] border border-[#CBD5E1] rounded-xl p-6 h-full hover:border-[#7C3AED]/30 transition-colors duration-150">
                <div className="text-2xl mb-3">{item.icon}</div>
                <div className="text-[#7C3AED] font-mono-brand text-xs font-medium mb-2 tracking-wider">
                  {item.step}
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ── Glassbox Agent — Key Differentiator ──────────────────────────────── */}
      <section className="bg-white text-[#0F172A] py-24">
        <div className="max-w-7xl mx-auto px-6">

          {/* Agent hero */}
          <div className="max-w-3xl mb-20">
            <div className="flex items-center gap-2 mb-6">
              <Hexagon size={16} className="text-[#7C3AED]" />
              <span className="text-[#7C3AED] text-xs font-semibold uppercase tracking-widest">The Glassbox Agent</span>
              <div className="h-px flex-1 bg-[#7C3AED]/30 ml-2" />
            </div>
            <h2 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
              Your project, under a{' '}
              <em className="text-[#7C3AED] not-italic">glass ceiling</em> — not a black box.
            </h2>
            <p className="text-[#64748B] text-lg leading-relaxed">
              Traditional engineering engagements ask you to trust progress reports written by the team
              delivering your project. Glassbox changes the equation with an independent AI agent that
              works exclusively for you — monitoring every commitment, flagging every deviation, before
              your team even knows you&apos;re watching.
            </p>
          </div>

          {/* Traditional vs Glassbox comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-8">
              <span className="text-[#64748B] text-[10px] font-semibold uppercase tracking-widest border border-[#CBD5E1] rounded px-2 py-1">Traditional Services</span>
              <ul className="mt-6 space-y-4">
                {[
                  'Progress reports written by the same team being evaluated',
                  'Health scores reflect what the PM wants you to believe',
                  'Scope drift discovered at invoice time, not delivery time',
                  'No independent verification that milestones reflect the original brief',
                  'You find out something is wrong when it\'s already expensive to fix',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#64748B] text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]/40 mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border-2 border-[#7C3AED]/40 rounded-xl p-8 shadow-sm shadow-[#7C3AED]/10">
              <span className="text-[#7C3AED] text-[10px] font-semibold uppercase tracking-widest border border-[#7C3AED]/30 rounded px-2 py-1">With Glassbox Agent</span>
              <ul className="mt-6 space-y-4">
                {[
                  'Independent AI auditor configured by you, answerable only to you',
                  'Score computed from raw signals — milestone data, activity patterns, timeline position — never from PM narrative',
                  'Scope fidelity checked on every assessment, against your original brief',
                  'PM can add context to agent findings — but cannot edit, suppress, or reorder them',
                  'Deploy the agent on-demand, any time, with no warning to your team',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#334155] text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Three pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {[
              {
                num: '01',
                title: 'You configure it.\nIt works for you.',
                desc: 'Set your success definition, non-negotiables, and risk areas when you start an engagement. The agent reads your brief on every single assessment — not a template, your actual words.',
              },
              {
                num: '02',
                title: 'PM context.\nNot PM control.',
                desc: 'Your PM gets a short window to add context alongside the agent\'s findings before they reach you. They cannot edit, reorder, or remove what the agent found. Silence is visible too — you see which findings went unanswered.',
              },
              {
                num: '03',
                title: 'On-demand.\nNo warning.',
                desc: 'Deploy your agent at any moment for an unfiltered read of your project. Before a board meeting. After a difficult call. Whenever you need certainty. The assessment lands directly — no PM review window on on-demand runs.',
              },
            ].map((pillar) => (
              <div key={pillar.num} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6">
                <span className="text-[#7C3AED] font-mono-brand text-xs font-medium">{pillar.num}</span>
                <h3 className="font-heading font-bold text-xl text-[#0F172A] mt-2 mb-3 whitespace-pre-line">{pillar.title}</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>

          {/* Score transparency section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="font-heading font-bold text-3xl md:text-4xl text-[#0F172A] mb-6 leading-tight">
                Every report shows you exactly what drove the score.
              </h3>
              <p className="text-[#64748B] text-sm leading-relaxed mb-8">
                The agent&apos;s health score is computed independently of anything your PM submits. When the two
                diverge, you see both — side by side, with the gap clearly labeled. Every finding is traced to
                its source: milestone completion rates, days of inactivity, blocker duration, timeline position
                against budget burn. Not opinion. Data.
              </p>

              {/* Pipeline steps */}
              <div className="space-y-4">
                {[
                  { icon: '⬡', label: 'Agent generates independently', desc: 'Collects signals, scores against your weights, writes findings via Claude' },
                  { icon: '◎', label: 'PM adds context (read-only)', desc: '4-hour window to annotate findings — no edits, no suppressions' },
                  { icon: '▤', label: 'Delivered to you, intact', desc: 'Agent findings unchanged, PM context alongside — both clearly labeled' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="text-[#7C3AED] text-lg shrink-0 mt-0.5">{step.icon}</span>
                    <div>
                      <p className="text-[#0F172A] text-sm font-semibold">{step.label}</p>
                      <p className="text-[#64748B] text-xs">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock assessment card */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
                <Hexagon size={12} className="text-[#7C3AED]" />
                <span className="text-[#64748B] text-[10px] font-medium uppercase tracking-wider">Glassbox Agent · Independent Assessment</span>
                <span className="text-[#64748B] text-[10px] ml-auto">Apr 14, 2026</span>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-[#0F172A] text-sm font-medium italic leading-snug">
                  &ldquo;Milestone 3 is 11 days behind expected completion; scope is intact but timeline requires immediate attention.&rdquo;
                </p>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[#64748B] text-[10px]">Agent score</p>
                    <p className="font-mono-brand font-bold text-3xl text-[#F59E0B]">72</p>
                  </div>
                  <div>
                    <p className="text-[#64748B] text-[10px]">PM submitted</p>
                    <p className="font-mono-brand font-bold text-3xl text-[#0F172A]">81</p>
                  </div>
                  <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded px-2 py-1">
                    <p className="text-[#EF4444] font-mono-brand text-xs font-bold">−9 divergence</p>
                  </div>
                </div>
                <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
                  <div className="flex items-start gap-2">
                    <span className="text-[#F59E0B] text-xs mt-0.5">●</span>
                    <div>
                      <p className="text-[#0F172A] text-xs font-medium">Timeline · Milestone 3 is 11 days behind</p>
                      <p className="text-[#64748B] text-[11px]">68% through timeline, 52% milestones complete. Projected: May 13 vs. contracted May 2.</p>
                      <div className="mt-1.5 ml-3 pl-3 border-l border-[#7C3AED]/40">
                        <p className="text-[#7C3AED] text-[10px] font-medium">PM context:</p>
                        <p className="text-[#64748B] text-[11px]">April 10 scope change added 3 deliverables. ~8 of 11 days attributable to approved change.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#10B981] text-xs mt-0.5">●</span>
                    <div>
                      <p className="text-[#0F172A] text-xs font-medium">Scope · All deliverables match original brief</p>
                      <p className="text-[#64748B] text-[11px]">No scope drift detected. Deliverables align with contract specification.</p>
                      <p className="text-[#64748B]/50 text-[10px] mt-1 italic">No PM response</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#F59E0B] text-xs mt-0.5">●</span>
                    <div>
                      <p className="text-[#0F172A] text-xs font-medium">Communication · No PM report for 48 hours</p>
                      <p className="text-[#64748B] text-[11px]">At your configured alert threshold. Last report submitted April 12.</p>
                      <p className="text-[#64748B]/50 text-[10px] mt-1 italic">No PM response</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Closing statement */}
          <div className="flex items-center justify-between pt-8 border-t border-[#E2E8F0]">
            <p className="text-[#64748B] text-sm max-w-lg">
              <strong className="text-[#0F172A]">The firms that survive the next decade will be the ones that invite scrutiny.</strong>{' '}
              Glassbox Agent is how FullStack puts that belief into practice — on every engagement, for every client, by default.
            </p>
            <Link href="/signup">
              <Button className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold px-6">
                See it in action <ArrowRight size={14} className="ml-2" />
              </Button>
            </Link>
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
            <p className="text-[#64748B] text-lg leading-relaxed mb-8">
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
                  <CheckCircle2 size={18} className="text-[#7C3AED] mt-0.5 shrink-0" strokeWidth={2} />
                  <span className="text-[#64748B] text-sm leading-relaxed">{item}</span>
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
              <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-6">
                <div className="font-mono-brand font-semibold text-3xl text-[#7C3AED] mb-1">
                  {stat.value}
                </div>
                <div className="text-[#0F172A] text-sm font-medium mb-1">{stat.label}</div>
                <div className="text-[#94A3B8] text-xs">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Four Modes ──────────────────────────────────────────────────── */}
      <section className="section-padding bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
              Four ways to get work done
            </h2>
            <p className="text-[#64748B] text-lg max-w-xl mx-auto">
              Every team is different. Choose the procurement mode that fits your project.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Talent */}
            <Link href="/marketplace/talent" className="group block">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 h-full hover:border-[#EC4899]/40 hover:-translate-y-0.5 transition-all duration-150">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] flex items-center justify-center">
                    <Users size={22} className="text-[#EC4899]" strokeWidth={1.5} />
                  </div>
                  <span
                    className="text-xs font-medium border rounded-full px-2.5 py-1"
                    style={{ color: '#EC4899', borderColor: '#EC489940' }}
                  >
                    Talent
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-xl mb-3">Individual Talent</h3>
                <p className="text-[#64748B] text-sm leading-relaxed mb-6">
                  Hire a single AI-accelerated engineer — full-stack, mobile, ML, or DevOps — and
                  embed them directly with your team. Every engineer comes with an AI Velocity Score.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {['React', 'Node.js', 'Python', 'Go', 'iOS', 'DevOps'].map((s) => (
                    <span key={s} className="text-xs bg-[#F1F5F9] text-[#64748B] rounded px-2 py-1">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center text-[#7C3AED] text-sm font-semibold group-hover:gap-2 gap-1 transition-all duration-150">
                  Explore engineers <ChevronRight size={14} />
                </div>
              </div>
            </Link>

            {/* Predefined Outcomes */}
            <Link href="/marketplace/outcomes" className="group block">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 h-full hover:border-[#7C3AED]/40 hover:-translate-y-0.5 transition-all duration-150">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] flex items-center justify-center">
                    <Package size={22} className="text-[#7C3AED]" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-medium border rounded-full px-2.5 py-1 text-[#7C3AED] border-[#7C3AED40]">
                    Outcomes
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-xl mb-3">Predefined Outcomes</h3>
                <p className="text-[#64748B] text-sm leading-relaxed mb-6">
                  Productized services at fixed prices. MVP Sprint, CI/CD Pipeline, Automated
                  Testing — scoped, priced, and timelines defined upfront. No surprises.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {['MVP Sprint', 'CI/CD Pipeline', 'Test Coverage', 'Perf Audit'].map((s) => (
                    <span key={s} className="text-xs bg-[#F1F5F9] text-[#64748B] rounded px-2 py-1">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center text-[#7C3AED] text-sm font-semibold group-hover:gap-2 gap-1 transition-all duration-150">
                  Browse outcomes <ChevronRight size={14} />
                </div>
              </div>
            </Link>

            {/* Pods */}
            <Link href="/marketplace/pods" className="group block">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 h-full hover:border-[#EC4899]/40 hover:-translate-y-0.5 transition-all duration-150">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] flex items-center justify-center">
                    <Zap size={22} className="text-[#EC4899]" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-medium border rounded-full px-2.5 py-1 text-[#EC4899] border-[#EC489940]">
                    Pods
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-xl mb-3">Pods</h3>
                <p className="text-[#64748B] text-sm leading-relaxed mb-6">
                  Cross-functional teams — engineering, design, PM — assembled for your project.
                  Full product teams on demand, fully AI-accelerated.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {['AI Product Pod', 'Growth Pod', 'Platform Pod'].map((s) => (
                    <span key={s} className="text-xs bg-[#F1F5F9] text-[#64748B] rounded px-2 py-1">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center text-[#7C3AED] text-sm font-semibold group-hover:gap-2 gap-1 transition-all duration-150">
                  Explore pods <ChevronRight size={14} />
                </div>
              </div>
            </Link>

            {/* Custom Outcomes */}
            <Link href="/marketplace/custom" className="group block">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 h-full hover:border-[#FB923C]/40 hover:-translate-y-0.5 transition-all duration-150">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] flex items-center justify-center">
                    <Wrench size={22} className="text-[#FB923C]" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-medium border rounded-full px-2.5 py-1 text-[#FB923C] border-[#FB923C40]">
                    Custom
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-xl mb-3">Custom Outcomes</h3>
                <p className="text-[#64748B] text-sm leading-relaxed mb-6">
                  Bring your own spec. Our AI PM works with you to define scope, timeline, and price
                  — then assembles the right team to execute it.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {['Bespoke Scope', 'Phased Delivery', 'Dedicated Team'].map((s) => (
                    <span key={s} className="text-xs bg-[#F1F5F9] text-[#64748B] rounded px-2 py-1">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center text-[#7C3AED] text-sm font-semibold group-hover:gap-2 gap-1 transition-all duration-150">
                  Start a custom project <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Footer ──────────────────────────────────────────────────────── */}
      <section className="section-padding bg-[#F8FAFC] border-t border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-heading font-bold text-4xl md:text-5xl mb-6">
            Ready to ship faster?
          </h2>
          <p className="text-[#64748B] text-lg mb-10">
            Join 600+ companies that have switched from traditional outsourcing to AI-native
            engineering outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold text-base px-10 h-12 group"
              >
                Start your first project
                <ArrowRight size={16} className="ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <Link href="/marketplace/outcomes">
              <Button
                size="lg"
                variant="outline"
                className="border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9] font-semibold text-base px-10 h-12"
              >
                Browse the catalog
              </Button>
            </Link>
          </div>
          <p className="text-[#94A3B8] text-xs mt-6">No commitment required. First scope estimate is free.</p>
        </div>
      </section>
    </div>
  )
}
