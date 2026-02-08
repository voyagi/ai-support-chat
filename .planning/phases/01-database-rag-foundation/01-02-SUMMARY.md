---
phase: 01-database-rag-foundation
plan: 02
subsystem: testing
tags: [fixtures, RAG, evaluation, markdown, test-data, ground-truth]

# Dependency graph
requires:
  - phase: 01-01
    provides: Document chunker and embedding utilities
provides:
  - 10 realistic FlowBoard knowledge base documents (1878 lines total)
  - 18 RAG evaluation test cases with ground truth
  - Reusable demo content for Phase 2 UI
affects: [01-03-seeding, 01-04-evaluation, 02-chat-api, widget-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Markdown documentation structure with H2 sections for chunking
    - FAQ documents with H3 sub-headings for Q&A pairs
    - JSON test case format with expectedDocuments and expectedTopics

key-files:
  created:
    - test/fixtures/flowboard-faq.md
    - test/fixtures/flowboard-pricing.md
    - test/fixtures/flowboard-getting-started.md
    - test/fixtures/flowboard-features.md
    - test/fixtures/flowboard-integrations.md
    - test/fixtures/flowboard-api-reference.md
    - test/fixtures/flowboard-billing-faq.md
    - test/fixtures/flowboard-team-management.md
    - test/fixtures/flowboard-security-compliance.md
    - test/fixtures/flowboard-mobile-app.md
    - test/fixtures/evaluation-queries.json
  modified: []

key-decisions:
  - "FlowBoard context: PM SaaS founded 2021, Free (5 users, 3 projects), Pro ($12/user/month), Enterprise ($29/user/month)"
  - "Document structure: H1 for title, H2 for major sections (chunker split points), H3 for FAQ Q&A pairs"
  - "18 evaluation test cases: 6 easy (direct), 6 medium (inference), 6 hard (typos, compound, cross-doc)"

patterns-established:
  - "Internally consistent documentation: prices, feature names, tier details match across all documents"
  - "Test fixtures span diverse topics to exercise similarity search (FAQ, pricing, security, API, integrations)"
  - "Evaluation queries include typos and conversational phrasing to test real-world robustness"

# Metrics
duration: 15min
completed: 2026-02-08
---

# Phase 01 Plan 02: Test Fixtures & Evaluation Summary

**10 realistic FlowBoard PM SaaS documents (1878 lines) with 18 RAG evaluation test cases spanning easy/medium/hard queries**

## Performance

- **Duration:** 15 minutes
- **Started:** 2026-02-08T13:09:12Z
- **Completed:** 2026-02-08T13:24:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Created 10 internally consistent FlowBoard knowledge base documents covering FAQ, pricing, features, integrations, API, billing, team management, security, and mobile app
- Established FlowBoard fictional company context used across all documents (founded 2021, pricing tiers, API endpoints, integrations)
- Created 18 evaluation test cases with ground truth: 6 easy (direct single-doc), 6 medium (inference), 6 hard (typos, compound, cross-doc queries)
- All content reads as realistic SaaS documentation with specific numbers, feature names, and cross-references

## Task Commits

Each task was committed atomically:

1. **Task 1: Create FlowBoard knowledge base documents** - `7c11982` (feat)
   - 10 markdown files totaling 1878 lines
   - Topics: FAQ (12 Q&A pairs), pricing (3 tiers), getting started (onboarding), features (Kanban, Timeline, Sprint Planning, Automations, Reporting, Templates), integrations (Slack, GitHub, GitLab, Google Drive, Figma, Jira, Zapier), API reference (auth, endpoints, webhooks, errors), billing FAQ (13 Q&A pairs), team management (roles, permissions, guest access), security & compliance (encryption, SOC 2, GDPR, SSO, 2FA), mobile app (iOS/Android with offline mode)

2. **Task 2: Create evaluation ground truth test cases** - `8d74404` (feat)
   - 18 test query-answer pairs in JSON format
   - Difficulty distribution: 6 easy, 6 medium, 6 hard
   - Categories: pricing, features, security, mobile, API, integrations, billing, team management
   - Each case maps queries to expectedDocuments, expectedTopics, and expectedAnswer

**Note:** No planning metadata commit (fixtures only, no plan execution overhead).

## Files Created/Modified

**Created:**
- `test/fixtures/flowboard-faq.md` (51 lines) - General FAQ with 12 Q&A pairs
- `test/fixtures/flowboard-pricing.md` (112 lines) - Pricing page with Free/Pro/Enterprise tiers
- `test/fixtures/flowboard-getting-started.md` (89 lines) - Onboarding guide
- `test/fixtures/flowboard-features.md` (122 lines) - Feature overview (Kanban, Timeline, Sprint Planning, Automations)
- `test/fixtures/flowboard-integrations.md` (152 lines) - Integration guides (Slack, GitHub, GitLab, Google Drive, Figma, Jira, Zapier)
- `test/fixtures/flowboard-api-reference.md` (376 lines) - API documentation with endpoints and examples
- `test/fixtures/flowboard-billing-faq.md` (100 lines) - Billing FAQ with 13 Q&A pairs
- `test/fixtures/flowboard-team-management.md` (265 lines) - Team roles, permissions, guest access
- `test/fixtures/flowboard-security-compliance.md` (289 lines) - Security, SOC 2, GDPR, SSO, 2FA
- `test/fixtures/flowboard-mobile-app.md` (322 lines) - iOS/Android app guide with offline mode
- `test/fixtures/evaluation-queries.json` (167 lines) - 18 test cases with ground truth

## Decisions Made

1. **FlowBoard company context:** Established consistent details across all documents
   - Founded 2021, PM SaaS for project management
   - Pricing: Free (5 users, 3 projects), Pro ($12/user/month), Enterprise ($29/user/month)
   - Integrations: Slack, GitHub, GitLab, Google Drive, Figma, Jira, Zapier
   - API: REST at api.flowboard.io/v1
   - Support: Email (all), live chat (Pro+), dedicated CSM (Enterprise)

2. **Document structure for chunking compatibility:**
   - H1 for document title
   - H2 for major sections (chunker split points)
   - H3 for FAQ Q&A pairs (enables FAQ-specific handling)
   - 400-1500 words per document (yields 3-15 chunks each)

3. **Evaluation test case design:**
   - 18 cases: 6 easy (direct), 6 medium (inference), 6 hard (edge cases)
   - Hard cases include typos ("whats the cheepest plan"), compound questions ("storage + github"), cross-document queries ("everything about enterprise")
   - All expectedDocuments reference actual fixture files for validation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward content creation with consistent cross-referencing.

## User Setup Required

None - no external service configuration required. These are static test fixtures.

## Next Phase Readiness

**Ready for Plan 01-03 (Seeding Script):**
- 10 markdown documents ready for chunking and embedding
- Content is diverse enough to test similarity search (unique terminology per topic)
- Document structure compatible with heading-aware chunker from Plan 01-01

**Ready for Plan 01-04 (Evaluation Framework):**
- 18 ground truth test cases ready to measure precision@k and recall@k
- expectedDocuments field provides answer key for retrieval evaluation
- expectedTopics enable semantic similarity verification

**Blockers/concerns:**
- None. Fixtures are complete and internally consistent.

**Notes:**
- The `relevantChunkIds` field in evaluation-queries.json will be populated by the evaluation script after seeding (when chunk IDs are known)
- FlowBoard demo content is realistic enough to reuse for Phase 2 UI demonstrations

---
*Phase: 01-database-rag-foundation*
*Completed: 2026-02-08*
