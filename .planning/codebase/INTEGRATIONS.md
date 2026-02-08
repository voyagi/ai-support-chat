# External Integrations

**Analysis Date:** 2026-02-08

## APIs & External Services

**Generative AI:**
- OpenAI API - Primary LLM for chat responses and embeddings
  - SDK/Client: `openai` npm package (v5.1.0)
  - Models: GPT-4o-mini (primary), GPT-4o (fallback for complex queries)
  - Embeddings: `text-embedding-3-small` for RAG document chunking
  - Auth: `OPENAI_API_KEY` environment variable (secret, server-side only)
  - Implementation: `src/lib/openai.ts` exports initialized OpenAI client

## Data Storage

**Databases:**
- Supabase (PostgreSQL-based)
  - Purpose: Knowledge base documents, conversation history, message storage, pgvector embeddings for RAG similarity search
  - Connection: Configured via `NEXT_PUBLIC_SUPABASE_URL` and authentication keys
  - Client: `@supabase/supabase-js` (v2.49.4) for browser operations
  - Server Client: `@supabase/ssr` (v0.6.1) for server-side SSR operations with cookie-based session management
  - Auth Implementation: `src/lib/supabase/server.ts` (server) and `src/lib/supabase/client.ts` (browser)
  - Pgvector Integration: Supabase vector extension for embeddings storage and similarity search
  - Tables:
    - `documents` - Knowledge base document metadata (title, content, created_at)
    - `document_chunks` - Text chunks with embeddings for RAG queries
    - `conversations` - Conversation sessions
    - `messages` - Individual messages in conversations
  - Functions: `match_document_chunks()` for semantic similarity search via pgvector

**File Storage:**
- Supabase Storage - Document file upload and retrieval
  - Used by admin panel to persist uploaded knowledge base files
  - Integration through `@supabase/supabase-js` storage API

**Caching:**
- None detected - Queries hit Supabase directly

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built-in PostgreSQL auth with JWT)
  - Implementation: Cookie-based sessions via `@supabase/ssr` middleware
  - Server-side auth: `src/lib/supabase/server.ts` handles cookie session management
  - Browser auth: `src/lib/supabase/client.ts` manages client-side authentication state
  - Tokens: JWT-based, stored in secure HTTP-only cookies
  - Admin protection: Routes protected via server-side session middleware

## Monitoring & Observability

**Error Tracking:**
- None detected - Standard Next.js/browser console logging only

**Logs:**
- Console logging (browser DevTools + server stdout)
- No centralized logging service (would be added for production at Vercel)

## CI/CD & Deployment

**Hosting:**
- Vercel - Primary deployment platform for Next.js applications
  - Auto-deploys on git push to linked repository
  - Environment variables configured in Vercel dashboard
  - Supports Turbopack fast builds and serverless functions

**CI Pipeline:**
- None explicitly configured - Vercel provides default Next.js build pipeline
- Pre-commit checks: Biome linting via npm scripts (manual, not automated)

## Environment Configuration

**Required env vars:**
- `OPENAI_API_KEY` - OpenAI API authentication (secret, server-side only)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key for browser client (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role for admin operations (secret, server-side only)

**Optional env vars:**
- `NEXT_PUBLIC_APP_URL` - Application base URL for widget embeds (defaults to deployment URL)

**Secrets location:**
- Development: `.env.local` (git-ignored, never committed)
- Production: Vercel Environment Variables (dashboard or CLI)
- GitHub: No secrets stored in repo; configured via Vercel deployment settings

## Webhooks & Callbacks

**Incoming:**
- None detected - App uses standard HTTP request/response pattern

**Outgoing:**
- OpenAI API requests - Chat completions streaming, embedding generation
- Supabase API requests - CRUD operations on documents, conversations, messages
- No outbound webhooks configured

## Integration Architecture

**RAG Flow:**
1. Admin uploads document via Supabase Storage
2. Document processed: text extracted, split into chunks (~500 tokens each)
3. Embeddings generated via OpenAI `text-embedding-3-small`
4. Chunks + embeddings stored in `document_chunks` table with pgvector
5. User sends chat message
6. Message embedding generated via OpenAI
7. pgvector similarity search retrieves top matching chunks
8. Retrieved context injected into system prompt
9. GPT-4o-mini generates response grounded in knowledge base
10. Conversation + messages persisted to Supabase

**Authentication Flow (SSR):**
1. Browser sends request with session cookie
2. Server-side Supabase client (`@supabase/ssr`) validates cookie
3. JWT extracted from cookie, verified
4. Protected routes check session presence
5. Response includes updated session cookie if needed

---

*Integration audit: 2026-02-08*
