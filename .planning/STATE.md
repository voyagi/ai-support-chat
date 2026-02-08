# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-08)

**Core value:** A prospect interacts with the demo and thinks "I want this, but for my business"
**Current focus:** Phase 1 - Database & RAG Foundation

## Current Position

Phase: 1 of 10 (Database & RAG Foundation)
Plan: 3 of 3 in phase
Status: In progress
Last activity: 2026-02-08 - Completed 01-03-PLAN.md

Progress: [███░░░░░░░] 30%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 9.7 min
- Total execution time: 0.48 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-database-rag-foundation | 3/3 | 29min | 9.7min |

**Recent Trend:**

- Last 5 plans: 01-01 (8min), 01-02 (15min), 01-03 (6min)
- Trend: Accelerating (technical implementation faster than content creation)

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
- Lazy-loaded OpenAI client via Proxy pattern - Enables dry-run without credentials (01-03)
- Batch embedding with auto-split at 2048 items - Single API call efficiency (01-03)
- Relative imports in scripts/ (not @/ aliases) - tsx doesn't reliably resolve tsconfig paths (01-03)
- Idempotent seeding deletes existing docs - Safe re-runs during development (01-03)

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-08 - Plan 01-03 execution
Stopped at: Completed 01-03-PLAN.md - RAG pipeline complete (embeddings + search + seeding)
Resume file: None
