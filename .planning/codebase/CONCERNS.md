# Codebase Concerns

**Analysis Date:** 2026-02-08

## Project Status

**Current State:** Early scaffolding phase (84 lines of functional code)
- Only basic Next.js setup and library clients initialized
- No core features implemented yet (chat endpoints, UI components, database integration)
- No tests, error handling, or authentication in place
- Primarily configuration and placeholder pages

---

## Critical Missing Implementations

**RAG Pipeline:**
- **What's missing:** Core RAG (Retrieval Augmented Generation) pipeline not implemented
  - No document chunking logic (`src/lib/embeddings.ts` referenced but missing)
  - No embedding generation or pgvector search endpoints
  - No document upload/processing flow
- **Blocks:** Core feature functionality; cannot answer user questions grounded in knowledge base
- **Files affected:** Missing `src/api/documents/route.ts`, `src/lib/embeddings.ts`
- **Timeline risk:** High - this is the differentiator feature for the portfolio project

**Chat Endpoints:**
- **What's missing:** No chat message API or streaming response handler
- **Blocks:** Cannot send/receive messages; chat UI will have nowhere to send data
- **Files affected:** Missing `src/api/chat/route.ts`
- **Implementation gap:** OpenAI client exists but not wired to any endpoints

**UI Components & Pages:**
- **What's missing:** No components for chat interface, admin panel, or widget
- **Blocks:** "Coming Soon" placeholder on landing page; no actual chat UX
- **Files affected:** Missing entire `src/components/` directory
  - `src/components/chat/ChatWindow.tsx`
  - `src/components/admin/DocumentUpload.tsx`
  - Widget embed components
- **Pages affected:** Missing `/chat`, `/admin`, `/widget` routes referenced in CLAUDE.md

**Database Setup & Migrations:**
- **What's missing:** No SQL migration files, no schema initialization
- **Blocks:** Knowledge base tables, conversation history, and document chunks cannot be created
- **Files affected:** Missing `src/db/migrations/` or equivalent
- **Risk:** Manual Supabase setup required; no repeatable deployment process

---

## Security Concerns

**Service Role Key Handling (High Priority):**
- **Issue:** `src/lib/supabase/server.ts:30-35` uses `require()` to dynamically load Supabase client
  ```typescript
  const { createClient } = require("@supabase/supabase-js") as {
    createClient: (url: string, key: string) => unknown;
  };
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");
  ```
- **Risk:** Service role key is loaded at runtime without validation; `?? ""` returns empty string if env var missing
- **Impact:** Could expose administrative database operations if service role key is compromised; silent failure with empty key
- **Recommendation:**
  - Validate service role key on startup; throw error if missing (fail loudly, not silently)
  - Extract to separate function with proper error handling
  - Add type safety for Supabase client

**Empty Environment Variables (Medium Priority):**
- **Issue:** Multiple places use `?? ""` for critical secrets
  - `src/lib/supabase/client.ts:3-4` — both URL and anon key default to empty strings
  - `src/lib/supabase/server.ts:34` — service role key defaults to empty string
- **Risk:** Code will initialize with empty credentials, making bugs harder to diagnose
- **Recommendation:** Fail at startup if critical env vars are missing, don't silently use empty strings

**API Key in Client (Medium Priority):**
- **Issue:** OpenAI API key loaded directly in `src/lib/openai.ts:3-4`
  ```typescript
  export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  ```
- **Risk:** This client is exported globally; could be exposed if used in browser context
- **Current safeguard:** Only used server-side currently, but no enforcement
- **Recommendation:**
  - Add runtime check that this client only exists on server (use `server` directives)
  - Create separate client factory for server-only contexts
  - Document that this cannot be imported in client components

---

## Architecture Gaps

**No Error Handling Strategy:**
- **Issue:** Zero error handling infrastructure
- **Files:** All API routes are missing (no implementation yet)
- **Risk:** When endpoints are created, errors will propagate unhandled; no logging/monitoring
- **Recommendation:** Define error handling pattern early (see CONVENTIONS.md for patterns once available)

**No Authentication Middleware:**
- **Issue:** CLAUDE.md references admin panel, but no auth checks visible
- **Files:** Missing any middleware in `src/lib/` or `src/middleware.ts`
- **Risk:** Admin endpoints (/admin, /api/documents) will be publicly accessible when created
- **Recommendation:** Implement Supabase auth middleware before building admin features

**Type Safety Gaps:**
- **Issue:** Supabase clients have `unknown` return types
  - `src/lib/supabase/server.ts:32` — client is typed as `unknown`
- **Risk:** No type safety for database operations; easy to make mistakes
- **Recommendation:** Properly type Supabase client using generated types or manual interfaces

**No Streaming Implementation:**
- **Issue:** Chat API must support streaming (per CLAUDE.md), but no streaming infrastructure exists
- **Files:** Missing `src/api/chat/route.ts`
- **Risk:** Large responses could timeout; poor UX without streaming
- **Recommendation:** Use Next.js streaming with OpenAI async iteration when building chat endpoint

---

## Testing Gaps

**No Test Infrastructure:**
- **What's missing:** No testing framework, fixtures, or test files
- **Files:** No `*.test.ts`, `*.spec.ts`, or test configuration
- **Risk:** Core RAG logic (embeddings, similarity search) will have no validation; easy to introduce bugs
- **Priority:** High - RAG correctness is critical for demo quality

**Untested Areas:**
- Embedding generation and chunking logic
- pgvector similarity search queries
- Chat streaming and error handling
- Document upload and processing

---

## Dependency Risks

**Version Constraints:**
- **Issue:** Package versions use flexible constraints (`^` and `~`)
  - `next: ^15.3.2` — major version bumps allowed
  - `openai: ^5.1.0` — could jump to v6+ (API breaking changes possible)
  - `@supabase/supabase-js: ^2.49.4` — wide range
- **Risk:** Silent breaking changes during `npm install` on fresh environments
- **Recommendation:** Lock exact versions in package.json for reproducible deployments, or use `npm ci` in CI/CD

**Supabase Client Mismatch:**
- **Issue:** Using both `@supabase/ssr` and `@supabase/supabase-js` for different contexts
  - Browser: `@supabase/ssr` (correct)
  - Server: `@supabase/supabase-js` via dynamic require (unusual)
- **Risk:** Inconsistent behavior; harder to debug
- **Recommendation:** Use `@supabase/ssr` everywhere; it handles both contexts correctly

---

## Performance Concerns

**No Caching Strategy:**
- **What's missing:** No mention of caching for:
  - Document embeddings (will be searched on every query)
  - Chat responses (repeated questions will hit OpenAI)
  - Conversation history lookups
- **Impact:** High cost (OpenAI API, Supabase compute) for production use
- **Recommendation:** Implement caching layer (Redis or Supabase cache) before production

**No Query Optimization:**
- **Issue:** pgvector similarity search endpoint not yet built
- **Risk:** Without proper indexing, searches on large document sets will be slow
- **Recommendation:** Create `HNSW` index on `document_chunks(embedding)` in migrations

**No Rate Limiting:**
- **What's missing:** No protection against OpenAI API overages or spam
- **Impact:** Unbounded costs if demo gets popular traffic
- **Recommendation:** Implement rate limiting per IP/user before deploying

---

## Configuration & Deployment Risks

**Missing Environment Validation:**
- **Issue:** No startup check that all required env vars exist
- **Files:** All entry points
- **Risk:** Deployment will succeed but fail at runtime when trying to use missing configs
- **Recommendation:** Add validation function in `src/lib/env.ts` that runs on startup

**No Next.js Configuration for Production:**
- **Issue:** `next.config.ts` is empty
- **Risk:** Missing security headers, image optimization, or performance settings
- **Recommendation:** Add config for SWR caching, security headers, CSP

**Vercel Deployment Not Documented:**
- **Issue:** CLAUDE.md says "Deploy to Vercel" but no `vercel.json` or deployment instructions
- **Files:** Missing `vercel.json`
- **Risk:** Automated deployments from GitHub will lack environment setup
- **Recommendation:** Create `vercel.json` with environment variable requirements

---

## Database Concerns

**No Migration Tracking System:**
- **Issue:** Schema referenced in CLAUDE.md but no `.sql` files exist
- **Files:** Missing `src/db/migrations/` or similar
- **Risk:** Cannot reproduce database setup; manual SQL required for deployments
- **Recommendation:** Create SQL migration files and document initial setup

**pgvector Extension Not Verified:**
- **Issue:** Embeddings table uses `vector(1536)` type, but unclear if pgvector is enabled
- **Files:** Missing schema initialization docs
- **Risk:** Database creation will fail without pgvector extension enabled
- **Recommendation:** Document Supabase pgvector setup in README or migration file

---

## Documentation & Handoff Risks

**Missing README:**
- **What's missing:** No `README.md` with setup instructions
- **Impact:** Anyone cloning repo won't know:
  - How to set up Supabase tables
  - How to configure environment variables
  - How to run the project
- **Recommendation:** Create README with database setup steps and env var guide

**Incomplete Scaffolding:**
- **Issue:** CLAUDE.md describes full architecture (6 API routes, 5+ components, admin panel)
  - But only 7 files exist; zero implementation
- **Risk:** New developer (or future you) won't know where to start or what's already done
- **Recommendation:** Maintain current implementation status in README or progress tracker

---

## Technical Debt Summary

| Category | Severity | Blocker | Fix Effort |
|----------|----------|---------|-----------|
| Service role key validation | High | No | Low (1-2 hours) |
| Missing RAG pipeline | High | Yes | High (8-12 hours) |
| Missing chat endpoints | High | Yes | High (6-10 hours) |
| Missing UI components | High | Yes | High (12-16 hours) |
| Database migrations | High | Yes | Medium (3-5 hours) |
| Authentication middleware | High | Yes | Medium (4-6 hours) |
| Error handling strategy | Medium | No | Medium (4-6 hours) |
| Test infrastructure | Medium | No | Medium (3-5 hours) |
| Environment validation | Medium | No | Low (1-2 hours) |
| Streaming implementation | Medium | Yes | Medium (3-5 hours) |

---

## Recommended Fix Priority

1. **Phase 1 (Critical — blocks demo):**
   - Create database schema & migrations
   - Implement chat endpoint with streaming
   - Implement RAG pipeline (embeddings, search)
   - Build ChatWindow component

2. **Phase 2 (Important — core features):**
   - Add document upload & processing
   - Build admin panel
   - Implement authentication
   - Add error handling & logging

3. **Phase 3 (Polish — quality/deployment):**
   - Add test coverage
   - Implement caching strategy
   - Configure Next.js for production
   - Create deployment documentation

---

*Concerns audit: 2026-02-08*
