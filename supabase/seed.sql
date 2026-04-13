-- ─────────────────────────────────────────────────────────────────────────────
-- Connect++ Seed Data  (idempotent — safe to re-run)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Outcome Templates ─────────────────────────────────────────────────────────

insert into outcome_templates (slug, title, subtitle, description, category, price_range_low, price_range_high, timeline_range_low, timeline_range_high, icon, features, intake_schema, display_order) values

-- 1. MVP Sprint
('mvp-sprint', 'MVP Sprint', 'From idea to working product in 3 weeks',
'Get a production-ready MVP built by an AI-native engineering team. You bring the product brief — we handle architecture, design, development, testing, and deployment. Includes one round of revisions and 30-day post-launch support.',
'build', 1500000, 3500000, 15, 21, 'Rocket',
'["Product architecture & tech stack selection", "UI/UX design (up to 10 screens)", "Full-stack development", "Automated test suite", "CI/CD pipeline & production deployment", "30-day post-launch warranty"]'::jsonb,
'{
  "fields": [
    {
      "key": "what_building",
      "type": "textarea",
      "label": "What are you building?",
      "placeholder": "Describe what you''re building — the more detail the better. Upload a PRD, wireframes, or even a napkin sketch if you have one.",
      "required": true
    },
    {
      "key": "platform",
      "type": "select",
      "label": "What platform?",
      "options": ["Web", "iOS", "Android", "Cross-platform"],
      "required": true
    },
    {
      "key": "user_type",
      "type": "select",
      "label": "Who are the primary users?",
      "options": ["Internal team", "B2B customers", "B2C consumers", "Marketplace"],
      "required": true
    },
    {
      "key": "scale",
      "type": "select",
      "label": "Expected users at launch?",
      "options": ["<100", "100–1K", "1K–10K", "10K+"],
      "required": true
    },
    {
      "key": "has_designs",
      "type": "select",
      "label": "Do you have existing designs?",
      "options": ["Yes, Figma/Sketch files", "Rough wireframes", "Nothing — include design"],
      "required": true
    },
    {
      "key": "integrations",
      "type": "multiselect",
      "label": "Key integrations needed?",
      "options": ["Payment processing", "Auth/SSO", "Third-party APIs", "CRM", "None yet"]
    },
    {
      "key": "timeline",
      "type": "select",
      "label": "Timeline preference?",
      "options": ["ASAP", "4–6 weeks", "Flexible"],
      "required": true
    }
  ]
}'::jsonb, 1),

-- 2. Automated Testing Setup
('automated-testing', 'Automated Testing Setup', 'Ship with confidence — full test coverage in 1–2 weeks',
'We analyze your codebase and build a comprehensive automated test suite — unit, integration, and end-to-end — integrated into your CI pipeline. Includes coverage targets and a testing strategy document your team can maintain.',
'automate', 800000, 2000000, 5, 10, 'TestTube',
'["Codebase audit & test strategy", "Unit test suite", "Integration tests for critical paths", "E2E tests (Playwright or Cypress)", "CI pipeline integration", "Coverage reporting dashboard", "Testing best practices documentation"]'::jsonb,
'{
  "fields": [
    {
      "key": "repo_url",
      "type": "text",
      "label": "Repository URL",
      "placeholder": "https://github.com/your-org/your-repo",
      "required": true
    },
    {
      "key": "framework",
      "type": "select",
      "label": "Primary framework / language",
      "options": ["React", "Vue", "Angular", "Node.js", "Python", "Other"],
      "required": true
    },
    {
      "key": "current_coverage",
      "type": "select",
      "label": "Current test coverage",
      "options": ["None", "Under 20%", "20–50%", "50%+"],
      "required": true
    },
    {
      "key": "ci_tool",
      "type": "select",
      "label": "CI/CD tool",
      "options": ["GitHub Actions", "GitLab CI", "CircleCI", "Jenkins", "None"],
      "required": true
    },
    {
      "key": "priority_areas",
      "type": "textarea",
      "label": "Priority areas to test",
      "placeholder": "Which parts of your codebase are most critical / most broken?"
    }
  ]
}'::jsonb, 2),

-- 3. Landing Page & Marketing Site
('landing-page', 'Landing Page & Marketing Site', 'Designed, built, and deployed in 5–10 days',
'A high-converting marketing site built on modern web tech with CMS integration. Responsive, fast, SEO-optimized, and ready to capture leads from day one.',
'build', 500000, 1500000, 5, 10, 'Globe',
'["Custom responsive design", "CMS integration (manage content yourself)", "SEO optimization & meta tags", "Analytics setup (GA4 / Plausible)", "Contact form & lead capture", "Performance optimized (95+ Lighthouse score)"]'::jsonb,
'{
  "fields": [
    {
      "key": "brand_guidelines",
      "type": "select",
      "label": "Do you have brand guidelines?",
      "options": ["Yes — I''ll share files", "Partial — basic colors/fonts", "No — start from scratch"],
      "required": true
    },
    {
      "key": "pages_needed",
      "type": "select",
      "label": "How many pages?",
      "options": ["Single page", "3–5 pages", "5–10 pages"],
      "required": true
    },
    {
      "key": "cms_preference",
      "type": "select",
      "label": "CMS preference",
      "options": ["Contentful", "Sanity", "WordPress", "No preference"],
      "required": true
    },
    {
      "key": "reference_sites",
      "type": "textarea",
      "label": "Reference sites you love",
      "placeholder": "Share 2–3 sites whose design or UX you admire"
    },
    {
      "key": "goals",
      "type": "textarea",
      "label": "What''s the primary goal of the site?",
      "placeholder": "Lead capture, sign-ups, investor pitch, product launch...",
      "required": true
    }
  ]
}'::jsonb, 3),

-- 4. CI/CD Pipeline Build
('cicd-pipeline', 'CI/CD Pipeline Build', 'Zero to fully automated deploys in 1–2 weeks',
'We set up your entire build-test-deploy pipeline from scratch. Automated testing on every PR, staging environments for review, and one-click production deploys. Includes infrastructure-as-code so your team can maintain and extend it.',
'automate', 600000, 1800000, 5, 10, 'GitBranch',
'["Automated build & test on every PR", "Staging environment with preview deploys", "Production deploy pipeline", "Infrastructure-as-code (Terraform / Pulumi)", "Secrets management", "Monitoring & alerting setup", "Runbook documentation"]'::jsonb,
'{
  "fields": [
    {
      "key": "cloud_provider",
      "type": "select",
      "label": "Cloud provider",
      "options": ["AWS", "GCP", "Azure", "Other"],
      "required": true
    },
    {
      "key": "repo_host",
      "type": "select",
      "label": "Repository host",
      "options": ["GitHub", "GitLab", "Bitbucket"],
      "required": true
    },
    {
      "key": "current_deploy_process",
      "type": "textarea",
      "label": "Describe your current deployment process",
      "placeholder": "How do you deploy today? Manual SSH? Scripts? Nothing?",
      "required": true
    },
    {
      "key": "environments_needed",
      "type": "multiselect",
      "label": "Environments needed",
      "options": ["Dev", "Staging", "Production", "QA"]
    },
    {
      "key": "app_type",
      "type": "select",
      "label": "Application type",
      "options": ["Web app", "API/Backend", "Mobile backend", "Monorepo"],
      "required": true
    }
  ]
}'::jsonb, 4),

-- 5. Performance Audit & Fix
('performance-audit', 'Performance Audit & Fix', 'Find the bottlenecks. Fix them. Measure the improvement.',
'Our engineers profile your application under realistic load, identify the top performance bottlenecks, and fix them — with measurable before/after benchmarks. You get a faster app and a performance playbook.',
'optimize', 800000, 2200000, 5, 15, 'Zap',
'["Load testing & profiling under realistic traffic", "Bottleneck identification & root cause analysis", "Top 5–10 fixes implemented", "Before/after benchmark report", "Performance monitoring setup", "Optimization playbook for ongoing maintenance"]'::jsonb,
'{
  "fields": [
    {
      "key": "app_url",
      "type": "text",
      "label": "Application URL",
      "placeholder": "https://your-app.com",
      "required": true
    },
    {
      "key": "tech_stack",
      "type": "textarea",
      "label": "Tech stack",
      "placeholder": "e.g. Next.js frontend, Node.js API, PostgreSQL, Redis — hosted on AWS ECS",
      "required": true
    },
    {
      "key": "current_issues",
      "type": "textarea",
      "label": "What performance problems are you seeing?",
      "placeholder": "Slow page loads? API timeouts? Database lock-ups? Dashboard lag?",
      "required": true
    },
    {
      "key": "traffic_volume",
      "type": "select",
      "label": "Current traffic volume",
      "options": ["<1K req/min", "1K–10K", "10K–100K", "100K+"],
      "required": true
    },
    {
      "key": "target_metrics",
      "type": "textarea",
      "label": "What does ''fast enough'' look like?",
      "placeholder": "e.g. P95 API response < 200ms, page load < 2s on 4G"
    }
  ]
}'::jsonb, 5)

on conflict (slug) do nothing;


-- ── Talent Profiles ───────────────────────────────────────────────────────────

insert into talent_profiles (id, display_name, title, seniority, bio, skills, ai_velocity_score, years_experience, hourly_rate_cents, highlight_projects) values

('c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', 'Marcus', 'Senior Full-Stack Engineer', 'senior',
'I build fast, maintainable product backends and pair them with clean React frontends. I''ve shipped SaaS products from zero to Series A scale and have strong opinions about API design and database modeling. My AI workflow triples output on greenfield features without sacrificing code quality.',
'["React", "TypeScript", "Node.js", "PostgreSQL", "Next.js", "AWS", "Prisma"]'::jsonb,
2.4, 8, 18500,
'[{"title": "Fintech Dashboard Rebuild", "description": "Led a 3-month rewrite of a legacy banking dashboard handling $2B in daily transactions. Migrated to Next.js + tRPC, reduced bundle size by 60% and API latency by 40%.", "tech": ["Next.js", "tRPC", "PostgreSQL", "AWS"]}, {"title": "Real-Time Collaboration Tool", "description": "Built a Notion-like collaborative editor from scratch with real-time sync, offline support, and conflict resolution for a Series A startup.", "tech": ["React", "Yjs", "WebSockets", "Node.js"]}]'::jsonb),

('c2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7', 'Priya', 'Staff Engineer – Backend & Infrastructure', 'staff',
'Distributed systems engineer with a focus on reliability and scale. I''ve designed data pipelines processing billions of events per day and led migrations from monoliths to service-oriented architectures. I use AI tools to accelerate infrastructure automation and cut toil dramatically.',
'["Go", "Kubernetes", "PostgreSQL", "Kafka", "Terraform", "Python", "gRPC"]'::jsonb,
2.7, 12, 24000,
'[{"title": "Event Streaming Platform", "description": "Designed and built a multi-tenant Kafka-based event streaming platform processing 5B events/day for a logistics company. Zero-downtime deploys, 99.99% uptime.", "tech": ["Kafka", "Go", "Kubernetes", "Terraform"]}, {"title": "Monolith to Microservices Migration", "description": "Led 18-month migration of a 500K LOC Rails monolith to event-driven microservices. Reduced deploy time from 45 minutes to 3 minutes.", "tech": ["Go", "gRPC", "PostgreSQL", "Kubernetes"]}]'::jsonb),

('c3c4d5e6-f7a8-b9c0-d1e2-f3a4b5c6d7e8', 'Jordan', 'Senior iOS Engineer', 'senior',
'iOS specialist who cares deeply about native performance and intuitive UX. I''ve shipped apps with millions of MAU and know every corner of UIKit and SwiftUI. I leverage AI pair programming to prototype at 2x speed while maintaining the polish users expect from top-tier iOS apps.',
'["Swift", "SwiftUI", "UIKit", "Core Data", "Combine", "Xcode", "TestFlight"]'::jsonb,
2.1, 7, 17500,
'[{"title": "Health & Fitness App", "description": "Led iOS development for a fitness app that reached #3 in the Health category on the App Store with 800K downloads in 6 months. Custom animation engine and HealthKit integration.", "tech": ["Swift", "SwiftUI", "HealthKit", "Core Data"]}, {"title": "Real-Time Transit App", "description": "Built an offline-first transit app with live vehicle tracking and predictive arrival times serving 200K daily active users.", "tech": ["Swift", "MapKit", "Core Location", "Combine"]}]'::jsonb),

('c4d5e6f7-a8b9-c0d1-e2f3-a4b5c6d7e8f9', 'Amara', 'Senior ML Engineer', 'senior',
'I build ML systems that actually make it to production. My background spans recommendation systems, NLP pipelines, and computer vision — and I specialize in the unglamorous work of getting models out of notebooks and into reliable, scalable services.',
'["Python", "PyTorch", "MLflow", "FastAPI", "AWS SageMaker", "Pandas", "Docker"]'::jsonb,
2.3, 6, 19000,
'[{"title": "Personalization Engine", "description": "Built and deployed a real-time recommendation engine for an e-commerce platform that increased click-through rate by 34% and average order value by 18%.", "tech": ["PyTorch", "FastAPI", "Redis", "AWS SageMaker"]}, {"title": "Document Intelligence Pipeline", "description": "Created an NLP pipeline that extracts structured data from 50K+ contracts per day, reducing manual review time by 85%.", "tech": ["Python", "spaCy", "FastAPI", "PostgreSQL"]}]'::jsonb),

('c5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0', 'Devon', 'Principal DevOps & Platform Engineer', 'principal',
'Platform engineer who builds the systems other engineers love. I''ve designed golden paths for dozens of engineering teams — from CI/CD to internal developer portals. AI tools have transformed how I write Terraform and build automation; I ship infrastructure 3x faster than I did three years ago.',
'["Terraform", "AWS", "Kubernetes", "GitHub Actions", "Python", "ArgoCD", "Prometheus"]'::jsonb,
2.6, 14, 26000,
'[{"title": "Internal Developer Platform", "description": "Built a Backstage-based internal developer portal adopted by 200+ engineers across 15 teams. Self-service infrastructure provisioning reduced ops tickets by 70%.", "tech": ["Backstage", "Terraform", "AWS", "Kubernetes"]}, {"title": "Zero-Downtime Migration", "description": "Led AWS region migration for a healthcare platform with strict HIPAA requirements. 18-month project completed with zero downtime and full compliance audit trail.", "tech": ["AWS", "Terraform", "ArgoCD", "Python"]}]'::jsonb),

('c6f7a8b9-c0d1-e2f3-a4b5-c6d7e8f9a0b1', 'Sasha', 'Senior Full-Stack Engineer – React & Node', 'senior',
'Product-focused engineer who thrives at the intersection of design and engineering. I build UIs that feel fast and intuitive and back them with clean APIs. I have a strong eye for UX and collaborate closely with design teams. AI-assisted development has made me significantly faster at generating boilerplate and prototyping new features.',
'["React", "TypeScript", "Node.js", "GraphQL", "Tailwind CSS", "Prisma", "Vercel"]'::jsonb,
2.2, 6, 17000,
'[{"title": "B2B SaaS Analytics Dashboard", "description": "Built a complex analytics dashboard with 40+ chart types, real-time updates, and white-labeling for a B2B SaaS product used by 500+ companies.", "tech": ["React", "Recharts", "GraphQL", "Node.js"]}, {"title": "Design System Library", "description": "Architected and built a company-wide design system with 80+ components, full a11y compliance, and Storybook documentation. Adopted by 5 product teams.", "tech": ["React", "TypeScript", "Storybook", "Tailwind CSS"]}]'::jsonb),

('c7a8b9c0-d1e2-f3a4-b5c6-d7e8f9a0b1c2', 'Wei', 'Senior Android Engineer', 'senior',
'Android specialist with deep expertise in Jetpack Compose and modern Android architecture. I''ve shipped apps in fintech and health that handle sensitive data with the security and reliability those domains demand.',
'["Kotlin", "Jetpack Compose", "Android SDK", "Room", "Retrofit", "Coroutines", "Hilt"]'::jsonb,
1.9, 7, 17000,
'[{"title": "Mobile Banking App Redesign", "description": "Led the Jetpack Compose migration of a banking app with 1.2M users. Reduced crash rate by 45% and improved app store rating from 3.8 to 4.7.", "tech": ["Kotlin", "Jetpack Compose", "Biometrics API", "Room"]}, {"title": "Telehealth Platform", "description": "Built the Android side of a HIPAA-compliant telehealth app with video consultations, e-prescriptions, and offline medical records.", "tech": ["Kotlin", "WebRTC", "Room", "Hilt"]}]'::jsonb),

('c8b9c0d1-e2f3-a4b5-c6d7-e8f9a0b1c2d3', 'Nadia', 'Staff Engineer – Python & Data', 'staff',
'Data engineer and API architect. I design the plumbing that keeps data flowing reliably — from ingestion pipelines to the APIs that serve it to product teams. I lean heavily on AI to accelerate schema design, data transformation code, and API documentation.',
'["Python", "FastAPI", "PostgreSQL", "dbt", "Airflow", "Spark", "Redis"]'::jsonb,
1.8, 10, 21000,
'[{"title": "Data Warehouse Modernization", "description": "Redesigned a fragile ETL spaghetti system into a reliable dbt-based data warehouse processing 10TB/day. Analyst query time dropped from 45 seconds to 2 seconds average.", "tech": ["dbt", "Snowflake", "Airflow", "Python"]}, {"title": "API Gateway for Data Products", "description": "Built a FastAPI-based gateway serving ML model predictions and analytics to 30+ internal and external consumers with SLAs, rate limiting, and full observability.", "tech": ["FastAPI", "PostgreSQL", "Redis", "Prometheus"]}]'::jsonb)

on conflict (id) do nothing;


-- ── Demo Companies ────────────────────────────────────────────────────────────

insert into companies (id, name, website, size, industry) values
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Acme Corp', 'https://acme.example.com', '51-200', 'E-commerce'),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Bloom Health', 'https://bloomhealth.example.com', '11-50', 'Healthcare')

on conflict (id) do nothing;


-- ── Demo Engagements ──────────────────────────────────────────────────────────

insert into engagements (id, company_id, template_id, mode, title, status, scope_summary, price_cents, start_date, target_end_date)
values
(
  'e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  (select id from outcome_templates where slug = 'mvp-sprint'),
  'predefined_outcome',
  'Acme Corp — Inventory Management MVP',
  'active',
  'Build a web-based inventory management system for Acme''s warehouse operations. Core features: product catalog with SKU management, real-time stock tracking, purchase order workflow, low-stock alerts, and a reporting dashboard. Stack: Next.js frontend, Node.js API, PostgreSQL. Target: 50 concurrent warehouse staff users.',
  2800000,
  '2026-03-24',
  '2026-04-18'
),
(
  'e2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  (select id from outcome_templates where slug = 'automated-testing'),
  'predefined_outcome',
  'Bloom Health — Automated Testing Setup',
  'in_review',
  'Establish a comprehensive test suite for Bloom''s React/Node.js telehealth platform. Scope includes: unit tests for all utility functions and hooks (target: 90% coverage), integration tests for the 12 critical API endpoints, and E2E tests for the 5 core user journeys (patient onboarding, appointment booking, video consult, prescription request, medical record access). CI integration via GitHub Actions.',
  1400000,
  '2026-03-31',
  '2026-04-11'
)

on conflict (id) do nothing;


-- ── Demo Milestones ───────────────────────────────────────────────────────────

-- Engagement 1: Acme Corp — 4 milestones
insert into milestones (engagement_id, title, description, status, deliverables, due_date, completed_at, display_order) values
(
  'e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
  'Architecture & Design',
  'Define the system architecture, database schema, and UI designs for the core inventory workflows.',
  'completed',
  '[{"name": "System architecture diagram", "description": "AWS infrastructure, service boundaries, data flow", "status": "done"}, {"name": "Database schema", "description": "Products, SKUs, locations, purchase orders, stock movements", "status": "done"}, {"name": "UI wireframes (8 screens)", "description": "Figma designs for all core views", "status": "done"}, {"name": "Tech stack document", "description": "Final decisions with rationale", "status": "done"}]'::jsonb,
  '2026-03-29', '2026-03-28 16:30:00+00', 1
),
(
  'e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
  'Core Build',
  'Implement the product catalog, stock tracking engine, and purchase order workflow.',
  'in_progress',
  '[{"name": "Product catalog API", "description": "CRUD endpoints with full-text search and filtering", "status": "done"}, {"name": "Stock tracking engine", "description": "Real-time inventory updates with audit trail", "status": "done"}, {"name": "Purchase order workflow", "description": "Create, approve, receive flow with email notifications", "status": "pending"}, {"name": "React frontend — catalog & stock views", "description": "Responsive UI connected to live API", "status": "pending"}]'::jsonb,
  '2026-04-09', null, 2
),
(
  'e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
  'Polish & QA',
  'Low-stock alert system, reporting dashboard, and full QA pass across all user flows.',
  'upcoming',
  '[{"name": "Low-stock alert system", "description": "Configurable thresholds with email/SMS notifications", "status": "pending"}, {"name": "Reporting dashboard", "description": "Stock value, turnover rate, PO velocity charts", "status": "pending"}, {"name": "QA pass & bug fixes", "description": "End-to-end testing across Chrome, Safari, Firefox", "status": "pending"}]'::jsonb,
  '2026-04-14', null, 3
),
(
  'e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
  'Launch & Handoff',
  'Production deployment, staff onboarding documentation, and 30-day support window begins.',
  'upcoming',
  '[{"name": "Production deployment", "description": "AWS deployment with monitoring and alerting", "status": "pending"}, {"name": "Staff onboarding guide", "description": "Video walkthrough + written documentation", "status": "pending"}, {"name": "Admin user training", "description": "Live 60-minute walkthrough with warehouse managers", "status": "pending"}]'::jsonb,
  '2026-04-18', null, 4
)

on conflict do nothing;

-- Engagement 2: Bloom Health — 3 milestones
insert into milestones (engagement_id, title, description, status, deliverables, due_date, completed_at, display_order) values
(
  'e2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7',
  'Codebase Audit',
  'Analyze the existing codebase, identify testability gaps, and deliver a testing strategy.',
  'completed',
  '[{"name": "Coverage audit report", "description": "Current state: 8% coverage, 47 untested critical paths identified", "status": "done"}, {"name": "Testing strategy document", "description": "Framework selection (Jest + React Testing Library + Playwright), coverage targets, team guidelines", "status": "done"}, {"name": "CI configuration draft", "description": "GitHub Actions workflow with test gates", "status": "done"}]'::jsonb,
  '2026-04-04', '2026-04-03 14:00:00+00', 1
),
(
  'e2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7',
  'Test Suite Build',
  'Implement unit and integration tests across all critical paths. Deliver for client review.',
  'in_review',
  '[{"name": "Unit tests — utilities & hooks", "description": "186 tests covering all utility functions and 14 custom hooks. Coverage: 94%", "status": "done"}, {"name": "Integration tests — API endpoints", "description": "All 12 critical endpoints covered with happy path + error scenarios", "status": "done"}, {"name": "E2E tests — core user journeys", "description": "Playwright tests for patient onboarding, appointment booking, video consult flows", "status": "done"}, {"name": "Coverage report", "description": "Overall project coverage: 71% (up from 8%)", "status": "done"}]'::jsonb,
  '2026-04-10', null, 2
),
(
  'e2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7',
  'CI Integration',
  'Integrate all tests into the CI pipeline and hand off with documentation.',
  'upcoming',
  '[{"name": "GitHub Actions pipeline", "description": "Tests run on every PR with pass/fail gates", "status": "pending"}, {"name": "Coverage dashboard", "description": "Codecov integration with badge on README", "status": "pending"}, {"name": "Testing playbook", "description": "Guidelines for the Bloom engineering team to maintain and extend coverage", "status": "pending"}]'::jsonb,
  '2026-04-11', null, 3
)

on conflict do nothing;


-- ── Demo Messages ─────────────────────────────────────────────────────────────

-- Engagement 1: Acme Corp messages
insert into messages (engagement_id, sender_name, sender_role, content, is_system_message, created_at) values
('e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', 'System', 'system', 'Engagement created. Your AI-native PM will review your scope within 24 hours.', true, '2026-03-23 09:15:00+00'),
('e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', 'Jamie (PM)', 'pm', 'Hi! I''ve reviewed your intake form and I''m excited about this project. The inventory management scope is clear and well-defined. I have a few quick questions before we finalize architecture: (1) How many warehouse locations will the system need to support? (2) Do you need barcode/QR scanner integration? (3) Any existing ERP we need to integrate with (SAP, NetSuite, etc.)?', false, '2026-03-23 11:30:00+00'),
('e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', 'Tyler (Acme)', 'client', 'Hey Jamie! Great questions. We have 3 warehouse locations. Barcode scanning would be great — our staff all have handheld scanners already. And yes, we use NetSuite but it''s mostly for accounting so a one-way sync (inventory → NetSuite) would be sufficient. Let me know if you need anything else!', false, '2026-03-23 14:45:00+00'),
('e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', 'Jamie (PM)', 'pm', 'Perfect — this is all very actionable. I''ve updated the scope to include barcode scanning (camera-based via browser API, no native app needed) and a NetSuite outbound sync. I''ll have the architecture doc and wireframes ready for your review by Thursday EOD. The engineering team starts Monday.', false, '2026-03-24 09:00:00+00'),
('e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', 'System', 'system', 'Milestone 1 (Architecture & Design) marked as completed.', true, '2026-03-28 16:30:00+00'),
('e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', 'Marcus (Engineer)', 'engineer', 'Architecture doc and Figma designs are ready for review — I''ve shared the link via email. The DB schema is finalized. We''re using Next.js 14 + Supabase for the backend, which lets us move fast and gives you real-time updates out of the box. Kicking off the product catalog API today.', false, '2026-03-29 10:15:00+00'),
('e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', 'Tyler (Acme)', 'client', 'Designs look great! One feedback: on the stock overview screen, can we add a "Days of Stock Remaining" column? That''s the metric our warehouse managers check first every morning.', false, '2026-03-31 08:30:00+00'),
('e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', 'Marcus (Engineer)', 'engineer', 'Done — added Days of Stock Remaining calculated from average daily movement over the last 30 days. It''ll be a real-time computed column so it updates automatically as stock moves. Good call, this is genuinely useful.', false, '2026-03-31 11:00:00+00')

on conflict do nothing;

-- Engagement 2: Bloom Health messages
insert into messages (engagement_id, sender_name, sender_role, content, is_system_message, created_at) values
('e2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7', 'System', 'system', 'Engagement created. Your AI-native PM will review your scope within 24 hours.', true, '2026-03-30 10:00:00+00'),
('e2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7', 'Sam (PM)', 'pm', 'Hi! I''ve audited your repo and put together the testing strategy doc — it''s in your shared Drive folder. Main finding: you''re at 8% coverage today but the codebase is actually quite testable once we set up the right patterns. I expect we can hit 70%+ coverage in the 8-day build window. The E2E tests for the video consult flow will be the trickiest part — can you give me access to a staging environment with test HIPAA data?', false, '2026-03-31 13:00:00+00'),
('e2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7', 'Keisha (Bloom)', 'client', 'Sending staging credentials now via 1Password. The environment is already HIPAA-sandboxed with synthetic patient data. One request: can we prioritize the prescription request E2E test? That flow has had the most prod incidents.', false, '2026-03-31 15:30:00+00'),
('e2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7', 'Sam (PM)', 'pm', 'Absolutely — prescription request will be the first E2E we build. We found a race condition in that flow during the audit that likely explains some of your incidents. We''ll write a regression test for it specifically.', false, '2026-04-01 09:00:00+00'),
('e2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7', 'System', 'system', 'Milestone 1 (Codebase Audit) marked as completed.', true, '2026-04-03 14:00:00+00'),
('e2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7', 'Sam (PM)', 'pm', 'Test suite build is complete and ready for your review. We hit 71% overall coverage (up from 8%), including 94% on utilities/hooks and 100% on the prescription flow with a regression test for the race condition. Milestone 2 is marked In Review — please take a look and let us know if anything needs adjustment before we wire it into CI.', false, '2026-04-10 16:00:00+00')

on conflict do nothing;
