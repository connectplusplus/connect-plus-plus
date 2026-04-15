'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { Engagement, Milestone, Message, OutcomeTemplate, DailyReport } from '@/lib/types'
import { MilestoneTracker } from '@/components/dashboard/milestone-tracker'
import { MilestoneTimeline } from '@/components/dashboard/milestone-timeline'
import { MessageThread } from '@/components/dashboard/message-thread'
import { EngagementStatusBadge } from '@/components/dashboard/status-badge'
import { formatCents } from '@/lib/utils'
import { getHealthColor } from '@/lib/types'
import {
  Calendar,
  DollarSign,
  ExternalLink,
  Layers,
  MessageCircle,
  BarChart2,
  Zap,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  FileText,
  GitBranch,
  Search,
  File,
  Folder,
  ChevronRight,
  Download,
  FolderOpen,
  Hexagon,
  Loader2,
} from 'lucide-react'

type Tab = 'overview' | 'milestones' | 'docs' | 'daily_reports' | 'agent_reports' | 'codebase' | 'messages'

interface TeamMember {
  name: string
  role: string
  velocity: number
  initials: string
}

interface ProjectLead {
  name: string
  title: string
  photo: string
  calendly: string
}

interface IntakeResponses {
  health_score?: number
  ai_velocity?: number
  project_lead?: ProjectLead
  team?: TeamMember[]
}

interface EngagementDetailClientProps {
  engagement: Engagement & { outcome_templates?: OutcomeTemplate | null }
  milestones: Milestone[]
  messages: Message[]
  dailyReports?: DailyReport[]
  currentUserId?: string
  currentUserName?: string
}

function HealthRing({ score }: { score: number }) {
  const color = score >= 80 ? '#7C3AED' : score >= 70 ? '#FBBF24' : '#F87171'
  const label = score >= 80 ? 'Excellent' : score >= 70 ? 'On Track' : 'At Risk'
  const radius = 36
  const circ = 2 * Math.PI * radius
  const dash = (score / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg width="96" height="96" className="-rotate-90">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#1E1E24" strokeWidth="8" />
          <circle
            cx="48" cy="48" r={radius} fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-brand font-bold text-xl" style={{ color }}>{score}</span>
          <span className="text-[#94A3B8] text-[9px] uppercase tracking-wide">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-medium" style={{ color }}>{label}</span>
      <span className="text-[#94A3B8] text-[10px]">Project Health</span>
    </div>
  )
}

export function EngagementDetailClient({
  engagement,
  milestones,
  messages,
  dailyReports = [],
  currentUserId,
  currentUserName,
}: EngagementDetailClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const intake = (engagement.intake_responses ?? {}) as IntakeResponses
  const healthScore = intake.health_score ?? 75
  const aiVelocity = intake.ai_velocity ?? 2.0
  const projectLead = intake.project_lead
  const team = intake.team ?? []

  const completedMilestones = milestones.filter((m) => m.status === 'completed').length
  const totalMilestones = milestones.length
  const progressPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

  const startDate = engagement.start_date
    ? new Date(engagement.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null
  const targetEndDate = engagement.target_end_date
    ? new Date(engagement.target_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const daysRemaining = engagement.target_end_date
    ? Math.max(0, Math.ceil((new Date(engagement.target_end_date).getTime() - Date.now()) / 86400000))
    : null

  const currentMilestone = milestones.find((m) => m.status === 'in_progress' || m.status === 'in_review')

  const tabs: Array<{ id: Tab; label: string; icon: typeof Layers }> = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'milestones', label: `Milestones (${totalMilestones})`, icon: Layers },
    { id: 'docs', label: 'Project Docs', icon: FileText },
    { id: 'daily_reports', label: 'Daily Reports', icon: FileText },
    { id: 'agent_reports', label: 'Agent Reports', icon: Hexagon },
    { id: 'codebase', label: 'Codebase', icon: GitBranch },
    { id: 'messages', label: `Messages (${messages.filter((m) => !m.is_system_message).length})`, icon: MessageCircle },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <EngagementStatusBadge status={engagement.status} />
            </div>
            <h1 className="font-heading font-bold text-2xl text-[#0F172A] leading-snug mb-4">
              {engagement.title}
            </h1>
            {/* Key metrics row */}
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#7C3AED]/10 rounded-lg flex items-center justify-center">
                  <TrendingUp size={13} className="text-[#7C3AED]" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide">Progress</p>
                  <p className="text-[#0F172A] text-sm font-mono-brand font-semibold">{progressPct}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#EC4899]/10 rounded-lg flex items-center justify-center">
                  <Zap size={13} className="text-[#EC4899]" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide">AI Velocity</p>
                  <p className="text-[#0F172A] text-sm font-mono-brand font-semibold">{aiVelocity}x</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#60A5FA]/10 rounded-lg flex items-center justify-center">
                  <Clock size={13} className="text-[#60A5FA]" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide">Days Left</p>
                  <p className="text-[#0F172A] text-sm font-mono-brand font-semibold">
                    {daysRemaining !== null ? `${daysRemaining}d` : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#34D399]/10 rounded-lg flex items-center justify-center">
                  <DollarSign size={13} className="text-[#34D399]" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[#94A3B8] text-[10px] uppercase tracking-wide">Budget</p>
                  <p className="text-[#0F172A] text-sm font-mono-brand font-semibold">
                    {engagement.price_cents ? formatCents(engagement.price_cents) : 'TBD'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Health ring */}
          <div className="shrink-0">
            <HealthRing score={healthScore} />
          </div>
        </div>
      </div>

      {/* ── Phase Timeline ──────────────────────────────────────────────────── */}
      {milestones.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl px-6 py-5">
          <p className="text-[#94A3B8] text-[10px] uppercase tracking-widest mb-4">How it unfolds</p>
          <MilestoneTimeline milestones={milestones} />
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="border-b border-[#E2E8F0]">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 -mb-px ${
                activeTab === tab.id
                  ? 'border-[#7C3AED] text-[#7C3AED]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <tab.icon size={14} strokeWidth={1.5} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview ─────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Progress bar */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-[#0F172A] text-sm">Overall Progress</h3>
                <span className="font-mono-brand text-[#7C3AED] font-semibold text-sm">{progressPct}%</span>
              </div>
              <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-[#7C3AED] rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                <span>{completedMilestones} of {totalMilestones} milestones completed</span>
                {currentMilestone && (
                  <span className="text-[#FBBF24]">Active: {currentMilestone.title}</span>
                )}
              </div>
            </div>

            {/* Milestone summary */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
              <h3 className="font-heading font-semibold text-[#0F172A] text-sm mb-4 flex items-center gap-2">
                <Layers size={14} strokeWidth={1.5} className="text-[#64748B]" />
                Milestones
              </h3>
              <div className="space-y-3">
                {milestones.map((m) => {
                  const statusConfig = {
                    completed: { color: '#7C3AED', label: 'Completed', dot: 'bg-[#7C3AED]' },
                    in_progress: { color: '#FBBF24', label: 'In Progress', dot: 'bg-[#FBBF24]' },
                    in_review: { color: '#60A5FA', label: 'In Review', dot: 'bg-[#60A5FA]' },
                    upcoming: { color: '#6B7280', label: 'Upcoming', dot: 'bg-[#E2E8F0]' },
                  }[m.status] ?? { color: '#6B7280', label: m.status, dot: 'bg-[#E2E8F0]' }

                  return (
                    <div key={m.id} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${statusConfig.dot}`} />
                      <span className="text-[#0F172A] text-sm flex-1 truncate">{m.title}</span>
                      {m.due_date && (
                        <span className="text-[#94A3B8] text-xs shrink-0">
                          {new Date(m.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <span className="text-xs shrink-0" style={{ color: statusConfig.color }}>
                        {statusConfig.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Scope */}
            {engagement.scope_summary && (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <h3 className="font-heading font-semibold text-[#0F172A] text-sm mb-3">Scope Summary</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">{engagement.scope_summary}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
              <h3 className="font-heading font-semibold text-[#0F172A] text-sm mb-4">Timeline</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Start Date', value: startDate, icon: Calendar },
                  { label: 'Target End', value: targetEndDate, icon: Calendar },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F1F5F9] rounded-lg flex items-center justify-center shrink-0">
                      <item.icon size={14} className="text-[#64748B]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-[#94A3B8] text-xs">{item.label}</p>
                      <p className="text-[#0F172A] text-sm font-medium">{item.value ?? '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column (1/3) */}
          <div className="space-y-5">

            {/* Project Lead card */}
            {projectLead && (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <p className="text-[#94A3B8] text-[10px] uppercase tracking-widest mb-4">
                  Project Delivery Lead
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-[#7C3AED]/20 shrink-0">
                    <Image
                      src={projectLead.photo}
                      alt={projectLead.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[#0F172A] font-semibold text-sm">{projectLead.name}</p>
                    <p className="text-[#64748B] text-xs">{projectLead.title}</p>
                  </div>
                </div>
                <a
                  href={projectLead.calendly}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#8B5CF6] px-3 py-2 rounded-lg transition-colors duration-150"
                >
                  <ExternalLink size={11} strokeWidth={2.5} />
                  Schedule Project Review
                </a>
              </div>
            )}

            {/* Team */}
            {team.length > 0 && (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <p className="text-[#94A3B8] text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Users size={11} />
                  Engineering Team
                </p>
                <div className="space-y-3">
                  {team.map((member) => (
                    <div key={member.name} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#7C3AED] font-mono-brand text-xs font-bold shrink-0">
                        {member.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#0F172A] text-sm font-medium truncate">{member.name}</p>
                        <p className="text-[#94A3B8] text-[11px] truncate">{member.role}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[#7C3AED] font-mono-brand text-xs font-semibold">{member.velocity}x</p>
                        <p className="text-[#94A3B8] text-[10px]">velocity</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-[#64748B] text-xs">Team avg velocity</span>
                  <span className="text-[#7C3AED] font-mono-brand text-sm font-bold">
                    {team.length > 0
                      ? (team.reduce((s, m) => s + m.velocity, 0) / team.length).toFixed(1)
                      : aiVelocity}x
                  </span>
                </div>
              </div>
            )}

            {/* AI acceleration */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
              <p className="text-[#94A3B8] text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                <Zap size={11} />
                AI Acceleration
              </p>
              <div className="flex items-end gap-2 mb-2">
                <span className="font-mono-brand font-bold text-3xl text-[#7C3AED]">{aiVelocity}x</span>
                <span className="text-[#64748B] text-sm mb-1">faster delivery</span>
              </div>
              <p className="text-[#94A3B8] text-xs leading-relaxed">
                AI-native workflows are accelerating this engagement {aiVelocity}× vs. traditional delivery.
              </p>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'milestones' && (
        <MilestoneTracker milestones={milestones} />
      )}

      {activeTab === 'docs' && (
        <ProjectDocsTab />
      )}

      {activeTab === 'messages' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
          <MessageThread
            messages={messages}
            engagementId={engagement.id}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </div>
      )}

      {activeTab === 'daily_reports' && (
        <DailyReportsTab
          engagementTitle={engagement.title}
          projectLead={projectLead}
          startDate={engagement.start_date}
          realReports={dailyReports}
        />
      )}

      {activeTab === 'agent_reports' && (
        <AgentReportsTab engagementId={engagement.id} />
      )}

      {activeTab === 'codebase' && (
        <CodebaseTab engagementTitle={engagement.title} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Project Documentation Tab
// ═══════════════════════════════════════════════════════════════════════════════

interface ProjectDoc {
  id: string
  name: string
  type: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'figma' | 'md'
  folder: string
  size: string
  uploadedBy: string
  uploadedAt: string
  description: string
}

const DOC_TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  pdf: { color: '#F87171', label: 'PDF' },
  docx: { color: '#60A5FA', label: 'DOCX' },
  xlsx: { color: '#34D399', label: 'XLSX' },
  pptx: { color: '#FB923C', label: 'PPTX' },
  figma: { color: '#EC4899', label: 'FIG' },
  md: { color: '#9CA3AF', label: 'MD' },
}

const DEMO_DOCS: ProjectDoc[] = [
  // Architecture & Design
  { id: '1', name: 'System Architecture Document', type: 'pdf', folder: 'Architecture & Design', size: '2.4 MB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-03-06', description: 'Complete system architecture including infrastructure diagram, service boundaries, data flow, and technology decisions.' },
  { id: '2', name: 'Database Schema & ERD', type: 'pdf', folder: 'Architecture & Design', size: '1.1 MB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-03-06', description: 'Entity relationship diagram with all tables, relationships, indexes, and migration strategy.' },
  { id: '3', name: 'API Specification (OpenAPI)', type: 'pdf', folder: 'Architecture & Design', size: '890 KB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-03-08', description: 'Complete REST API specification with endpoints, request/response schemas, and authentication details.' },
  { id: '4', name: 'UI/UX Design Handoff', type: 'figma', folder: 'Architecture & Design', size: '—', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-03-07', description: 'Figma file with all screens, component library, design tokens, and responsive breakpoints.' },
  { id: '5', name: 'Technical Decisions Log', type: 'docx', folder: 'Architecture & Design', size: '340 KB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-03-10', description: 'ADR (Architecture Decision Records) documenting all major technical choices with rationale.' },

  // Project Management
  { id: '6', name: 'Project Plan & Timeline', type: 'xlsx', folder: 'Project Management', size: '520 KB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-03-04', description: 'Detailed project timeline with milestones, dependencies, resource allocation, and critical path.' },
  { id: '7', name: 'Sprint Backlog & Estimates', type: 'xlsx', folder: 'Project Management', size: '380 KB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-03-06', description: 'Full sprint backlog with story points, priority ranking, and acceptance criteria for every task.' },
  { id: '8', name: 'Stakeholder Kickoff Deck', type: 'pptx', folder: 'Project Management', size: '4.2 MB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-03-04', description: 'Presentation from the project kickoff meeting covering scope, team, timeline, and communication plan.' },
  { id: '9', name: 'Risk Register', type: 'docx', folder: 'Project Management', size: '180 KB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-03-05', description: 'Identified project risks with probability, impact, mitigation strategies, and owners.' },
  { id: '10', name: 'Change Request Log', type: 'xlsx', folder: 'Project Management', size: '95 KB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-04-08', description: 'Log of all scope changes requested, with status, impact assessment, and approval decisions.' },

  // Quality & Testing
  { id: '11', name: 'Testing Strategy Document', type: 'pdf', folder: 'Quality & Testing', size: '1.6 MB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-03-12', description: 'Comprehensive test strategy covering unit, integration, E2E, performance, and security testing approaches.' },
  { id: '12', name: 'QA Test Cases', type: 'xlsx', folder: 'Quality & Testing', size: '720 KB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-03-20', description: '150+ test cases organized by feature area with steps, expected results, and priority levels.' },
  { id: '13', name: 'Performance Test Report', type: 'pdf', folder: 'Quality & Testing', size: '3.1 MB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-04-05', description: 'Load testing results: P50/P95/P99 latency, throughput, error rates under 500 concurrent users.' },

  // Security & Compliance
  { id: '14', name: 'Security Audit Report', type: 'pdf', folder: 'Security & Compliance', size: '2.8 MB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-04-02', description: 'Third-party security assessment results including OWASP Top 10 review, dependency scanning, and penetration test findings.' },
  { id: '15', name: 'Data Privacy Impact Assessment', type: 'docx', folder: 'Security & Compliance', size: '450 KB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-03-15', description: 'DPIA covering data collection, processing, storage, retention, and deletion policies.' },

  // Deployment & Operations
  { id: '16', name: 'Deployment Runbook', type: 'md', folder: 'Deployment & Ops', size: '85 KB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-04-10', description: 'Step-by-step production deployment procedure with rollback steps, health checks, and monitoring verification.' },
  { id: '17', name: 'Infrastructure as Code (Terraform)', type: 'md', folder: 'Deployment & Ops', size: '42 KB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-03-28', description: 'Terraform module documentation covering all provisioned infrastructure resources and configuration.' },
  { id: '18', name: 'Monitoring & Alerting Setup', type: 'pdf', folder: 'Deployment & Ops', size: '1.2 MB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-04-01', description: 'Grafana dashboards, alert rules, PagerDuty integration, and on-call runbook for production monitoring.' },

  // Handoff & Training
  { id: '19', name: 'Developer Onboarding Guide', type: 'md', folder: 'Handoff & Training', size: '120 KB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-04-12', description: 'Guide for new engineers joining the project: local setup, architecture overview, coding conventions, and PR workflow.' },
  { id: '20', name: 'Admin User Training Guide', type: 'pptx', folder: 'Handoff & Training', size: '6.8 MB', uploadedBy: 'Carlos Mendez', uploadedAt: '2026-04-11', description: 'Training presentation with screenshots and video links for admin users covering all platform features.' },
]

function ProjectDocsTab() {
  const [search, setSearch] = useState('')
  const [activeFolder, setActiveFolder] = useState<string | null>(null)

  const folders = [...new Set(DEMO_DOCS.map((d) => d.folder))]

  const filtered = DEMO_DOCS.filter((doc) => {
    const matchesSearch = !search.trim() ||
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.description.toLowerCase().includes(search.toLowerCase()) ||
      doc.folder.toLowerCase().includes(search.toLowerCase())
    const matchesFolder = !activeFolder || doc.folder === activeFolder
    return matchesSearch && matchesFolder
  })

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Left: folder nav */}
      <div className="w-64 shrink-0 bg-white border border-[#E2E8F0] rounded-xl flex flex-col overflow-hidden">
        <div className="p-3 border-b border-[#E2E8F0]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-sm placeholder:text-[#94A3B8] focus:border-[#7C3AED] focus:outline-none transition-colors"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* All docs */}
          <button
            onClick={() => setActiveFolder(null)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              !activeFolder ? 'bg-[#7C3AED]/10 border-r-2 border-[#7C3AED]' : 'hover:bg-[#F1F5F9]'
            }`}
          >
            <Folder size={14} className={!activeFolder ? 'text-[#7C3AED]' : 'text-[#94A3B8]'} />
            <span className={`text-sm font-medium ${!activeFolder ? 'text-[#7C3AED]' : 'text-[#0F172A]'}`}>
              All Documents
            </span>
            <span className="text-[#94A3B8] text-xs ml-auto">{DEMO_DOCS.length}</span>
          </button>

          <div className="px-4 py-2">
            <p className="text-[#94A3B8] text-[10px] uppercase tracking-widest font-medium">Folders</p>
          </div>

          {folders.map((folder) => {
            const count = DEMO_DOCS.filter((d) => d.folder === folder).length
            const isActive = activeFolder === folder
            return (
              <button
                key={folder}
                onClick={() => setActiveFolder(folder)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  isActive ? 'bg-[#7C3AED]/10 border-r-2 border-[#7C3AED]' : 'hover:bg-[#F1F5F9]'
                }`}
              >
                <FolderOpen size={14} className={isActive ? 'text-[#7C3AED]' : 'text-[#94A3B8]'} />
                <span className={`text-sm truncate ${isActive ? 'text-[#7C3AED]' : 'text-[#64748B]'}`}>
                  {folder}
                </span>
                <span className="text-[#94A3B8] text-xs ml-auto shrink-0">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: document list */}
      <div className="flex-1 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2E8F0]">
          <h3 className="font-heading font-semibold text-[#0F172A] text-sm">
            {activeFolder ?? 'All Documents'}
          </h3>
          <span className="text-[#94A3B8] text-xs">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-3 px-5 py-2 border-b border-[#E2E8F0] bg-[#F8FAFC] text-[10px] text-[#94A3B8] uppercase tracking-wider">
          <span className="flex-1">Document</span>
          <span className="w-16 text-center">Type</span>
          <span className="w-20 text-right">Size</span>
          <span className="w-24 text-right">Uploaded</span>
          <span className="w-10" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[#94A3B8] text-sm">
              No documents match your search.
            </div>
          ) : (
            filtered.map((doc) => {
              const typeConfig = DOC_TYPE_CONFIG[doc.type] ?? { color: '#6B7280', label: doc.type.toUpperCase() }
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 px-5 py-3 border-b border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <File size={13} className="text-[#64748B] shrink-0" />
                      <span className="text-[#0F172A] text-sm font-medium truncate">{doc.name}</span>
                    </div>
                    <p className="text-[#94A3B8] text-xs truncate pl-5">{doc.description}</p>
                  </div>
                  <span
                    className="w-16 text-center text-[10px] font-bold rounded px-2 py-1 shrink-0"
                    style={{ color: typeConfig.color, backgroundColor: `${typeConfig.color}10`, border: `1px solid ${typeConfig.color}20` }}
                  >
                    {typeConfig.label}
                  </span>
                  <span className="w-20 text-right text-[#94A3B8] text-xs shrink-0">{doc.size}</span>
                  <span className="w-24 text-right text-[#94A3B8] text-xs shrink-0">
                    {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <button className="w-10 flex items-center justify-center text-[#94A3B8] hover:text-[#7C3AED] transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                    <Download size={14} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Daily Reports Tab
// ═══════════════════════════════════════════════════════════════════════════════

interface DemoReport {
  id: string
  date: string
  author: string
  summary: string
  highlights: string[]
  blockers: string[]
  tomorrow: string[]
  pm_notes?: string | null
}

function generateDemoReports(title: string, lead: ProjectLead | undefined, startDate: string | null): DemoReport[] {
  const author = lead?.name ?? 'Carlos Mendez'
  const base = startDate ? new Date(startDate) : new Date('2026-03-03')

  // Generate 5 realistic daily reports
  const reports: DemoReport[] = [
    {
      id: '1',
      date: new Date(base.getTime() + 35 * 86400000).toISOString(),
      author,
      summary: 'Strong progress across the board. The team shipped 3 PRs today and the staging environment is looking solid. Velocity is tracking at 2.3x against our baseline.',
      highlights: [
        'Merged PR #47: Completed API integration layer with full error handling and retry logic',
        'PR #48 (UI components) passed code review — deploying to staging tonight',
        'Test coverage increased from 62% to 71% with 34 new integration tests',
        'Successful load test: 500 concurrent users with P95 response time under 180ms',
      ],
      blockers: [
        'Waiting on client API credentials for the third-party data sync — followed up via email',
      ],
      tomorrow: [
        'Begin work on the admin dashboard views',
        'Complete the notification service integration',
        'Run full regression suite on staging',
      ],
    },
    {
      id: '2',
      date: new Date(base.getTime() + 34 * 86400000).toISOString(),
      author,
      summary: 'Focused day on infrastructure and DevOps. CI/CD pipeline is now fully automated with preview deployments on every PR. Team also knocked out several bug fixes from last week\'s QA pass.',
      highlights: [
        'CI/CD pipeline fully operational — preview deploys on every PR via Vercel',
        'Fixed 8 bugs from QA backlog (5 critical, 3 minor)',
        'Database migration scripts tested and verified on staging',
        'Added monitoring dashboards in Grafana for API latency and error rates',
      ],
      blockers: [],
      tomorrow: [
        'Start core API integration work',
        'Pair programming session on the authentication flow',
        'Review updated wireframes from the client',
      ],
    },
    {
      id: '3',
      date: new Date(base.getTime() + 33 * 86400000).toISOString(),
      author,
      summary: 'Authentication and authorization layer is complete. RBAC model tested with all 5 role configurations. The team is moving fast — we\'re about 2 days ahead of schedule.',
      highlights: [
        'Auth flow complete: login, signup, password reset, email verification all working',
        'RBAC layer implemented with 5 role levels — tested and passing',
        'SSO integration (Okta) working in staging environment',
        'Reduced bundle size by 23% through code splitting optimization',
      ],
      blockers: [
        'Azure AD SSO requires a redirect URI whitelist update from client IT team — ticket submitted',
      ],
      tomorrow: [
        'Begin the data import/export module',
        'Set up end-to-end test suite with Playwright',
        'Architecture review for the real-time sync feature',
      ],
    },
    {
      id: '4',
      date: new Date(base.getTime() + 32 * 86400000).toISOString(),
      author,
      summary: 'Design implementation sprint. Converted all remaining Figma screens to code. The frontend is now feature-complete for the core user flows — moving to polish and edge cases.',
      highlights: [
        'All 12 core screens implemented from Figma designs',
        'Responsive design verified across mobile, tablet, and desktop breakpoints',
        'Dark mode support added (client requested this in last week\'s review)',
        'Form validation and error states implemented for all input flows',
      ],
      blockers: [],
      tomorrow: [
        'Focus on authentication and authorization implementation',
        'Begin API endpoint security audit',
        'Client demo prep for end-of-week review',
      ],
    },
    {
      id: '5',
      date: new Date(base.getTime() + 31 * 86400000).toISOString(),
      author,
      summary: 'Kickoff week wrap-up. Architecture finalized, development environment stable, and the team has hit a good rhythm. The client is engaged and responsive — ideal project dynamics.',
      highlights: [
        'Architecture document finalized and signed off by client',
        'Development environment fully configured with hot reload, linting, testing',
        'Database schema finalized — 14 tables, all migrations tested',
        'Sprint backlog groomed and estimated — 47 story points for sprint 1',
      ],
      blockers: [
        'Need access to client\'s staging data for realistic test fixtures — requested',
      ],
      tomorrow: [
        'Sprint 1 begins — focus on core data models and API scaffold',
        'Start UI component library build',
        'Set up CI/CD pipeline',
      ],
    },
  ]

  return reports
}

function DailyReportsTab({
  engagementTitle,
  projectLead,
  startDate,
  realReports = [],
}: {
  engagementTitle: string
  projectLead?: ProjectLead
  startDate: string | null
  realReports?: DailyReport[]
}) {
  const [search, setSearch] = useState('')
  const [selectedReport, setSelectedReport] = useState<string | null>(null)

  // Use real reports if available, otherwise fall back to demo data
  const hasRealReports = realReports.length > 0

  // Normalize real reports to the same shape as demo reports for the existing UI
  const normalizedRealReports: DemoReport[] = realReports.map((r) => ({
    id: r.id,
    date: r.report_date,
    author: (r as any).internal_users?.full_name ?? projectLead?.name ?? 'Project Manager',
    summary: r.accomplishments,
    highlights: r.accomplishments.split('\n').filter(Boolean).length > 1
      ? r.accomplishments.split('\n').filter(Boolean)
      : [r.accomplishments],
    blockers: r.blockers ? [r.blockers] : [],
    tomorrow: r.plan_tomorrow.split('\n').filter(Boolean).length > 1
      ? r.plan_tomorrow.split('\n').filter(Boolean)
      : [r.plan_tomorrow],
    pm_notes: r.pm_notes ?? null,
  }))

  const reports: DemoReport[] = hasRealReports
    ? normalizedRealReports
    : generateDemoReports(engagementTitle, projectLead, startDate)

  const filtered = search.trim()
    ? reports.filter(
        (r) =>
          r.summary.toLowerCase().includes(search.toLowerCase()) ||
          r.highlights.some((h) => h.toLowerCase().includes(search.toLowerCase())) ||
          r.blockers.some((b) => b.toLowerCase().includes(search.toLowerCase()))
      )
    : reports

  const activeReport = selectedReport ? reports.find((r) => r.id === selectedReport) : filtered[0]

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Left: report list */}
      <div className="w-80 shrink-0 bg-white border border-[#E2E8F0] rounded-xl flex flex-col overflow-hidden">
        <div className="p-3 border-b border-[#E2E8F0]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedReport(null) }}
              placeholder="Search reports..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-sm placeholder:text-[#94A3B8] focus:border-[#7C3AED] focus:outline-none transition-colors"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-[#94A3B8] text-sm">No reports match your search.</div>
          ) : (
            filtered.map((report) => {
              const isActive = activeReport?.id === report.id
              const date = new Date(report.date)
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`w-full text-left px-4 py-3 border-b border-[#E2E8F0] transition-colors ${
                    isActive ? 'bg-[#7C3AED]/10 border-l-2 border-l-[#7C3AED]' : 'hover:bg-[#F1F5F9]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isActive ? 'text-[#7C3AED]' : 'text-[#0F172A]'}`}>
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[#94A3B8] text-xs">
                      {date.toLocaleDateString('en-US', { year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[#64748B] text-xs line-clamp-2">{report.summary}</p>
                  {report.blockers.length > 0 && (
                    <span className="inline-block mt-1.5 text-[9px] font-semibold text-[#F87171] bg-[#F87171]/10 border border-[#F87171]/20 rounded px-1.5 py-0.5">
                      {report.blockers.length} blocker{report.blockers.length > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right: report detail */}
      <div className="flex-1 bg-white border border-[#E2E8F0] rounded-xl overflow-y-auto">
        {activeReport ? (
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading font-semibold text-xl text-[#0F172A]">
                  Daily Report — {new Date(activeReport.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#7C3AED]/10 flex items-center justify-center">
                  <FileText size={12} className="text-[#7C3AED]" />
                </div>
                <span className="text-[#64748B] text-sm">{activeReport.author} — Project Delivery Lead</span>
              </div>
            </div>

            <div>
              <p className="text-[#1E293B] text-sm leading-relaxed">{activeReport.summary}</p>
            </div>

            <div>
              <h4 className="text-[#0F172A] text-sm font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#7C3AED]" />
                Completed Today
              </h4>
              <ul className="space-y-2">
                {activeReport.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[#64748B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-1.5 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[#0F172A] text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#F87171]/20 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F87171]" />
                </span>
                Blockers
              </h4>
              {activeReport.blockers.length > 0 ? (
                <ul className="space-y-2">
                  {activeReport.blockers.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[#F87171]/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F87171] mt-1.5 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#94A3B8] text-sm italic">No blockers reported.</p>
              )}
            </div>

            <div>
              <h4 className="text-[#0F172A] text-sm font-semibold mb-3 flex items-center gap-2">
                <ChevronRight size={14} className="text-[#60A5FA]" />
                Plan for Tomorrow
              </h4>
              <ul className="space-y-2">
                {activeReport.tomorrow.map((t, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[#64748B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] mt-1.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {activeReport.pm_notes && (
              <div className="bg-[#7C3AED]/5 border-l-2 border-[#7C3AED] rounded-r-lg p-4">
                <h4 className="text-[#0F172A] text-sm font-semibold mb-2">
                  PM Notes
                </h4>
                <p className="text-[#64748B] text-sm leading-relaxed">{activeReport.pm_notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[#94A3B8] text-sm">
            Select a report to view.
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Codebase Tab
// ═══════════════════════════════════════════════════════════════════════════════

interface RepoFile {
  name: string
  type: 'file' | 'folder'
  size?: string
  lastCommit?: string
  children?: RepoFile[]
}

const DEMO_REPO: RepoFile[] = [
  { name: '.github', type: 'folder', lastCommit: 'ci: add preview deploy workflow', children: [
    { name: 'workflows', type: 'folder', children: [
      { name: 'ci.yml', type: 'file', size: '2.1 KB', lastCommit: 'ci: add preview deploy workflow' },
      { name: 'deploy.yml', type: 'file', size: '1.8 KB', lastCommit: 'ci: production deploy pipeline' },
    ]},
  ]},
  { name: 'src', type: 'folder', lastCommit: 'feat: complete admin dashboard views', children: [
    { name: 'api', type: 'folder', lastCommit: 'feat: add rate limiting middleware', children: [
      { name: 'auth.ts', type: 'file', size: '4.2 KB', lastCommit: 'feat: SSO integration (Okta + Azure AD)' },
      { name: 'middleware.ts', type: 'file', size: '1.9 KB', lastCommit: 'feat: add rate limiting middleware' },
      { name: 'routes.ts', type: 'file', size: '6.8 KB', lastCommit: 'feat: complete CRUD endpoints' },
    ]},
    { name: 'components', type: 'folder', lastCommit: 'fix: responsive layout on mobile', children: [
      { name: 'Dashboard.tsx', type: 'file', size: '8.4 KB', lastCommit: 'feat: complete admin dashboard views' },
      { name: 'DataTable.tsx', type: 'file', size: '5.1 KB', lastCommit: 'feat: sortable data table component' },
      { name: 'Layout.tsx', type: 'file', size: '2.3 KB', lastCommit: 'fix: responsive layout on mobile' },
      { name: 'Sidebar.tsx', type: 'file', size: '3.7 KB', lastCommit: 'feat: navigation with active states' },
    ]},
    { name: 'lib', type: 'folder', lastCommit: 'refactor: extract db helpers', children: [
      { name: 'db.ts', type: 'file', size: '3.2 KB', lastCommit: 'refactor: extract db helpers' },
      { name: 'utils.ts', type: 'file', size: '1.4 KB', lastCommit: 'feat: add date formatting utils' },
      { name: 'validators.ts', type: 'file', size: '2.8 KB', lastCommit: 'feat: input validation schemas' },
    ]},
    { name: 'app.tsx', type: 'file', size: '1.2 KB', lastCommit: 'feat: add router with auth guards' },
    { name: 'index.tsx', type: 'file', size: '0.4 KB', lastCommit: 'chore: initial project setup' },
  ]},
  { name: 'tests', type: 'folder', lastCommit: 'test: add E2E tests for auth flow', children: [
    { name: 'e2e', type: 'folder', children: [
      { name: 'auth.spec.ts', type: 'file', size: '3.6 KB', lastCommit: 'test: add E2E tests for auth flow' },
      { name: 'dashboard.spec.ts', type: 'file', size: '4.1 KB', lastCommit: 'test: dashboard E2E scenarios' },
    ]},
    { name: 'unit', type: 'folder', children: [
      { name: 'api.test.ts', type: 'file', size: '5.2 KB', lastCommit: 'test: API endpoint coverage' },
      { name: 'utils.test.ts', type: 'file', size: '2.1 KB', lastCommit: 'test: utility function tests' },
    ]},
  ]},
  { name: '.env.example', type: 'file', size: '0.3 KB', lastCommit: 'chore: add env template' },
  { name: '.gitignore', type: 'file', size: '0.2 KB', lastCommit: 'chore: initial project setup' },
  { name: 'package.json', type: 'file', size: '1.8 KB', lastCommit: 'chore: update dependencies' },
  { name: 'tsconfig.json', type: 'file', size: '0.6 KB', lastCommit: 'chore: strict TypeScript config' },
  { name: 'README.md', type: 'file', size: '3.4 KB', lastCommit: 'docs: add setup and deployment guide' },
]

function FileTree({ files, depth = 0 }: { files: RepoFile[]; depth?: number }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(depth === 0 ? ['src', '.github', 'tests'] : []))

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  // Sort: folders first, then files, alphabetical within each
  const sorted = [...files].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div>
      {sorted.map((file) => {
        const isFolder = file.type === 'folder'
        const isOpen = expanded.has(file.name)

        return (
          <div key={file.name}>
            <button
              onClick={() => isFolder && toggle(file.name)}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#F1F5F9] transition-colors text-left group"
              style={{ paddingLeft: `${16 + depth * 20}px` }}
            >
              {isFolder ? (
                <ChevronRight
                  size={12}
                  className={`text-[#94A3B8] shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
              ) : (
                <span className="w-3" />
              )}
              {isFolder ? (
                <Folder size={14} className="text-[#60A5FA] shrink-0" />
              ) : (
                <File size={14} className="text-[#64748B] shrink-0" />
              )}
              <span className={`text-sm flex-1 truncate ${isFolder ? 'text-[#0F172A] font-medium' : 'text-[#1E293B]'}`}>
                {file.name}
              </span>
              {file.lastCommit && (
                <span className="text-[#94A3B8] text-xs truncate max-w-[300px] hidden lg:block">
                  {file.lastCommit}
                </span>
              )}
              {file.size && (
                <span className="text-[#94A3B8] text-xs shrink-0 w-14 text-right">{file.size}</span>
              )}
            </button>
            {isFolder && isOpen && file.children && (
              <FileTree files={file.children} depth={depth + 1} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function CodebaseTab({ engagementTitle }: { engagementTitle: string }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      {/* Repo header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center">
            <GitBranch size={15} className="text-[#7C3AED]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-semibold text-[#0F172A] text-sm">Project Repository</h3>
              <span className="text-[10px] font-mono-brand text-[#7C3AED] bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded px-1.5 py-0.5">
                main
              </span>
            </div>
            <p className="text-[#94A3B8] text-xs mt-0.5">Read-only access — live codebase</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
            <span>147 commits</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GitBranch size={12} />
            <span>3 branches</span>
          </div>
          <div>Last push: 2h ago</div>
        </div>
      </div>

      {/* File tree header */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#94A3B8]">
        <span className="flex-1">Name</span>
        <span className="max-w-[300px] w-[300px] hidden lg:block">Last commit message</span>
        <span className="w-14 text-right">Size</span>
      </div>

      {/* File tree */}
      <div className="max-h-[500px] overflow-y-auto">
        <FileTree files={DEMO_REPO} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Agent Reports Tab
// ═══════════════════════════════════════════════════════════════════════════════

function AgentReportsTab({ engagementId }: { engagementId: string }) {
  const [assessments, setAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)

  useEffect(() => {
    loadAssessments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId])

  async function loadAssessments() {
    setLoading(true)
    try {
      const res = await fetch(`/api/agent/assessments?engagement_id=${engagementId}`)
      if (res.ok) {
        const data = await res.json()
        setAssessments(data.assessments ?? [])
        if (data.assessments?.length > 0) setSelected(data.assessments[0])
      }
    } catch (e) {
      console.error('Failed to load assessments:', e)
    }
    setLoading(false)
  }

  const [agentError, setAgentError] = useState<string | null>(null)

  async function handleOnDemand() {
    setRequesting(true)
    setAgentError(null)
    try {
      const res = await fetch('/api/agent/on-demand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engagement_id: engagementId }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        // Agent completed — reload assessments
        await loadAssessments()
      } else {
        setAgentError(data.error ?? `Request failed (${res.status})`)
      }
    } catch (e) {
      setAgentError(e instanceof Error ? e.message : 'On-demand request failed')
    }
    setRequesting(false)
  }

  const SEVERITY_ICONS: Record<string, { color: string; icon: string }> = {
    positive: { color: '#10B981', icon: '✓' },
    neutral: { color: '#64748B', icon: '•' },
    concern: { color: '#F59E0B', icon: '⚠' },
    critical: { color: '#EF4444', icon: '⛔' },
  }

  return (
    <div className="space-y-4">
      {/* Header with on-demand button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-semibold text-[#0F172A] text-sm flex items-center gap-2">
            <Hexagon size={14} className="text-[#7C3AED]" />
            Glassbox Agent · Independent Assessments
          </h3>
          <p className="text-[#94A3B8] text-xs mt-0.5">AI assessments of your project — independent of the PM&apos;s reporting.</p>
        </div>
        <button
          onClick={handleOnDemand}
          disabled={requesting}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7C3AED] text-white text-xs font-semibold rounded-lg hover:bg-[#8B5CF6] transition-colors disabled:opacity-50"
        >
          {requesting ? (
            <><Loader2 size={12} className="animate-spin" /> Analyzing...</>
          ) : (
            <><Hexagon size={12} /> Get Assessment</>
          )}
        </button>
      </div>

      {agentError && (
        <div className="flex items-start gap-2 text-[#EF4444] text-sm bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-4 py-3">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>{agentError}</span>
        </div>
      )}

      {requesting && (
        <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/20 rounded-xl p-5 text-center">
          <Loader2 size={24} className="text-[#7C3AED] animate-spin mx-auto mb-2" />
          <p className="text-[#0F172A] text-sm font-medium">Your Glassbox Agent is analyzing this engagement...</p>
          <p className="text-[#64748B] text-xs mt-1">This typically takes 10-15 seconds.</p>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center">
          <Loader2 size={24} className="text-[#7C3AED] animate-spin mx-auto mb-2" />
          <p className="text-[#64748B] text-sm">Loading agent assessments...</p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center">
          <Hexagon size={28} className="text-[#94A3B8] mx-auto mb-3" />
          <h4 className="font-heading font-semibold text-[#0F172A] text-base mb-1">No agent assessments yet</h4>
          <p className="text-[#64748B] text-sm mb-4">
            Click &quot;Get Assessment&quot; to run your Glassbox Agent now, or assessments will appear automatically based on your configured cadence.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Assessment list */}
          {assessments.map((a: any) => (
            <div
              key={a.id}
              className="bg-white border-l-4 border border-[#E2E8F0] rounded-xl p-5"
              style={{ borderLeftColor: '#7C3AED' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Hexagon size={14} className="text-[#7C3AED]" />
                    <span className="text-[#64748B] text-xs">
                      Glassbox Agent · {a.trigger_type === 'on_demand' ? 'On-demand' : 'Scheduled'} ·{' '}
                      {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[#0F172A] text-sm font-semibold leading-snug">{a.headline}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-mono-brand font-bold text-2xl" style={{ color: getHealthColor(a.weighted_score) }}>
                    {a.weighted_score}
                  </p>
                  {a.pm_submitted_score && Math.abs(a.weighted_score - a.pm_submitted_score) > 5 && (
                    <p className="text-[#94A3B8] text-[10px]">
                      PM score: {a.pm_submitted_score} · {a.weighted_score - a.pm_submitted_score > 0 ? '+' : ''}{a.weighted_score - a.pm_submitted_score} divergence
                    </p>
                  )}
                </div>
              </div>

              <p className="text-[#64748B] text-sm mb-4">{a.executive_summary}</p>

              {/* Findings */}
              {a.findings && (
                <div className="space-y-2 mb-4">
                  {(a.findings as any[]).map((f: any, i: number) => {
                    const sev = SEVERITY_ICONS[f.severity] ?? SEVERITY_ICONS.neutral
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs mt-0.5 shrink-0" style={{ color: sev.color }}>{sev.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#0F172A] text-xs font-medium">{f.title}</p>
                          <p className="text-[#64748B] text-xs">{f.detail}</p>
                          {f.pm_context && (
                            <div className="mt-1 ml-3 pl-3 border-l-2 border-[#7C3AED]/30">
                              <p className="text-[#7C3AED] text-[10px] font-medium">PM added context</p>
                              <p className="text-[#64748B] text-xs">{f.pm_context}</p>
                            </div>
                          )}
                          {!f.pm_context && (
                            <p className="text-[#94A3B8] text-[10px] mt-0.5 italic">No PM response</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Recommendation */}
              {a.recommendation && (
                <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/15 rounded-lg p-3">
                  <p className="text-[#0F172A] text-xs font-semibold mb-1">Recommendation</p>
                  <p className="text-[#64748B] text-xs">{a.recommendation}</p>
                </div>
              )}

              {/* PM response */}
              {a.pm_response && (
                <div className="mt-3 bg-[#F1F5F9] rounded-lg p-3">
                  <p className="text-[#0F172A] text-xs font-semibold mb-1">PM Response</p>
                  <p className="text-[#64748B] text-xs">{a.pm_response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
