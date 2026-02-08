# AI Support Chat

## What This Is

A live, deployed AI customer support chatbot that serves as portfolio piece #1
for an Upwork freelancing profile. Prospects click a demo link, interact with a
RAG-powered chatbot answering questions about a fictional SaaS company
("FlowBoard"), and see exactly what they'd get for their own business. Two UI
modes: full-page chat and an embeddable Intercom-style widget.

## Core Value

A prospect interacts with the demo and thinks "I want this, but for my
business" — that's the conversion moment. Everything serves this.

## Requirements

### Validated

- ✓ Next.js 15 App Router scaffolding with TypeScript — existing
- ✓ Tailwind CSS v4 + PostCSS pipeline configured — existing
- ✓ OpenAI SDK (v5.1) + Supabase clients (browser + server) installed — existing
- ✓ Biome linter/formatter configured — existing
- ✓ cn() utility (clsx + tailwind-merge) — existing
- ✓ Root layout with fonts and global styles — existing

### Active

- [ ] Full-page chat UI with streaming responses
- [ ] RAG pipeline: embed user query → pgvector similarity search → context-grounded answer
- [ ] Embeddable widget (script tag + iframe, Intercom-style floating bubble)
- [ ] Widget must be mobile-first and look perfect on phones
- [ ] Admin panel with password gate (simple shared password)
- [ ] Admin: knowledge base document management (upload, list, delete)
- [ ] Admin: "Try it yourself" mode to upload docs and see RAG pipeline work
- [ ] Admin: copy-paste embed code snippet (like Intercom's install page)
- [ ] Admin: analytics dashboard (chat volume, common questions, response accuracy)
- [ ] Graceful out-of-KB handling: inline contact form (name + email + question) instead of hallucination
- [ ] Conversation history persisted in Supabase
- [ ] Dark mode with light/dark toggle (must-have)
- [ ] Premium polish: animations, transitions, loading states, micro-interactions
- [ ] 15-20 realistic FlowBoard demo docs (pricing, FAQ, getting started, API docs, etc.)
- [ ] Landing page: zero-friction demo entry, no signup required
- [ ] Deploy to Vercel with live URL for Upwork profile

### Out of Scope

- Real authentication (OAuth, email/password signup) — demo project, password gate is enough
- Multiple knowledge base support (different bots per business) — v2 if demand exists
- "Was this helpful?" thumbs up/down feedback — excluded from v1 analytics
- Real-time typing indicators — nice-to-have, defer unless trivial to add
- PDF parsing for document upload — text-only in v1, PDF adds complexity
- Rate limiting — demo project, low traffic expected
- npm package for widget — script tag + iframe is simpler and targets broader audience

## Context

**Purpose:** Portfolio piece #1 of 4 for Upwork freelancing. Demonstrates AI
chatbot + RAG skills. Must be live and interactive, not a mockup.

**Target audience:** Upwork prospects — business owners and product managers
looking to add AI chat support to their products/sites. They range from
e-commerce to SaaS to professional services.

**Demo business:** "FlowBoard" — a fictional project management SaaS tool
(similar to Asana/Linear). Free/Pro/Enterprise tiers, Kanban + timeline views,
integrations, API. Chosen because PM tools have rich, relatable FAQ content.

**Demo data strategy:** Claude generates all 15-20 docs during build. Content
must feel real — not placeholder text. Docs include: pricing page, FAQ, getting
started guide, API reference, integration guides, billing FAQ, team management
guide, etc.

**Existing codebase:** Next.js 15 scaffolding with OpenAI + Supabase + Biome
configured. No feature code exists yet — all pages and API routes are planned
but not built. See `.planning/codebase/` for full map.

**Upwork strategy context:** Full strategy at
`C:\Users\Eagi\Making money\side-projects\upwork-strategy.md`

## Constraints

- **Tech stack**: Next.js 15, OpenAI API, Supabase (pgvector), Tailwind CSS v4, Biome — already configured, do not change
- **AI model**: GPT-4o-mini for cost efficiency (gpt-4o fallback for complex queries)
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Deployment**: Vercel — standard Next.js hosting
- **Auth**: Simple password gate for admin only — no user auth system
- **Budget**: Minimize OpenAI API costs — demo will have real traffic from prospects
- **Polish**: Must feel premium — animations, dark mode, transitions. This IS the sales pitch.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| FlowBoard (PM SaaS) as demo business | Broad appeal, rich FAQ content, relatable to most Upwork clients | — Pending |
| Script tag + iframe for widget | Matches Intercom UX, works on any site, simpler than npm package | — Pending |
| Password gate instead of real auth | Demo project — no need for user management overhead | — Pending |
| Inline contact form for out-of-KB | Shows lead capture value, builds trust by not hallucinating | — Pending |
| Dark mode as must-have | "Feels premium" polish bar — dark mode signals attention to detail | — Pending |
| Chat volume + common Qs + accuracy for analytics | Shows business value without overbuilding — satisfaction deferred to v2 | — Pending |
| Admin "try it yourself" toggle | Proves RAG pipeline is real, not pre-canned — default read-only prevents abuse | — Pending |

---
*Last updated: 2026-02-08 after initialization*
