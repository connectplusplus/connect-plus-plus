'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Star,
  ThumbsUp,
  AlertTriangle,
  MessageCircle,
  Clock,
  DollarSign,
  Zap,
  Users,
  ChevronRight,
  Calendar,
} from 'lucide-react'

// ── Active Talent ─────────────────────────────────────────────────────────

interface ActiveTalent {
  id: string
  name: string
  title: string
  photo: string
  skills: string[]
  velocity: number
  hourlyRate: number
  startDate: string
  hoursWorked: number
  status: 'active' | 'on_leave'
}

const ACTIVE_TALENT: ActiveTalent[] = [
  {
    id: '1',
    name: 'Ryan Mitchell',
    title: 'Senior Full-Stack Engineer',
    photo: '/talent-1.png',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
    velocity: 2.4,
    hourlyRate: 185,
    startDate: '2025-12-16',
    hoursWorked: 624,
    status: 'active',
  },
  {
    id: '2',
    name: 'Marcus Thompson',
    title: 'Staff Backend Engineer',
    photo: '/talent-2.png',
    skills: ['Python', 'Go', 'Kubernetes', 'Kafka', 'Terraform'],
    velocity: 2.7,
    hourlyRate: 210,
    startDate: '2026-01-06',
    hoursWorked: 536,
    status: 'active',
  },
  {
    id: '3',
    name: 'Sofia Ramirez',
    title: 'Senior Frontend Engineer',
    photo: '/talent-3.png',
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind', 'Figma'],
    velocity: 2.2,
    hourlyRate: 175,
    startDate: '2026-02-03',
    hoursWorked: 408,
    status: 'active',
  },
]

// ── Suggested Talent ──────────────────────────────────────────────────────

interface SuggestedTalent {
  name: string
  title: string
  skills: string[]
  velocity: number
  hourlyRate: number
  initials: string
}

const SUGGESTED_TALENT: SuggestedTalent[] = [
  { name: 'Amara Osei', title: 'Senior ML Engineer', skills: ['Python', 'PyTorch', 'FastAPI'], velocity: 2.3, hourlyRate: 195, initials: 'AO' },
  { name: 'Devon Park', title: 'Principal DevOps Engineer', skills: ['Terraform', 'AWS', 'Kubernetes'], velocity: 2.6, hourlyRate: 225, initials: 'DP' },
  { name: 'Wei Chen', title: 'Senior Android Engineer', skills: ['Kotlin', 'Jetpack Compose', 'Room'], velocity: 1.9, hourlyRate: 170, initials: 'WC' },
  { name: 'Jordan Blake', title: 'Senior Full-Stack Engineer', skills: ['React', 'Node.js', 'GraphQL'], velocity: 2.1, hourlyRate: 180, initials: 'JB' },
]

// ── Pods ──────────────────────────────────────────────────────────────────

interface Pod {
  name: string
  description: string
  members: number
  skills: string[]
  monthlyRate: number
  tasks: string[]
}

const SUGGESTED_PODS: Pod[] = [
  {
    name: 'AI Product Pod',
    description: 'End-to-end AI feature development: model integration, API layer, and streaming UI. Ship production AI features in sprints.',
    members: 3,
    skills: ['Claude / GPT-4', 'Python', 'React', 'RAG', 'Prompt Engineering'],
    monthlyRate: 48000,
    tasks: ['AI feature development', 'LLM integration & prompt engineering', 'RAG pipeline builds', 'Evaluation & monitoring'],
  },
  {
    name: 'Full-Stack Growth Pod',
    description: 'Cross-functional team for rapid feature development. Product engineer + designer + backend. Perfect for sprint-based delivery.',
    members: 3,
    skills: ['React', 'Node.js', 'PostgreSQL', 'UI/UX', 'TypeScript'],
    monthlyRate: 42000,
    tasks: ['Feature sprints', 'UI/UX implementation', 'API development', 'Performance optimization'],
  },
  {
    name: 'Platform & DevOps Pod',
    description: 'Infrastructure, CI/CD, monitoring, and reliability. Keep your platform running and your deploys fast.',
    members: 2,
    skills: ['Terraform', 'Kubernetes', 'AWS/GCP', 'GitHub Actions', 'Prometheus'],
    monthlyRate: 36000,
    tasks: ['Infrastructure as code', 'CI/CD pipeline management', 'Monitoring & alerting', 'Cost optimization'],
  },
]

// ── Component ─────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function FeedbackModal({ name, type, onClose }: { name: string; type: 'kudos' | 'feedback' | 'concern'; onClose: () => void }) {
  const config = {
    kudos: { title: `Give Kudos to ${name}`, color: '#6B8F5E', placeholder: 'What did they do great? Be specific — it helps them grow.' },
    feedback: { title: `Feedback for ${name}`, color: '#60A5FA', placeholder: 'Share constructive feedback about their work, communication, or delivery...' },
    concern: { title: `Report Concern about ${name}`, color: '#F87171', placeholder: 'Describe the issue. This will be shared with the FullStack talent team confidentially.' },
  }[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-heading font-semibold text-[#2D2B27] text-lg">{config.title}</h3>
        <textarea
          rows={4}
          placeholder={config.placeholder}
          className="w-full rounded-lg bg-[#EFEDE8] border border-[#E0DDD6] text-[#2D2B27] text-sm p-3 placeholder:text-[#B0ADA6] focus:border-[#6B8F5E] focus:outline-none resize-none"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="border-[#E0DDD6] text-[#8B8781] hover:text-[#2D2B27] text-sm h-9">
            Cancel
          </Button>
          <Button onClick={onClose} className="text-sm h-9 font-semibold" style={{ backgroundColor: config.color, color: '#FFFFFF' }}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  )
}

export function MyTalentClient({ companyName }: { companyName: string }) {
  const [modal, setModal] = useState<{ name: string; type: 'kudos' | 'feedback' | 'concern' } | null>(null)

  const totalMonthlySpend = ACTIVE_TALENT.reduce((s, t) => s + t.hourlyRate * 160, 0)
  const totalBilled = ACTIVE_TALENT.reduce((s, t) => s + t.hourlyRate * t.hoursWorked, 0)

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      {modal && <FeedbackModal name={modal.name} type={modal.type} onClose={() => setModal(null)} />}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-heading font-bold text-2xl text-[#2D2B27] mb-1">Talent by FullStack</h2>
        <p className="text-[#8B8781] text-sm">
          Your dedicated AI-native engineers working on {companyName} projects.
        </p>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Engineers', value: `${ACTIVE_TALENT.length}`, icon: Users, color: '#6B8F5E' },
          { label: 'Avg AI Velocity', value: `${(ACTIVE_TALENT.reduce((s, t) => s + t.velocity, 0) / ACTIVE_TALENT.length).toFixed(1)}x`, icon: Zap, color: '#D4A574' },
          { label: 'Monthly Run Rate', value: formatCurrency(totalMonthlySpend), icon: DollarSign, color: '#34D399' },
          { label: 'Total Billed to Date', value: formatCurrency(totalBilled), icon: DollarSign, color: '#60A5FA' },
        ].map((card) => (
          <div key={card.label} className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}10` }}>
                <card.icon size={14} style={{ color: card.color }} />
              </div>
              <span className="text-[#B0ADA6] text-xs">{card.label}</span>
            </div>
            <p className="font-mono-brand font-bold text-xl text-[#2D2B27]">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Active Talent ───────────────────────────────────────────────── */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-[#2D2B27] mb-5">Active Engineers</h3>
        <div className="space-y-4">
          {ACTIVE_TALENT.map((talent) => {
            const days = daysSince(talent.startDate)
            const totalBilledForTalent = talent.hourlyRate * talent.hoursWorked

            return (
              <div key={talent.id} className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-5 hover:border-[#6B8F5E]/20 transition-colors">
                <div className="flex gap-5">
                  {/* Photo */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                    <Image src={talent.photo} alt={talent.name} width={96} height={96} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-heading font-semibold text-[#2D2B27] text-base">{talent.name}</h4>
                        <p className="text-[#8B8781] text-sm">{talent.title}</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#6B8F5E]/10 border border-[#6B8F5E]/20 rounded-lg px-2.5 py-1">
                        <Zap size={12} className="text-[#6B8F5E]" fill="#6B8F5E" />
                        <span className="text-[#6B8F5E] font-mono-brand font-semibold text-sm">{talent.velocity}x</span>
                        <span className="text-[#B0ADA6] text-xs">velocity</span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {talent.skills.map((s) => (
                        <span key={s} className="text-[10px] bg-[#EFEDE8] text-[#8B8781] rounded px-2 py-0.5 border border-[#E0DDD6]">{s}</span>
                      ))}
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-5 text-xs">
                      <div className="flex items-center gap-1.5 text-[#8B8781]">
                        <Calendar size={12} className="text-[#B0ADA6]" />
                        <span>Since {new Date(talent.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        <span className="text-[#B0ADA6]">({days} days)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#8B8781]">
                        <Clock size={12} className="text-[#B0ADA6]" />
                        <span>{talent.hoursWorked} hrs logged</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#8B8781]">
                        <DollarSign size={12} className="text-[#B0ADA6]" />
                        <span>{formatCurrency(talent.hourlyRate)}/hr</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#2D2B27] font-medium">
                        <DollarSign size={12} className="text-[#34D399]" />
                        <span>{formatCurrency(totalBilledForTalent)} billed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#E0DDD6]">
                  <button
                    onClick={() => setModal({ name: talent.name, type: 'kudos' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6B8F5E]/10 text-[#6B8F5E] border border-[#6B8F5E]/20 hover:bg-[#6B8F5E]/20 transition-colors"
                  >
                    <ThumbsUp size={12} /> Give Kudos
                  </button>
                  <button
                    onClick={() => setModal({ name: talent.name, type: 'feedback' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#60A5FA]/10 text-[#60A5FA] border border-[#60A5FA]/20 hover:bg-[#60A5FA]/20 transition-colors"
                  >
                    <MessageCircle size={12} /> Feedback
                  </button>
                  <button
                    onClick={() => setModal({ name: talent.name, type: 'concern' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20 hover:bg-[#F87171]/20 transition-colors"
                  >
                    <AlertTriangle size={12} /> Report Concern
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Suggested Talent ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-heading font-semibold text-lg text-[#2D2B27]">Suggested Engineers</h3>
            <p className="text-[#B0ADA6] text-xs mt-0.5">Based on your active projects and technology stack</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUGGESTED_TALENT.map((t) => (
            <div key={t.name} className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-5 hover:border-[#6B8F5E]/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#EFEDE8] flex items-center justify-center text-[#6B8F5E] font-mono-brand text-sm font-bold shrink-0">
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[#2D2B27] text-sm font-semibold truncate">{t.name}</p>
                  <p className="text-[#B0ADA6] text-xs truncate">{t.title}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {t.skills.map((s) => (
                  <span key={s} className="text-[10px] bg-[#EFEDE8] text-[#8B8781] rounded px-1.5 py-0.5 border border-[#E0DDD6]">{s}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6B8F5E] font-mono-brand font-semibold">{t.velocity}x velocity</span>
                <span className="text-[#8B8781]">{formatCurrency(t.hourlyRate)}/hr</span>
              </div>
              <Button className="w-full mt-3 bg-[#EFEDE8] border border-[#E0DDD6] text-[#2D2B27] hover:bg-[#E2E8F0] text-xs h-8 font-medium">
                Request Interview
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Suggested Pods ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-heading font-semibold text-lg text-[#2D2B27]">Suggested Pods</h3>
            <p className="text-[#B0ADA6] text-xs mt-0.5">Pre-configured cross-functional teams ready to deploy</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {SUGGESTED_PODS.map((pod) => (
            <div key={pod.name} className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-5 hover:border-[#6B8F5E]/30 transition-colors flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4A574]/10 flex items-center justify-center shrink-0">
                  <Users size={16} className="text-[#D4A574]" />
                </div>
                <div>
                  <h4 className="text-[#2D2B27] font-semibold text-sm">{pod.name}</h4>
                  <p className="text-[#B0ADA6] text-xs">{pod.members} engineers</p>
                </div>
              </div>

              <p className="text-[#8B8781] text-xs leading-relaxed mb-3">{pod.description}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {pod.skills.map((s) => (
                  <span key={s} className="text-[10px] bg-[#EFEDE8] text-[#8B8781] rounded px-1.5 py-0.5 border border-[#E0DDD6]">{s}</span>
                ))}
              </div>

              <div className="mb-3">
                <p className="text-[#B0ADA6] text-[10px] uppercase tracking-widest mb-2">Pod tasks</p>
                <ul className="space-y-1">
                  {pod.tasks.map((task) => (
                    <li key={task} className="flex items-center gap-2 text-xs text-[#8B8781]">
                      <ChevronRight size={10} className="text-[#6B8F5E] shrink-0" />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-3 border-t border-[#E0DDD6] flex items-center justify-between">
                <div>
                  <span className="text-[#2D2B27] font-mono-brand font-bold text-lg">{formatCurrency(pod.monthlyRate)}</span>
                  <span className="text-[#B0ADA6] text-xs">/month</span>
                </div>
                <Button className="bg-[#6B8F5E] text-white hover:bg-[#7DA06E] text-xs h-8 font-semibold px-4">
                  Deploy Pod
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
