// The gold-standard "Automated Testing Setup" template, transcribed from
// glassbox-l2-schema.md. Embedded into the system prompt as a worked
// example so Claude has concrete reference shape for every field.
//
// Kept here as JSON (rather than a typed object) deliberately — what the
// system prompt needs is the literal JSON Claude is expected to mirror.

export const CANONICAL_EXAMPLE_JSON = `{
  "slug": "automated-testing-setup",
  "title": "Automated Testing Setup",
  "subtitle": "Ship with confidence — full test coverage in 1–2 weeks",
  "description": "We analyze your codebase and build a comprehensive automated test suite — unit, integration, and end-to-end — integrated into your CI pipeline. Includes coverage targets and a testing strategy document your team can maintain.",
  "icon": "TestTube",
  "category": "custom",
  "status": "draft",
  "version": "0.1.0",
  "published_at": null,
  "pricing": {
    "model": "fixed_range",
    "min": 800000,
    "max": 2000000,
    "currency": "USD",
    "notes": "Fixed price — no scope creep surprises"
  },
  "timeline": {
    "min_days": 5,
    "max_days": 10,
    "unit": "business_days",
    "starts_from": "kickoff",
    "notes": "Business days from kickoff"
  },
  "deliverables": [
    { "id": "d1", "order": 1, "name": "Codebase audit & test strategy", "acceptance_criteria": ["Audit document delivered", "Strategy approved by client"] },
    { "id": "d2", "order": 2, "name": "Unit test suite", "acceptance_criteria": ["Coverage \\u2265 80%"] },
    { "id": "d3", "order": 3, "name": "Integration tests for critical paths", "acceptance_criteria": ["All P0 paths covered"] },
    { "id": "d4", "order": 4, "name": "E2E tests (Playwright or Cypress)", "acceptance_criteria": ["Top 5 user flows automated"] },
    { "id": "d5", "order": 5, "name": "CI pipeline integration", "acceptance_criteria": ["Tests run on every PR"] },
    { "id": "d6", "order": 6, "name": "Coverage reporting dashboard", "acceptance_criteria": ["Dashboard accessible to client"] },
    { "id": "d7", "order": 7, "name": "Testing best practices documentation", "acceptance_criteria": ["Docs delivered, team trained"] }
  ],
  "milestone_templates": [
    {
      "id": "m1",
      "order": 1,
      "name": "Intake & Scoping",
      "duration": { "min_days": 1, "max_days": 2 },
      "description": "PM reviews your responses and confirms scope",
      "acceptance_criteria": ["Scope document signed by client", "Repository access granted"],
      "expected_signals": [
        { "source": "github", "signature": "repo_access_granted", "required": true },
        { "source": "manual", "signature": "scope_doc_signed", "required": true }
      ]
    },
    {
      "id": "m2",
      "order": 2,
      "name": "Kickoff",
      "duration": { "min_days": 1, "max_days": 1, "fixed_label": "Day 3" },
      "description": "Engineering team assembles and work begins",
      "acceptance_criteria": ["Team allocated and onboarded", "Kickoff meeting held"],
      "expected_signals": [
        { "source": "manual", "signature": "kickoff_held", "required": true },
        { "source": "github", "signature": "first_commit_pushed", "required": false }
      ]
    },
    {
      "id": "m3",
      "order": 3,
      "name": "Build Phase",
      "duration": { "min_days": 5, "max_days": 7 },
      "description": "Core development with daily progress updates",
      "acceptance_criteria": ["Test coverage \\u2265 80%", "All E2E tests pass on main"],
      "expected_signals": [
        { "source": "github", "signature": "pr_merged_to_main", "required": true },
        { "source": "ci", "signature": "ci_coverage_threshold", "required": true },
        { "source": "slack", "signature": "daily_standup_posted", "required": true }
      ]
    },
    {
      "id": "m4",
      "order": 4,
      "name": "Review & Polish",
      "duration": { "min_days": 2, "max_days": 3 },
      "description": "QA pass, revisions, and final testing",
      "acceptance_criteria": ["All tests green on staging", "Client sign-off on coverage report"],
      "expected_signals": [
        { "source": "ci", "signature": "all_tests_green", "required": true },
        { "source": "manual", "signature": "client_signoff_received", "required": true }
      ]
    },
    {
      "id": "m5",
      "order": 5,
      "name": "Delivery & Handoff",
      "duration": { "min_days": 1, "max_days": 1, "fixed_label": "Final day" },
      "description": "Deployment, documentation, and 30-day warranty begins",
      "acceptance_criteria": ["Code deployed to production", "Documentation delivered", "Handoff session completed"],
      "expected_signals": [
        { "source": "github", "signature": "release_tagged", "required": true },
        { "source": "manual", "signature": "handoff_completed", "required": true }
      ]
    }
  ],
  "intake_schema": {
    "fields": [
      { "id": "if1", "order": 1, "label": "Repository URL", "type": "url", "required": true, "placeholder": "https://github.com/your-org/your-repo", "maps_to": "engagement.repository_url" },
      { "id": "if2", "order": 2, "label": "Primary framework / language", "type": "select", "required": true, "options": ["TypeScript / Node", "Python", "Ruby on Rails", "Go", "Java / Kotlin", "Other"] },
      { "id": "if3", "order": 3, "label": "Current test coverage", "type": "select", "required": true, "options": ["None", "<25%", "25\\u201350%", "50\\u201375%", ">75%"] },
      { "id": "if4", "order": 4, "label": "CI/CD tool", "type": "select", "required": true, "options": ["GitHub Actions", "CircleCI", "Jenkins", "GitLab CI", "Other", "None"] },
      { "id": "if5", "order": 5, "label": "Priority areas to test", "type": "textarea", "required": false, "placeholder": "Which parts of your codebase are most critical / most broken?" },
      { "id": "if6", "order": 6, "label": "Your email", "type": "email", "required": true, "placeholder": "you@company.com" }
    ]
  },
  "delivery_config": {
    "typical_team": [
      { "role": "qa_engineer", "count": 1, "seniority": "senior", "allocation_percent": 100 },
      { "role": "forward_deployed_engineer", "count": 1, "seniority": "mid", "allocation_percent": 50 },
      { "role": "pm", "count": 1, "seniority": "senior", "allocation_percent": 25 }
    ],
    "ai_agents": [
      { "tool": "claude_code", "prompt_library_ref": "fullstack/test-generation/v3" },
      { "tool": "cursor" }
    ],
    "toolchain": {
      "language": ["TypeScript", "Python"],
      "frameworks": ["Jest", "Vitest", "Pytest"],
      "testing": ["Playwright", "Cypress"],
      "ci_cd": ["GitHub Actions", "CircleCI"],
      "hosting": [],
      "monitoring": []
    },
    "environment_template_id": "env_testing_v2",
    "expected_velocity_multiplier": 2.4
  },
  "audit_config_defaults": {
    "priority_weights": {
      "timeline": 8,
      "quality": 10,
      "scope": 7,
      "communication": 6,
      "velocity": 7
    },
    "alert_thresholds": { "critical": 60, "warning": 75 },
    "report_cadence": "every_2_days",
    "report_tone": "technical",
    "pm_review_window_hours": 4
  },
  "guarantees": [
    { "id": "g1", "label": "30-day post-delivery warranty", "icon": "ShieldCheck" },
    { "id": "g2", "label": "Fixed price guarantee", "icon": "Lock" },
    { "id": "g3", "label": "Dedicated AI-native PM", "icon": "Sparkles" },
    { "id": "g4", "label": "Real-time milestone tracking", "icon": "Activity" }
  ]
}`
