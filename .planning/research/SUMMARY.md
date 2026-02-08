# Project Research Summary

**Project:** AI Support Chat — Upwork Portfolio Project
**Domain:** RAG-powered customer support chatbot
**Researched:** 2026-02-08
**Confidence:** HIGH

## Executive Summary

This project is a production-quality AI customer support chatbot demonstrating RAG (Retrieval-Augmented Generation) capabilities for an Upwork portfolio. The research confirms that the recommended approach—Next.js 15 with OpenAI GPT-4o-mini for chat, text-embedding-3-small for RAG, and Supabase pgvector for vector search—is the current industry standard. This stack is well-documented, cost-effective, and proven in production environments. The embeddable widget pattern (iframe + postMessage) matches how Intercom and Drift implement their solutions, making this demo immediately recognizable to prospects.

The critical success factors are: (1) semantic chunking with overlap to preserve context across document boundaries, (2) hallucination prevention through confidence thresholds and fallback prompting, and (3) streaming error handling to gracefully recover from mid-response failures. The research identified eight critical pitfalls, with naive fixed-size chunking being the most common cause of poor retrieval quality. Teams that skip evaluation pipelines cannot measure whether their RAG system actually works—this must be built in Phase 1, not deferred.

The key risk for a portfolio demo is cost explosion from uncontrolled API usage. Without rate limiting and max_tokens caps, a viral demo or bot attack can drain the OpenAI budget overnight. Implementation must include cost controls before public launch: GPT-4o-mini as default, 300-token response limits, and rate limiting at 20 requests/user/hour. With these mitigations, the demo can run safely at ~$50-100/month for moderate traffic.

## Key Findings

### Recommended Stack

The stack research confirms that the scaffolded technologies (Next.js 15, OpenAI SDK, Supabase, Tailwind v4) are optimal for this use case. Four additional libraries are essential: Vercel AI SDK for streaming infrastructure, streamdown for markdown rendering during streaming, officeparser for multi-format document parsing, and chonkiejs for RAG-optimized text chunking. These modern, TypeScript-native libraries replace heavier alternatives (LangChain is 50MB+; chonkiejs is 1% of that size and purpose-built for chunking).

**Core technologies:**
- **Vercel AI SDK (ai)**: Streaming chat infrastructure — handles OpenAI streaming complexity, provides useChat hook, supports React Server Components. Standard for Next.js AI apps.
- **streamdown**: Markdown rendering for AI streaming — handles unterminated code blocks, streaming carets, security hardening. Purpose-built for AI responses.
- **officeparser**: Multi-format document parsing — single library for DOCX, PDF, XLSX, RTF, ODT. TypeScript-native with clean AST output. Replaces pdf-parse + mammoth + xlsx.
- **chonkiejs**: Lightweight text chunking — zero dependencies, TypeScript-native, RAG-optimized. RecursiveChunker for semantic splitting, TokenChunker for token-aware boundaries.
- **next-themes**: Dark mode management — handles Tailwind v4's new dark mode architecture, no flash on load, respects system preference.
- **OpenAI GPT-4o-mini**: Chat model — $0.15/1M input tokens (3x cheaper than GPT-4o), sufficient quality for support chatbot. Escalate to GPT-4o only for complex queries.
- **OpenAI text-embedding-3-small**: Embeddings model — $0.02/1M tokens, 1536 dimensions. Industry standard for RAG pipelines.
- **Supabase pgvector**: Vector storage — PostgreSQL with pgvector extension. Handles <10M vectors efficiently, keeps data co-located with relational tables.

### Expected Features

The feature research identified 14 table stakes features that users expect in every support chatbot, and 12 differentiators that set premium products apart. The critical insight: RAG-grounded answers are table stakes, not differentiators. Users assume the chatbot pulls from a knowledge base—the differentiator is inline contact form fallback when the KB can't answer (captures leads instead of failing). Admin "try it yourself" mode proves the RAG pipeline is real, which is essential for portfolio credibility.

**Must have (table stakes):**
- RAG-grounded answers with source attribution — users expect accurate info from KB, not hallucination
- Streaming responses with loading states — chat feels broken if responses appear all at once
- Mobile-responsive UI and widget — 60% of traffic is mobile
- Conversation history (persisted) — users expect previous messages to remain visible
- Embeddable widget via script tag — site owners expect copy-paste install like Intercom
- Dark mode — premium products in 2026 have dark mode; absence signals "cheap"
- Admin document management (CRUD) — KB admins expect upload, list, delete
- Admin password protection — prevent public abuse of admin features
- Graceful fallback when KB can't answer — "I don't know" or escalation, not hallucinated nonsense

**Should have (competitive):**
- Inline contact form for out-of-KB queries — captures leads instead of failing, shows business value
- Admin "try it yourself" mode — proves RAG pipeline is real, builds trust with prospects
- Analytics dashboard (chat volume, common questions, accuracy) — shows business intelligence value
- Copy-paste embed code generator — one-click install removes integration friction
- Premium polish (animations, transitions) — signals attention to detail, "I want THIS quality"
- Zero-friction demo entry — no signup, instant interaction increases conversion

**Defer (v2+):**
- "Was this helpful?" feedback — creates expectation of ML training loop that doesn't exist in demo
- PDF parsing for document upload — PDF parsing is brittle; text-only in v1 with "PDF support available" note
- Multiple knowledge bases — multi-tenancy adds DB complexity; single KB proves concept
- Real user authentication (OAuth) — adds complexity with zero portfolio value; simple admin password gate sufficient
- Widget customization (colors, fonts) — high implementation cost, low demo value

### Architecture Approach

The architecture research confirms a standard three-tier approach: Client Layer (full-page chat + widget iframe + admin panel) → API Layer (route handlers for chat/docs/conversations) → Service Layer (embedding generation + retrieval + OpenAI client) → Data Layer (Supabase PostgreSQL + pgvector + Storage). The RAG pipeline follows the universal three-phase pattern: Ingest (chunk → embed → store), Retrieve (embed query → pgvector similarity search → top K chunks), Generate (inject context → streamText → streaming response).

The critical architectural decisions are: (1) use Vercel AI SDK's tool calling pattern for RAG retrieval so the LLM decides when to search the KB vs answer directly, (2) implement widget as iframe with postMessage for complete DOM/CSS isolation, (3) use semantic chunking with 10-20% overlap to preserve context at boundaries, (4) save conversation history asynchronously (fire-and-forget) so DB writes don't block streaming responses. The build order must start with database schema and RAG infrastructure (Phase 1), then admin panel for content creation (Phase 2), then chat interface (Phase 3), and finally embeddable widget (Phase 4).

**Major components:**
1. **RAG Pipeline** — Three-phase: ingest documents (chunk + embed + store), retrieve context (embed query + pgvector search), generate answers (streamText with context). Foundational for entire chatbot.
2. **Chat UI (shared component)** — Reusable ChatWindow component used by both full-page chat and widget iframe. Handles streaming responses, conversation history, error states. Built with Vercel AI SDK's useChat hook.
3. **Embeddable Widget** — Iframe-based isolation for third-party embedding. Widget loader script creates iframe, postMessage bridge handles cross-origin communication. Matches Intercom UX pattern.
4. **Admin Panel** — Password-gated document management. Upload form triggers server-side chunking + embedding pipeline. Embed code generator provides copy-paste script tag.
5. **API Route Handlers** — /api/chat (streamText with RAG tools), /api/documents (chunking + embedding), /api/conversations (save/load history). All server-side to protect API keys.

### Critical Pitfalls

The pitfall research identified eight critical issues, with naive chunking being the #1 cause of RAG failure. 70% of teams copy-paste fixed-size chunking from tutorials without understanding semantic boundaries, causing context loss when documents split mid-table or mid-definition. The second most common mistake is treating evaluation as optional—teams ship without metrics and can't tell if retrieval quality degrades over time. Hallucination prevention requires multi-layer defense: confidence thresholds, explicit fallback prompting, LLM-based detection, and citation requirements.

1. **Naive fixed-size chunking** — Use semantic chunking with 50-100 token overlap. Preserve tables/code blocks as atomic units. Include contextual headers in each chunk. Test with sample queries before full indexing.
2. **Treating evaluation as optional** — Build evaluation pipeline from day 1. Measure retrieval metrics (precision@k, recall@k) and generation metrics (relevance, factuality). Track hallucination rate. Don't ship without metrics.
3. **No hallucination prevention** — Implement detection layer (LLM prompt-based, 75%+ accuracy). Use confidence scoring with fallback when similarity < 0.7. Explicitly instruct model to say "I don't have information on that" for low-confidence matches.
4. **Mid-stream error handling failures** — Listen for error event type in SSE stream. Set 30s timeout for stalled connections. Show "regenerate" button on failure. Don't append partial responses to conversation history on error.
5. **Widget iframe security holes** — Use iframe sandbox attribute with minimal permissions. Set CSP frame-ancestors directive. Verify event.origin in postMessage handlers. Generate time-limited JWT tokens for embed authentication.
6. **Uncontrolled API cost explosion** — Use GPT-4o-mini as default. Cap responses at 300 tokens. Rate limit at 20 requests/user/hour. Implement prompt caching for 50-90% savings. Set OpenAI usage limits with hard cap at $500/month for demo.
7. **Demo data looks fake** — Research real IT support company FAQs, service descriptions, pricing pages. Create 15-20 realistic documents with actual troubleshooting steps. Test with questions a real customer would ask. Have non-technical reviewer confirm it feels real.
8. **Stale vector index after schema changes** — Version your embedding pipeline (track chunking strategy, model, preprocessing). Detect version mismatch before retrieval. Create migration script to re-embed all documents when pipeline changes.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: RAG Foundation

**Rationale:** Everything depends on RAG pipeline. Can't test chat until retrieval works. Can't populate admin until chunking/embedding exists. Architecture research shows database schema must come first, then services that interact with it.

**Delivers:** Database schema with pgvector setup, Supabase clients (browser/server), OpenAI client, embedding service (generateEmbedding + retrieveContext), chunking utility (semantic with overlap), evaluation framework (retrieval metrics).

**Addresses:**
- RAG-grounded answers (table stakes from FEATURES.md)
- Source attribution (table stakes)
- Semantic chunking pattern (ARCHITECTURE.md)

**Avoids:**
- Naive chunking (Pitfall #1) — implement semantic chunking with overlap from start
- No evaluation pipeline (Pitfall #2) — build metrics before claiming feature complete
- No hallucination prevention (Pitfall #3) — implement confidence thresholds and fallback

**Research flag:** SKIP — RAG architecture is well-documented. Vercel AI SDK docs + Supabase pgvector guides provide complete implementation patterns.

### Phase 2: Admin Panel & Content

**Rationale:** Need to populate knowledge base before testing chat. Admin panel is simpler than chat UI (no streaming complexity). Architecture research recommends content creation before core feature.

**Delivers:** Password gate (layout.tsx with env var check), upload form, document processing API (POST /api/documents with chunking + embedding), document list with delete, 15-20 realistic FlowBoard demo documents.

**Addresses:**
- Admin document management (table stakes)
- Admin password protection (table stakes)
- Admin "try it yourself" mode (differentiator)

**Avoids:**
- Demo data looks fake (Pitfall #7) — create realistic IT support company knowledge base
- Uncontrolled uploads (Security) — implement file size limits, content validation

**Research flag:** SKIP — Standard CRUD with file upload. Next.js Server Actions + Supabase Storage are well-documented patterns.

### Phase 3: Chat Interface

**Rationale:** Core product feature. Reusable components will be shared with widget in Phase 4. Architecture research shows API route is foundation for UI, and conversation persistence comes last since it's not required for basic functionality.

**Delivers:** Chat API route (POST /api/chat with streamText and RAG retrieval), ChatWindow/MessageBubble/ChatInput components, full-page chat (app/chat/page.tsx using useChat hook), conversation persistence (save/load to Supabase), landing page with zero-friction demo entry.

**Addresses:**
- Streaming responses with loading states (table stakes)
- Conversation history persisted (table stakes)
- Mobile-responsive UI (table stakes)
- Dark mode toggle (table stakes)
- Zero-friction demo entry (differentiator)
- Premium polish animations (differentiator)

**Avoids:**
- Mid-stream error handling failures (Pitfall #4) — implement retry UI, error boundaries
- Blocking response while saving to DB (Anti-pattern) — fire-and-forget save, return stream immediately
- Poor streaming UX (UX pitfall) — buffer tokens, stream in 3-5 word chunks, not character-by-character

**Research flag:** SKIP — Vercel AI SDK provides complete streaming implementation. Next.js App Router + useChat hook patterns are standard.

### Phase 4: Embeddable Widget

**Rationale:** Advanced feature that reuses Phase 3 components. Widget requires deployed URL, so it naturally comes after core chat works. Architecture research shows loader script depends on widget page being live.

**Delivers:** Widget page (app/widget/page.tsx rendering ChatWindow in minimal layout), widget loader script (public/widget.js creating iframe), postMessage bridge for cross-origin events, embed code generator in admin panel.

**Addresses:**
- Embeddable widget via script tag (table stakes)
- Widget bubble visibility (table stakes)
- Instant widget load (table stakes)
- Copy-paste embed code generator (differentiator)
- Mobile-first widget design (differentiator)

**Avoids:**
- Widget iframe security holes (Pitfall #5) — implement sandbox attribute, CSP headers, postMessage origin verification
- Widget covers mobile nav (UX pitfall) — test on actual devices, adjust z-index and positioning

**Research flag:** LOW — iframe + postMessage pattern is well-documented. May need research for CSP configuration and cross-origin security best practices.

### Phase 5: Analytics & Production Hardening

**Rationale:** Analytics depends on conversation persistence from Phase 3. Cost controls and monitoring must be in place before public launch. Scaling considerations from architecture research inform this phase.

**Delivers:** Analytics dashboard (chat volume, common questions, accuracy tracking), rate limiting (20 req/user/hour, 100 req/day), cost monitoring with alerts ($100/day threshold), max_tokens cap (300), model routing (GPT-4o-mini default), deployment to Vercel with live URL.

**Addresses:**
- Analytics dashboard (differentiator)
- Real-time accuracy tracking (differentiator)
- Out-of-KB handling with inline contact form (differentiator)

**Avoids:**
- Uncontrolled API cost explosion (Pitfall #6) — rate limiting, max_tokens, cost alerts before public launch
- Stale vector index (Pitfall #8) — add embedding version tracking and migration tooling

**Research flag:** MEDIUM — May need research for query clustering algorithms (common questions feature) and rate limiting strategies for Next.js API routes.

### Phase Ordering Rationale

- **Foundation first (Phase 1):** RAG pipeline is dependency for everything. Database schema must exist before services can interact with it. Evaluation framework prevents shipping broken retrieval.
- **Content before chat (Phase 2):** Can't test chatbot without knowledge base populated. Admin panel is simpler than streaming chat UI—get it working early.
- **Core before advanced (Phases 3→4):** Full-page chat proves core functionality. Widget reuses chat components, naturally comes after. Widget needs deployed URL, so it must come later.
- **Hardening last (Phase 5):** Analytics requires conversation data from Phase 3. Cost controls and monitoring are production concerns, not MVP blockers. But must complete before public launch.
- **Pitfall-aware ordering:** Phase 1 addresses top 3 pitfalls (chunking, evaluation, hallucination). Phase 4 addresses widget security. Phase 5 addresses cost explosion. This prevents costly rework.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5 (Analytics):** Query clustering for "common questions" feature—may need algorithm research. Rate limiting strategies for Next.js API routes at edge vs serverless.

Phases with standard patterns (skip research-phase):
- **Phase 1 (RAG Foundation):** Vercel AI SDK docs + Supabase pgvector guides provide complete implementation. Chunking strategies well-documented in Weaviate/Chonkie docs.
- **Phase 2 (Admin Panel):** Standard Next.js Server Actions + file upload. Supabase Storage docs cover this completely.
- **Phase 3 (Chat Interface):** Vercel AI SDK useChat hook is battle-tested pattern. Streaming responses are standard Next.js implementation.
- **Phase 4 (Widget):** iframe + postMessage pattern well-documented. May need security best practices review but core implementation is standard.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core technologies verified with official docs. Vercel AI SDK v6.0.77 confirmed as latest. Alternative libraries (streamdown, officeparser, chonkiejs) have GitHub repos with release history and WebSearch confirmation. |
| Features | HIGH | Competitor analysis (Intercom, Drift, Zendesk) confirms table stakes. Multiple sources agree on differentiators (analytics, try-it-yourself mode, inline contact form). Anti-features identified from common mistake articles. |
| Architecture | HIGH | RAG three-phase pattern is universal (confirmed across 8+ sources). Widget iframe + postMessage approach matches industry practice (Intercom, chatscope articles). Build order validated by dependency analysis. |
| Pitfalls | HIGH | Top 3 pitfalls (chunking, evaluation, hallucination) confirmed across multiple authoritative sources (Stack Overflow, AWS, Weaviate). Remaining pitfalls identified from production experience articles and security guides. |

**Overall confidence:** HIGH

### Gaps to Address

- **Query clustering algorithm for analytics:** Feature research identified "common questions" as differentiator, but specific clustering approach needs decision during Phase 5. Recommendation: use sentence embeddings + k-means clustering on query embeddings (fast, simple). Validate during phase planning.

- **Rate limiting implementation details:** Architecture research mentions rate limiting but doesn't specify Next.js-specific implementation. Upstash Redis + @upstash/ratelimit is recommended pattern for edge compatibility. Research during Phase 5 planning.

- **Prompt caching strategy:** Cost optimization mentions 50-90% savings from prompt caching, but OpenAI's prompt caching API requires specific formatting. Need to validate: (1) cache system prompt + top-K chunks as prefix, (2) only user message changes per request. Verify OpenAI docs during Phase 1 implementation.

- **Demo content creation process:** Pitfall #7 requires realistic demo data, but research doesn't specify how to create it efficiently. Recommendation: scrape real IT support FAQs from 3-5 companies, synthesize into FlowBoard-branded content. Budget 4-8 hours for content creation in Phase 2.

- **Embedding version migration script:** Pitfall #8 requires versioning system for embedding pipeline, but migration script specifics need design. Recommendation: add `embedding_version` column to `documents` table, write one-time script to re-embed when version changes. Design during Phase 1.

## Sources

### Primary (HIGH confidence)

**Stack research:**
- [AI SDK Documentation](https://ai-sdk.dev/docs/introduction) — Vercel AI SDK official docs
- [Streamdown Official Site](https://streamdown.ai/) — streamdown markdown renderer
- [GitHub: harshankur/officeParser](https://github.com/harshankur/officeParser) — officeparser v6.0.0 release
- [GitHub: chonkie-inc/chonkiejs](https://github.com/chonkie-inc/chonkiejs) — chonkiejs chunking library
- [Supabase AI & Vectors Docs](https://supabase.com/docs/guides/ai) — pgvector setup and querying

**Features research:**
- [42 Best AI Chatbots for Customer Service in 2026](https://thecxlead.com/tools/best-ai-chatbot-for-customer-service/) — Competitor feature analysis
- [Top 14 Intercom alternatives and competitors for 2026](https://www.zendesk.com/service/comparison/intercom-alternatives/) — Table stakes identification
- [Drift vs. Intercom comparison](https://www.tidio.com/blog/drift-vs-intercom/) — Feature parity analysis

**Architecture research:**
- [RAG with Vercel AI SDK](https://vercel.com/templates/next.js/ai-sdk-rag) — Official Vercel template
- [Guides: RAG Agent - Vercel AI SDK Cookbook](https://ai-sdk.dev/cookbook/guides/rag-chatbot) — Tool calling pattern for RAG
- [pgvector: Key features and tutorial [2026 guide]](https://www.instaclustr.com/education/vector-database/pgvector-key-features-tutorial-and-pros-and-cons-2026-guide/) — Vector search implementation

**Pitfalls research:**
- [Chunking Strategies for RAG | Weaviate](https://weaviate.io/blog/chunking-strategies-for-rag) — Semantic chunking best practices
- [5 Critical Mistakes When Building a RAG Chatbot](https://softwarelogic.co/en/blog/5-critical-mistakes-when-building-a-rag-chatbot-and-how-to-avoid-them) — Evaluation and hallucination prevention
- [RAG Hallucinations Explained - Mindee](https://www.mindee.com/blog/rag-hallucinations-explained) — Detection and mitigation
- [Cost optimization - OpenAI](https://platform.openai.com/docs/guides/cost-optimization) — Model routing and prompt caching
- [2026 Iframe Security Risks and 10 Ways to Secure Them - Qrvey](https://qrvey.com/iframe-security/) — Widget security hardening

### Secondary (MEDIUM confidence)

- [Text Chunking with Chonkie-TS tutorial](https://www.blog.brightcoding.dev/2025/06/05/text-chunking-the-ts-way-fast-simple-and-sweet-with-chonkie-ts/) — Chunking library implementation examples
- [Building Production RAG Systems in 2026: Complete Architecture Guide](https://brlikhon.engineer/blog/building-production-rag-systems-in-2026-complete-architecture-guide) — Build order recommendations
- [Common Mistakes in Customer Support Chatbots](https://fastbots.ai/blog/common-mistakes-in-customer-support-chatbots) — UX pitfalls

### Tertiary (LOW confidence)

- [Why 40% of Agentic AI Projects Fail in 2026](https://www.techedubyte.com/agentic-ai-projects-fail-architecture-data-challenges-2026/) — Demo quality considerations (needs validation with real portfolio examples)

---
*Research completed: 2026-02-08*
*Ready for roadmap: yes*
