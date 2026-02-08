# Architecture

**Analysis Date:** 2026-02-08

## Pattern Overview

**Overall:** Next.js 15 App Router with server-client separation, RAG-backed chatbot system

**Key Characteristics:**
- Server Components for data fetching and sensitive operations
- Client Components for interactive UI (chat, forms)
- API routes for streaming responses and document processing
- Separation of browser clients (`@supabase/ssr`) and server clients (service role)
- Environment-based configuration for third-party integrations (OpenAI, Supabase)

## Layers

**Presentation Layer:**
- Purpose: React components for UI (chat interface, admin panels, widget)
- Location: `src/app/` (page.tsx files and future component files)
- Contains: Next.js page routes, layout wrappers, interactive UI
- Depends on: API routes, lib utilities, Tailwind CSS
- Used by: End users and admins

**API Layer:**
- Purpose: Backend endpoints for chat, document processing, and state management
- Location: `src/app/api/` (planned: chat/route.ts, documents/route.ts, conversations/route.ts)
- Contains: Next.js route handlers, streaming responses, RAG logic
- Depends on: OpenAI client, Supabase server client, embeddings utilities
- Used by: Frontend, external integrations

**Business Logic Layer:**
- Purpose: Core domain logic (RAG search, embedding generation, chat orchestration)
- Location: `src/lib/` (future modules: embeddings.ts, rag.ts, chat.ts)
- Contains: Reusable functions for OpenAI interactions, vector search, document chunking
- Depends on: External SDKs (OpenAI, Supabase)
- Used by: API routes

**Integration Layer:**
- Purpose: Wrap external service SDKs with project-specific configuration
- Location: `src/lib/openai.ts`, `src/lib/supabase/`
- Contains: OpenAI client singleton, Supabase client factories (browser + server)
- Depends on: `openai`, `@supabase/supabase-js`, `@supabase/ssr`
- Used by: Business logic and API routes

**Utility Layer:**
- Purpose: Shared helpers and constants
- Location: `src/lib/cn.ts` (Tailwind classname merging)
- Contains: Pure functions, type utilities, formatting helpers
- Depends on: `clsx`, `tailwind-merge`
- Used by: All other layers

## Data Flow

**Chat Request Flow:**

1. User types message in ChatWindow component (`src/app/chat/page.tsx`)
2. Component sends message to `/api/chat` endpoint via fetch/streaming
3. API route receives request, extracts user message
4. Backend embeds user query via OpenAI embeddings API
5. Backend performs vector similarity search on `document_chunks` table (Supabase pgvector)
6. Top 3-5 relevant chunks returned, injected into system prompt as context
7. GPT-4o-mini generates response using prompt + RAG context
8. Response streamed back to client as Server-Sent Events (SSE)
9. ChatWindow component reads stream and renders message incrementally
10. Message saved to `messages` table via conversations API

**Document Upload Flow:**

1. Admin uploads document via UploadForm (`src/app/admin/upload/page.tsx`)
2. Form sends multipart file to `/api/documents` endpoint
3. API route receives document, extracts text (or parses PDF)
4. Backend chunks text into ~500 token chunks with overlap
5. For each chunk, embed via OpenAI `text-embedding-3-small`
6. Store chunk + embedding vector in `document_chunks` table
7. Original document metadata stored in `documents` table
8. UI confirms upload and refreshes document list

**State Management:**

- Conversation history: Persisted in Supabase `conversations` and `messages` tables
- Knowledge base: Vector embeddings in `document_chunks`, metadata in `documents`
- Session/auth: Managed by Supabase (cookies via `@supabase/ssr`)
- UI state (draft message, loading indicators): React component state + hooks

## Key Abstractions

**Supabase Client Factory:**
- Purpose: Provide environment-aware database/auth connections
- Examples: `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (server)
- Pattern: Factory functions returning configured client instances; separation ensures browser client uses anon key while server uses service role key

**OpenAI Integration:**
- Purpose: Singleton OpenAI client configured with API key
- Examples: `src/lib/openai.ts`
- Pattern: Initialized once at module load, exported for use across API routes

**Classname Utility:**
- Purpose: Merge Tailwind class conflicts with clsx + tailwind-merge
- Examples: `src/lib/cn.ts`
- Pattern: Re-export cn() helper for use in components to avoid duplicate responsive classes

## Entry Points

**Web UI — Landing Page:**
- Location: `src/app/page.tsx`
- Triggers: User visits `/`
- Responsibilities: Serves home/demo page (currently "Coming Soon" placeholder)

**Web UI — Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: All pages load
- Responsibilities: Provides HTML shell, font loading, metadata, global styles wrapper

**Chat Page:**
- Location: `src/app/chat/page.tsx` (planned)
- Triggers: User visits `/chat`
- Responsibilities: Renders full-page chat interface with conversation history

**Admin Panel:**
- Location: `src/app/admin/page.tsx` (planned)
- Triggers: Admin visits `/admin`
- Responsibilities: Dashboard for knowledge base management

**API — Chat Endpoint:**
- Location: `src/app/api/chat/route.ts` (planned)
- Triggers: POST to `/api/chat`
- Responsibilities: Receive user message, search knowledge base, stream AI response

**API — Documents Endpoint:**
- Location: `src/app/api/documents/route.ts` (planned)
- Triggers: POST/GET to `/api/documents`
- Responsibilities: Upload documents, chunk/embed, store in database

**API — Conversations Endpoint:**
- Location: `src/app/api/conversations/route.ts` (planned)
- Triggers: GET/POST to `/api/conversations`
- Responsibilities: Fetch or create conversations, save/load messages

## Error Handling

**Strategy:** Fail-fast with informative user feedback

**Patterns:**
- API routes catch errors and return JSON with `status` + `error` fields
- Streaming responses include error boundaries to gracefully degrade if OpenAI fails mid-stream
- Client components show toast notifications or error messages on fetch failure
- Server components throw errors for 5xx, which Next.js catches and serves error page
- Sensitive errors (API key validation) logged server-side only, generic message shown to user

## Cross-Cutting Concerns

**Logging:** console.log for development; structured logging via Supabase or external service in production (planned)

**Validation:** Client-side form validation via HTML5 + React; server-side validation in API routes via manual checks or Zod schema validation (planned)

**Authentication:** Supabase Auth via SSR library; anon key for public chat, service role for admin operations; middleware guards `/admin` routes (planned)

**Rate Limiting:** Supabase Realtime or external service (planned); prevents abuse of OpenAI API

---

*Architecture analysis: 2026-02-08*
