-- ─────────────────────────────────────────────────────────────────────────────
-- Glassbox Seed Data  (idempotent — safe to re-run)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Outcome Templates ─────────────────────────────────────────────────────────

insert into outcome_templates (slug, title, subtitle, description, category, price_range_low, price_range_high, timeline_range_low, timeline_range_high, icon, features, intake_schema, display_order) values

-- 1. MVP Sprint
('mvp-sprint', 'MVP Sprint', 'From idea to working product in 3 weeks',
'Get a production-ready MVP built by an AI-native engineering team. You bring the product brief — we handle architecture, design, development, testing, and deployment. Includes one round of revisions and 30-day post-launch support.',
'custom', 1500000, 3500000, 15, 21, 'Rocket',
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
'custom', 800000, 2000000, 5, 10, 'TestTube',
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
'custom', 500000, 1500000, 5, 10, 'Globe',
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
'custom', 600000, 1800000, 5, 10, 'GitBranch',
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
'custom', 800000, 2200000, 5, 15, 'Zap',
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
}'::jsonb, 5),

-- 6. AI Feature Integration
('ai-feature-integration', 'AI Feature Integration', 'Ship production AI features inside your existing product',
'Your product already works — now make it intelligent. We integrate AI capabilities directly into your existing application: natural language search, intelligent recommendations, content generation, classification, summarisation, and conversational interfaces. No science projects — we deploy production-grade features backed by Claude, GPT-4, or open-source models, with proper guardrails, latency budgets, and cost controls. Includes prompt engineering, model selection, evaluation harness, and full integration testing.',
'custom', 2000000, 5000000, 10, 21, 'Sparkles',
'["AI feature discovery & feasibility assessment", "Model selection & benchmarking (Claude, GPT-4, open-source)", "Prompt engineering & prompt management system", "Production API integration with latency & cost guardrails", "Evaluation harness with accuracy metrics", "Streaming UI for real-time AI responses", "Fallback & error handling for model failures", "Usage monitoring & cost dashboard"]'::jsonb,
'{
  "fields": [
    {
      "key": "product_description",
      "type": "textarea",
      "label": "Describe your product",
      "placeholder": "What does your product do today? Who are the users? What tech stack is it built on?",
      "required": true
    },
    {
      "key": "ai_features",
      "type": "textarea",
      "label": "What AI features do you want to add?",
      "placeholder": "e.g. Natural language search, smart recommendations, auto-categorisation, content generation, chatbot...",
      "required": true
    },
    {
      "key": "model_preference",
      "type": "select",
      "label": "Model preference",
      "options": ["Claude (Anthropic)", "GPT-4 (OpenAI)", "Open-source (Llama, Mistral)", "No preference — recommend for us"],
      "required": true
    },
    {
      "key": "data_sensitivity",
      "type": "select",
      "label": "Data sensitivity level",
      "options": ["Public data only", "Internal business data", "PII / regulated data", "Healthcare (HIPAA)", "Financial (SOC2)"],
      "required": true
    },
    {
      "key": "latency_requirement",
      "type": "select",
      "label": "Latency requirements",
      "options": ["Real-time (< 1s)", "Near real-time (1–5s)", "Batch / async is fine", "Not sure"],
      "required": true
    },
    {
      "key": "existing_api_infra",
      "type": "select",
      "label": "Do you have existing API infrastructure?",
      "options": ["Yes — REST APIs", "Yes — GraphQL", "Yes — both", "Minimal / greenfield"],
      "required": true
    }
  ]
}'::jsonb, 6),

-- 7. Agentic Workflow Builder
('agentic-workflows', 'Agentic Workflow Builder', 'Autonomous AI agents that execute complex business processes',
'We design and deploy autonomous AI agent systems that handle multi-step business workflows end-to-end. These aren''t chatbots — they''re agents with tool access, memory, reasoning, and the ability to take real actions: querying databases, calling APIs, sending emails, updating records, and escalating to humans when confidence is low. Built on proven frameworks (LangGraph, CrewAI, or custom orchestration), with full observability and human-in-the-loop safeguards.',
'custom', 2500000, 6000000, 15, 25, 'Bot',
'["Workflow discovery & agent architecture design", "Agent orchestration framework (LangGraph / CrewAI / custom)", "Tool integration (APIs, databases, email, Slack, CRM)", "Memory & context management across sessions", "Human-in-the-loop escalation triggers", "Guardrails & safety layer (content filtering, action limits)", "Observability dashboard (traces, costs, success rates)", "Agent evaluation suite with regression testing"]'::jsonb,
'{
  "fields": [
    {
      "key": "workflow_description",
      "type": "textarea",
      "label": "Describe the workflow to automate",
      "placeholder": "Walk us through the process step by step. What triggers it? What decisions are made? What systems are touched? What does ''done'' look like?",
      "required": true
    },
    {
      "key": "current_process",
      "type": "select",
      "label": "How is this workflow handled today?",
      "options": ["Fully manual (people do it)", "Partially automated (scripts, Zapier, etc.)", "Outsourced to a BPO / VA team", "Not handled — it''s a new capability"],
      "required": true
    },
    {
      "key": "systems_involved",
      "type": "multiselect",
      "label": "Systems the agent needs to interact with",
      "options": ["Internal database", "REST / GraphQL APIs", "Email / Slack", "CRM (Salesforce, HubSpot)", "ERP / accounting", "File storage (S3, Drive)", "Web scraping"]
    },
    {
      "key": "volume",
      "type": "select",
      "label": "Expected volume",
      "options": ["< 100 tasks/day", "100–1K tasks/day", "1K–10K tasks/day", "10K+ tasks/day"],
      "required": true
    },
    {
      "key": "human_oversight",
      "type": "select",
      "label": "Human oversight level needed",
      "options": ["Full autonomy — agent decides", "Human approves high-risk actions", "Human reviews every output", "Not sure — help us decide"],
      "required": true
    },
    {
      "key": "success_criteria",
      "type": "textarea",
      "label": "How will you measure success?",
      "placeholder": "e.g. 80% of tickets resolved without human intervention, < 5 min average processing time, 95% accuracy on classification..."
    }
  ]
}'::jsonb, 7),

-- 8. AI-SDLC Implementation
('ai-sdlc', 'AI-SDLC Implementation', 'Transform your engineering team''s development lifecycle with AI',
'We embed AI tooling into every phase of your software development lifecycle — from planning to production. This is not about buying Copilot licenses. We implement AI-augmented code review, automated PR summaries, intelligent test generation, AI-powered documentation, predictive bug detection, and developer productivity analytics. Your team ships faster and with fewer defects, measured by hard metrics before and after.',
'custom', 1500000, 4000000, 10, 20, 'Cpu',
'["Developer workflow audit & AI readiness assessment", "AI code review pipeline (PR-level analysis & suggestions)", "Automated test generation from code changes", "AI-powered documentation generation & maintenance", "Intelligent PR summaries & changelog automation", "Predictive defect detection from code patterns", "Developer productivity metrics dashboard", "Team training & AI-SDLC playbook"]'::jsonb,
'{
  "fields": [
    {
      "key": "team_size",
      "type": "select",
      "label": "Engineering team size",
      "options": ["1–5 engineers", "6–15 engineers", "16–50 engineers", "50+ engineers"],
      "required": true
    },
    {
      "key": "current_tools",
      "type": "multiselect",
      "label": "AI tools currently in use",
      "options": ["GitHub Copilot", "Cursor / Windsurf", "ChatGPT / Claude (manual)", "AI code review tools", "None yet"]
    },
    {
      "key": "primary_languages",
      "type": "multiselect",
      "label": "Primary languages / frameworks",
      "options": ["TypeScript / JavaScript", "Python", "Go", "Java / Kotlin", "Ruby", "C# / .NET", "Rust"]
    },
    {
      "key": "pain_points",
      "type": "textarea",
      "label": "Biggest development bottlenecks",
      "placeholder": "e.g. Code reviews take 2+ days, test coverage is low, documentation is always stale, onboarding new engineers takes weeks...",
      "required": true
    },
    {
      "key": "repo_host",
      "type": "select",
      "label": "Source control & CI",
      "options": ["GitHub + GitHub Actions", "GitLab + GitLab CI", "Bitbucket + Jenkins", "Azure DevOps", "Other"],
      "required": true
    },
    {
      "key": "priority",
      "type": "select",
      "label": "Top priority",
      "options": ["Ship features faster", "Reduce bugs in production", "Improve code review speed", "Better documentation", "All of the above"],
      "required": true
    }
  ]
}'::jsonb, 8),

-- 9. AI-Ready Data Modernisation
('ai-ready-data', 'AI-Ready Data Modernisation', 'Structure your data so AI can actually use it',
'AI is only as good as the data it runs on. We modernise your data infrastructure to be AI-ready: cleaning and normalising data, building vector stores and embeddings pipelines, implementing RAG (Retrieval-Augmented Generation) architectures, creating semantic search indices, and setting up data governance for AI workloads. The result is a data layer that makes every AI feature you build faster, cheaper, and more accurate.',
'custom', 2000000, 5500000, 15, 25, 'Database',
'["Data audit & AI readiness assessment", "Data cleaning, normalisation & deduplication", "Vector database setup (Pinecone, Weaviate, or pgvector)", "Embeddings pipeline for documents, products, or content", "RAG architecture design & implementation", "Semantic search index with hybrid retrieval", "Data governance & access control for AI workloads", "Migration runbook & monitoring dashboard"]'::jsonb,
'{
  "fields": [
    {
      "key": "data_description",
      "type": "textarea",
      "label": "Describe your data landscape",
      "placeholder": "What data do you have? Where does it live (databases, data warehouse, S3, APIs)? How much data are we talking about? What format is it in?",
      "required": true
    },
    {
      "key": "ai_use_case",
      "type": "textarea",
      "label": "What AI use cases will this data power?",
      "placeholder": "e.g. Semantic search over 500K support tickets, RAG chatbot trained on internal docs, product recommendations from purchase history...",
      "required": true
    },
    {
      "key": "current_database",
      "type": "select",
      "label": "Primary database",
      "options": ["PostgreSQL", "MySQL", "MongoDB", "Snowflake / BigQuery", "Multiple / mixed", "Other"],
      "required": true
    },
    {
      "key": "data_volume",
      "type": "select",
      "label": "Approximate data volume",
      "options": ["< 1 GB", "1–100 GB", "100 GB – 1 TB", "1 TB+"],
      "required": true
    },
    {
      "key": "vector_db_preference",
      "type": "select",
      "label": "Vector database preference",
      "options": ["Pinecone", "Weaviate", "pgvector (Postgres)", "Qdrant", "No preference — recommend for us"],
      "required": true
    },
    {
      "key": "compliance_requirements",
      "type": "multiselect",
      "label": "Compliance requirements",
      "options": ["SOC2", "HIPAA", "GDPR", "PCI-DSS", "None / internal only"]
    }
  ]
}'::jsonb, 9),

-- 10. AI-Native Experience Build
('ai-native-experience', 'AI-Native Experience Build', 'Build a product where AI is the experience, not a feature',
'For products where AI isn''t a bolt-on — it IS the product. We build AI-native applications from scratch: conversational interfaces, generative content tools, AI copilots, intelligent dashboards, and multimodal experiences. The entire UX is designed around AI interaction patterns — streaming responses, progressive disclosure, confidence indicators, and graceful degradation. Built for production scale with proper evaluation, monitoring, and cost management from day one.',
'custom', 3000000, 7500000, 20, 30, 'Wand',
'["AI-native product strategy & UX design", "Conversational / generative UI architecture", "Streaming response infrastructure", "Multi-model orchestration (routing, fallbacks, cost optimisation)", "Prompt management system with versioning & A/B testing", "Evaluation framework with automated quality scoring", "Usage analytics, cost tracking & rate limiting", "Production deployment with auto-scaling"]'::jsonb,
'{
  "fields": [
    {
      "key": "product_vision",
      "type": "textarea",
      "label": "Describe the AI-native product you want to build",
      "placeholder": "What is the core experience? Who is the user? What problem does it solve? How does AI power the interaction?",
      "required": true
    },
    {
      "key": "interaction_model",
      "type": "select",
      "label": "Primary AI interaction model",
      "options": ["Conversational (chat-like)", "Generative (content creation)", "Copilot (augments user actions)", "Analytical (AI-powered insights)", "Multi-modal (text + image + voice)"],
      "required": true
    },
    {
      "key": "platform",
      "type": "select",
      "label": "Target platform",
      "options": ["Web application", "Mobile (iOS/Android)", "Desktop (Electron)", "API / headless", "Cross-platform"],
      "required": true
    },
    {
      "key": "target_users",
      "type": "select",
      "label": "Target users",
      "options": ["Internal team / employees", "B2B customers", "B2C consumers", "Developers (API product)"],
      "required": true
    },
    {
      "key": "scale_expectations",
      "type": "select",
      "label": "Expected scale at launch",
      "options": ["< 100 users", "100–1K users", "1K–10K users", "10K+ users"],
      "required": true
    },
    {
      "key": "existing_assets",
      "type": "multiselect",
      "label": "Existing assets to build on",
      "options": ["Product spec / PRD", "Figma designs", "Brand guidelines", "Existing codebase", "Training data / knowledge base", "Starting from scratch"]
    },
    {
      "key": "model_preference",
      "type": "select",
      "label": "AI model preference",
      "options": ["Claude (Anthropic)", "GPT-4 (OpenAI)", "Open-source models", "Multiple / routing", "No preference"],
      "required": true
    }
  ]
}'::jsonb, 10),

-- ─── Partnership Offerings ────────────────────────────────────────────────────

-- 11. Google Cloud — Vertex AI Feature Integration
('vertex-ai-integration', 'Vertex AI Feature Integration', 'Ship Gemini-powered features on Google Cloud',
'Integrate Google Vertex AI (Gemini 1.5, grounding, and enterprise search) into your existing product. We handle model selection, grounded retrieval against your corpus, safety filters, and production deployment on Google Cloud — with full observability via Cloud Logging and Cloud Monitoring. Includes prompt management, evaluation harness, and cost controls from day one.',
'google_cloud', 2000000, 5000000, 10, 21, 'Sparkles',
'["Vertex AI integration & model selection (Gemini 1.5 Pro/Flash)", "Grounded RAG with Vertex AI Search / your data", "Safety, PII, and jailbreak filters", "Cloud Run / GKE deployment with autoscaling", "Prompt library + versioning in Firestore", "Evaluation harness on Vertex AI Experiments", "Cost & latency dashboards (Cloud Monitoring)", "SOC2-aligned logging & audit trails"]'::jsonb,
'{"fields":[{"key":"use_case","type":"textarea","label":"AI feature to build","placeholder":"Describe the user-facing behavior (chat, search, summarization, classification, etc.)","required":true},{"key":"gcp_maturity","type":"select","label":"Google Cloud maturity","options":["Greenfield GCP","Some workloads","Primary cloud"],"required":true},{"key":"data_location","type":"select","label":"Where does your grounding data live?","options":["BigQuery","Cloud Storage","Firestore","External (Postgres / Snowflake)","Mixed"],"required":true},{"key":"scale","type":"select","label":"Expected query volume","options":["<1K/day","1K–100K/day","100K+/day"],"required":true},{"key":"compliance","type":"multiselect","label":"Compliance requirements","options":["SOC2","HIPAA","GDPR","PCI-DSS","None"]}]}'::jsonb, 11),

-- 12. Google Cloud — BigQuery Data Platform Build
('bigquery-data-platform', 'BigQuery Data Platform Build', 'Modern analytics lakehouse on BigQuery + Looker',
'We design and implement a production-grade data platform on BigQuery — from ingestion through to executive dashboards. Includes streaming and batch ingestion via Dataflow, dimensional modeling with dbt, Looker and Looker Studio dashboards, row-level security, and cost governance. The outcome: trustworthy numbers at every level of the org, with sub-second dashboard response on datasets into the billions of rows.',
'google_cloud', 2500000, 6500000, 15, 25, 'Database',
'["Source-to-BigQuery ingestion (Dataflow / Pub/Sub / Fivetran)", "Dimensional modeling with dbt", "Partitioning & clustering strategy for cost control", "Looker semantic layer with LookML", "Executive + operational Looker Studio dashboards", "Row-level security & data governance", "BigQuery slot monitoring & cost optimization", "Runbook for the client data team"]'::jsonb,
'{"fields":[{"key":"current_stack","type":"textarea","label":"Current analytics stack","placeholder":"Where does data live today? What BI tool? Any pain points?","required":true},{"key":"data_sources","type":"multiselect","label":"Data sources to unify","options":["Production Postgres/MySQL","Salesforce","HubSpot","Stripe","Segment","Google Analytics","App event stream","Other"]},{"key":"data_volume","type":"select","label":"Approximate daily data volume","options":["<10 GB","10–500 GB","500 GB – 5 TB","5 TB+"],"required":true},{"key":"dashboard_audience","type":"select","label":"Primary dashboard audience","options":["Exec team","Ops team","Product / engineering","External (customers)","Mixed"],"required":true},{"key":"timeline","type":"select","label":"Timeline pressure","options":["ASAP","4–6 weeks","Flexible"],"required":true}]}'::jsonb, 12),

-- 13. NVIDIA — NIM Microservices Integration
('nvidia-nim-integration', 'NVIDIA NIM Microservices Integration', 'Production-grade inference with NVIDIA NIM',
'Deploy NVIDIA NIM (Inference Microservices) for scalable, low-latency AI in production. We containerize and orchestrate NIM for your chosen model family (Llama, Mistral, Nemotron, or your fine-tuned model), integrate it with your application layer, and set up autoscaling on Kubernetes or NVIDIA DGX Cloud. Includes benchmarking against your latency and throughput targets and a cost model so you can compare against hosted APIs.',
'nvidia', 2500000, 6500000, 15, 25, 'Cpu',
'["Model selection & NIM container setup", "Kubernetes / DGX Cloud deployment with GPU autoscaling", "Triton Inference Server tuning for latency", "Application-layer integration (gRPC / REST)", "Load testing & throughput benchmarks", "Observability stack (Prometheus + Grafana + NIM metrics)", "Cost model vs. hosted APIs (Anthropic, OpenAI, Bedrock)", "Failover & model version rollout runbook"]'::jsonb,
'{"fields":[{"key":"model_family","type":"select","label":"Model family","options":["Llama (Meta)","Mistral","Nemotron (NVIDIA)","Fine-tuned custom","Not sure — recommend"],"required":true},{"key":"latency_sla","type":"select","label":"Latency SLA","options":["<100ms P95","100–500ms","<1s","Async / batch"],"required":true},{"key":"deployment_target","type":"select","label":"Deployment target","options":["AWS EKS (with GPU nodes)","GCP GKE","Azure AKS","NVIDIA DGX Cloud","On-prem"],"required":true},{"key":"throughput","type":"select","label":"Expected throughput","options":["<100 req/min","100–10K req/min","10K+ req/min"],"required":true},{"key":"current_setup","type":"textarea","label":"Current inference setup","placeholder":"Are you on a hosted API today? What''s driving the move to self-hosted?"}]}'::jsonb, 13),

-- 14. NVIDIA — CUDA-Accelerated Compute Pipeline
('cuda-compute-pipeline', 'CUDA-Accelerated Compute Pipeline', 'GPU-accelerated data & AI pipelines on NVIDIA hardware',
'Rebuild your compute-heavy pipeline on NVIDIA GPU infrastructure — CUDA, cuDF (RAPIDS), Triton, and TensorRT — for 10–100x speedups on data processing, model training, and inference. Ideal for ML/AI workloads, quant / financial modeling, genomics, simulation, and video/image processing. Includes cluster provisioning, job orchestration, cost optimization, and a playbook for your team to extend.',
'nvidia', 3000000, 8000000, 20, 30, 'CircuitBoard',
'["Workload profiling & GPU architecture selection (H100 / L40S / A100)", "CUDA / RAPIDS (cuDF, cuML) pipeline rewrites", "TensorRT optimization for inference workloads", "Slurm / Kubernetes job orchestration", "Multi-node training with NCCL", "Cost-aware spot / reserved capacity strategy", "Observability (DCGM + Prometheus)", "Knowledge transfer & runbook"]'::jsonb,
'{"fields":[{"key":"workload_type","type":"select","label":"Primary workload","options":["ML training","ML inference","Data processing (ETL)","Simulation / modeling","Video / image processing","Mixed"],"required":true},{"key":"current_runtime","type":"textarea","label":"What are you running today?","placeholder":"Framework, hardware, and current runtime per job","required":true},{"key":"bottleneck","type":"textarea","label":"Primary bottleneck","placeholder":"Runtime too long? Cost too high? Both? Unable to scale?","required":true},{"key":"infra_preference","type":"select","label":"Infra preference","options":["Cloud (AWS/GCP/Azure GPU instances)","NVIDIA DGX Cloud","On-prem DGX / HGX","Hybrid"],"required":true},{"key":"team_cuda_experience","type":"select","label":"Team CUDA experience","options":["None","Some (can read CUDA)","Strong (can write CUDA)"],"required":true}]}'::jsonb, 14),

-- 15. AWS — Amazon Bedrock AI Integration
('bedrock-ai-integration', 'Amazon Bedrock AI Integration', 'Claude, Llama, and more — integrated on AWS',
'Integrate Amazon Bedrock into your AWS-native application with full enterprise controls. We handle model selection (Claude, Llama, Titan), Knowledge Bases for RAG on your S3 data, Agents for Bedrock for tool use, IAM-based model access policies, PrivateLink for VPC-only traffic, and Guardrails for safety. Deployed via CDK with full CloudWatch observability and cost attribution per feature.',
'aws', 2000000, 5000000, 10, 21, 'Cloud',
'["Bedrock model selection (Claude 3.5/3 Opus/Sonnet/Haiku, Titan, Llama)", "Knowledge Bases for Bedrock (RAG on S3)", "Agents for Bedrock with tool integration", "Guardrails for content filtering & PII", "PrivateLink + VPC endpoints for data residency", "IAM policies & model access controls", "CDK / Terraform deployment", "CloudWatch dashboards & per-feature cost tags"]'::jsonb,
'{"fields":[{"key":"aws_maturity","type":"select","label":"AWS maturity","options":["AWS is our primary cloud","AWS is one of several","Greenfield AWS"],"required":true},{"key":"model_preference","type":"select","label":"Model preference","options":["Claude family","Llama","Titan","Mixed / routing","No preference — recommend"],"required":true},{"key":"use_case","type":"textarea","label":"What will it do?","placeholder":"Describe the user-facing AI feature","required":true},{"key":"data_residency","type":"select","label":"Data residency requirement","options":["Must stay in specific region","Any US region","Any region","Not a concern"],"required":true},{"key":"existing_integration","type":"select","label":"Existing AWS services you use","options":["ECS/EKS + RDS","Lambda + DynamoDB","Elastic Beanstalk","EC2-only","Minimal"],"required":true}]}'::jsonb, 15),

-- 16. AWS — Serverless Platform Build
('aws-serverless-platform', 'AWS Serverless Platform Build', 'Zero-to-production on Lambda, DynamoDB, and API Gateway',
'Build a production-grade serverless application on AWS — Lambda, API Gateway, DynamoDB, EventBridge, Step Functions, and Cognito. We deliver a scalable, cost-efficient architecture designed for your specific workload pattern, deployed via CDK, with full observability, tracing, and cost controls. Ideal for APIs, event-driven workflows, and variable-load products where you don''t want to pay for idle capacity.',
'aws', 1800000, 4500000, 10, 20, 'Cloud',
'["Architecture design (Lambda + API Gateway + DynamoDB)", "Event-driven orchestration (EventBridge + Step Functions)", "Authentication (Cognito + JWT)", "CDK / Terraform infrastructure-as-code", "CI/CD pipeline (CodePipeline / GitHub Actions)", "Observability (X-Ray tracing + CloudWatch)", "Cost monitoring & alerting", "Handoff runbook for the client team"]'::jsonb,
'{"fields":[{"key":"app_description","type":"textarea","label":"What are you building?","placeholder":"Describe the product, users, and core workflows","required":true},{"key":"workload_pattern","type":"select","label":"Workload pattern","options":["API backend","Event-driven workflow","Scheduled batch jobs","Mixed / multiple"],"required":true},{"key":"traffic_estimate","type":"select","label":"Expected traffic","options":["<10K req/day","10K–1M req/day","1M+ req/day","Very spiky / unpredictable"],"required":true},{"key":"datastore","type":"select","label":"Primary datastore","options":["DynamoDB","RDS (Postgres)","Both","Need recommendation"],"required":true},{"key":"timeline","type":"select","label":"Timeline","options":["ASAP","4–6 weeks","Flexible"],"required":true}]}'::jsonb, 16),

-- 17. Azure — Azure OpenAI Service Integration
('azure-openai-integration', 'Azure OpenAI Service Integration', 'Enterprise GPT-4o on Azure with full governance',
'Integrate Azure OpenAI Service (GPT-4o, GPT-4, o1) into your enterprise application with full governance, private networking, and Microsoft compliance. We handle model deployment, Azure AI Search for RAG, Content Safety filters, Private Endpoints, Microsoft Entra ID authentication, and audit logging. Deployed via Bicep with Application Insights telemetry and cost attribution.',
'azure', 2000000, 5500000, 10, 21, 'Cloud',
'["Azure OpenAI model deployment (GPT-4o, o1, embeddings)", "Azure AI Search for RAG over your corpus", "Content Safety filters (jailbreak, PII, prompt shields)", "Private Endpoints + VNet integration", "Microsoft Entra ID auth & role-based access", "Bicep / Terraform infrastructure-as-code", "Application Insights + Log Analytics", "Microsoft-aligned compliance documentation"]'::jsonb,
'{"fields":[{"key":"use_case","type":"textarea","label":"Feature to build","placeholder":"What will the AI feature do? Who will use it?","required":true},{"key":"azure_maturity","type":"select","label":"Azure maturity","options":["Azure is our primary cloud","Azure is one of several","Greenfield Azure"],"required":true},{"key":"compliance_stack","type":"multiselect","label":"Compliance needs","options":["ISO 27001","SOC2","HIPAA","FedRAMP","GDPR","None"]},{"key":"auth_provider","type":"select","label":"Authentication","options":["Microsoft Entra ID","Other SAML","Custom","Not sure"],"required":true},{"key":"grounding_data","type":"select","label":"Grounding data location","options":["SharePoint / OneDrive","Azure Blob Storage","Azure SQL","External (SaaS)","Multiple sources"],"required":true}]}'::jsonb, 17),

-- 18. Azure — Microsoft Fabric Analytics Platform
('microsoft-fabric-platform', 'Microsoft Fabric Analytics Platform', 'Unified analytics + AI on OneLake and Fabric',
'We implement Microsoft Fabric end-to-end — OneLake storage, Data Factory pipelines, Synapse notebooks, Direct Lake semantic models, Power BI reports, and Fabric AI features (Copilot for Data). Designed around your existing Microsoft estate (Entra ID, Purview governance, Teams distribution). The result: a single source of truth that your business users can query in natural language and that your data scientists can extend.',
'azure', 2800000, 7500000, 15, 25, 'BarChart3',
'["OneLake architecture & medallion (bronze/silver/gold) design", "Data Factory ingestion pipelines", "Lakehouse transformations via Synapse notebooks", "Direct Lake semantic model with row-level security", "Power BI executive + operational reports", "Purview integration for governance & lineage", "Fabric Copilot enablement for business users", "Cost monitoring & capacity management"]'::jsonb,
'{"fields":[{"key":"current_bi_stack","type":"textarea","label":"Current BI / analytics stack","placeholder":"Power BI today? Which warehouse? Pain points?","required":true},{"key":"sources","type":"multiselect","label":"Data sources","options":["Dynamics 365","Salesforce","Azure SQL","On-prem SQL Server","Oracle","SAP","SaaS apps (other)"]},{"key":"users","type":"select","label":"Primary users","options":["Executives","Finance / ops","Sales / marketing","Engineering / product","Broad company-wide"],"required":true},{"key":"data_volume","type":"select","label":"Approximate volume","options":["<10 GB","10–500 GB","500 GB – 5 TB","5 TB+"],"required":true},{"key":"governance_needs","type":"multiselect","label":"Governance requirements","options":["Data lineage","PII classification","Row-level security","Audit logging","None of the above"]}]}'::jsonb, 18),

-- 19. Databricks — Lakehouse Platform Build
('databricks-lakehouse', 'Databricks Lakehouse Platform Build', 'Production lakehouse on Databricks + Unity Catalog',
'Design and build a modern lakehouse on Databricks — Delta Lake storage, Unity Catalog governance, DLT (Delta Live Tables) pipelines, Databricks SQL warehouses, and MLflow for ML lifecycle. Cloud-agnostic (AWS, Azure, or GCP). Delivered with a medallion architecture, automated data quality checks, cost-attribution per workspace, and a migration plan if you''re coming from Snowflake, Redshift, or a legacy Hadoop stack.',
'databricks', 3000000, 8000000, 20, 30, 'Database',
'["Medallion architecture (bronze / silver / gold) on Delta Lake", "Unity Catalog setup with RLS & column masking", "DLT pipelines for streaming + batch ingestion", "Databricks SQL warehouses for BI workloads", "MLflow-based model lifecycle (train, register, serve)", "Databricks Asset Bundles for CI/CD", "Cluster policies & cost-attribution tags", "Migration runbook from legacy warehouse (optional)"]'::jsonb,
'{"fields":[{"key":"cloud","type":"select","label":"Cloud target","options":["AWS","Azure","GCP","Multi-cloud"],"required":true},{"key":"current_stack","type":"textarea","label":"Current data stack","placeholder":"Snowflake, Redshift, Hadoop, nothing, etc.","required":true},{"key":"use_cases","type":"multiselect","label":"Primary workloads","options":["Batch analytics","Streaming analytics","ML training","ML inference","BI / reporting"]},{"key":"data_volume","type":"select","label":"Approximate data volume","options":["<1 TB","1–100 TB","100 TB – 1 PB","1 PB+"],"required":true},{"key":"team_experience","type":"select","label":"Team Databricks experience","options":["None","Some (used notebooks)","Strong (running workspaces)"],"required":true}]}'::jsonb, 19),

-- 20. Databricks — Mosaic AI Model Serving Integration
('mosaic-ai-serving', 'Mosaic AI Model Serving Integration', 'Deploy custom models via Databricks Mosaic AI',
'Deploy your custom or fine-tuned models via Databricks Mosaic AI Model Serving — real-time inference endpoints backed by GPU compute, with full integration into your Unity Catalog feature tables. We handle model registration, endpoint provisioning, autoscaling, A/B routing, drift monitoring, and integration with your application layer. Ideal when you''ve trained models on Databricks and now need to ship them to production.',
'databricks', 2000000, 5500000, 15, 25, 'Workflow',
'["MLflow model registration in Unity Catalog", "Mosaic AI serving endpoint provisioning", "Feature store integration for real-time lookup", "A/B traffic routing between model versions", "Autoscaling with GPU-backed compute", "Inference tables for drift & performance monitoring", "Application-layer client integration", "Rollback & canary deployment playbook"]'::jsonb,
'{"fields":[{"key":"model_type","type":"select","label":"Model type","options":["Traditional ML (sklearn, xgboost)","Deep learning (PyTorch/TensorFlow)","Fine-tuned LLM","Custom embedding model","Mixed"],"required":true},{"key":"latency_target","type":"select","label":"Latency target","options":["<50ms","50–200ms","200ms–1s","Async / batch"],"required":true},{"key":"traffic","type":"select","label":"Expected traffic","options":["<100 req/min","100–10K req/min","10K+ req/min"],"required":true},{"key":"features_setup","type":"select","label":"Feature store status","options":["Already using Databricks feature store","Features in Delta tables","Features elsewhere","Not using features"],"required":true},{"key":"current_serving","type":"textarea","label":"Where are models served today?","placeholder":"SageMaker, Vertex, homegrown, not in production yet, etc."}]}'::jsonb, 20),

-- 21. Domo — Analytics Dashboard Build
('domo-analytics-build', 'Domo Analytics Dashboard Build', 'Executive BI on Domo with live data feeds',
'We build a complete executive analytics experience on Domo — from source connectors (ERP, CRM, Finance, Product) through ETL (Magic ETL + Beast Mode calculations) to executive dashboards, pixel-perfect KPI cards, and scheduled PDF delivery to the C-suite. Includes Domo governance, PDP row-level security, and mobile-optimized cards for leadership on the go.',
'domo', 1200000, 3500000, 10, 20, 'BarChart3',
'["Source system connectors (NetSuite, Salesforce, HubSpot, SaaS apps)", "Magic ETL + Beast Mode calculations", "Executive KPI dashboard (6–12 boards)", "PDP (row-level) security rules", "Mobile-optimized cards & offline caching", "Scheduled PDF / email distribution", "Alert rules for threshold breaches", "Admin & editor training"]'::jsonb,
'{"fields":[{"key":"data_sources","type":"multiselect","label":"Data sources to connect","options":["NetSuite","Salesforce","HubSpot","Stripe","Google Ads","Google Analytics","QuickBooks","Internal database","Other SaaS"]},{"key":"kpi_focus","type":"textarea","label":"Top KPIs leadership tracks","placeholder":"Revenue, churn, CAC, pipeline, headcount, etc. — what are the 5-10 metrics that matter most?","required":true},{"key":"audience","type":"select","label":"Primary audience","options":["Exec team only","Exec + department heads","Company-wide","External stakeholders"],"required":true},{"key":"existing_domo","type":"select","label":"Current Domo usage","options":["No instance yet","Instance but underused","Heavy use, need a refresh"],"required":true},{"key":"delivery_prefs","type":"multiselect","label":"How should insights be delivered?","options":["Live dashboards","Scheduled email","Slack / Teams alerts","Mobile app"]}]}'::jsonb, 21),

-- 22. Domo — Embedded Analytics (Domo Everywhere)
('domo-embedded-everywhere', 'Domo Everywhere Embedded Analytics', 'Ship customer-facing analytics in your product',
'Embed Domo analytics inside your SaaS product using Domo Everywhere — multi-tenant dashboards that let your customers see their own data, branded as yours. We handle embed architecture, tenant data isolation (PDP), white-labeling, SSO integration, and in-app iframing with proper performance and responsiveness. A fast path to "customer-facing analytics" without building it from scratch.',
'domo', 1500000, 4000000, 10, 20, 'Globe',
'["Multi-tenant data model with PDP enforcement", "Domo Everywhere embed architecture", "White-label branding & custom theme", "SSO (SAML / JWT) integration with your app", "In-app iframe integration with your UI framework", "Usage analytics & tenant-level cost attribution", "Tenant onboarding automation", "Performance tuning for embedded load times"]'::jsonb,
'{"fields":[{"key":"product_type","type":"select","label":"Your product","options":["B2B SaaS","B2C SaaS","Marketplace","Internal tool","Other"],"required":true},{"key":"tenant_count","type":"select","label":"Number of customer tenants","options":["<50","50–500","500–5K","5K+"],"required":true},{"key":"data_volume_per_tenant","type":"select","label":"Typical data volume per tenant","options":["<1 GB","1–100 GB","100 GB+","Varies widely"],"required":true},{"key":"sso_provider","type":"select","label":"SSO provider","options":["Auth0","Okta","Custom JWT","None / build it"],"required":true},{"key":"branding_needs","type":"select","label":"Branding depth","options":["Fully white-labeled","Co-branded (powered by Domo)","Standard Domo branding"],"required":true}]}'::jsonb, 22),

-- 23. ServiceNow — App Engine Build
('servicenow-app-engine', 'ServiceNow App Engine Build', 'Custom ServiceNow apps on App Engine Studio',
'Build a custom ServiceNow application on App Engine Studio — tailored to your business process, integrated with your existing ServiceNow instance (ITSM, HRSD, CSM, or any custom table), and delivered as a scoped app ready for installation across environments. We handle data modeling, Flow Designer orchestration, UI Builder experience design, security roles, and migration through dev/test/prod. Ideal for replacing shadow-IT spreadsheets and bespoke workflows.',
'servicenow', 1800000, 5000000, 10, 21, 'Layers',
'["Scoped app design with custom tables & data model", "Flow Designer orchestration for workflows", "UI Builder pages for modern, responsive experience", "Role-based access control & ACLs", "IntegrationHub spokes for external system calls", "Automated Test Framework (ATF) test suite", "Update set / app repo CI/CD through environments", "Admin runbook & end-user documentation"]'::jsonb,
'{"fields":[{"key":"process_description","type":"textarea","label":"Process to automate","placeholder":"What workflow / process will this app handle? What pain are you solving?","required":true},{"key":"servicenow_module","type":"select","label":"Primary ServiceNow module","options":["ITSM","HRSD","CSM","GRC","Custom (no module)","Multiple"],"required":true},{"key":"user_count","type":"select","label":"Expected users","options":["<50","50–500","500–5K","5K+"],"required":true},{"key":"integrations","type":"multiselect","label":"External integrations","options":["Workday","SAP","Salesforce","Slack / Teams","Jira","Custom REST APIs","None"]},{"key":"existing_instance","type":"select","label":"ServiceNow instance status","options":["Production with heavy use","Production with light use","New instance (fresh)"],"required":true}]}'::jsonb, 23),

-- 24. ServiceNow — Now Assist AI Integration
('now-assist-integration', 'Now Assist AI Integration', 'Generative AI inside ITSM, HR, and CSM workflows',
'Enable Now Assist across your ServiceNow instance — AI-generated incident summaries, resolution suggestions, case recommendations, chat experiences in the portal, and knowledge article authoring. We configure the Now Assist skill library for your environment, fine-tune summarization against your knowledge base, set up topic routing for the virtual agent, and deliver change-management training for your support organization.',
'servicenow', 1500000, 4000000, 10, 21, 'Bot',
'["Now Assist skill enablement across ITSM / HRSD / CSM", "Incident & case summarization tuning", "Resolution recommendations from historical data", "Virtual Agent topic design & natural language routing", "AI knowledge article generation workflow", "Prompt optimization & guardrails", "Change management & support team training", "Adoption & impact dashboard (ticket deflection, AHT)"]'::jsonb,
'{"fields":[{"key":"modules","type":"multiselect","label":"Modules in scope","options":["ITSM","HRSD","CSM","FSM","IRM","Portal / VA"]},{"key":"pain_points","type":"textarea","label":"Support / service pain points","placeholder":"Long handle times? Low KB quality? Repetitive tickets?","required":true},{"key":"ticket_volume","type":"select","label":"Monthly ticket volume","options":["<1K","1K–10K","10K–100K","100K+"],"required":true},{"key":"now_assist_status","type":"select","label":"Now Assist licensing","options":["Licensed but not configured","Partially configured","Not yet licensed — need recommendation"],"required":true},{"key":"kb_maturity","type":"select","label":"Knowledge base maturity","options":["Strong KB","Moderate KB with gaps","Very little KB content"],"required":true}]}'::jsonb, 24),

-- 25. Salesforce — Agentforce Agent Build
('agentforce-agent-build', 'Agentforce Agent Build', 'Custom Agentforce agents for sales and service',
'Build production-ready Agentforce agents that operate inside Salesforce — Service Agent for customer support, Sales Development Representative (SDR) for outbound qualification, or a fully custom agent for your unique workflow. We handle topic and action library design, Apex action development, prompt engineering, guardrails via Trust Layer, and deployment through sandbox → production with full regression testing.',
'salesforce', 2500000, 6500000, 15, 25, 'Bot',
'["Agent topic & action library design", "Custom Apex actions for your workflows", "Prompt engineering with Salesforce Prompt Builder", "Trust Layer guardrails (masking, grounding, retention)", "Data grounding via Data Cloud / SOQL / Apex", "Sandbox → production deployment pipeline", "Agent regression test suite", "Admin & CSM team training"]'::jsonb,
'{"fields":[{"key":"agent_purpose","type":"select","label":"Primary agent purpose","options":["Service Agent (customer support)","SDR Agent (lead qualification)","Custom (describe below)"],"required":true},{"key":"workflow_description","type":"textarea","label":"Describe the agent''s job","placeholder":"What will the agent do end-to-end? What inputs, what actions, what outputs?","required":true},{"key":"sf_edition","type":"select","label":"Salesforce edition","options":["Enterprise","Unlimited","Einstein 1","Other / not sure"],"required":true},{"key":"integrations","type":"multiselect","label":"Systems the agent will touch","options":["Service Cloud","Sales Cloud","Marketing Cloud","Data Cloud","External REST APIs","Knowledge articles"]},{"key":"guardrails","type":"multiselect","label":"Guardrails needed","options":["PII masking","Toxicity filtering","Prompt injection protection","Zero data retention","Human handoff rules"]}]}'::jsonb, 25),

-- 26. Salesforce — Data Cloud + Agentforce Integration
('datacloud-agentforce', 'Data Cloud + Agentforce Integration', 'Grounded agents powered by unified customer data',
'Combine Salesforce Data Cloud (unified customer profiles across Sales, Service, Marketing, and external sources) with Agentforce to deploy agents that have real context. We ingest and harmonize your data sources into Data Cloud, build calculated insights and segments, and wire those directly into Agentforce prompts as grounding — so the agent knows each customer''s history, preferences, and open issues before it responds. The outcome: agents that feel like your best CSM on their best day.',
'salesforce', 3000000, 7500000, 20, 30, 'Workflow',
'["Data Cloud source ingestion (Sales, Service, Marketing, external)", "Identity resolution & unified customer profile", "Calculated insights & dynamic segments", "Data streams from external sources (S3, Snowflake, Kafka)", "Agentforce prompt grounding on Data Cloud objects", "Real-time customer context in agent conversations", "Activation to Sales Cloud, Marketing Cloud, or external channels", "Performance monitoring & quality evaluation"]'::jsonb,
'{"fields":[{"key":"data_sources","type":"multiselect","label":"Sources to unify in Data Cloud","options":["Service Cloud","Sales Cloud","Marketing Cloud","External website / product events","Snowflake / BigQuery","S3 / Azure / GCS","Other CRM"]},{"key":"use_case","type":"textarea","label":"Agent + data use case","placeholder":"What will agents do with unified customer context?","required":true},{"key":"identity_keys","type":"select","label":"Identity resolution basis","options":["Email is reliable","Customer ID is reliable","Fuzzy matching needed","Unsure"],"required":true},{"key":"volume","type":"select","label":"Customer record volume","options":["<100K","100K–10M","10M–100M","100M+"],"required":true},{"key":"activation","type":"multiselect","label":"Activation channels","options":["Agentforce","Marketing Cloud","Sales Cloud","External (ad platforms, warehouse)"]}]}'::jsonb, 26)

-- Upsert: keep re-runnable AND self-healing when categories / copy change.
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  description = excluded.description,
  category = excluded.category,
  price_range_low = excluded.price_range_low,
  price_range_high = excluded.price_range_high,
  timeline_range_low = excluded.timeline_range_low,
  timeline_range_high = excluded.timeline_range_high,
  icon = excluded.icon,
  features = excluded.features,
  intake_schema = excluded.intake_schema,
  display_order = excluded.display_order;


-- ── Talent Profiles ───────────────────────────────────────────────────────────

insert into talent_profiles (id, display_name, title, seniority, bio, skills, ai_velocity_score, years_experience, hourly_rate_cents, highlight_projects) values

('c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', 'Kenji', 'Forward Deployed Engineer — NVIDIA GPU & AI Infrastructure', 'principal',
'Forward-deployed engineer specialising in NVIDIA accelerated computing. I embed with client teams to land production GPU workloads — CUDA kernels, NIM microservices, Triton serving, RAPIDS data pipelines, and DGX / DGX Cloud orchestration. I''ve shipped inference stacks in fintech, genomics, and autonomous-vehicle perception, and I translate hardware capability into client outcomes: lower latency, lower per-sample cost, and throughput that actually matches the marketing. AI-native tooling lets me deliver weeks of CUDA work in days.',
'["CUDA", "NVIDIA NIM", "Triton Inference Server", "TensorRT", "RAPIDS (cuDF / cuML)", "NCCL", "Parabricks", "DGX Cloud", "Kubernetes", "Python", "PyTorch", "Slurm"]'::jsonb,
2.9, 12, 29500,
'[{"title": "Genomics CUDA Pipeline — 48x Speedup", "description": "Rebuilt a biotech variant-calling pipeline on NVIDIA H100 with Parabricks + custom CUDA kernels. Whole-genome runtime dropped from 38 hours to 47 minutes at 30% lower per-sample cost. Embedded with client bioinformatics team through production handover.", "tech": ["CUDA", "Parabricks", "RAPIDS", "H100", "Slurm"]}, {"title": "NIM Microservices in Production for a Fortune 500 Retailer", "description": "Led the migration of a hosted-API LLM workload to self-hosted NVIDIA NIM on EKS with GPU autoscaling. Delivered 4x lower per-token cost at strict sub-300ms P95 latency across 7 regions, with full Triton tuning and DCGM observability.", "tech": ["NVIDIA NIM", "Triton", "EKS", "TensorRT", "DCGM"]}]'::jsonb),

('c2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7', 'Mira', 'Forward Deployed Engineer — Palantir Foundry & Ontology', 'principal',
'Forward-deployed engineer with deep Palantir experience across Foundry, Gotham, and Apollo. I embed with client teams — often at executive proximity — to turn messy enterprise data into a working ontology, Pipeline Builder transforms, and Workshop / operational-analytics apps that people actually use. I''ve shipped at financial services, public-sector, and industrial clients, with a focus on translating ambiguous business requirements into concrete data models and actions. AI-native workflows accelerate schema drafting, PySpark authoring, and ontology documentation.',
'["Palantir Foundry", "Pipeline Builder", "Ontology Manager", "Workshop", "Apollo", "PySpark", "Python", "TypeScript", "SQL", "Code Repositories", "AIP (AI Platform)"]'::jsonb,
2.8, 10, 27500,
'[{"title": "Foundry Ontology Migration for a Global Insurer", "description": "Led the Foundry ontology design for a Tier-1 insurer consolidating 14 legacy claims and policy systems. Delivered a unified object model, Pipeline Builder transforms across 80+ datasets, and Workshop apps for claims operations. Embedded on-site for 6 months through executive adoption.", "tech": ["Foundry", "Ontology Manager", "Pipeline Builder", "PySpark", "Workshop"]}, {"title": "Operational Analytics for a Defense Logistics Program", "description": "Forward-deployed on a defense logistics program, building real-time Foundry + Gotham operational dashboards fusing sensor, supply-chain, and personnel data. Cleared-environment delivery with Apollo-managed deployments across classified networks.", "tech": ["Foundry", "Gotham", "Apollo", "TypeScript", "PySpark"]}]'::jsonb),

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

-- Upsert: replaces rows that already exist under the same id (needed to swap
-- Marcus/Priya → FDE profiles on an already-seeded DB).
on conflict (id) do update set
  display_name = excluded.display_name,
  title = excluded.title,
  seniority = excluded.seniority,
  bio = excluded.bio,
  skills = excluded.skills,
  ai_velocity_score = excluded.ai_velocity_score,
  years_experience = excluded.years_experience,
  hourly_rate_cents = excluded.hourly_rate_cents,
  highlight_projects = excluded.highlight_projects;


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
