# Phase 1: Database & RAG Foundation - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>

## Phase Boundary

RAG pipeline infrastructure that can embed, store, and retrieve document chunks with measurable accuracy. Includes database schema (Supabase pgvector), document chunking, embedding generation (OpenAI text-embedding-3-small), similarity search, and an evaluation framework with pass/fail scoring. Admin UI and chat API are separate phases.

</domain>

<decisions>

## Implementation Decisions

### Document format support

- Support plain text and markdown from day one; PDF deferred to Phase 2
- Heading-aware chunking for markdown — split at `##` boundaries, subdivide large sections to stay within ~500 token target
- Detect and preserve FAQ-style Q&A pairs as single chunks, even if shorter than the target chunk size
- On re-upload (same document title): delete old chunks and embeddings, then create new ones — no duplicates

### Chunk enrichment

- Store parent document title on each chunk (enables citation: "From: Getting Started Guide")
- Prepend section heading to chunk content before embedding (e.g., "Pricing: Our plans start at...") — improves topic-specific retrieval
- Track chunk position within document (chunk N of M) — enables surrounding-context retrieval and ordered display
- Similarity search function returns full context: document title + section heading + chunk content + similarity score

### Evaluation framework

- Runnable test script (not a test suite) with predefined query-answer fixtures
- 15-20 test query-answer pairs covering diverse scenarios
- Outputs precision@k and recall@k scores with a pass/fail threshold gate
- Include edge case queries: typos, conversational phrasing ("how much does it cost"), multi-topic compound questions

### Test data approach

- Use FlowBoard (PM SaaS) domain for test content — aligns with demo business decision, reusable in Phase 2
- Create 8-10 FlowBoard documents: FAQ, features, pricing, getting started, integrations, etc.
- Test documents checked into repo as markdown fixtures (e.g., `test/fixtures/`) for reproducibility
- Automated seed script (`npm run seed`) that chunks, embeds, and loads all fixtures into Supabase

### Claude's Discretion

- Exact chunking algorithm implementation details
- Overlap percentage within the 10-20% range
- Pass/fail threshold values for precision@k and recall@k
- Specific FlowBoard document topics beyond the ones listed
- Seed script error handling and idempotency approach

</decisions>

<specifics>

## Specific Ideas

- FlowBoard is a Project Management SaaS (not "TechStart Solutions" from earlier docs — this was updated during project research)
- Test fixtures should double as Phase 2 seed content where possible, reducing duplicate work
- Evaluation script should be runnable without any UI — pure CLI validation of the pipeline

</specifics>

<deferred>

## Deferred Ideas

- PDF document support — Phase 2 (Admin Panel & Content Upload)
- Out-of-knowledge-base handling — Phase 9
- Multiple knowledge base support — noted in CLAUDE.md as nice-to-have, not currently phased

</deferred>

---

*Phase: 01-database-rag-foundation*
*Context gathered: 2026-02-08*
