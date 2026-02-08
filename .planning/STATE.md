# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-08)

**Core value:** A prospect interacts with the demo and thinks "I want this, but for my business"
**Current focus:** Phase 1 - Database & RAG Foundation

## Current Position

Phase: 1 of 10 (Database & RAG Foundation)
Plan: 2 of 3 in phase
Status: In progress
Last activity: 2026-02-08 - Completed 01-02-PLAN.md

Progress: [██░░░░░░░░] 20%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 11.5 min
- Total execution time: 0.38 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-database-rag-foundation | 2/3 | 23min | 11.5min |

**Recent Trend:**

- Last 5 plans: 01-01 (8min), 01-02 (15min)
- Trend: Accelerating (15min vs 8min for content creation vs technical implementation)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- FlowBoard (PM SaaS) as demo business - Broad appeal, rich FAQ content, relatable to most Upwork clients
- Script tag + iframe for widget - Matches Intercom UX, works on any site, simpler than npm package
- Inline contact form for out-of-KB - Shows lead capture value, builds trust by not hallucinating
- Dark mode as must-have - "Feels premium" polish bar, signals attention to detail
- HNSW index with vector_ip_ops for normalized embeddings - Faster than IVFFlat for read-heavy RAG (01-01)
- Enriched chunks with metadata (title, heading, position) - Better citation and context (01-01)
- FAQ sections preserved as individual Q&A chunks - Maintains semantic coherence (01-01)
- Section headings prepended to chunk content - Improves embedding context and retrieval (01-01)
- FlowBoard context: Founded 2021, Free (5 users, 3 projects), Pro ($12/user/month), Enterprise ($29/user/month) - Internally consistent across all docs (01-02)
- Document structure: H1 title, H2 sections (chunker splits), H3 for FAQ Q&A pairs - Compatible with Plan 01-01 chunker (01-02)
- 18 evaluation test cases: 6 easy, 6 medium, 6 hard - Tests direct queries, inference, and edge cases (01-02)

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-08 - Plan 01-02 execution
Stopped at: Completed 01-02-PLAN.md - test fixtures and evaluation ground truth ready
Resume file: None
