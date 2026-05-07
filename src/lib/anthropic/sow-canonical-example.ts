// Canonical SOW for the seeded "automated-testing-setup" template, used
// as the worked example in the SOW drafter's system prompt.
//
// Pricing follows the rules from the sprint spec:
//   - Single fixed price (not a range), at the midpoint of the template's
//     pricing range, rounded to the nearest $500.
//     Template pricing: $8,000 – $20,000 → midpoint $14,000 → $1,400,000 cents.
//   - Timeline defaults to template's timeline_range_high (10 business days).
//   - Milestone payment_pct sums to exactly 100, weighted toward the end
//     (final milestone gets at least 30%).
//   - Every deliverable has ≥2 verifiable acceptance_criteria.
//   - terms_md is a 4–8 line markdown snippet covering change requests,
//     IP ownership, warranty (30 days), confidentiality.
//
// Kept here as JSON (a literal string) rather than a typed object — the
// system prompt embeds this verbatim so Claude has a concrete shape to
// mirror.

export const CANONICAL_SOW_EXAMPLE_JSON = `{
  "scope_summary": "FullStack Labs will design and implement a comprehensive automated testing strategy for ACME's primary application codebase. The engagement covers a thorough audit of existing test coverage, the design of a layered testing strategy (unit, integration, end-to-end), and the implementation of test suites integrated into ACME's continuous-integration pipeline.\\n\\nWork begins with a discovery and scoping phase to align on coverage targets, critical user paths, and tooling. Build proceeds in iterative sprints with daily progress updates posted to a shared Slack channel. The engagement concludes with a coverage dashboard, written testing-best-practices documentation, and a hand-off session with ACME's engineering team so the suite remains maintainable beyond the engagement.\\n\\nThe deliverables and milestones below describe the work in detail and define the acceptance criteria each milestone must meet before payment is invoiced.",
  "deliverables": [
    {
      "name": "Codebase audit and test strategy document",
      "description": "Written audit of existing test coverage across the target repositories, identification of high-value test gaps, and a written strategy document covering tooling choices, coverage targets, and prioritization.",
      "acceptance_criteria": [
        "Audit document delivered as a markdown file in the engagement repo",
        "Strategy document approved in writing by ACME's engineering lead before build phase begins"
      ]
    },
    {
      "name": "Unit test suite",
      "description": "Unit tests for new and modified code, organized by module and runnable locally and in CI.",
      "acceptance_criteria": [
        "Coverage of new code ≥ 80% as reported by the CI coverage tool",
        "All unit tests pass in CI on the engagement branch and on the protected main branch"
      ]
    },
    {
      "name": "Integration tests for critical paths",
      "description": "Integration tests covering all P0 user-facing paths identified during the audit phase.",
      "acceptance_criteria": [
        "Every P0 path identified in the audit has at least one passing integration test",
        "Test results published to the coverage dashboard on each main-branch merge"
      ]
    },
    {
      "name": "End-to-end test suite (Playwright)",
      "description": "Playwright-based E2E suite covering the top five user-flows agreed during scoping, runnable locally and in CI.",
      "acceptance_criteria": [
        "Top five user-flows automated and passing on the staging environment",
        "Suite runs in CI on every pull request with a runtime under 10 minutes"
      ]
    },
    {
      "name": "CI pipeline integration",
      "description": "GitHub Actions workflows that run the test suites on every pull request, gate merges on test pass, and publish coverage reports.",
      "acceptance_criteria": [
        "All test suites run automatically on every PR via GitHub Actions",
        "Failing tests block merge to the main branch via branch protection rules"
      ]
    },
    {
      "name": "Coverage reporting dashboard",
      "description": "A dashboard accessible to ACME engineering surfacing per-module coverage, trend over time, and per-PR delta.",
      "acceptance_criteria": [
        "Dashboard URL accessible to all named ACME engineering team members",
        "Per-module coverage and per-PR delta refresh within 5 minutes of a main-branch merge"
      ]
    },
    {
      "name": "Testing best-practices documentation and team training",
      "description": "Written documentation covering the testing strategy, conventions, and how to add new tests, plus one live training session for ACME's engineering team.",
      "acceptance_criteria": [
        "Documentation delivered as a markdown file in the engagement repo and reviewed by ACME's engineering lead",
        "One 60-minute training session held with at least three ACME engineers in attendance"
      ]
    }
  ],
  "milestones": [
    {
      "name": "Discovery and scoping",
      "description": "Audit existing tests, agree coverage targets, finalize tooling, and produce the strategy document.",
      "payment_pct": 15,
      "expected_business_days": 2
    },
    {
      "name": "Build phase — unit and integration",
      "description": "Implement the unit and integration test suites, hook them into CI, and verify coverage targets on the engagement branch.",
      "payment_pct": 25,
      "expected_business_days": 4
    },
    {
      "name": "Build phase — end-to-end and CI hardening",
      "description": "Implement the Playwright E2E suite, finalize GitHub Actions workflows and branch protection, and stand up the coverage dashboard.",
      "payment_pct": 25,
      "expected_business_days": 3
    },
    {
      "name": "Hand-off and acceptance",
      "description": "Final acceptance review against all acceptance criteria, written documentation, and live training session with ACME's engineering team.",
      "payment_pct": 35,
      "expected_business_days": 1
    }
  ],
  "pricing": {
    "total_cents": 1400000,
    "currency": "USD",
    "payment_terms_md": "**Payment schedule.** Invoices are issued at the close of each milestone against the milestone's \`payment_pct\`. **Net terms.** Net 15 from invoice date. **Late fees.** A 1.5% monthly interest charge applies to balances unpaid after 30 days. **Method.** ACH or wire transfer; bank details supplied on the first invoice."
  },
  "timeline_business_days": 10,
  "terms_md": "**Change requests.** Material scope changes require a written change order signed by both parties before work begins; the engagement total and timeline are revised accordingly. **Intellectual property.** All work product authored under this SOW is assigned to ACME on full payment of the final invoice; FullStack retains rights to general-purpose tooling, libraries, and methodologies developed independently of ACME's confidential information. **Warranty.** FullStack warrants the deliverables for 30 days following hand-off; defects reported in writing during the warranty period will be remediated at no additional cost. **Confidentiality.** Each party will hold the other's confidential information in strict confidence and use it solely to perform the obligations of this SOW. **Governing law.** This SOW is governed by the laws of the State of Delaware without regard to its conflict-of-laws principles."
}`
