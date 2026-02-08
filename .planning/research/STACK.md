# Stack Research

**Domain:** RAG-Powered AI Customer Support Chatbot
**Researched:** 2026-02-08
**Confidence:** HIGH

## Recommended Stack

### Core Technologies (Already in Place)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.3.2 | Framework | App Router, Server Components, API routes, streaming support |
| OpenAI SDK | 5.1.0 | AI Provider | GPT-4o-mini for chat, text-embedding-3-small for RAG embeddings |
| Supabase | supabase-js 2.49.4 + ssr 0.6.1 | Database + Auth | PostgreSQL with pgvector extension, built-in auth, storage for docs |
| Tailwind CSS | 4.1.4 | Styling | Utility-first, v4 CSS variables for theming, small bundle size |
| TypeScript | 5.8.3 | Type Safety | Catch errors at compile-time, better IDE support |

### Chat & Streaming Libraries

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **ai** (Vercel AI SDK) | ^6.0.77 | Streaming chat infrastructure | Provider-agnostic streaming, useChat hook, React Server Components support, streamText API. Handles all OpenAI streaming complexity. Standard for Next.js AI apps. |
| **streamdown** | Latest | Markdown rendering for streaming | Drop-in replacement for react-markdown designed specifically for AI streaming. Handles unterminated markdown blocks, streaming carets, CJK text, syntax highlighting via Shiki, security hardening against prompt injection. |

**Alternative: react-markdown** - Use if you need max ecosystem compatibility or already familiar. But Streamdown is purpose-built for AI streaming and handles edge cases better (incomplete code blocks, security, performance).

### Document Processing

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **officeparser** | ^6.0.0 | Multi-format document parsing | Supports DOCX, PPTX, XLSX, ODT, ODP, ODS, PDF, RTF. TypeScript-native. Returns clean AST with metadata. Better than pdf-parse + mammoth + xlsx separately. |

**Why officeparser:** Released Dec 2024 with v6.0 overhaul. Single library for all office formats. TypeScript-first with strict types. Handles attachments, OCR-ready, toText() helper for RAG. No need for multiple parsing libraries.

**Alternative: pdf-parse + mammoth** - Use if you only need PDF and DOCX, or need finer control over parsing. But officeparser is simpler and handles more formats.

### Text Chunking for RAG

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **chonkiejs** | Latest | Lightweight text chunking | TypeScript-native, zero dependencies, simple API. RecursiveChunker for paragraphs, TokenChunker for token-aware splitting, CodeChunker for code. Built for RAG pipelines without LangChain bloat. |

**Why NOT LangChain:** LangChain is 50MB+ and brings massive dependency tree. For this project, you only need text chunking - not agents, chains, or LLM orchestration. Chonkie-TS is 1% the size and does chunking better.

**Alternative: LangChain.js RecursiveCharacterTextSplitter** - Use if you're building complex multi-agent systems or need LangChain's broader ecosystem. For simple RAG chunking, it's overkill.

### Dark Mode

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **next-themes** | ^0.3.0 or latest | Theme management | Handles Tailwind v4's new dark mode architecture. No flash on load, respects system preference, persists user choice, works with CSS variables. Standard for Next.js + Tailwind dark mode. |

### UI & Icon Libraries (Already in Place)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| lucide-react | 0.511.0 | Icons | Tree-shakeable, consistent design, actively maintained |
| clsx + tailwind-merge | 2.1.1 + 3.3.0 | Utility classes | Conditional classes with conflict resolution |

### Development Tools (Already in Place)

| Tool | Purpose | Notes |
|------|---------|-------|
| Biome | Linter + Formatter | Replaces ESLint + Prettier. Faster, single config file. |
| Turbopack | Dev server bundler | Built into Next.js 15 via --turbopack flag. 700x faster HMR. |

## Installation

```bash
# Chat & Streaming
npm install ai streamdown @streamdown/code

# Document Processing
npm install officeparser

# Text Chunking
npm install chonkiejs

# Dark Mode
npm install next-themes

# Already installed (from scaffold):
# - next@^15.3.2
# - react@^19.1.0
# - openai@^5.1.0
# - @supabase/supabase-js@^2.49.4
# - @supabase/ssr@^0.6.1
# - lucide-react@^0.511.0
# - clsx@^2.1.1
# - tailwind-merge@^3.3.0
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vercel AI SDK (ai) | OpenAI SDK directly | Never for chat UI - AI SDK handles streaming, state, React hooks. OpenAI SDK is low-level. |
| streamdown | react-markdown | If max compatibility matters more than streaming-specific features. |
| officeparser | pdf-parse + mammoth | If you only need 1-2 formats or want fine-grained control over parsing. |
| chonkiejs | LangChain.js | If building complex agents or need LangChain's broader ecosystem. Overkill for RAG chunking. |
| Supabase pgvector | Pinecone, Weaviate | If you need >10M vectors or managed service. Supabase is simpler for <10M and keeps data co-located. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| LangChain.js for chunking only | 50MB+ dependency tree, agent-focused, overkill for RAG text splitting | chonkiejs - 1% the size, TypeScript-first, purpose-built for chunking |
| react-markdown without streaming consideration | Re-renders on every token, no handling for incomplete markdown blocks during streaming | streamdown - designed for AI streaming, handles unterminated blocks |
| Multiple document parsers (pdf-parse + mammoth + xlsx) | Increases bundle size, inconsistent APIs, more dependencies to manage | officeparser - single library, consistent AST output for all formats |
| Tailwind v3 dark mode patterns | v4 changed config - no more darkMode: "class" in tailwind.config.js | Tailwind v4 @custom-variant + next-themes for toggle |
| ESLint + Prettier | Two tools, slow, conflicting configs | Biome - replaces both, 10x faster, single config |

## Stack Patterns by Variant

**If building embeddable widget:**
- Use iframe-based approach with postMessage for cross-origin communication
- Deploy chat route as standalone page at `/widget` that can be iframed
- Host widget.js script on Vercel CDN with version pinning
- Use Shadow DOM for CSS isolation if injecting directly into parent page

**If adding analytics:**
- Use Vercel Analytics (built-in, zero config with Vercel deployment)
- Or Plausible/Umami for self-hosted privacy-friendly analytics
- Track: total chats, messages per conversation, common questions, "was this helpful" feedback

**If scaling beyond 10M vectors:**
- Consider migrating from Supabase pgvector to Pinecone or Weaviate
- But for portfolio demo and early-stage product, Supabase is perfect

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Vercel AI SDK 6.x | OpenAI SDK 5.x | AI SDK abstracts provider, OpenAI SDK 4.x also works but 5.x recommended |
| streamdown | React 19.x | Confirmed compatible, uses modern React patterns |
| officeparser 6.x | Node.js 16+ | Requires Node 16+, works in Next.js API routes and Server Components |
| chonkiejs | TypeScript 5.x | Pure TypeScript, zero dependencies, works in browser and Node |
| next-themes 0.3.x | Next.js 15.x + Tailwind v4 | Must configure @custom-variant in CSS for Tailwind v4 compatibility |
| Supabase ssr 0.6.x | Next.js 15.x | Handles Server Components, middleware, and route handlers correctly |

## Confidence Assessment

| Technology | Confidence | Reasoning |
|------------|-----------|-----------|
| Vercel AI SDK (ai) | HIGH | Official Vercel docs, WebSearch confirmed v6.0.77 as latest, standard for Next.js AI apps |
| streamdown | HIGH | Official GitHub repo + docs (streamdown.ai), purpose-built for AI streaming |
| officeparser | HIGH | GitHub repo with release history, v6.0.0 released Dec 2024, TypeScript-native |
| chonkiejs | MEDIUM | Multiple WebSearch results confirm TypeScript-native, lightweight, but newer library (less battle-tested than LangChain) |
| next-themes | HIGH | Standard for Next.js dark mode, multiple 2026 tutorials confirm Tailwind v4 compatibility |
| Tailwind v4 dark mode | HIGH | Official Tailwind docs confirm @custom-variant pattern for v4 |

## Sources

**Vercel AI SDK:**
- [AI SDK Documentation](https://ai-sdk.dev/docs/introduction) - Official docs
- [Vercel AI SDK Complete Guide (2026)](https://dev.to/pockit_tools/vercel-ai-sdk-complete-guide-building-production-ready-ai-chat-apps-with-nextjs-4cp6) - Recent tutorial
- [Real-time AI in Next.js: streaming with Vercel AI SDK](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/) - LogRocket guide

**streamdown:**
- [Streamdown Official Site](https://streamdown.ai/) - Official docs
- [GitHub: vercel/streamdown](https://github.com/vercel/streamdown) - Official repo
- [Next.js: Markdown Chatbot with Memoization](https://ai-sdk.dev/cookbook/next/markdown-chatbot-with-memoization) - AI SDK cookbook

**officeparser:**
- [GitHub: harshankur/officeParser](https://github.com/harshankur/officeParser) - Official repo with v6.0.0 details

**Text Chunking:**
- [Text Chunking with Chonkie-TS](https://www.blog.brightcoding.dev/2025/06/05/text-chunking-the-ts-way-fast-simple-and-sweet-with-chonkie-ts/) - BrightCoding tutorial
- [GitHub: chonkie-inc/chonkiejs](https://github.com/chonkie-inc/chonkiejs) - Official repo
- [Best Chunking Strategies for RAG 2025](https://www.firecrawl.dev/blog/best-chunking-strategies-rag-2025) - Firecrawl guide
- [Chunking Strategies for RAG](https://weaviate.io/blog/chunking-strategies-for-rag) - Weaviate blog

**Dark Mode:**
- [How to Add Dark Mode in Next.js 15 with Tailwind v4](https://www.sujalvanjare.com/blog/dark-mode-nextjs15-tailwind-v4) - Recent tutorial
- [Tailwind v4 Dark Mode Official Docs](https://tailwindcss.com/docs/dark-mode) - Official Tailwind docs
- [Implementing Dark Mode with Tailwind v4 and Next.js](https://www.thingsaboutweb.dev/en/posts/dark-mode-with-tailwind-v4-nextjs) - Tutorial

**RAG Ecosystem:**
- [Build RAG Chatbot with Next.js & Supabase](https://freeacademy.ai/blog/how-to-build-rag-chatbot-nextjs-supabase) - Tutorial
- [Supabase AI & Vectors Docs](https://supabase.com/docs/guides/ai) - Official docs

---
*Stack research for: AI Support Chat — Upwork Portfolio Project*
*Researched: 2026-02-08*
