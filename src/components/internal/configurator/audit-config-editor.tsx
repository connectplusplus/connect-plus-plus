'use client'

import { Input } from '@/components/ui/input'
import { Activity } from 'lucide-react'
import type {
  OutcomeTemplate,
  AuditConfigDefaults,
  ReportCadence,
  ReportTone,
} from '@/lib/types'
import { Field } from './_shared'

const DEFAULTS: AuditConfigDefaults = {
  priority_weights: { timeline: 8, quality: 10, scope: 7, communication: 6, velocity: 7 },
  alert_thresholds: { critical: 60, warning: 75 },
  report_cadence: 'every_2_days',
  report_tone: 'technical',
  pm_review_window_hours: 4,
}

type WeightKey = keyof AuditConfigDefaults['priority_weights']
const WEIGHT_KEYS: Array<{ key: WeightKey; label: string }> = [
  { key: 'timeline', label: 'Timeline' },
  { key: 'quality', label: 'Quality' },
  { key: 'scope', label: 'Scope' },
  { key: 'communication', label: 'Communication' },
  { key: 'velocity', label: 'Velocity' },
]

const CADENCE_OPTIONS: Array<{ key: ReportCadence; label: string }> = [
  { key: 'daily', label: 'Daily' },
  { key: 'every_2_days', label: 'Every 2 days' },
  { key: 'weekly', label: 'Weekly' },
]

const TONE_OPTIONS: Array<{ key: ReportTone; label: string }> = [
  { key: 'technical', label: 'Technical' },
  { key: 'balanced', label: 'Balanced' },
  { key: 'executive', label: 'Executive' },
]

interface Props {
  template: OutcomeTemplate
  onChange: (patch: Partial<OutcomeTemplate>) => void
}

export function AuditConfigEditor({ template, onChange }: Props) {
  // Hydrate from defaults so the controls always have valid values to render.
  const cfg: AuditConfigDefaults = {
    ...DEFAULTS,
    ...(template.audit_config_defaults ?? {}),
    priority_weights: {
      ...DEFAULTS.priority_weights,
      ...(template.audit_config_defaults?.priority_weights ?? {}),
    },
    alert_thresholds: {
      ...DEFAULTS.alert_thresholds,
      ...(template.audit_config_defaults?.alert_thresholds ?? {}),
    },
  }

  function update(p: Partial<AuditConfigDefaults>) {
    onChange({ audit_config_defaults: { ...cfg, ...p } })
  }

  function setWeight(k: WeightKey, v: number) {
    update({ priority_weights: { ...cfg.priority_weights, [k]: v } })
  }

  function setThreshold(k: 'critical' | 'warning', v: number) {
    update({ alert_thresholds: { ...cfg.alert_thresholds, [k]: v } })
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#06B6D4]/5 border border-[#06B6D4]/20 rounded-lg px-3 py-2 flex items-center gap-2">
        <Activity size={12} className="text-[#0891B2] shrink-0" />
        <p className="text-[#0891B2] text-xs">
          Becomes the agent_configs default for engagements created from this template.
          Clients can override at engagement time.
        </p>
      </div>

      {/* ── Priority weights ────────────────────────────────────────────── */}
      <Field
        label="Priority weights"
        hint="The Glassbox Agent weights its health score using these. Each must be 1–10."
      >
        <div className="space-y-2">
          {WEIGHT_KEYS.map(({ key, label }) => {
            const v = cfg.priority_weights[key]
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-[#0F172A] text-sm w-32 shrink-0">{label}</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={v}
                  onChange={(e) => setWeight(key, Number(e.target.value))}
                  className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full appearance-none cursor-pointer accent-[#7C3AED]"
                />
                <span className="font-mono-brand text-sm font-semibold text-[#7C3AED] w-10 text-right">
                  {v}/10
                </span>
              </div>
            )
          })}
        </div>
      </Field>

      {/* ── Alert thresholds ────────────────────────────────────────────── */}
      <Field
        label="Alert thresholds"
        hint="Score below critical triggers a PM bypass — Agent publishes directly to client. Critical must be < warning."
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[#64748B] text-xs">Critical (default 60)</label>
            <Input
              type="number"
              min={1}
              max={100}
              value={cfg.alert_thresholds.critical}
              onChange={(e) => setThreshold('critical', Number(e.target.value))}
              className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#7C3AED]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[#64748B] text-xs">Warning (default 75)</label>
            <Input
              type="number"
              min={1}
              max={100}
              value={cfg.alert_thresholds.warning}
              onChange={(e) => setThreshold('warning', Number(e.target.value))}
              className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#7C3AED]"
            />
          </div>
        </div>
        {cfg.alert_thresholds.critical >= cfg.alert_thresholds.warning && (
          <p className="text-[#F59E0B] text-xs">
            critical must be less than warning to publish.
          </p>
        )}
      </Field>

      {/* ── Cadence + tone ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6">
        <Field label="Report cadence" hint="How often the Agent posts to the client.">
          <div className="space-y-1.5">
            {CADENCE_OPTIONS.map((opt) => (
              <RadioRow
                key={opt.key}
                checked={cfg.report_cadence === opt.key}
                onChange={() => update({ report_cadence: opt.key })}
                label={opt.label}
              />
            ))}
          </div>
        </Field>
        <Field label="Report tone" hint="Voice the Agent uses in its written assessments.">
          <div className="space-y-1.5">
            {TONE_OPTIONS.map((opt) => (
              <RadioRow
                key={opt.key}
                checked={cfg.report_tone === opt.key}
                onChange={() => update({ report_tone: opt.key })}
                label={opt.label}
              />
            ))}
          </div>
        </Field>
      </div>

      {/* ── PM review window ───────────────────────────────────────────── */}
      <Field
        label="PM review window (hours)"
        hint="If the PM doesn't review within this window, the Agent publishes the assessment automatically."
      >
        <Input
          type="number"
          min={1}
          max={24}
          value={cfg.pm_review_window_hours}
          onChange={(e) => update({ pm_review_window_hours: Number(e.target.value) || 4 })}
          className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand focus:border-[#7C3AED] max-w-[120px]"
        />
      </Field>
    </div>
  )
}

function RadioRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
        checked
          ? 'bg-[#7C3AED]/5 border-[#7C3AED] text-[#7C3AED]'
          : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
      }`}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="accent-[#7C3AED]"
      />
      {label}
    </label>
  )
}
