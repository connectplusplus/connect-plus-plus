'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

export async function completeAccountSetup(companyName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const companyId = randomUUID()
  const { error: companyError } = await supabase
    .from('companies')
    .insert({ id: companyId, name: companyName })
  if (companyError) return { error: companyError.message }

  const { error: userError } = await supabase.from('users').insert({
    id: user.id,
    company_id: companyId,
    full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
    email: user.email ?? '',
    role: 'owner',
  })
  if (userError) return { error: userError.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function seedDemoEngagements() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: userProfile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const companyId = userProfile?.company_id
  if (!companyId) return { error: 'No company found' }

  // Set company created_at to December 2025
  await supabase.from('companies').update({ created_at: '2025-12-09T10:00:00+00' }).eq('id', companyId)

  // If this company already has engagements, clean them up first
  const { data: existing } = await supabase
    .from('engagements')
    .select('id')
    .eq('company_id', companyId)

  if (existing && existing.length > 0) {
    const ids = existing.map((e) => e.id)
    await supabase.from('messages').delete().in('engagement_id', ids)
    await supabase.from('milestones').delete().in('engagement_id', ids)
    await supabase.from('engagements').delete().in('id', ids)
  }

  // Generate unique IDs per seed run
  const e1Id = randomUUID()
  const e2Id = randomUUID()
  const e3Id = randomUUID()
  const e4Id = randomUUID()
  const e5Id = randomUUID()

  // ── Engagement 1: Hertz AI Intelligence Layer ────────────────────────────
  // Started Feb 3, target May 2. Currently in Build phase (week 10 of 13).
  const { error: e1Err } = await supabase.from('engagements').insert({
    id: e1Id,
    company_id: companyId,
    template_id: null,
    mode: 'custom_outcome',
    title: 'End Client: Hertz — Car Rental App Intelligence Layer on Claude',
    status: 'active',
    scope_summary: 'Building an AI intelligence layer for Hertz\'s car rental application using Anthropic\'s Claude API. The system handles natural language fleet availability queries, intelligent price optimisation recommendations, predictive maintenance scheduling, and automated customer service responses — all integrated with Hertz\'s existing reservation system and fleet management platform.',
    price_cents: 18500000,
    start_date: '2026-02-03',
    target_end_date: '2026-05-02',
    intake_responses: {
      health_score: 84,
      ai_velocity: 2.5,
      project_lead: {
        name: 'Carlos Mendez',
        title: 'Senior Project Delivery Lead',
        photo: '/carlos.jpeg',
        calendly: 'https://calendly.com',
      },
      team: [
        { name: 'Marcus Chen', role: 'Senior Full-Stack Engineer', velocity: 2.4, initials: 'MC' },
        { name: 'Priya Sharma', role: 'Staff Engineer — Backend & Infra', velocity: 2.7, initials: 'PS' },
        { name: 'Amara Osei', role: 'Senior ML Engineer', velocity: 2.3, initials: 'AO' },
      ],
    },
  })
  if (e1Err) return { error: `Engagement 1 failed: ${e1Err.message}` }

  const { error: m1Err } = await supabase.from('milestones').insert([
    {
      engagement_id: e1Id,
      title: 'Discovery & Architecture',
      description: 'Stakeholder alignment with Hertz engineering leads, API surface mapping, Claude integration strategy, and system architecture sign-off.',
      status: 'completed',
      deliverables: [
        { name: 'System architecture diagram', status: 'done' },
        { name: 'Claude API integration strategy', status: 'done' },
        { name: 'Data flow & security model', status: 'done' },
        { name: 'Hertz API endpoint mapping', status: 'done' },
      ],
      due_date: '2026-02-14',
      completed_at: '2026-02-13T15:00:00+00',
      display_order: 1,
    },
    {
      engagement_id: e1Id,
      title: 'Claude API Integration & PoC',
      description: 'Live Claude API integration, prompt engineering for rental domain, PoC demonstrating natural language fleet queries with real Hertz test data.',
      status: 'completed',
      deliverables: [
        { name: 'Claude API wrapper service', status: 'done' },
        { name: 'Prompt library v1 (fleet, pricing, support)', status: 'done' },
        { name: 'PoC demo with Hertz test dataset', status: 'done' },
        { name: 'Latency & cost benchmarks', status: 'done' },
      ],
      due_date: '2026-03-07',
      completed_at: '2026-03-06T17:30:00+00',
      display_order: 2,
    },
    {
      engagement_id: e1Id,
      title: 'Core Intelligence Layer Build',
      description: 'Full implementation of the intelligence layer: fleet availability NLP engine, price optimisation module, predictive maintenance scheduler, and customer service auto-response pipeline.',
      status: 'in_progress',
      deliverables: [
        { name: 'Fleet availability NLP engine', status: 'done' },
        { name: 'Price optimisation module', status: 'done' },
        { name: 'Predictive maintenance scheduler', status: 'pending' },
        { name: 'Customer service auto-response pipeline', status: 'pending' },
        { name: 'Reservation system integration', status: 'pending' },
      ],
      due_date: '2026-04-18',
      completed_at: null,
      display_order: 3,
    },
    {
      engagement_id: e1Id,
      title: 'QA & Performance Testing',
      description: 'End-to-end QA pass, load testing under realistic Hertz traffic volumes, accuracy benchmarking for Claude responses, and security review.',
      status: 'upcoming',
      deliverables: [
        { name: 'E2E test suite (150+ scenarios)', status: 'pending' },
        { name: 'Load test report (10K req/min)', status: 'pending' },
        { name: 'Claude response accuracy report (target: 94%+)', status: 'pending' },
        { name: 'Security & compliance sign-off', status: 'pending' },
      ],
      due_date: '2026-04-28',
      completed_at: null,
      display_order: 4,
    },
    {
      engagement_id: e1Id,
      title: 'Deployment & Client Handoff',
      description: 'Production deployment to Hertz infrastructure, go-live monitoring, Hertz engineering team handoff, and documentation.',
      status: 'upcoming',
      deliverables: [
        { name: 'Production deployment', status: 'pending' },
        { name: 'Runbook & ops documentation', status: 'pending' },
        { name: 'Hertz engineering team training', status: 'pending' },
        { name: '30-day monitoring window activated', status: 'pending' },
      ],
      due_date: '2026-05-02',
      completed_at: null,
      display_order: 5,
    },
  ])
  if (m1Err) return { error: `Milestones 1 failed: ${m1Err.message}` }

  await supabase.from('messages').insert([
    { engagement_id: e1Id, sender_name: 'System', sender_role: 'system', content: 'Engagement created. Carlos Mendez has been assigned as Project Delivery Lead.', is_system_message: true, created_at: '2026-02-03T09:00:00+00' },
    { engagement_id: e1Id, sender_name: 'Carlos Mendez (PM)', sender_role: 'pm', content: 'Hi team — kickoff call with Hertz went well. Their engineering leads are aligned on the Claude-first approach. Architecture doc is in Notion. Marcus and Priya, please review the Hertz API docs I shared — we start integration Monday.', is_system_message: false, created_at: '2026-02-03T14:30:00+00' },
    { engagement_id: e1Id, sender_name: 'Marcus Chen', sender_role: 'engineer', content: 'Hertz API docs reviewed. Their fleet availability endpoint is REST, well-documented, 200ms P95. I\'m thinking we wrap it with a semantic caching layer so Claude isn\'t firing live API calls for every query — should cut latency by ~60%. Will have a design proposal by EOD.', is_system_message: false, created_at: '2026-02-05T10:15:00+00' },
    { engagement_id: e1Id, sender_name: 'System', sender_role: 'system', content: 'Milestone 1 (Discovery & Architecture) marked as completed.', is_system_message: true, created_at: '2026-02-13T15:00:00+00' },
    { engagement_id: e1Id, sender_name: 'Amara Osei', sender_role: 'engineer', content: 'PoC is live in staging. Claude is handling "find me a 7-seater SUV available in Miami next weekend under $80/day" style queries with 91% accuracy on the test set. The prompt library covers fleet, pricing, and basic support flows. Ready for Hertz stakeholder demo.', is_system_message: false, created_at: '2026-03-03T16:00:00+00' },
    { engagement_id: e1Id, sender_name: 'Carlos Mendez (PM)', sender_role: 'pm', content: 'Hertz demo went great — they loved the natural language fleet search. Green light to proceed to full build. One addition from their side: they want the price optimisation module to factor in competitor rates. Amara, can we scope that? I\'ll update the engagement budget if needed.', is_system_message: false, created_at: '2026-03-07T11:00:00+00' },
    { engagement_id: e1Id, sender_name: 'System', sender_role: 'system', content: 'Milestone 2 (Claude API Integration & PoC) marked as completed.', is_system_message: true, created_at: '2026-03-06T17:30:00+00' },
    { engagement_id: e1Id, sender_name: 'Priya Sharma', sender_role: 'engineer', content: 'Fleet availability NLP engine and price optimisation module both deployed to staging. Competitor rate integration added — pulling from their existing pricing feed. Predictive maintenance scheduler is next; data pipeline from their IoT sensors is more complex than expected, building an adapter layer.', is_system_message: false, created_at: '2026-04-10T09:30:00+00' },
  ])

  // ── Engagement 2: Internal Quality Framework ─────────────────────────────
  // Started Jan 13, target Apr 18. Currently in review (milestone 3 of 4).
  await supabase.from('engagements').insert({
    id: e2Id,
    company_id: companyId,
    template_id: null,
    mode: 'predefined_outcome',
    title: 'Internal Automated Quality Framework',
    status: 'in_review',
    scope_summary: 'Building a fully automated quality assurance framework for Anthropic\'s internal engineering teams. Includes Claude-powered test generation, automated code review pipelines, regression test orchestration, a live coverage tracking dashboard, and full CI/CD integration via GitHub Actions. Target: lift internal test coverage from 34% to 85%+ across all active repos.',
    price_cents: 9500000,
    start_date: '2026-01-13',
    target_end_date: '2026-04-18',
    intake_responses: {
      health_score: 91,
      ai_velocity: 2.3,
      project_lead: {
        name: 'Carlos Mendez',
        title: 'Senior Project Delivery Lead',
        photo: '/carlos.jpeg',
        calendly: 'https://calendly.com',
      },
      team: [
        { name: 'Devon Park', role: 'Principal DevOps & Platform Engineer', velocity: 2.6, initials: 'DP' },
        { name: 'Nadia Torres', role: 'Staff Engineer — Python & Data', velocity: 1.8, initials: 'NT' },
        { name: 'Sasha Kim', role: 'Senior Full-Stack Engineer', velocity: 2.2, initials: 'SK' },
      ],
    },
  })

  await supabase.from('milestones').insert([
    {
      engagement_id: e2Id,
      title: 'Framework Architecture & Tool Selection',
      description: 'Audit of existing test infrastructure across all repos, framework selection (pytest + Playwright + Jest), Claude integration strategy for AI-powered test generation.',
      status: 'completed',
      deliverables: [
        { name: 'Codebase audit across 12 repos', status: 'done' },
        { name: 'Framework selection document', status: 'done' },
        { name: 'Claude test-gen integration design', status: 'done' },
        { name: 'Coverage baseline report (34% avg)', status: 'done' },
      ],
      due_date: '2026-01-31',
      completed_at: '2026-01-30T14:00:00+00',
      display_order: 1,
    },
    {
      engagement_id: e2Id,
      title: 'Core QA Pipeline Build',
      description: 'Implementation of the core automated testing pipeline: unit and integration test suites across priority repos, CI gates via GitHub Actions, and the coverage tracking dashboard.',
      status: 'completed',
      deliverables: [
        { name: 'Unit + integration test suites (8 repos)', status: 'done' },
        { name: 'GitHub Actions CI pipeline with quality gates', status: 'done' },
        { name: 'Coverage dashboard (live, Codecov-backed)', status: 'done' },
        { name: 'Coverage lifted to 71% avg across target repos', status: 'done' },
      ],
      due_date: '2026-03-07',
      completed_at: '2026-03-06T16:00:00+00',
      display_order: 2,
    },
    {
      engagement_id: e2Id,
      title: 'AI Test Generation Integration',
      description: 'Claude-powered automatic test generation for new code, PR-level test suggestions, and regression test auto-creation from bug reports. Delivered for client review.',
      status: 'in_review',
      deliverables: [
        { name: 'Claude test-gen service (PR hook)', status: 'done' },
        { name: 'Regression test auto-creation from Jira bugs', status: 'done' },
        { name: 'Test quality scoring model', status: 'done' },
        { name: 'Internal team review & sign-off', status: 'pending' },
      ],
      due_date: '2026-04-04',
      completed_at: null,
      display_order: 3,
    },
    {
      engagement_id: e2Id,
      title: 'Documentation & Full Rollout',
      description: 'Full rollout to all engineering teams, developer onboarding docs, test strategy playbook, and handoff.',
      status: 'upcoming',
      deliverables: [
        { name: 'Developer onboarding guide', status: 'pending' },
        { name: 'Test strategy playbook', status: 'pending' },
        { name: 'Rollout to remaining 4 repos', status: 'pending' },
        { name: 'Final coverage report (target: 85%+)', status: 'pending' },
      ],
      due_date: '2026-04-18',
      completed_at: null,
      display_order: 4,
    },
  ])

  await supabase.from('messages').insert([
    { engagement_id: e2Id, sender_name: 'System', sender_role: 'system', content: 'Engagement created. Carlos Mendez assigned as Project Delivery Lead.', is_system_message: true, created_at: '2026-01-13T09:00:00+00' },
    { engagement_id: e2Id, sender_name: 'Carlos Mendez (PM)', sender_role: 'pm', content: 'Kicked off the QA framework project with Devon and Nadia. Codebase audit across all 12 repos complete — we\'re at 34% average coverage today, with some repos at 0%. Framework selected: pytest for Python services, Jest + RTL for React, Playwright for E2E. Claude integration will handle test generation from PR diffs.', is_system_message: false, created_at: '2026-01-13T15:00:00+00' },
    { engagement_id: e2Id, sender_name: 'Devon Park', sender_role: 'engineer', content: 'GitHub Actions pipeline is live across all priority repos. Quality gates set at 70% — any PR dropping coverage below that will be flagged (not blocked yet, we\'ll tighten this in phase 2). Coverage dashboard is up at the internal URL I shared. Current average across target repos: 71%.', is_system_message: false, created_at: '2026-03-06T11:00:00+00' },
    { engagement_id: e2Id, sender_name: 'System', sender_role: 'system', content: 'Milestone 1 (Framework Architecture & Tool Selection) marked as completed.', is_system_message: true, created_at: '2026-01-30T14:00:00+00' },
    { engagement_id: e2Id, sender_name: 'System', sender_role: 'system', content: 'Milestone 2 (Core QA Pipeline Build) marked as completed.', is_system_message: true, created_at: '2026-03-06T16:00:00+00' },
    { engagement_id: e2Id, sender_name: 'Nadia Torres', sender_role: 'engineer', content: 'Claude test-gen service is deployed. It\'s hooking into PR webhooks and suggesting tests for any new function or module. In the past 3 days it\'s generated 47 test suggestions across 8 open PRs — engineers are accepting about 60% of them as-is, rest with minor edits. Ready for your review, Carlos.', is_system_message: false, created_at: '2026-04-01T14:00:00+00' },
    { engagement_id: e2Id, sender_name: 'Carlos Mendez (PM)', sender_role: 'pm', content: 'Milestone 3 is in review — please take a look at the Claude test-gen output and the test quality scores in the dashboard. Overall project health is excellent. We\'re on track for full rollout and final handoff by April 18th.', is_system_message: false, created_at: '2026-04-03T10:00:00+00' },
  ])

  // ── Engagement 3: Enterprise Onboarding Portal MVP ──────────────────────
  // Started Mar 3, original target Mar 28. Scope change pushed to Apr 25.
  await supabase.from('engagements').insert({
    id: e3Id,
    company_id: companyId,
    template_id: null,
    mode: 'predefined_outcome',
    title: 'Enterprise Onboarding Portal MVP',
    status: 'active',
    scope_summary: 'Building a production-ready enterprise onboarding portal for new client organisations. Includes multi-tenant user provisioning, role-based access control, guided onboarding flows with progress tracking, SSO integration (Okta/Azure AD), document upload & e-signature workflows, and an admin dashboard for onboarding managers. Target: from first login to fully onboarded in under 15 minutes.',
    price_cents: 12500000,
    start_date: '2026-03-03',
    target_end_date: '2026-04-25',
    intake_responses: {
      health_score: 68,
      ai_velocity: 1.9,
      project_lead: {
        name: 'Carlos Mendez',
        title: 'Senior Project Delivery Lead',
        photo: '/carlos.jpeg',
        calendly: 'https://calendly.com',
      },
      team: [
        { name: 'Jordan Blake', role: 'Senior Full-Stack Engineer', velocity: 2.1, initials: 'JB' },
        { name: 'Elena Voss', role: 'Staff Engineer — Identity & Auth', velocity: 1.7, initials: 'EV' },
        { name: 'Kai Nakamura', role: 'Senior Frontend Engineer', velocity: 2.3, initials: 'KN' },
      ],
    },
  })

  await supabase.from('milestones').insert([
    {
      engagement_id: e3Id,
      title: 'Intake & Scoping',
      description: 'Requirements gathering, stakeholder alignment, technical architecture, and scope sign-off.',
      status: 'completed',
      deliverables: [
        { name: 'Requirements document', status: 'done' },
        { name: 'Technical architecture diagram', status: 'done' },
        { name: 'Scope & timeline sign-off', status: 'done' },
      ],
      due_date: '2026-03-05',
      completed_at: '2026-03-04T16:00:00+00',
      display_order: 1,
    },
    {
      engagement_id: e3Id,
      title: 'Kickoff',
      description: 'Engineering team assembly, dev environment setup, CI/CD pipeline, and sprint planning.',
      status: 'completed',
      deliverables: [
        { name: 'Dev environment & CI/CD pipeline', status: 'done' },
        { name: 'Sprint backlog created', status: 'done' },
        { name: 'Design system tokens configured', status: 'done' },
      ],
      due_date: '2026-03-06',
      completed_at: '2026-03-06T17:00:00+00',
      display_order: 2,
    },
    {
      engagement_id: e3Id,
      title: 'Build Phase',
      description: 'Core development: multi-tenant provisioning, RBAC, onboarding flows, SSO integration, document workflows, admin dashboard.',
      status: 'completed',
      deliverables: [
        { name: 'Multi-tenant user provisioning', status: 'done' },
        { name: 'Role-based access control', status: 'done' },
        { name: 'Guided onboarding flows', status: 'done' },
        { name: 'SSO integration (Okta/Azure AD)', status: 'done' },
        { name: 'Document upload & e-signature', status: 'done' },
        { name: 'Admin dashboard', status: 'done' },
      ],
      due_date: '2026-03-21',
      completed_at: '2026-03-20T18:00:00+00',
      display_order: 3,
    },
    {
      engagement_id: e3Id,
      title: 'Review & Polish',
      description: 'BLOCKED: Scope Change — Project Delay. Client requested major compliance workflow module mid-review. QA pass complete but UAT sign-off blocked pending scope alignment.',
      status: 'in_review',
      deliverables: [
        { name: 'E2E test suite', status: 'done' },
        { name: 'Performance & load testing', status: 'done' },
        { name: 'Client UAT sign-off', status: 'pending' },
        { name: 'Compliance workflow module (scope change)', status: 'pending' },
      ],
      due_date: '2026-04-15',
      completed_at: null,
      display_order: 4,
    },
    {
      engagement_id: e3Id,
      title: 'Delivery & Handoff',
      description: 'Production deployment, documentation, and 30-day post-launch warranty begins.',
      status: 'upcoming',
      deliverables: [
        { name: 'Production deployment', status: 'pending' },
        { name: 'Runbook & documentation', status: 'pending' },
        { name: 'Client team training', status: 'pending' },
        { name: '30-day warranty window activated', status: 'pending' },
      ],
      due_date: '2026-04-25',
      completed_at: null,
      display_order: 5,
    },
  ])

  await supabase.from('messages').insert([
    { engagement_id: e3Id, sender_name: 'System', sender_role: 'system', content: 'Engagement created. Carlos Mendez assigned as Project Delivery Lead.', is_system_message: true, created_at: '2026-03-03T09:00:00+00' },
    { engagement_id: e3Id, sender_name: 'Carlos Mendez (PM)', sender_role: 'pm', content: 'Kicked off the Enterprise Onboarding Portal MVP. Team is assembled — Jordan on full-stack, Elena on identity/auth, Kai on frontend. Architecture is clean: Next.js + Supabase, multi-tenant via RLS. Sprint 1 starts tomorrow.', is_system_message: false, created_at: '2026-03-03T14:00:00+00' },
    { engagement_id: e3Id, sender_name: 'Elena Voss', sender_role: 'engineer', content: 'SSO integration complete — Okta and Azure AD both working. RBAC layer is solid, tested with 5 role configurations. The provisioning flow handles org creation, admin invite, and member onboarding in a single transaction. Moving to document workflows next.', is_system_message: false, created_at: '2026-03-14T11:00:00+00' },
    { engagement_id: e3Id, sender_name: 'System', sender_role: 'system', content: 'Milestone 3 (Build Phase) marked as completed.', is_system_message: true, created_at: '2026-03-20T18:00:00+00' },
    { engagement_id: e3Id, sender_name: 'Carlos Mendez (PM)', sender_role: 'pm', content: 'Build is done and in review. QA pass looks clean — 94% test coverage, all E2E scenarios passing. Shared staging link with the client for UAT.', is_system_message: false, created_at: '2026-03-24T10:00:00+00' },
    { engagement_id: e3Id, sender_name: 'Carlos Mendez (PM)', sender_role: 'pm', content: 'SCOPE CHANGE: Client\'s compliance team has requested a full compliance workflow module — document audit trails, approval chains, and regulatory checklist enforcement. This was NOT in the original scope. I\'ve flagged this as a scope change and we\'re blocked on UAT sign-off until we align on timeline and budget impact. Scheduling an escalation call.', is_system_message: false, created_at: '2026-04-08T15:30:00+00' },
    { engagement_id: e3Id, sender_name: 'Jordan Blake', sender_role: 'engineer', content: 'I\'ve scoped the compliance module — it\'s roughly 5-7 days of additional work. The audit trail can piggyback on our existing event system, but the approval chains and regulatory checklists need new DB models and UI. This pushes delivery to April 25th minimum. We need the client to formally approve the change order before we proceed.', is_system_message: false, created_at: '2026-04-08T17:00:00+00' },
  ])

  // ── Engagement 4: WayMart — Retail Intelligence on Google Cloud ──────────
  // Partnership: Google Cloud (Vertex AI + BigQuery). Active, mid-build.
  await supabase.from('engagements').insert({
    id: e4Id,
    company_id: companyId,
    template_id: null,
    mode: 'custom_outcome',
    title: 'End Client: WayMart — Real-Time Merchandising AI on Google Cloud',
    status: 'active',
    scope_summary: 'Building a real-time merchandising intelligence platform for WayMart (regional grocery chain, 340 stores) on Google Cloud. Unifies POS, loyalty, supply chain, and e-commerce data in BigQuery, then grounds a Vertex AI / Gemini layer for store-manager-facing natural language queries ("which SKUs are over-performing in the Austin region this week?") and automated daily insight digests. Includes Looker dashboards for regional directors and an Agent Builder conversational interface on the store-manager mobile app.',
    price_cents: 21500000,
    start_date: '2026-03-10',
    target_end_date: '2026-06-12',
    intake_responses: {
      health_score: 88,
      ai_velocity: 2.5,
      project_lead: {
        name: 'Carlos Mendez',
        title: 'Senior Project Delivery Lead',
        photo: '/carlos.jpeg',
        calendly: 'https://calendly.com',
      },
      team: [
        { name: 'Priya Sharma', role: 'Staff Engineer — Backend & Infra', velocity: 2.7, initials: 'PS' },
        { name: 'Amara Osei', role: 'Senior ML Engineer', velocity: 2.3, initials: 'AO' },
        { name: 'Nadia Torres', role: 'Staff Engineer — Python & Data', velocity: 1.8, initials: 'NT' },
      ],
    },
  })

  await supabase.from('milestones').insert([
    {
      engagement_id: e4Id,
      title: 'Discovery & Google Cloud Architecture',
      description: 'WayMart data landscape audit, BigQuery medallion architecture design, Vertex AI grounding strategy, and Google Cloud landing zone provisioning.',
      status: 'completed',
      deliverables: [
        { name: 'Data source audit (POS, loyalty, supply chain, e-comm)', status: 'done' },
        { name: 'BigQuery medallion architecture spec', status: 'done' },
        { name: 'Vertex AI grounding & prompt architecture', status: 'done' },
        { name: 'GCP landing zone + IAM baseline', status: 'done' },
      ],
      due_date: '2026-03-24',
      completed_at: '2026-03-23T16:30:00+00',
      display_order: 1,
    },
    {
      engagement_id: e4Id,
      title: 'BigQuery Data Platform Build',
      description: 'Source-to-BigQuery ingestion pipelines, dbt transformations, and Looker semantic layer. Target: daily fresh data across all 340 stores by end of milestone.',
      status: 'completed',
      deliverables: [
        { name: 'Dataflow ingestion (POS, loyalty, e-comm)', status: 'done' },
        { name: 'dbt transformations (bronze → silver → gold)', status: 'done' },
        { name: 'Looker semantic layer with LookML', status: 'done' },
        { name: 'Partitioning + clustering for cost control', status: 'done' },
      ],
      due_date: '2026-04-14',
      completed_at: '2026-04-13T17:00:00+00',
      display_order: 2,
    },
    {
      engagement_id: e4Id,
      title: 'Vertex AI Intelligence Layer',
      description: 'Gemini 1.5 Pro integration with BigQuery grounding, natural language query engine for store managers, and daily insight digest generation.',
      status: 'in_progress',
      deliverables: [
        { name: 'Vertex AI Search over BigQuery gold layer', status: 'done' },
        { name: 'Gemini NL→SQL query engine', status: 'done' },
        { name: 'Daily insight digest generator', status: 'pending' },
        { name: 'Safety filters & PII redaction', status: 'pending' },
        { name: 'Agent Builder conversational flow', status: 'pending' },
      ],
      due_date: '2026-05-15',
      completed_at: null,
      display_order: 3,
    },
    {
      engagement_id: e4Id,
      title: 'Mobile App Integration & Rollout',
      description: 'Integration into the WayMart store-manager iOS/Android app, pilot rollout in 20 stores, feedback loop, and full 340-store rollout.',
      status: 'upcoming',
      deliverables: [
        { name: 'Mobile app SDK & UI integration', status: 'pending' },
        { name: '20-store pilot with feedback instrumentation', status: 'pending' },
        { name: 'Pilot retro + prompt tuning', status: 'pending' },
        { name: 'Full 340-store rollout', status: 'pending' },
      ],
      due_date: '2026-06-12',
      completed_at: null,
      display_order: 4,
    },
  ])

  await supabase.from('messages').insert([
    { engagement_id: e4Id, sender_name: 'System', sender_role: 'system', content: 'Engagement created. Carlos Mendez assigned as Project Delivery Lead. Google Cloud partnership track activated.', is_system_message: true, created_at: '2026-03-10T09:00:00+00' },
    { engagement_id: e4Id, sender_name: 'Carlos Mendez (PM)', sender_role: 'pm', content: 'Kicked off WayMart discovery — their data is in better shape than we expected (POS is already streaming, e-comm data is clean). The interesting challenge is their supply chain data, which lives in a legacy AS/400 system; Nadia is designing an adapter layer. Vertex AI path is clear: Gemini 1.5 Pro with grounding via BigQuery + AI Search.', is_system_message: false, created_at: '2026-03-10T15:30:00+00' },
    { engagement_id: e4Id, sender_name: 'Nadia Torres', sender_role: 'engineer', content: 'BigQuery medallion architecture finalized. Bronze layer has raw streams from all 4 source systems; silver has conformed dims + fact tables; gold has the aggregated KPIs that feed both Looker and Vertex AI grounding. Partitioning by store_id + date — rough cost estimate is $1.8K/month for BigQuery storage + compute across all 340 stores.', is_system_message: false, created_at: '2026-03-18T11:00:00+00' },
    { engagement_id: e4Id, sender_name: 'System', sender_role: 'system', content: 'Milestone 1 (Discovery & Google Cloud Architecture) marked as completed.', is_system_message: true, created_at: '2026-03-23T16:30:00+00' },
    { engagement_id: e4Id, sender_name: 'Amara Osei', sender_role: 'engineer', content: 'Gemini NL→SQL is working nicely in dev — tested against 80 real store-manager questions with 89% syntactic accuracy and 94% semantic accuracy (the gap is mostly Gemini being overly specific with filters). Grounding via Vertex AI Search over the gold layer is clean; latency is ~1.2s P95 which is well within our SLA.', is_system_message: false, created_at: '2026-04-07T14:00:00+00' },
    { engagement_id: e4Id, sender_name: 'System', sender_role: 'system', content: 'Milestone 2 (BigQuery Data Platform Build) marked as completed.', is_system_message: true, created_at: '2026-04-13T17:00:00+00' },
    { engagement_id: e4Id, sender_name: 'Priya Sharma', sender_role: 'engineer', content: 'Starting milestone 3. Safety filter approach: Vertex AI Content Safety for obvious stuff, then our own PII regex layer for WayMart-specific fields (loyalty IDs, email addresses that leak through). Daily digest generation will run as a Cloud Run job at 4am local per region, using Gemini 1.5 Flash to keep costs down on the batch path.', is_system_message: false, created_at: '2026-04-14T10:00:00+00' },
  ])

  // ── Engagement 5: Velara BioSystems — Genomics CUDA Pipeline on NVIDIA ──
  // Partnership: NVIDIA. COMPLETED — showcases the finished state.
  await supabase.from('engagements').insert({
    id: e5Id,
    company_id: companyId,
    template_id: null,
    mode: 'custom_outcome',
    title: 'End Client: Velara BioSystems — Genomics CUDA Pipeline on NVIDIA H100',
    status: 'completed',
    scope_summary: 'Rebuilt Velara BioSystems\' genomics variant-calling pipeline on NVIDIA H100 infrastructure using CUDA, RAPIDS, and Parabricks. The legacy CPU pipeline took 38 hours per whole-genome sample and was bottlenecking Velara\'s rare-disease research program. Delivered a GPU-accelerated pipeline running on NVIDIA DGX Cloud that processes a whole genome in 47 minutes end-to-end — a 48x speedup at 30% lower per-sample cost. Includes Slurm-based job orchestration, multi-node scaling with NCCL, and a handover playbook for Velara\'s bioinformatics team.',
    price_cents: 16500000,
    start_date: '2026-01-06',
    target_end_date: '2026-03-27',
    actual_end_date: '2026-03-28',
    intake_responses: {
      health_score: 96,
      ai_velocity: 2.6,
      project_lead: {
        name: 'Carlos Mendez',
        title: 'Senior Project Delivery Lead',
        photo: '/carlos.jpeg',
        calendly: 'https://calendly.com',
      },
      team: [
        { name: 'Devon Park', role: 'Principal DevOps & Platform Engineer', velocity: 2.6, initials: 'DP' },
        { name: 'Amara Osei', role: 'Senior ML Engineer', velocity: 2.3, initials: 'AO' },
        { name: 'Priya Sharma', role: 'Staff Engineer — Backend & Infra', velocity: 2.7, initials: 'PS' },
      ],
    },
  })

  await supabase.from('milestones').insert([
    {
      engagement_id: e5Id,
      title: 'Pipeline Profiling & GPU Architecture Selection',
      description: 'Deep profiling of the existing CPU pipeline, identification of GPU-amenable stages, NVIDIA hardware selection, and DGX Cloud provisioning.',
      status: 'completed',
      deliverables: [
        { name: 'Existing pipeline profiling report (per-stage runtime)', status: 'done' },
        { name: 'GPU architecture comparison (H100 vs L40S vs A100)', status: 'done' },
        { name: 'NVIDIA DGX Cloud capacity provisioned (8x H100)', status: 'done' },
        { name: 'Cost model & ROI projections', status: 'done' },
      ],
      due_date: '2026-01-23',
      completed_at: '2026-01-22T15:00:00+00',
      display_order: 1,
    },
    {
      engagement_id: e5Id,
      title: 'Parabricks + RAPIDS Integration',
      description: 'Migration of variant-calling stages to NVIDIA Parabricks, RAPIDS (cuDF) for variant annotation, and custom CUDA kernels for Velara\'s proprietary scoring algorithm.',
      status: 'completed',
      deliverables: [
        { name: 'Parabricks integration (BWA-MEM, HaplotypeCaller, DeepVariant)', status: 'done' },
        { name: 'RAPIDS-based variant annotation pipeline', status: 'done' },
        { name: 'Custom CUDA kernels for Velara scoring algorithm', status: 'done' },
        { name: 'Unit + accuracy regression tests (100% vs. legacy output)', status: 'done' },
      ],
      due_date: '2026-02-20',
      completed_at: '2026-02-19T18:00:00+00',
      display_order: 2,
    },
    {
      engagement_id: e5Id,
      title: 'Multi-Node Scaling & Slurm Orchestration',
      description: 'Slurm job scheduler setup, multi-node training with NCCL for bulk genome batches, cost-aware spot capacity strategy, and DCGM observability.',
      status: 'completed',
      deliverables: [
        { name: 'Slurm scheduler + partition configuration', status: 'done' },
        { name: 'Multi-node NCCL-based batch processing', status: 'done' },
        { name: 'Spot / reserved capacity mix for cost optimization', status: 'done' },
        { name: 'DCGM + Prometheus GPU observability stack', status: 'done' },
        { name: 'Benchmark report: 47 min/genome, 48x speedup', status: 'done' },
      ],
      due_date: '2026-03-13',
      completed_at: '2026-03-12T17:30:00+00',
      display_order: 3,
    },
    {
      engagement_id: e5Id,
      title: 'Handover & Knowledge Transfer',
      description: 'Velara bioinformatics team training, runbook delivery, 2-week parallel-run validation in production, and formal sign-off.',
      status: 'completed',
      deliverables: [
        { name: 'Runbook (operations, scaling, troubleshooting)', status: 'done' },
        { name: '4-session training program with Velara team', status: 'done' },
        { name: 'Parallel production run with 200 samples (100% accuracy match)', status: 'done' },
        { name: 'Formal client sign-off & project retrospective', status: 'done' },
      ],
      due_date: '2026-03-27',
      completed_at: '2026-03-28T14:00:00+00',
      display_order: 4,
    },
  ])

  await supabase.from('messages').insert([
    { engagement_id: e5Id, sender_name: 'System', sender_role: 'system', content: 'Engagement created. Carlos Mendez assigned as Project Delivery Lead. NVIDIA partnership track activated.', is_system_message: true, created_at: '2026-01-06T09:00:00+00' },
    { engagement_id: e5Id, sender_name: 'Carlos Mendez (PM)', sender_role: 'pm', content: 'Kickoff with Velara went well. Their existing pipeline is well-documented but genuinely bottlenecked — 38 hours per whole genome on CPUs is painful when they\'re trying to scale the rare-disease program. Devon and Amara are profiling now; we should have the hardware recommendation by end of next week.', is_system_message: false, created_at: '2026-01-06T16:00:00+00' },
    { engagement_id: e5Id, sender_name: 'Devon Park', sender_role: 'engineer', content: 'Profiling is done. 72% of runtime is in the alignment + variant-calling stages, both of which have mature GPU implementations (Parabricks). The variant annotation stage is custom Python and will need RAPIDS work. Recommending 8x H100 on DGX Cloud — projected per-genome runtime is ~45-50 minutes. ROI is ~3x better than L40S at this scale.', is_system_message: false, created_at: '2026-01-20T11:00:00+00' },
    { engagement_id: e5Id, sender_name: 'System', sender_role: 'system', content: 'Milestone 1 (Pipeline Profiling & GPU Architecture Selection) marked as completed.', is_system_message: true, created_at: '2026-01-22T15:00:00+00' },
    { engagement_id: e5Id, sender_name: 'Amara Osei', sender_role: 'engineer', content: 'Parabricks integration is clean. Running our first end-to-end test on a reference genome and getting 100% variant-call match with the legacy pipeline — zero drift. Custom CUDA kernels for the Velara scoring algo took longer than expected but the speedup is huge (from 4.2 hours CPU to 8 minutes on H100).', is_system_message: false, created_at: '2026-02-15T14:30:00+00' },
    { engagement_id: e5Id, sender_name: 'System', sender_role: 'system', content: 'Milestone 2 (Parabricks + RAPIDS Integration) marked as completed.', is_system_message: true, created_at: '2026-02-19T18:00:00+00' },
    { engagement_id: e5Id, sender_name: 'Priya Sharma', sender_role: 'engineer', content: 'Final benchmark: 47 minutes per whole genome end-to-end, 48x speedup, 30% lower per-sample cost factoring in H100 hourly rate. Multi-node scaling is linear up to 8 nodes on the batch workload. DCGM metrics are piping into Velara\'s Grafana. Ready for handover.', is_system_message: false, created_at: '2026-03-12T16:00:00+00' },
    { engagement_id: e5Id, sender_name: 'System', sender_role: 'system', content: 'Milestone 3 (Multi-Node Scaling & Slurm Orchestration) marked as completed.', is_system_message: true, created_at: '2026-03-12T17:30:00+00' },
    { engagement_id: e5Id, sender_name: 'Carlos Mendez (PM)', sender_role: 'pm', content: 'Parallel run complete — 200 samples processed through both pipelines, 100% variant-call match, zero accuracy drift. Velara\'s team did 4 training sessions and has the runbook. They ran 12 samples unsupervised this week with zero issues. Scheduling formal sign-off for tomorrow.', is_system_message: false, created_at: '2026-03-27T11:00:00+00' },
    { engagement_id: e5Id, sender_name: 'Velara (Client)', sender_role: 'client', content: 'Signed off. This is the single most impactful infrastructure delivery we\'ve done this year — we\'re now processing genomes in the time it used to take to get coffee. Our rare-disease researchers are giddy. Thank you to the entire FullStack team. Already scoping a follow-on engagement for the single-cell pipeline.', is_system_message: false, created_at: '2026-03-28T13:30:00+00' },
    { engagement_id: e5Id, sender_name: 'System', sender_role: 'system', content: 'Milestone 4 (Handover & Knowledge Transfer) marked as completed.', is_system_message: true, created_at: '2026-03-28T14:00:00+00' },
    { engagement_id: e5Id, sender_name: 'System', sender_role: 'system', content: 'Engagement completed. 30-day post-delivery warranty window opens today.', is_system_message: true, created_at: '2026-03-28T14:00:00+00' },
  ])

  revalidatePath('/dashboard')
  return { success: true }
}
