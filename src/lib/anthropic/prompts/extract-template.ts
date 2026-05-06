// System + user prompts for the smart-intake extraction call.
//
// The system prompt is large (~5K tokens) but stable across calls — we mark
// it for ephemeral prompt caching so repeat extractions in the same hour
// pay near-zero on the system content.

import { CANONICAL_EXAMPLE_JSON } from '../canonical-example'

// MUST be kept in sync with src/lib/types.ts. We embed the relevant L2
// interfaces directly (not the file's full contents) so Claude sees a
// focused, compilable type contract.
const SCHEMA_TS = `
type CategoryKey = string;  // matches a key in the outcome_categories table

type SignalSource =
  | 'github' | 'linear' | 'jira' | 'slack' | 'daily_report' | 'ci' | 'manual';

interface OutcomeTemplate {
  slug: string;                    // url-safe key, kebab-case
  title: string;                   // 8–80 chars
  subtitle: string;                // 20–140 chars
  description: string;             // 80–600 chars; markdown allowed
  icon: string;                    // one of: BarChart3, Beaker, Bot, Brain,
                                   // CircuitBoard, Cloud, Cpu, Database,
                                   // GitBranch, Globe, Layers, LineChart,
                                   // Rocket, Shield, ShieldCheck, Sparkles,
                                   // TestTube, Wand, Workflow, Zap
  category: CategoryKey;
  status: 'draft';                 // always 'draft' from this extractor
  version: '0.1.0';                // always '0.1.0' from this extractor
  published_at: null;              // always null from this extractor

  pricing: {
    model: 'fixed_range' | 'starting_at' | 'custom';
    min: number;                   // CENTS, integer
    max: number;                   // CENTS, integer; min < max with at least 2x spread
    currency: 'USD';
    notes: string;
  };
  timeline: {
    min_days: number;
    max_days: number;              // min_days < max_days
    unit: 'business_days' | 'calendar_days' | 'weeks';
    starts_from: 'kickoff' | 'contract_signed' | 'intake_completed';
    notes: string;
  };

  deliverables: Deliverable[];           // ≥3
  milestone_templates: MilestoneTemplate[];  // ≥3, EVERY one needs ≥1 required signal
  intake_schema: { fields: IntakeField[] };  // ≥2 fields
  delivery_config: DeliveryConfig;
  audit_config_defaults: AuditConfigDefaults;
  guarantees: Guarantee[];               // ≥2
}

interface Deliverable {
  id: string;                      // kebab-case identifier, e.g. "d1", "d2"
  order: number;                   // 1-indexed
  name: string;
  description?: string;
  acceptance_criteria: string[];   // verifiable, binary, client-readable
}

interface MilestoneTemplate {
  id: string;                      // e.g. "m1"
  order: number;                   // 1-indexed
  name: string;                    // a named outcome, not a task list
  duration: { min_days: number; max_days: number; fixed_label?: string };
  description: string;             // one client-facing line
  acceptance_criteria: string[];   // ≥1; client-facing
  expected_signals: SignalSpec[];  // ≥1 with required: true; audit-facing
}

interface SignalSpec {
  source: SignalSource;
  signature: string;               // snake_case, machine-checkable
  required: boolean;
  description?: string;
}

interface IntakeField {
  id: string;                      // e.g. "if1"
  order: number;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'url' | 'select' | 'multiselect' | 'number';
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: string[];              // for select / multiselect
  validation?: string;
  maps_to?: string;                // dot-path into engagement.intake_responses
}

interface DeliveryConfig {
  typical_team: Array<{
    role: 'forward_deployed_engineer' | 'product_designer' | 'ai_engineer'
        | 'qa_engineer' | 'devops_engineer' | 'pm';
    count: number;
    seniority: 'junior' | 'mid' | 'senior' | 'principal' | 'staff';
    allocation_percent: number;
  }>;
  ai_agents: Array<{
    tool: 'claude_code' | 'cursor' | 'windsurf' | 'github_copilot';
    prompt_library_ref?: string;
  }>;
  toolchain: {
    language: string[]; frameworks: string[]; testing: string[];
    ci_cd: string[]; hosting: string[]; monitoring: string[];
  };
  environment_template_id?: string;
  expected_velocity_multiplier?: number;
  internal_runbook_url?: string;
  internal_notes?: string;
}

interface AuditConfigDefaults {
  priority_weights: {
    timeline: number;     // 1..10
    quality: number;
    scope: number;
    communication: number;
    velocity: number;
  };
  alert_thresholds: { critical: number; warning: number };  // critical < warning
  report_cadence: 'daily' | 'every_2_days' | 'weekly';
  report_tone: 'technical' | 'executive' | 'balanced';
  pm_review_window_hours: number;  // 1..24
}

interface Guarantee {
  id: string;                      // e.g. "g1"
  label: string;
  description?: string;
  icon: string;                    // same icon set as OutcomeTemplate.icon
}
`.trim()

const RULES_OF_THUMB = `
RULES OF THUMB

A good acceptance criterion is:
  - Verifiable: someone can check whether it happened
  - Binary: it's done or it isn't
  - Client-readable: written in the client's language, not engineering jargon

A good expected signal is:
  - Machine-checkable: the source can confirm it (github, ci, slack, etc.)
  - Snake_case signature: e.g. pr_merged_to_main, client_signoff_received
  - Mapped to a real source the Glassbox Agent watches
  - Marked required: true when its absence would mean the milestone failed

A good milestone is:
  - A named outcome, not a task list ("Build Phase", not "PR #1, PR #2, PR #3")
  - Has a duration matched to its scope (1-day kickoffs, multi-day build phases)
  - Carries both client-facing acceptance criteria AND audit-facing signals

A good deliverable is:
  - Something the client receives at end of engagement
  - Distinct from milestones (which are time-bounded phases of work)
  - Has acceptance_criteria the L1.5 audit can check
`.trim()

const OUTPUT_RULES = `
OUTPUT RULES

1. Output ONLY valid JSON matching the OutcomeTemplate shape above. No
   markdown fences, no commentary, no preamble, no trailing text.
2. status="draft", version="0.1.0", published_at=null. Always.
3. Generate a sensible kebab-case slug from the title.
4. Pricing min and max are in CENTS as integers. Range should have at
   least 2x spread (rough estimates are fine; the user will refine).
5. EVERY milestone_templates entry MUST include at least one
   expected_signals item with required: true. This is non-negotiable.
   If you cannot infer a real signal from the input, default to:
     { source: "manual", signature: "milestone_complete_acknowledged",
       required: true,
       description: "PM acknowledges milestone completion" }
6. For delivery_config.typical_team: infer roles from the work described.
   For delivery_config.ai_agents: default to claude_code and cursor unless
   the input indicates otherwise.
7. For audit_config_defaults: use { timeline: 8, quality: 10, scope: 7,
   communication: 6, velocity: 7, critical: 60, warning: 75,
   cadence: "every_2_days", tone: "technical", pm_review_window_hours: 4 }
   unless the input says otherwise (e.g. "executive reporting only" → tone="executive").
8. Use empty arrays for fields you cannot populate confidently from the
   input. Never invent details that aren't supported by the source material.
9. Title comes verbatim from the questionnaire's "Service name". Category
   comes verbatim from the questionnaire's "Category" key.
`.trim()

export function buildSystemPrompt(): string {
  return [
    'You are an expert at extracting structured engineering service templates from unstructured input. Your job is to produce a complete, valid OutcomeTemplate JSON object that a Delivery Lead at FullStack will review and refine.',
    '',
    'TYPESCRIPT SCHEMA',
    '',
    SCHEMA_TS,
    '',
    'WORKED EXAMPLE',
    '',
    'A complete, well-formed OutcomeTemplate looks exactly like this:',
    '',
    CANONICAL_EXAMPLE_JSON,
    '',
    OUTPUT_RULES,
    '',
    RULES_OF_THUMB,
    '',
    'Output the JSON object now. Nothing else.',
  ].join('\n')
}

export interface QuestionnaireResponses {
  service_name: string
  category: string
  what_it_delivers: string
  budget_timeline?: string
  anything_else?: string
}

export interface FilePayload {
  filename: string
  text: string
  was_truncated: boolean
}

export function buildUserPrompt(input: {
  questionnaire: QuestionnaireResponses
  files: FilePayload[]
}): string {
  const lines: string[] = []

  lines.push('QUESTIONNAIRE RESPONSES')
  lines.push('=======================')
  lines.push(`Service name: ${input.questionnaire.service_name}`)
  lines.push(`Category: ${input.questionnaire.category}`)
  lines.push(
    `What it delivers: ${input.questionnaire.what_it_delivers}`
  )
  if (input.questionnaire.budget_timeline) {
    lines.push(`Approximate budget and timeline: ${input.questionnaire.budget_timeline}`)
  }
  if (input.questionnaire.anything_else) {
    lines.push(`Anything else important: ${input.questionnaire.anything_else}`)
  }

  if (input.files.length > 0) {
    lines.push('')
    lines.push('ATTACHED REFERENCE MATERIALS')
    lines.push('============================')

    for (const file of input.files) {
      lines.push('')
      lines.push(`[${file.filename}]`)
      if (file.was_truncated) {
        lines.push('[Note: this file was truncated to fit the size budget.]')
      }
      lines.push(file.text)
    }
  }

  return lines.join('\n')
}

// Used by the retry path when the first response was unparseable.
export const RETRY_SYSTEM_ADDENDUM =
  '\n\nYour previous response could not be parsed as valid JSON. Output ONLY the JSON object, with no markdown fences or commentary, no preamble, no trailing text.'
