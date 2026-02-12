# AI Support Chat

## What This Is

A live, deployed AI customer support chatbot (branded "FlowBoard") that serves
as portfolio piece #1 for an Upwork freelancing profile. Prospects visit the
demo URL, chat with a RAG-powered bot answering questions about a fictional
PM SaaS company, upload their own documents to test the pipeline, and see
exactly what they'd get for their own business. Two UI modes: full-page chat
and an embeddable Intercom-style widget.

## Core Value

A prospect interacts with the demo and thinks "I want this, but for my
business" - that's the conversion moment. Everything serves this.

## Current State

**Version:** v1.0 MVP - shipped 2026-02-12
**Live URL:** https://upwork-ai-chatbot.vercel.app
**Codebase:** 6,532 LOC TypeScript, 132 commits across 10 phases

Shipped features:
- Full-page chat with streaming responses and conversation history
- RAG pipeline (pgvector, 18 FlowBoard docs, 223 chunks)
- Embeddable widget (script tag + iframe, 2.9KB loader)
- Admin panel (document management, analytics, embed code generator, contacts)
- Dark mode with animations and micro-interactions
- Out-of-KB handling with inline contact form
- Rate limiting (20/hr + 100/day per IP) and $10/day cost cap
- Sandbox mode for prospect document uploads
- Production deployment on Vercel with branded OG cards

## Requirements

### Validated

- ✓ Next.js 15 App Router scaffolding with TypeScript - existing
- ✓ Tailwind CSS v4 + PostCSS pipeline configured - existing
- ✓ OpenAI SDK (v5.1) + Supabase clients (browser + server) installed - existing
- ✓ Biome linter/formatter configured - existing
- ✓ cn() utility (clsx + tailwind-merge) - existing
- ✓ Root layout with fonts and global styles - existing
- ✓ Full-page chat UI with streaming responses - v1.0
- ✓ RAG pipeline: embed user query, pgvector similarity search, context-grounded answer - v1.0
- ✓ Embeddable widget (script tag + iframe, Intercom-style floating bubble) - v1.0
- ✓ Widget mobile-first, full-screen on phones - v1.0
- ✓ Admin panel with password gate - v1.0
- ✓ Admin: knowledge base document management (upload, list, delete) - v1.0
- ✓ Admin: "Try it yourself" sandbox mode - v1.0
- ✓ Admin: copy-paste embed code snippet - v1.0
- ✓ Admin: analytics dashboard (chat volume, common questions, response accuracy) - v1.0
- ✓ Graceful out-of-KB handling: inline contact form - v1.0
- ✓ Conversation history persisted in Supabase - v1.0
- ✓ Dark mode with light/dark toggle - v1.0
- ✓ Premium polish: animations, transitions, loading states, micro-interactions - v1.0
- ✓ 18 realistic FlowBoard demo docs pre-loaded - v1.0
- ✓ Landing page: zero-friction demo entry, no signup required - v1.0
- ✓ Deploy to Vercel with live URL for Upwork profile - v1.0
- ✓ Rate limiting (20 req/hour, 100 req/day per IP) - v1.0
- ✓ Cost tracking with $10/day budget cap and email alerts - v1.0

### Active

(None - all v1 requirements shipped. Define new requirements with `/gsd:new-milestone`.)

### Out of Scope

- Real authentication (OAuth, email/password signup) - demo project, password gate is enough
- Multiple knowledge base support (different bots per business) - v2 if demand exists
- "Was this helpful?" thumbs up/down feedback - excluded from v1 analytics
- PDF parsing for document upload - text/markdown only, PDF adds complexity
- npm package for widget - script tag + iframe is simpler and targets broader audience
- Voice input - adds permissions UX, mic detection, transcription costs
- Conversation branching / decision trees - defeats RAG value prop

## Context

**Purpose:** Portfolio piece #1 of 4 for Upwork freelancing. Demonstrates AI
chatbot + RAG skills. Must be live and interactive, not a mockup.

**Target audience:** Upwork prospects - business owners and product managers
looking to add AI chat support to their products/sites.

**Demo business:** "FlowBoard" - a fictional project management SaaS tool
(similar to Asana/Linear). Free/Pro/Enterprise tiers, Kanban + timeline views,
integrations, API. Chosen because PM tools have rich, relatable FAQ content.

**Tech stack:** Next.js 15 (App Router), OpenAI API (gpt-4.1-mini), Supabase
(pgvector), Tailwind CSS v4, Biome, Upstash Redis, Resend, Vercel.

**Upwork strategy context:** Full strategy at
`C:\Users\Eagi\Making money\side-projects\upwork-strategy.md`

## Constraints

- **Tech stack**: Next.js 15, OpenAI API, Supabase (pgvector), Tailwind CSS v4, Biome
- **AI model**: gpt-4.1-mini for cost efficiency, 300 token output cap
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Deployment**: Vercel at https://upwork-ai-chatbot.vercel.app
- **Auth**: Simple password gate for admin only
- **Budget**: $10/day OpenAI cost cap, dual rate limiting per IP
- **Polish**: Must feel premium - animations, dark mode, transitions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| FlowBoard (PM SaaS) as demo business | Broad appeal, rich FAQ content, relatable to most Upwork clients | ✓ Good - 18 docs feel authentic |
| Script tag + iframe for widget | Matches Intercom UX, works on any site, simpler than npm package | ✓ Good - 2.9KB loader, works everywhere |
| Password gate instead of real auth | Demo project, no user management overhead | ✓ Good - iron-session, simple and secure |
| Inline contact form for out-of-KB | Shows lead capture value, builds trust by not hallucinating | ✓ Good - confidence threshold 0.7 |
| Dark mode as must-have | "Feels premium" polish bar, signals attention to detail | ✓ Good - Tailwind v4 custom variant |
| Chat volume + common Qs + accuracy for analytics | Shows business value without overbuilding | ✓ Good - Recharts, dark mode compatible |
| Admin "try it yourself" sandbox toggle | Proves RAG pipeline is real, not pre-canned | ✓ Good - per-IP tenant isolation |
| AI SDK v6 Chat + DefaultChatTransport | Latest Vercel AI SDK pattern for streaming | ✓ Good - parts format, clean API |
| Upstash Redis for rate limiting | Distributed state for serverless, free tier | ✓ Good - dual limits, tighter-wins logic |
| gpt-4.1-mini (not gpt-4o-mini) | gpt-4o-mini retiring Feb 13, future-proof | ✓ Good - seamless transition |
| Direct tenant_id filtering over RLS | Serverless set_config unreliable | ✓ Good - simple, predictable |

---
*Last updated: 2026-02-12 after v1.0 milestone*
