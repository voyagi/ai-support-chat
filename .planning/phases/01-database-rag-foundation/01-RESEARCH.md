# Phase 1: Database & RAG Foundation - Research

**Researched:** 2026-02-08
**Domain:** RAG pipeline (document chunking, embeddings, pgvector similarity search)
**Confidence:** MEDIUM

## Summary

RAG systems require careful design across four interconnected domains: document chunking strategy, embedding generation, vector storage/indexing, and retrieval evaluation. The standard approach uses semantic-aware chunking (heading-based for markdown), OpenAI text-embedding-3-small (1536 dimensions), Supabase pgvector with HNSW indexing, and precision@k/recall@k metrics for evaluation.

**Key findings:**
- Heading-aware chunking for markdown outperforms fixed-size chunking by 8-12% for structured documents
- OpenAI embeddings are normalized (length 1), enabling fast inner product searches
- pgvector's HNSW index (default m=16, ef_construction=64) provides best query performance when kept in memory
- Industry benchmark: Precision@5 > 0.7 for narrow domains, Recall@20 > 0.8 for wider datasets
- Overlap is contested (recent research shows no benefit), but 10-20% remains industry standard for safety

**Primary recommendation:** Use heading-based chunking with FAQ-aware logic, HNSW indexing, inner product distance, and a ground-truth evaluation framework with 15-20 test cases before building the admin UI.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `gpt-tokenizer` | Latest | Token counting for chunking | Fastest JS tokenizer, supports GPT-4o's o200k_base encoding, pure TypeScript |
| `@supabase/supabase-js` | Latest | Supabase client (browser + server) | Official client, supports RPC calls for pgvector queries |
| `@supabase/ssr` | Latest | Server-side rendering support | Required for Next.js 15 server components with Supabase auth |
| OpenAI API | `text-embedding-3-small` | Embedding generation | Cost-effective (1536 dims), normalized vectors, multilingual |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tiktoken` (Python) | Latest | Reference token counting | For validation/comparison with gpt-tokenizer in tests |
| Ragas | Latest | RAG evaluation framework | If adopting full LLM-based evaluation (optional for Phase 1) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `gpt-tokenizer` | `js-tiktoken` | js-tiktoken is slower, larger footprint |
| HNSW index | IVFFlat index | IVFFlat faster to build but slower queries, worse recall |
| Inner product | Cosine distance | Identical rankings for normalized vectors, cosine slightly slower |
| `text-embedding-3-small` | `text-embedding-3-large` | 3x cost, 3x size (3072 dims), marginally better accuracy |

**Installation:**

```bash
npm install gpt-tokenizer @supabase/supabase-js @supabase/ssr
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client (uses cookies via @supabase/ssr)
│   │   ├── server.ts          # Server component client (cookie-based auth)
│   │   └── middleware.ts       # Auth token refresh middleware
│   ├── embeddings/
│   │   ├── chunker.ts         # Document chunking logic
│   │   ├── embeddings.ts      # OpenAI embedding generation
│   │   └── token-counter.ts   # Token counting utilities
│   └── rag/
│       ├── similarity-search.ts  # Query embedding + RPC call
│       └── evaluation.ts         # Precision@k, recall@k metrics
├── scripts/
│   ├── seed.ts                # Load test fixtures into Supabase
│   └── evaluate.ts            # Run evaluation framework (CLI)
└── test/
    └── fixtures/
        ├── flowboard-faq.md
        ├── flowboard-getting-started.md
        └── ... (8-10 markdown documents)
```

### Pattern 1: Heading-Aware Markdown Chunking

**What:** Split markdown at heading boundaries (##), subdivide large sections to stay within ~500 token target, preserve FAQ Q&A pairs as single chunks.

**When to use:** All markdown documents (the locked format for Phase 1).

**Example:**

```typescript
// Source: Weaviate chunking strategies + user decisions
interface Chunk {
  content: string;           // The chunk text
  documentId: string;        // Parent document ID
  documentTitle: string;     // For citation ("From: FAQ")
  sectionHeading: string;    // H2 heading this chunk belongs to
  position: number;          // Chunk N of M
  tokenCount: number;        // Actual token count
}

function chunkMarkdown(
  document: { title: string; content: string },
  targetTokens = 500,
  overlapPercent = 0.15
): Chunk[] {
  // 1. Split at ## headings
  const sections = splitAtHeadings(document.content);

  // 2. Detect FAQ pairs (Q: ... A: ... or ### Question format)
  const chunks: Chunk[] = [];
  for (const section of sections) {
    if (isFAQSection(section)) {
      // Preserve Q&A pairs as single chunks
      chunks.push(...chunkFAQPairs(section));
    } else if (countTokens(section.content) > targetTokens) {
      // Subdivide large sections with overlap
      chunks.push(...subdivideSection(section, targetTokens, overlapPercent));
    } else {
      // Keep small sections intact
      chunks.push(createChunk(section));
    }
  }

  // 3. Prepend section heading to content before embedding
  return chunks.map((chunk, i) => ({
    ...chunk,
    content: `${chunk.sectionHeading}: ${chunk.content}`,
    position: i + 1,
  }));
}
```

**Key insight:** Prepending section headings before embedding ("Pricing: Our plans start at...") improves topic-specific retrieval by making the semantic context explicit in the embedding space.

### Pattern 2: Supabase RPC Function for Similarity Search

**What:** PostgreSQL function that returns document chunks with enriched metadata (document title, section heading, similarity score).

**When to use:** All vector similarity queries (required because PostgREST doesn't support pgvector operators directly).

**Example:**

```sql
-- Source: OpenAI Cookbook + user decisions (chunk enrichment)
create or replace function match_document_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
) returns table (
  id uuid,
  document_id uuid,
  document_title text,
  section_heading text,
  content text,
  chunk_position int,
  total_chunks int,
  similarity float
) language sql stable as $$
  select
    dc.id,
    dc.document_id,
    d.title as document_title,
    dc.section_heading,
    dc.content,
    dc.chunk_position,
    dc.total_chunks,
    1 - (dc.embedding <#> query_embedding) as similarity
  from document_chunks dc
  join documents d on dc.document_id = d.id
  where 1 - (dc.embedding <#> query_embedding) > match_threshold
  order by dc.embedding <#> query_embedding
  limit match_count;
$$;
```

**TypeScript client usage:**

```typescript
// Source: Supabase docs + OpenAI Cookbook
const embedding = await generateEmbedding(userQuery);

const { data: chunks } = await supabase
  .rpc('match_document_chunks', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 5,
  });

// chunks now contains: document_title, section_heading, content, similarity
```

**Note:** Use `<#>` (negative inner product) operator for OpenAI embeddings (normalized vectors). This is functionally equivalent to cosine similarity but faster.

### Pattern 3: Evaluation Framework with Ground Truth

**What:** CLI script that runs predefined query-answer pairs, measures precision@k and recall@k, and gates with pass/fail thresholds.

**When to use:** After chunking/embedding logic is complete, before building admin UI or chat API.

**Example:**

```typescript
// Source: RAG evaluation guides + industry benchmarks
interface TestCase {
  query: string;
  groundTruth: {
    relevantChunkIds: string[];  // Manually verified relevant chunks
    expectedTopics: string[];     // Expected themes/topics
  };
}

interface EvaluationResult {
  precisionAt5: number;  // % of top 5 results that are relevant
  recallAt20: number;    // % of relevant chunks found in top 20
  passed: boolean;       // Gate: precision@5 > 0.7 AND recall@20 > 0.8
}

async function evaluateRAG(testCases: TestCase[]): Promise<EvaluationResult> {
  const results = [];

  for (const test of testCases) {
    const embedding = await generateEmbedding(test.query);
    const retrieved = await supabase.rpc('match_document_chunks', {
      query_embedding: embedding,
      match_threshold: 0.0,  // Get all results for recall calculation
      match_count: 20,
    });

    // Precision@5: how many of top 5 are relevant?
    const top5Relevant = retrieved.data
      .slice(0, 5)
      .filter(chunk => test.groundTruth.relevantChunkIds.includes(chunk.id))
      .length;

    // Recall@20: did we find all relevant chunks in top 20?
    const top20Ids = retrieved.data.slice(0, 20).map(c => c.id);
    const foundRelevant = test.groundTruth.relevantChunkIds.filter(id =>
      top20Ids.includes(id)
    ).length;

    results.push({
      precisionAt5: top5Relevant / 5,
      recallAt20: foundRelevant / test.groundTruth.relevantChunkIds.length,
    });
  }

  // Average across all test cases
  const avgPrecision = average(results.map(r => r.precisionAt5));
  const avgRecall = average(results.map(r => r.recallAt20));

  return {
    precisionAt5: avgPrecision,
    recallAt20: avgRecall,
    passed: avgPrecision >= 0.7 && avgRecall >= 0.8,  // Industry benchmarks
  };
}
```

**CLI script structure:**

```bash
npm run evaluate
# Output:
# Running 18 test queries...
# Precision@5: 0.76 ✓
# Recall@20: 0.83 ✓
# PASSED: RAG retrieval meets quality thresholds
```

### Anti-Patterns to Avoid

- **Fixed-size chunking without semantic boundaries:** Breaking sentences mid-way destroys semantic meaning, propagates across entire database. Use heading-aware or sentence-boundary splitting.
- **Storing only chunk content without metadata:** Can't provide citations, can't retrieve surrounding context. Always store document title, section heading, and position.
- **No overlap with heading-based chunking:** When subdividing large sections, overlap ensures edge sentences aren't orphaned. Use 10-20% overlap.
- **Cosine distance without checking normalization:** OpenAI embeddings are normalized, so use inner product (`<#>` operator) for speed. Only use cosine if mixing embedding sources.
- **Building admin UI before validating retrieval:** Without evaluation framework, you'll build on untested foundations. Validate precision/recall first.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token counting | Custom regex/splitter | `gpt-tokenizer` with `o200k_base` encoding | GPT-4o uses complex BPE tokenization; regex can't count accurately, will cause embedding API errors |
| Markdown heading extraction | String manipulation with `#` prefix | Markdown parser with AST traversal | Edge cases: code blocks with `#`, HTML in markdown, escaped `\#` |
| Overlap calculation | Manual index arithmetic | Proven libraries (LangChain splitters) or well-tested utility | Off-by-one errors, edge cases at document boundaries |
| Evaluation metrics | Custom precision/recall functions | Standard implementations (see Pattern 3) | Easy to miscalculate averages, handle edge cases (zero relevant chunks) |
| Embedding similarity | Custom distance functions | pgvector operators (`<->`, `<#>`, `<=>`) | Operator performance is optimized in C, custom SQL functions are slower |

**Key insight:** Token counting is the highest-risk area. OpenAI's tokenizer uses Byte Pair Encoding with model-specific vocabularies. Character counts or word counts will be wrong by 20-50%, causing API errors or truncated embeddings.

## Common Pitfalls

### Pitfall 1: Breaking Semantic Units Mid-Sentence

**What goes wrong:** Fixed-size chunking splits paragraphs or sentences at arbitrary token counts, destroying semantic meaning. When a sentence is cut in half, the embedding loses context, and retrieval accuracy collapses.

**Why it happens:** Developers default to simple fixed-size splitting (e.g., every 500 tokens) because it's easier to implement than parsing document structure.

**How to avoid:**
- Use heading-based chunking for markdown (locked decision for Phase 1)
- When subdividing large sections, split on sentence boundaries (use `.` or `\n\n` as split points)
- Apply overlap (10-20%) to ensure edge sentences appear in adjacent chunks

**Warning signs:**
- Test queries return partial sentences or nonsensical fragments
- Precision@5 < 0.5 (below 50% relevance in top results)
- Users see "cut-off" text in retrieved context

### Pitfall 2: Embedding Chunks Without Contextual Metadata

**What goes wrong:** Storing only the chunk text without parent document title or section heading. The embedding loses document-level context, making chunks from different documents indistinguishable if they use similar language.

**Why it happens:** Minimal schema design that doesn't anticipate the need for citations or multi-document disambiguation.

**How to avoid:**
- Prepend section heading to chunk content before embedding (locked decision: "Pricing: Our plans start at...")
- Store `document_title`, `section_heading`, and `chunk_position` in the `document_chunks` table
- Return enriched metadata in the similarity search RPC function

**Warning signs:**
- Test queries return relevant content but from the wrong document
- No way to cite sources ("From: Getting Started Guide")
- Duplicate content across documents causes confusion

### Pitfall 3: Missing HNSW Index or Wrong Distance Operator

**What goes wrong:** Querying pgvector without an index causes full table scans (slow), or using Euclidean distance (`<->`) instead of inner product (`<#>`) for normalized embeddings wastes computation.

**Why it happens:**
- Forgetting to create an index after initial schema setup
- Copying examples that use Euclidean distance without understanding embedding normalization

**How to avoid:**
- Create HNSW index immediately after enabling pgvector extension: `create index on document_chunks using hnsw (embedding vector_ip_ops);`
- Use inner product operator (`<#>`) for OpenAI embeddings (they are normalized to length 1)
- Monitor query performance: searches should complete in <100ms for tables with <100k rows

**Warning signs:**
- Similarity searches take >1 second on small datasets (<10k chunks)
- `EXPLAIN ANALYZE` shows sequential scan instead of index scan
- Similarity scores don't align with expected relevance (wrong distance metric)

### Pitfall 4: No Evaluation Framework Until Production

**What goes wrong:** Building the entire admin UI and chat API without validating retrieval quality. Discovering low precision/recall after users start complaining requires re-chunking entire knowledge base.

**Why it happens:** Pressure to ship visible features (UI) before invisible infrastructure (evaluation).

**How to avoid:**
- Build evaluation script first (Phase 1 boundary includes this)
- Create 15-20 test query-answer pairs with manually verified ground truth
- Set pass/fail gates (Precision@5 > 0.7, Recall@20 > 0.8) before moving to Phase 2

**Warning signs:**
- No quantitative way to measure if chunking changes improve or hurt retrieval
- QA testing is manual ("does this answer look right?")
- Regression risk when modifying chunking logic

### Pitfall 5: Re-Upload Duplicates Without Cleanup

**What goes wrong:** Uploading the same document twice creates duplicate chunks with identical embeddings. Similarity search returns multiple copies of the same content, wasting top-k slots and confusing users.

**Why it happens:** No uniqueness constraint on `documents.title`, no cleanup logic in the upload flow.

**How to avoid:**
- On upload, check if document with same title exists
- If exists, delete old chunks (`delete from document_chunks where document_id = ?`) before creating new ones
- This is a locked decision: "On re-upload (same document title): delete old chunks and embeddings, then create new ones"

**Warning signs:**
- Test evaluation shows precision dropping after re-seeding fixtures
- Similarity search returns 3 identical chunks with scores 0.99, 0.98, 0.97
- Chunk count grows unboundedly with each seed script run

## Code Examples

Verified patterns from official sources:

### Token Counting for Chunking

```typescript
// Source: gpt-tokenizer npm package
import { encode, countTokens } from 'gpt-tokenizer';

// Count tokens in a string (fast, doesn't allocate array)
const count = countTokens('Pricing: Our plans start at $29/month');

// Full encoding (use when you need actual token IDs)
const tokens = encode('Hello, world!');
console.log(tokens.length);  // Accurate token count for GPT-4o

// Check if text fits within limit (returns false or actual count)
import { isWithinTokenLimit } from 'gpt-tokenizer';
const fits = isWithinTokenLimit('Long text...', 8191);  // text-embedding-3-small limit
```

### Creating HNSW Index for pgvector

```sql
-- Source: pgvector GitHub + Supabase docs
-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Create table with vector column (1536 dims for text-embedding-3-small)
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  document_title text not null,
  section_heading text not null,
  content text not null,
  chunk_position int not null,
  total_chunks int not null,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Create HNSW index with inner product operator (for normalized vectors)
-- Default params: m=16, ef_construction=64
create index on document_chunks using hnsw (embedding vector_ip_ops);

-- For larger datasets or higher accuracy needs, tune params:
-- create index on document_chunks using hnsw (embedding vector_ip_ops)
-- with (m = 24, ef_construction = 128);
```

**Parameter guidance:**
- `m`: connections per node (default 16, range 5-48). Higher = faster queries, slower builds.
- `ef_construction`: candidate list size during build (default 64). Higher = better recall, slower builds.
- Start with defaults unless you have >100k chunks or failing recall tests.

### Generating and Storing Embeddings

```typescript
// Source: OpenAI API docs + Supabase cookbook
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Server-side only
);

interface Chunk {
  documentId: string;
  documentTitle: string;
  sectionHeading: string;
  content: string;
  chunkPosition: number;
  totalChunks: number;
}

async function embedAndStore(chunks: Chunk[]): Promise<void> {
  // Batch embed for efficiency (up to 2048 inputs per request)
  const embeddings = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: chunks.map(c => c.content),  // content already has heading prepended
    encoding_format: 'float',
  });

  // Insert chunks with embeddings
  const rows = chunks.map((chunk, i) => ({
    document_id: chunk.documentId,
    document_title: chunk.documentTitle,
    section_heading: chunk.sectionHeading,
    content: chunk.content,
    chunk_position: chunk.chunkPosition,
    total_chunks: chunk.totalChunks,
    embedding: embeddings.data[i].embedding,
  }));

  const { error } = await supabase.from('document_chunks').insert(rows);
  if (error) throw new Error(`Failed to insert chunks: ${error.message}`);
}
```

**Best practices:**
- Batch embed multiple chunks in a single API call (up to 2048 inputs, ~8191 tokens each)
- Check token limits before embedding: `countTokens(chunk.content) <= 8191`
- Use service role key for server-side operations (never expose to client)

### Next.js 15 Supabase Client Setup

```typescript
// Source: Supabase Next.js docs
// lib/supabase/server.ts (for Server Components, Server Actions, Route Handlers)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component, can't set cookies
          }
        },
      },
    }
  );
}

// lib/supabase/client.ts (for Client Components)
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Critical:** Always use `supabase.auth.getUser()` in Server Components (validates token with auth server), never trust `getSession()` (doesn't revalidate).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| IVFFlat indexing | HNSW indexing | pgvector 0.5.0 (2023) | HNSW provides better recall and query speed at cost of slower builds |
| text-embedding-ada-002 | text-embedding-3-small | Jan 2024 | 3-small is cheaper, smaller (1536 dims), better multilingual performance |
| Fixed-size chunking | Semantic/heading-aware chunking | 2024-2025 | 8-12% accuracy improvement for structured documents |
| Cosine distance for all embeddings | Inner product for normalized embeddings | 2024+ | Faster queries for OpenAI embeddings (already normalized) |
| Manual evaluation (human QA) | Automated precision@k/recall@k | 2024-2025 | Quantitative regression detection, scalable evaluation |

**Deprecated/outdated:**
- `text-embedding-ada-002`: Replaced by text-embedding-3-small (cheaper, better)
- Euclidean distance (`<->`) for OpenAI embeddings: Use inner product (`<#>`) instead
- IVFFlat index for new projects: HNSW is now standard (unless constrained by build time)
- LangChain for simple RAG: Adds unnecessary complexity for single-purpose embeddings pipeline

## Open Questions

Things that couldn't be fully resolved:

1. **Overlap percentage: 10-20% vs 0%**
   - What we know: Industry standard is 10-20%, but recent research (2026) shows overlap provides no measurable benefit and increases cost
   - What's unclear: Whether this research applies to heading-aware chunking (research focused on fixed-size chunking)
   - Recommendation: Start with 15% overlap as safety margin, measure precision/recall with and without overlap during evaluation phase. If no difference, drop to 0% in Phase 2 refactor.

2. **Optimal chunk size for FlowBoard content**
   - What we know: 512 tokens is a common starting point, ~500 is the target from requirements
   - What's unclear: Whether FlowBoard's PM SaaS domain benefits from smaller chunks (FAQ-heavy) or larger chunks (feature documentation)
   - Recommendation: Implement configurable chunk size (400, 500, 600 tokens), measure precision/recall for each during evaluation. Lock in best performer.

3. **HNSW index parameters for small dataset (<10k chunks)**
   - What we know: Default m=16, ef_construction=64 works for most cases
   - What's unclear: Whether Phase 1 test dataset (8-10 documents, ~100-200 chunks) is too small to benefit from tuning
   - Recommendation: Use defaults for Phase 1. If recall@20 < 0.8 in evaluation, experiment with m=24, ef_construction=128.

4. **Pass/fail thresholds for evaluation**
   - What we know: Industry benchmarks suggest Precision@5 > 0.7, Recall@20 > 0.8 for narrow domains
   - What's unclear: Whether FlowBoard (PM SaaS) qualifies as "narrow domain" or if thresholds should be adjusted
   - Recommendation: Start with 0.7/0.8 thresholds. If consistently failing, analyze failure modes (wrong chunks retrieved? relevant chunks missing?) before lowering thresholds.

## Sources

### Primary (HIGH confidence)

- [Supabase pgvector documentation](https://supabase.com/docs/guides/database/extensions/pgvector) - Setup, indexing, query patterns
- [Supabase Vector Columns guide](https://supabase.com/docs/guides/ai/vector-columns) - Schema design, best practices
- [OpenAI Cookbook: Semantic Search with Supabase](https://cookbook.openai.com/examples/vector_databases/supabase/semantic-search) - Complete RPC function pattern, TypeScript client usage
- [gpt-tokenizer npm package](https://www.npmjs.com/package/gpt-tokenizer) - Token counting API, o200k_base encoding
- [pgvector GitHub repository](https://github.com/pgvector/pgvector) - HNSW parameters, distance operators
- [Supabase Next.js SSR docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client) - Server component client setup

### Secondary (MEDIUM confidence)

- [Weaviate: Chunking Strategies for RAG](https://weaviate.io/blog/chunking-strategies-for-rag) - Heading-based chunking, semantic splitting
- [Unstructured: Chunking for RAG Best Practices](https://unstructured.io/blog/chunking-for-rag-best-practices) - Overlap recommendations, semantic boundaries
- [NVIDIA: Finding the Best Chunking Strategy](https://developer.nvidia.com/blog/finding-the-best-chunking-strategy-for-accurate-ai-responses/) - 15% overlap benchmark
- [Evidently AI: RAG Evaluation Guide](https://www.evidentlyai.com/llm-guide/rag-evaluation) - Precision@k, recall@k methodology
- [Crunchy Data: HNSW Indexes with pgvector](https://www.crunchydata.com/blog/hnsw-indexes-with-postgres-and-pgvector) - Index parameter guidance
- [EvidentlyAI: RAG Evaluation](https://www.evidentlyai.com/llm-guide/rag-evaluation) - Ground truth testing frameworks

### Tertiary (LOW confidence)

- [Stack Overflow: Breaking Up is Hard to Do - Chunking in RAG](https://stackoverflow.blog/2024/12/27/breaking-up-is-hard-to-do-chunking-in-rag-applications/) - Anti-patterns, common mistakes (community perspective)
- [Medium: Chunking Strategies for RAG](https://medium.com/@adnanmasood/chunking-strategies-for-retrieval-augmented-generation-rag-a-comprehensive-guide-5522c4ea2a90) - Overview, not implementation-specific
- [RAG About It: Chunking Blind Spot](https://ragaboutit.com/the-chunking-blind-spot-why-your-rag-accuracy-collapses-when-context-boundaries-matter-most/) - Recent research on overlap (2026), contradicts industry practice

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs and npm packages verified
- Architecture patterns: HIGH - Supabase cookbook and official guides provide complete examples
- Chunking strategy: MEDIUM - Heading-aware chunking is well-documented, but FlowBoard-specific tuning untested
- Evaluation methodology: MEDIUM - Industry benchmarks exist, but threshold validation needed for this domain
- Pitfalls: HIGH - Common mistakes well-documented across multiple authoritative sources

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days - stable technologies, but RAG best practices evolving)

**Schema extension needed:**
The existing schema in CLAUDE.md must be extended to support chunk enrichment decisions:

```sql
-- Add to existing document_chunks table:
alter table document_chunks add column document_title text not null;
alter table document_chunks add column section_heading text not null;
alter table document_chunks add column chunk_position int not null;
alter table document_chunks add column total_chunks int not null;

-- Update match_document_chunks function to return enriched metadata (see Pattern 2)
```
