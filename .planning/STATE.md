# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-08)

**Core value:** A prospect interacts with the demo and thinks "I want this, but for my business"
**Current focus:** Phase 3 in progress (Chat API & Streaming)

## Current Position

Phase: 3 of 10 (Chat API & Streaming)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-09 - Completed 03-01-PLAN.md (Chat infrastructure modules)

Progress: [█████████░░░░░░░░░░░] 41% (9 of ~22 plans)

## Performance Metrics

**Velocity:**

- Total plans completed: 9
- Average duration: 8.4 min
- Total execution time: 1.28 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-database-rag-foundation | 4/4 | 37min | 9.3min |
| 02-admin-panel-content-upload | 4/4 | 57min | 14.3min |
| 03-chat-api-streaming | 1/2 | 4min | 4.0min |

**Recent Trend:**

- Last 5 plans: 02-02 (7min), 02-03 (8min), 02-04 (~35min incl. human verification), 03-01 (4min)
- Trend: Auto plans ~7.5min, Phase 3 infrastructure setup faster

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
- FlowBoard context: Founded 2021, Free/Pro/Enterprise tiers - Internally consistent across all docs (01-02)
- Lazy-loaded OpenAI client via Proxy pattern - Enables dry-run without credentials (01-03)
- Relative imports in scripts/ (not @/ aliases) - tsx doesn't reliably resolve tsconfig paths (01-03)
- Supabase env vars renamed to PUBLISHABLE_KEY/SECRET_KEY - New Supabase convention (01-04)
- Quality gate thresholds: precision@5 >= 0.7, recall@20 >= 0.8 (01-04)
- Data Access Layer auth pattern: session verified in Server Components + Server Actions, not just middleware (02-01)
- Lazy getSessionOptions() instead of module-level constant for iron-session config (02-01)
- serverActions config under experimental key for Next.js 15.5.x (02-01)
- FAQ-style docs use ### sub-headings for chunker FAQ detection (02-02)
- 18 total FlowBoard docs covering all knowledge base categories (02-02)
- Sequential file upload to avoid overwhelming OpenAI embedding API (02-03)
- Orphan cleanup: delete document if embedding fails after insert (02-03)
- Server Component + Client wrapper pattern for pages needing SSR data + interactivity (02-03)
- 223 chunks from 18 documents confirms appropriate chunking granularity (02-04)
- Flo personality with strict KB grounding in system prompt - Friendly but won't hallucinate (03-01)
- 120K token input budget (8K reserve from 128K context) - Ensures room for output + safety (03-01)
- Last 10 messages for conversation history - 5 user + 5 assistant pairs max (03-01)
- Atomic message persistence (user + assistant in single insert) - Cleaner transactions (03-01)

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-09T06:35:34Z
Stopped at: Completed 03-01-PLAN.md (Chat infrastructure modules)
Resume file: None
