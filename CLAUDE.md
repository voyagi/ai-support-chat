# AI Support Chat — Upwork Portfolio Project

## Purpose

Portfolio demo for an Upwork freelancing profile. Must be a **live,
deployed chatbot** that prospects can interact with. This is project #1
of 4 portfolio pieces — it demonstrates AI chatbot + RAG skills.

Full Upwork strategy: `C:\Users\Eagi\Making money\side-projects\upwork-strategy.md`

## What to Build

A **customer support chatbot** that answers questions from a business's
knowledge base (FAQ/docs). Two UI modes:

1. **Full-page chat** — standalone `/chat` page with conversation history
2. **Embeddable widget** — floating bubble (Intercom-style) that can be
   dropped into any website via `<script>` tag

### Core Features

- Chat interface with streaming responses
- RAG: answers grounded in uploaded knowledge base documents
- Conversation history persisted in Supabase
- Admin panel to upload/manage knowledge base docs
- Widget embed code generator

### Nice-to-Have (if time permits)

- Typing indicators and message timestamps
- "Was this helpful?" feedback on responses
- Analytics: total chats, common questions, satisfaction rate
- Multiple knowledge base support (different bots per business)

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **AI**: OpenAI API (GPT-4o-mini for cost efficiency, gpt-4o fallback)
- **RAG**: OpenAI embeddings + Supabase pgvector
- **Database**: Supabase (auth, Postgres, pgvector, storage for docs)
- **Styling**: Tailwind CSS v4
- **Linter/Formatter**: Biome (NOT ESLint/Prettier)
- **Deployment**: Vercel
- **Icons**: lucide-react

## Architecture

```
src/
  app/
    page.tsx              — Landing page / demo
    chat/page.tsx         — Full-page chat UI
    admin/
      page.tsx            — Knowledge base management
      upload/page.tsx     — Document upload
    api/
      chat/route.ts       — Chat endpoint (streaming, RAG)
      documents/route.ts  — Upload & process docs into embeddings
      conversations/route.ts — Save/load conversation history
    widget/
      page.tsx            — Widget preview page
  components/
    chat/
      ChatWindow.tsx      — Main chat component (used by both page + widget)
      MessageBubble.tsx
      ChatInput.tsx
    widget/
      WidgetBubble.tsx    — Floating bubble trigger
      WidgetEmbed.tsx     — Iframe-based embed
    admin/
      DocumentList.tsx
      UploadForm.tsx
    ui/                   — Shared UI primitives
  lib/
    openai.ts             — OpenAI client + RAG search
    supabase/
      client.ts           — Browser Supabase client
      server.ts           — Server Supabase client
      middleware.ts        — Auth middleware
    embeddings.ts         — Document chunking + embedding generation
    cn.ts                 — clsx + tailwind-merge utility
```

## Database Schema (Supabase)

```sql
-- Knowledge base documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Document chunks with embeddings for RAG
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

-- Messages within conversations
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Similarity search function
create or replace function match_document_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
) returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float
) language sql stable as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
```

## RAG Flow

1. **Upload**: Admin uploads a document (text/PDF)
2. **Chunk**: Split into ~500 token chunks with overlap
3. **Embed**: Generate embeddings via OpenAI `text-embedding-3-small`
4. **Store**: Save chunks + embeddings to `document_chunks` table
5. **Query**: User sends message → embed the question → pgvector
   similarity search → top 3-5 chunks → inject as context into prompt
6. **Answer**: GPT-4o-mini generates answer grounded in the chunks

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

- `OPENAI_API_KEY` — OpenAI API key
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable key
- `SUPABASE_SECRET_KEY` — Supabase secret key (server-side only)

## Demo Data

For the live demo, pre-load a knowledge base about a fictional business:
**"TechStart Solutions"** — a small IT support company. Include FAQ about
services, pricing, support hours, common troubleshooting steps. This makes
the demo feel realistic without needing a real client.

## Deployment

Deploy to Vercel. The live URL will be linked from the Upwork profile.
Widget embed should work on any external site via iframe.

## Browser Testing

For any task that requires visual verification, clicking, typing, form
testing, or seeing a rendered page: use the dev-browser skill in
`.claude/skills/dev-browser/`. Read its `SKILL.md` for the API.

- ALWAYS use extension mode (`npm run start-extension`) — connects to the
  user's Chrome, no separate window
- NEVER install Playwright MCP or write raw Playwright scripts
- Use `cdpScreenshot()` for screenshots (never `page.screenshot()`)
- Use `getIframeContent()` / `evaluateInIframe()` for cross-origin iframes
- If the skill isn't deployed yet, copy from
  `/c/Users/Eagi/.claude/skill-library/dev-browser/`
- **Never use `~` in bash paths** — MSYS expands to `/home/Eagi` not
  `/c/Users/Eagi`

## Test Credentials

<!-- Auto-maintained by GSD — updated when auth tasks execute -->

## Commands

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run check     # Biome check (lint + format)
npm run lint      # Biome lint only
npm run format    # Biome format only
```
