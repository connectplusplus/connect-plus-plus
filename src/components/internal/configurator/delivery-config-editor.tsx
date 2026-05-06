'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Lock, Plus } from 'lucide-react'
import type {
  OutcomeTemplate,
  DeliveryConfig,
  TeamRole,
  TeamRoleKey,
  AgentSpec,
  ToolchainSpec,
} from '@/lib/types'
import { Field, ItemControls, arrayMove } from './_shared'

const ROLE_KEYS: TeamRoleKey[] = [
  'forward_deployed_engineer',
  'product_designer',
  'ai_engineer',
  'qa_engineer',
  'devops_engineer',
  'pm',
]

const SENIORITIES = ['junior', 'mid', 'senior', 'principal', 'staff'] as const

const AGENT_TOOLS = [
  'claude_code',
  'cursor',
  'windsurf',
  'github_copilot',
] as const

type ToolchainKey = keyof ToolchainSpec
const TOOLCHAIN_FIELDS: Array<{ key: ToolchainKey; label: string; placeholder: string }> = [
  { key: 'language', label: 'Languages', placeholder: 'TypeScript' },
  { key: 'frameworks', label: 'Frameworks', placeholder: 'Next.js' },
  { key: 'testing', label: 'Testing', placeholder: 'Playwright' },
  { key: 'ci_cd', label: 'CI/CD', placeholder: 'GitHub Actions' },
  { key: 'hosting', label: 'Hosting', placeholder: 'Vercel' },
  { key: 'monitoring', label: 'Monitoring', placeholder: 'Datadog' },
]

const EMPTY_TOOLCHAIN: ToolchainSpec = {
  language: [],
  frameworks: [],
  testing: [],
  ci_cd: [],
  hosting: [],
  monitoring: [],
}

interface Props {
  template: OutcomeTemplate
  onChange: (patch: Partial<OutcomeTemplate>) => void
}

export function DeliveryConfigEditor({ template, onChange }: Props) {
  const cfg: DeliveryConfig = template.delivery_config ?? {
    typical_team: [],
    ai_agents: [],
    toolchain: EMPTY_TOOLCHAIN,
  }

  function update(p: Partial<DeliveryConfig>) {
    onChange({ delivery_config: { ...cfg, ...p } })
  }

  // ── Team ─────────────────────────────────────────────────────────────────
  const team = cfg.typical_team ?? []

  function addRole() {
    update({
      typical_team: [
        ...team,
        { role: 'forward_deployed_engineer', count: 1, seniority: 'senior', allocation_percent: 100 },
      ],
    })
  }
  function patchRole(i: number, p: Partial<TeamRole>) {
    update({ typical_team: team.map((r, idx) => (idx === i ? { ...r, ...p } : r)) })
  }
  function removeRole(i: number) {
    update({ typical_team: team.filter((_, idx) => idx !== i) })
  }
  function moveRole(from: number, to: number) {
    update({ typical_team: arrayMove(team, from, to) })
  }

  // ── Agents ───────────────────────────────────────────────────────────────
  const agents = cfg.ai_agents ?? []

  function addAgent() {
    update({ ai_agents: [...agents, { tool: 'claude_code' }] })
  }
  function patchAgent(i: number, p: Partial<AgentSpec>) {
    update({ ai_agents: agents.map((a, idx) => (idx === i ? { ...a, ...p } : a)) })
  }
  function removeAgent(i: number) {
    update({ ai_agents: agents.filter((_, idx) => idx !== i) })
  }

  // ── Toolchain ────────────────────────────────────────────────────────────
  const toolchain = cfg.toolchain ?? EMPTY_TOOLCHAIN

  function patchToolchain(key: ToolchainKey, values: string[]) {
    update({ toolchain: { ...toolchain, [key]: values } })
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#94A3B8]/10 border border-[#94A3B8]/20 rounded-lg px-3 py-2 flex items-center gap-2">
        <Lock size={12} className="text-[#64748B] shrink-0" />
        <p className="text-[#64748B] text-xs">
          Internal only — never surfaces to clients. Powers L3 delivery routing.
        </p>
      </div>

      {/* ── Typical team ────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader
          label="Typical team"
          hint="Roles that make up the engagement squad. Need ≥1 to publish."
        />

        {team.length === 0 && (
          <p className="text-[#94A3B8] text-xs italic">No roles yet.</p>
        )}

        <div className="space-y-2">
          {team.map((r, i) => (
            <div
              key={i}
              className="bg-white border border-[#E2E8F0] rounded-lg p-3 flex items-center gap-2"
            >
              <select
                value={r.role}
                onChange={(e) => patchRole(i, { role: e.target.value as TeamRoleKey })}
                className="bg-[#F1F5F9] border border-[#E2E8F0] rounded h-8 px-2 text-xs text-[#0F172A] focus:border-[#7C3AED] focus:outline-none flex-1 min-w-0 font-mono-brand"
              >
                {ROLE_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <select
                value={r.seniority}
                onChange={(e) => patchRole(i, { seniority: e.target.value as TeamRole['seniority'] })}
                className="bg-[#F1F5F9] border border-[#E2E8F0] rounded h-8 px-2 text-xs text-[#0F172A] focus:border-[#7C3AED] focus:outline-none w-28 font-mono-brand"
              >
                {SENIORITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                value={r.count}
                onChange={(e) => patchRole(i, { count: Number(e.target.value) || 1 })}
                min={1}
                max={20}
                className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand h-8 w-16 text-xs focus:border-[#7C3AED]"
                title="Headcount"
              />
              <Input
                type="number"
                value={r.allocation_percent}
                onChange={(e) =>
                  patchRole(i, { allocation_percent: Number(e.target.value) || 0 })
                }
                min={1}
                max={100}
                className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand h-8 w-20 text-xs focus:border-[#7C3AED]"
                title="Allocation %"
              />
              <span className="text-[10px] text-[#94A3B8] -ml-1">%</span>
              <ItemControls
                index={i}
                count={team.length}
                onMove={moveRole}
                onRemove={removeRole}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRole}
          className="flex items-center gap-1 text-[#7C3AED] text-xs font-semibold hover:bg-[#7C3AED]/5 rounded px-2 py-1"
        >
          <Plus size={11} /> Add role
        </button>
      </section>

      {/* ── AI agents ───────────────────────────────────────────────────── */}
      <section className="space-y-3 pt-4 border-t border-[#E2E8F0]">
        <SectionHeader
          label="AI agents"
          hint="Tooling used by the engineers on this engagement."
        />

        {agents.length === 0 && (
          <p className="text-[#94A3B8] text-xs italic">No agents yet.</p>
        )}

        <div className="space-y-2">
          {agents.map((a, i) => (
            <div
              key={i}
              className="bg-white border border-[#E2E8F0] rounded-lg p-3 flex items-center gap-2"
            >
              <select
                value={a.tool}
                onChange={(e) =>
                  patchAgent(i, { tool: e.target.value as AgentSpec['tool'] })
                }
                className="bg-[#F1F5F9] border border-[#E2E8F0] rounded h-8 px-2 text-xs text-[#0F172A] focus:border-[#7C3AED] focus:outline-none w-44 font-mono-brand"
              >
                {AGENT_TOOLS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <Input
                value={a.prompt_library_ref ?? ''}
                onChange={(e) =>
                  patchAgent(i, { prompt_library_ref: e.target.value || undefined })
                }
                placeholder="prompt_library_ref (optional)"
                className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand h-8 text-xs flex-1 focus:border-[#7C3AED]"
              />
              <button
                type="button"
                onClick={() => removeAgent(i)}
                className="text-[#94A3B8] hover:text-[#EF4444] transition-colors p-1"
                aria-label="Remove agent"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addAgent}
          className="flex items-center gap-1 text-[#7C3AED] text-xs font-semibold hover:bg-[#7C3AED]/5 rounded px-2 py-1"
        >
          <Plus size={11} /> Add agent
        </button>
      </section>

      {/* ── Toolchain ──────────────────────────────────────────────────── */}
      <section className="space-y-3 pt-4 border-t border-[#E2E8F0]">
        <SectionHeader
          label="Toolchain"
          hint="Languages, frameworks, and infrastructure used on this engagement."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TOOLCHAIN_FIELDS.map((tf) => (
            <ChipsField
              key={tf.key}
              label={tf.label}
              placeholder={tf.placeholder}
              values={(toolchain[tf.key] ?? []) as string[]}
              onChange={(values) => patchToolchain(tf.key, values)}
            />
          ))}
        </div>
      </section>

      {/* ── Misc fields ────────────────────────────────────────────────── */}
      <section className="space-y-4 pt-4 border-t border-[#E2E8F0]">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Environment template ID">
            <Input
              value={cfg.environment_template_id ?? ''}
              onChange={(e) =>
                update({ environment_template_id: e.target.value || undefined })
              }
              placeholder="env_testing_v2"
              className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#7C3AED]"
            />
          </Field>
          <Field label="Expected velocity multiplier" hint="e.g. 2.4 for 2.4× baseline.">
            <Input
              type="number"
              step="0.1"
              value={cfg.expected_velocity_multiplier ?? ''}
              onChange={(e) =>
                update({
                  expected_velocity_multiplier: Number(e.target.value) || undefined,
                })
              }
              placeholder="2.4"
              className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#7C3AED]"
            />
          </Field>
        </div>

        <Field label="Internal runbook URL" hint="Optional link to the delivery runbook.">
          <Input
            value={cfg.internal_runbook_url ?? ''}
            onChange={(e) => update({ internal_runbook_url: e.target.value || undefined })}
            placeholder="https://runbooks.fullstacklabs.co/..."
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED]"
          />
        </Field>

        <Field label="Internal notes" hint="Free-form notes for the delivery team.">
          <Textarea
            value={cfg.internal_notes ?? ''}
            onChange={(e) => update({ internal_notes: e.target.value || undefined })}
            rows={3}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] resize-none"
          />
        </Field>
      </section>
    </div>
  )
}

function ChipsField({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string
  placeholder: string
  values: string[]
  onChange: (next: string[]) => void
}) {
  const [v, setV] = useState('')

  function add() {
    const next = v.trim()
    if (!next) return
    if (values.includes(next)) {
      setV('')
      return
    }
    onChange([...values, next])
    setV('')
  }

  function removeAt(i: number) {
    onChange(values.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-[#64748B] text-[11px] font-medium">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {values.map((val, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0] font-mono-brand"
          >
            {val}
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="hover:text-[#EF4444] transition-colors"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          className="bg-white border-[#E2E8F0] text-[#0F172A] h-8 text-xs focus:border-[#7C3AED]"
        />
        <button
          type="button"
          onClick={add}
          disabled={!v.trim()}
          className="text-[#7C3AED] text-xs font-semibold px-2 h-8 rounded hover:bg-[#7C3AED]/5 disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  )
}

function SectionHeader({ label, hint }: { label: string; hint?: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#0F172A]">{label}</p>
      {hint && <p className="text-[#94A3B8] text-xs mt-0.5">{hint}</p>}
    </div>
  )
}
