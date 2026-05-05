'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Save, Eye, Send, ChevronRight } from 'lucide-react'
import type { OutcomeTemplate, TemplateStatus } from '@/lib/types'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pricing-timeline', label: 'Pricing & Timeline' },
  { id: 'deliverables', label: 'Deliverables' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'intake-form', label: 'Intake form' },
  { id: 'delivery-config', label: 'Delivery config', tag: 'L3' as const },
  { id: 'audit-config', label: 'Audit config', tag: 'L1.5' as const },
  { id: 'guarantees', label: 'Guarantees' },
  { id: 'review', label: 'Review & publish' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

const STATUS_PILL: Record<TemplateStatus, { color: string; bg: string; label: string }> = {
  published: { color: '#10B981', bg: '#10B98115', label: 'Published' },
  draft: { color: '#F59E0B', bg: '#F59E0B15', label: 'Draft' },
  archived: { color: '#94A3B8', bg: '#94A3B815', label: 'Archived' },
}

interface Props {
  template: OutcomeTemplate & { internal_users: { full_name: string } | null }
  currentUserName: string
}

export function ConfiguratorShell({ template, currentUserName }: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview')

  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash.replace('#', '') as SectionId
      if (SECTIONS.some((s) => s.id === hash)) {
        setActiveSection(hash)
      } else {
        setActiveSection('overview')
      }
    }
    syncFromHash()
    window.addEventListener('hashchange', syncFromHash)
    return () => window.removeEventListener('hashchange', syncFromHash)
  }, [])

  const status = (template.status ?? 'draft') as TemplateStatus
  const pill = STATUS_PILL[status]
  const lastSavedAt = template.updated_at ?? template.created_at
  const lastSavedBy = template.internal_users?.full_name ?? currentUserName

  return (
    <div className="-m-6 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono-brand text-[10px] uppercase tracking-widest text-[#94A3B8]">
              FullStack
            </span>
            <span className="text-[#E2E8F0]">|</span>
            <span className="font-heading font-semibold text-sm text-[#0F172A]">
              GLASSBOX
            </span>
          </div>
          <span className="text-[#E2E8F0]">·</span>
          <nav className="flex items-center gap-1.5 text-xs text-[#64748B] min-w-0">
            <span className="text-[#94A3B8]">Configurator</span>
            <ChevronRight size={11} className="text-[#CBD5E1] shrink-0" />
            <Link href="/internal/outcomes" className="hover:text-[#0F172A] transition-colors">
              Outcomes
            </Link>
            <ChevronRight size={11} className="text-[#CBD5E1] shrink-0" />
            <span className="text-[#0F172A] truncate">{template.title}</span>
          </nav>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
            style={{ color: pill.color, backgroundColor: pill.bg }}
          >
            {pill.label}
          </span>
          <span className="font-mono-brand text-[11px] text-[#94A3B8] shrink-0">
            v{template.version ?? '1.0.0'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            disabled
            title="Section editors land in Phase 4"
            className="text-[#64748B] hover:text-[#0F172A] h-9 px-3"
          >
            <Save size={13} className="mr-1.5" />
            Save
          </Button>
          <a
            href={`/marketplace/outcomes/${template.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-[#64748B] hover:text-[#0F172A] text-xs font-medium h-9 px-3 rounded-md hover:bg-[#F1F5F9] transition-colors"
          >
            <Eye size={13} className="mr-1.5" />
            Preview
          </a>
          <Button
            size="sm"
            disabled
            title="Publish flow lands in Phase 5"
            className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold h-9 px-4"
          >
            <Send size={13} className="mr-1.5" />
            Publish
          </Button>
        </div>
      </div>

      {/* ── Body: left rail + main ─────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">
        {/* Left rail */}
        <aside className="w-60 bg-white border-r border-[#E2E8F0] flex flex-col shrink-0">
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {SECTIONS.map((section) => {
              const active = activeSection === section.id
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#7C3AED]/10 text-[#7C3AED]'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <span>{section.label}</span>
                  {'tag' in section && section.tag && (
                    <span
                      className={`font-mono-brand text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                        section.tag === 'L1.5'
                          ? 'bg-[#06B6D4]/10 text-[#0891B2]'
                          : 'bg-[#94A3B8]/10 text-[#64748B]'
                      }`}
                    >
                      {section.tag}
                    </span>
                  )}
                </a>
              )
            })}
          </nav>
          <div className="px-4 py-3 border-t border-[#E2E8F0]">
            <p className="text-[#94A3B8] text-[10px] uppercase tracking-widest font-medium mb-1">
              Last saved
            </p>
            <p className="text-[#64748B] text-xs">
              {new Date(lastSavedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
            <p className="text-[#94A3B8] text-[11px]">by {lastSavedBy}</p>
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-8">
          <div className="max-w-3xl mx-auto">
            <SectionPlaceholder section={activeSection} template={template} />
          </div>
        </main>
      </div>
    </div>
  )
}

function SectionPlaceholder({
  section,
  template,
}: {
  section: SectionId
  template: OutcomeTemplate
}) {
  const meta = SECTIONS.find((s) => s.id === section)!
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-heading font-bold text-2xl text-[#0F172A]">{meta.label}</h1>
          {'tag' in meta && meta.tag && (
            <span
              className={`font-mono-brand text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                meta.tag === 'L1.5'
                  ? 'bg-[#06B6D4]/10 text-[#0891B2]'
                  : 'bg-[#94A3B8]/10 text-[#64748B]'
              }`}
            >
              {meta.tag}
            </span>
          )}
        </div>
        <p className="text-[#64748B] text-sm">{describeSection(section)}</p>
      </div>

      <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-12 text-center">
        <p className="text-[#94A3B8] text-sm">Section editor coming next.</p>
        <p className="text-[#CBD5E1] text-xs mt-1">
          Editing template <span className="font-mono-brand">{template.slug}</span>
        </p>
      </div>
    </div>
  )
}

function describeSection(id: SectionId): string {
  switch (id) {
    case 'overview':
      return 'Title, subtitle, long-form description, icon, and category. The marketing surface for this outcome.'
    case 'pricing-timeline':
      return 'Pricing model and timeline ranges. Drives the L1 marketplace card and detail page.'
    case 'deliverables':
      return 'What clients receive. Each deliverable carries its own acceptance criteria. Minimum 3 to publish.'
    case 'milestones':
      return 'How the engagement unfolds. Acceptance criteria are client-facing; expected signals feed the L1.5 audit.'
    case 'intake-form':
      return 'Custom fields the client fills in at purchase. Output renders inside the existing IntakeForm component.'
    case 'delivery-config':
      return 'Internal-only — typical team, AI agents, toolchain, environment template. Never surfaces to clients.'
    case 'audit-config':
      return 'Becomes the agent_configs default for engagements created from this template. Clients can override at engagement time.'
    case 'guarantees':
      return 'Client-facing badges shown in the L1 sidebar. Minimum 2 to publish.'
    case 'review':
      return 'Read-only preview + validation panel. Publishing increments the version and adds a changelog entry.'
  }
}
