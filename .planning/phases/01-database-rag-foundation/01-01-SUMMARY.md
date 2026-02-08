---
phase: 01-database-rag-foundation
plan: 01
subsystem: database
tags: [supabase, pgvector, openai, embeddings, rag, markdown, chunking, gpt-tokenizer]

# Dependency graph
requires:
  - phase: none
    provides: greenfield project
provides:
  - Complete Supabase database schema with pgvector extension
  - HNSW index on embeddings for fast similarity search
  - match_document_chunks RPC function with enriched metadata
  - Heading-aware markdown chunker with FAQ detection
  - Token counter using gpt-tokenizer (o200k_base encoding)
affects: [01-02, 01-03, embeddings, rag-search, admin-panel]

# Tech tracking
tech-stack:
  added: [gpt-tokenizer]
  patterns:
    - "Markdown chunking at ## heading boundaries"
    - "FAQ detection via multiple ### sub-headings"
    - "15% overlap when subdividing large sections"
    - "Section headings prepended to chunk content for embedding context"
    - "HNSW index with inner product operator for normalized embeddings"

key-files:
  created:
    - supabase/schema.sql
    - src/lib/embeddings/types.ts
    - src/lib/embeddings/token-counter.ts
    - src/lib/embeddings/chunker.ts

key-decisions:
  - "HNSW index with vector_ip_ops (inner product) for normalized OpenAI embeddings - faster than IVFFlat for read-heavy RAG workloads"
  - "Enriched document_chunks table with document_title, section_heading, chunk_position, total_chunks for better citation and context"
  - "FAQ sections preserved as individual Q&A chunks to maintain semantic coherence"
  - "gpt-tokenizer with o200k_base encoding (GPT-4o compatible) for accurate token counting"

patterns-established:
  - "Chunking pattern: heading-aware splits preserve semantic boundaries"
  - "Metadata enrichment: chunks carry citation context (title, heading, position)"
  - "RPC pattern: negative inner product (<#>) for similarity search on normalized vectors"

# Metrics
duration: 8min
completed: 2026-02-08
---

# Phase 1 Plan 1: Database Schema & Chunking Engine Summary

**Complete pgvector schema with HNSW indexing and heading-aware markdown chunker using gpt-tokenizer**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-08T13:07:53Z
- **Completed:** 2026-02-08T13:15:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Supabase database schema ready to deploy with 4 tables, HNSW index, and RPC function
- Markdown chunker splits at heading boundaries, detects FAQ pairs, and subdivides large sections with overlap
- Token counter provides accurate counts using OpenAI's tokenizer
- All enriched metadata fields (document_title, section_heading, chunk_position, total_chunks) support better retrieval and citation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create database schema and install gpt-tokenizer** - `6fd5897` (feat)
2. **Task 2: Build heading-aware markdown chunker with token counting** - `2036d33` (feat)

## Files Created/Modified
- `package.json` - Added gpt-tokenizer dependency
- `package-lock.json` - Updated lockfile with gpt-tokenizer
- `supabase/schema.sql` - Complete database schema for Supabase SQL Editor (4 tables, HNSW index, RPC function)
- `src/lib/embeddings/types.ts` - Chunk and ChunkOptions interfaces with DEFAULT_CHUNK_OPTIONS
- `src/lib/embeddings/token-counter.ts` - Token counting using gpt-tokenizer's encode function
- `src/lib/embeddings/chunker.ts` - Heading-aware markdown chunking with FAQ detection, overlap, and metadata enrichment

## Decisions Made
- **HNSW index with vector_ip_ops:** Uses inner product operator for normalized OpenAI embeddings. HNSW is faster than IVFFlat for read-heavy RAG workloads (similarity search queries).
- **Enriched metadata columns:** Added document_title, section_heading, chunk_position, total_chunks to document_chunks table for better citation and user context in responses.
- **FAQ preservation:** Sections with multiple ### sub-headings are treated as FAQ sections - each Q&A pair becomes its own chunk to maintain semantic coherence.
- **gpt-tokenizer:** Uses o200k_base encoding (GPT-4o compatible) for accurate token counting, not regex approximation.
- **Section heading prepending:** Each chunk content starts with "{sectionHeading}: {content}" to provide context for embedding, improving retrieval relevance.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Node.js PATH issue in MSYS bash:**
- **Issue:** npm/npx commands failed because Node.js wasn't in the MSYS bash PATH
- **Resolution:** Called Node.js executables with full Windows paths (e.g., `'C:\Program Files\nodejs\npm.cmd'`)
- **Verification approach change:** Ran Biome check directly using the platform-specific executable (`node_modules/@biomejs/cli-win32-x64/biome.exe`) instead of npx
- **Result:** All files passed Biome check with formatting auto-fixed

## User Setup Required

None - no external service configuration required yet.

The database schema is in `supabase/schema.sql` ready to paste into Supabase SQL Editor. This will be covered in a future plan when setting up the Supabase project.

## Next Phase Readiness

**Ready for next plan (01-02):**
- Database schema complete and documented
- Chunking library ready to process documents
- Token counter accurate and tested

**What's next:**
- Supabase project setup (if not already done)
- Schema deployment to Supabase
- Embedding generation using OpenAI API
- Upload pipeline to process documents into chunks and embeddings

**No blockers or concerns.**

---
*Phase: 01-database-rag-foundation*
*Completed: 2026-02-08*
