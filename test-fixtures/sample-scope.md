# Code Review Service

A structured codebase audit and review pass for engineering teams who suspect their code quality is slipping but can't articulate where. One week, ends with an actionable report.

## Deliverables

1. **Coverage and complexity audit** — inventory of test coverage by directory, cyclomatic complexity hotspots, top 10 highest-risk files.
2. **Dependency health report** — outdated packages, security advisories, recommended upgrade path with effort estimates.
3. **Architecture findings** — where the codebase has accumulated patterns likely to cause issues in 6 months.
4. **90-day improvement plan** — prioritized list of fixes with effort + impact estimates.
5. **Walkthrough** — 60-minute live session with the engineering team.

## Timeline

5 business days from kickoff:

| Day | Phase |
|-----|-------|
| 1 | Tools setup and initial scan |
| 2–3 | Manual review of high-risk areas |
| 4 | Synthesize findings and draft report |
| 5 | Client review session and final delivery |

## Pricing

Fixed price: **$4,500**. No hourly billing, no scope creep surprises.

## Team

- One senior reviewer (full-time)
- PM for client communication (20%)

## Audit signals

The Glassbox Agent watches GitHub PR activity, CI test runs, Slack standup posts, and the daily report from the reviewer. Every milestone has explicit signals — the audit phase, for example, requires a `scan_complete` signal from the reviewer's tooling pipeline.

## Guarantees

- 30-day post-delivery follow-up
- Fixed price
- Confidentiality (NDA signed before kickoff; no client code retained)
