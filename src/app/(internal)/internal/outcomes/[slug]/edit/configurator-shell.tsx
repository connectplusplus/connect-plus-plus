'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Save, Eye, Send, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { OverviewEditor } from '@/components/internal/configurator/overview-editor'
import { PricingTimelineEditor } from '@/components/internal/configurator/pricing-timeline-editor'
import { DeliverablesEditor } from '@/components/internal/configurator/deliverables-editor'
import { MilestonesEditor } from '@/components/internal/configurator/milestones-editor'
import { IntakeFormEditor } from '@/components/internal/configurator/intake-form-editor'
import { DeliveryConfigEditor } from '@/components/internal/configurator/delivery-config-editor'
import { AuditConfigEditor } from '@/components/internal/configurator/audit-config-editor'
import { GuaranteesEditor } from '@/components/internal/configurator/guarantees-editor'
import { ReviewPublish } from '@/components/internal/configurator/review-publish'
import { saveTemplate, publishTemplate } from '../../actions'
import { validateForPublish, bumpVersion } from '@/lib/configurator/validation'
import type {
  OutcomeTemplate,
  OutcomeCategoryRow,
  TemplateStatus,
} from '@/lib/types'

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

// Every field the Configurator's section editors can mutate. The Save action
// sends only this subset to the server.
const EDITABLE_FIELDS: Array<keyof OutcomeTemplate> = [
  'title',
  'subtitle',
  'description',
  'icon',
  'category',
  'pricing',
  'timeline',
  'price_range_low',
  'price_range_high',
  'timeline_range_low',
  'timeline_range_high',
  'deliverables',
  'milestone_templates',
  'intake_schema',
  'delivery_config',
  'audit_config_defaults',
  'guarantees',
]

function pickEditable(t: OutcomeTemplate): Partial<OutcomeTemplate> {
  const out: Partial<OutcomeTemplate> = {}
  for (const k of EDITABLE_FIELDS) {
    // @ts-expect-error indexed assignment of heterogeneous keys
    out[k] = t[k]
  }
  return out
}

interface Props {
  template: OutcomeTemplate & { internal_users: { full_name: string } | null }
  categories: OutcomeCategoryRow[]
  currentUserName: string
}

export function ConfiguratorShell({ template, categories, currentUserName }: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview')
  const [local, setLocal] = useState<OutcomeTemplate>(template)
  const [server, setServer] = useState<OutcomeTemplate>(template)
  const [lastSavedAt, setLastSavedAt] = useState<string>(
    template.updated_at ?? template.created_at
  )
  const [lastSavedBy, setLastSavedBy] = useState<string>(
    template.internal_users?.full_name ?? currentUserName
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

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

  const dirty =
    JSON.stringify(pickEditable(local)) !== JSON.stringify(pickEditable(server))

  function handleChange(patch: Partial<OutcomeTemplate>) {
    setLocal((prev) => ({ ...prev, ...patch }))
    setSaveError(null)
  }

  function handleSave() {
    if (!dirty || pending) return
    startTransition(async () => {
      const result = await saveTemplate(local.id, pickEditable(local))
      if (result.error) {
        setSaveError(result.error)
        return
      }
      setServer(local)
      setLastSavedAt(new Date().toISOString())
      setLastSavedBy(currentUserName)
    })
  }

  const validation = validateForPublish(server)
  const nextVersion = bumpVersion(local.version ?? '1.0.0')
  const canPublish = !dirty && validation.ok && !pending

  function handlePublish() {
    if (!canPublish) return
    startTransition(async () => {
      const result = await publishTemplate(local.id)
      if (result.errors) {
        toast.error(`${result.errors.length} validation issue${result.errors.length === 1 ? '' : 's'} blocked publishing.`)
        // Surface the first error in the persistent banner too
        setSaveError(result.errors[0]?.message ?? 'Validation failed')
        return
      }
      if (result.error) {
        toast.error(result.error)
        setSaveError(result.error)
        return
      }
      if (result.ok && result.version) {
        const next = { ...local, status: 'published' as TemplateStatus, version: result.version, published_at: new Date().toISOString() }
        setLocal(next)
        setServer(next)
        setLastSavedAt(new Date().toISOString())
        setLastSavedBy(currentUserName)
        toast.success(`Published v${result.version}`)
      }
    })
  }

  const status = (local.status ?? 'draft') as TemplateStatus
  const pill = STATUS_PILL[status]

  const publishTooltip = dirty
    ? 'Save your changes first'
    : !validation.ok
      ? `${validation.errors.length} issue${validation.errors.length === 1 ? '' : 's'} to resolve — see Review & publish`
      : `Publish v${nextVersion}`

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
            <span className="text-[#0F172A] truncate">{local.title}</span>
          </nav>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
            style={{ color: pill.color, backgroundColor: pill.bg }}
          >
            {pill.label}
          </span>
          <span className="font-mono-brand text-[11px] text-[#94A3B8] shrink-0">
            v{local.version ?? '1.0.0'}
          </span>
          {dirty && (
            <span className="font-mono-brand text-[10px] text-[#F59E0B] shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] inline-block" />
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={!dirty || pending}
            className="text-[#64748B] hover:text-[#0F172A] h-9 px-3"
          >
            {pending ? (
              <Loader2 size={13} className="mr-1.5 animate-spin" />
            ) : (
              <Save size={13} className="mr-1.5" />
            )}
            Save
          </Button>
          <a
            href={`/marketplace/outcomes/${local.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-[#64748B] hover:text-[#0F172A] text-xs font-medium h-9 px-3 rounded-md hover:bg-[#F1F5F9] transition-colors"
          >
            <Eye size={13} className="mr-1.5" />
            Preview
          </a>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={!canPublish}
            title={publishTooltip}
            className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold h-9 px-4 disabled:opacity-50"
          >
            <Send size={13} className="mr-1.5" />
            {validation.ok && !dirty ? `Publish v${nextVersion}` : 'Publish'}
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="bg-[#F87171]/10 border-b border-[#F87171]/20 px-6 py-2 text-[#B91C1C] text-xs shrink-0">
          Save failed: {saveError}
        </div>
      )}

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
            <SectionHeader section={activeSection} />
            <ActiveEditor
              section={activeSection}
              template={local}
              categories={categories}
              dirty={dirty}
              onChange={handleChange}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

function SectionHeader({ section }: { section: SectionId }) {
  const meta = SECTIONS.find((s) => s.id === section)!
  return (
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
  )
}

function ActiveEditor({
  section,
  template,
  categories,
  dirty,
  onChange,
}: {
  section: SectionId
  template: OutcomeTemplate
  categories: OutcomeCategoryRow[]
  dirty: boolean
  onChange: (patch: Partial<OutcomeTemplate>) => void
}) {
  switch (section) {
    case 'overview':
      return (
        <OverviewEditor
          template={template}
          categories={categories}
          onChange={onChange}
        />
      )
    case 'pricing-timeline':
      return <PricingTimelineEditor template={template} onChange={onChange} />
    case 'deliverables':
      return <DeliverablesEditor template={template} onChange={onChange} />
    case 'milestones':
      return <MilestonesEditor template={template} onChange={onChange} />
    case 'intake-form':
      return <IntakeFormEditor template={template} onChange={onChange} />
    case 'delivery-config':
      return <DeliveryConfigEditor template={template} onChange={onChange} />
    case 'audit-config':
      return <AuditConfigEditor template={template} onChange={onChange} />
    case 'guarantees':
      return <GuaranteesEditor template={template} onChange={onChange} />
    case 'review':
      return <ReviewPublish template={template} dirty={dirty} />
  }
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
