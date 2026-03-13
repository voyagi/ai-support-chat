# AI Support Chat — Upwork Portfolio Project

## Purpose

Portfolio demo showcasing AI chatbot + RAG skills. A **live, deployed
chatbot** that visitors can interact with.

## What to Build

A **customer support chatbot** that answers questions from a business's
knowledge base (FAQ/docs). Two UI modes:

1. **Full-page chat** — standalone `/chat` page with conversation history
2. **Embeddable widget** — floating bubble (Intercom-style) that can be
   dropped into any website via `<script>` tag

### Core Features

- Chat interface with streaming responses
- RAG: answers grounded in uploaded knowledge base documents
- Conversation history persisted in Neon Postgres
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
- **RAG**: OpenAI embeddings + Neon pgvector
- **Database**: Neon Postgres (serverless, pgvector, EU region)
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
    db.ts                 — Neon serverless client
    openai.ts             — OpenAI client + RAG search
    embeddings.ts         — Document chunking + embedding generation
    cn.ts                 — clsx + tailwind-merge utility
```

## Database Schema (Neon Postgres)

Full schema in `backup/neon-schema.sql`. Key tables: documents,
document_chunks (with pgvector embeddings), conversations, messages,
contact_submissions. Uses `@neondatabase/serverless` tagged template
queries (not an ORM).

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
- `DATABASE_URL` — Neon Postgres connection string
- `ADMIN_PASSWORD` — Admin panel access
- `SESSION_SECRET` — iron-session encryption (32+ chars)

## Demo Data

For the live demo, pre-load a knowledge base about a fictional business:
**"TechStart Solutions"** — a small IT support company. Include FAQ about
services, pricing, support hours, common troubleshooting steps. This makes
the demo feel realistic without needing a real client.

## Deployment

Deploy to Vercel. Widget embed should work on any external site via iframe.

## Commands

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run check     # Biome check (lint + format)
npm run lint      # Biome lint only
npm run format    # Biome format only
```
