# Roadmap: AI Support Chat

## Overview

This roadmap delivers a production-ready AI customer support chatbot with RAG capabilities as an Upwork portfolio piece. The journey starts with database schema and RAG foundation, builds content creation and admin tools, implements streaming chat UI with dark mode polish, adds embeddable widget capability, and finishes with analytics and production hardening. Each phase delivers verifiable user-facing capabilities that build toward the core value: prospects interact with the demo and think "I want this, but for my business."

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Database & RAG Foundation** - Schema, embeddings, chunking, evaluation framework
- [x] **Phase 2: Admin Panel & Content Upload** - Password gate, document CRUD, FlowBoard demo content
- [x] **Phase 3: Chat API & Streaming** - RAG retrieval, streaming responses, conversation persistence
- [x] **Phase 4: Full-Page Chat UI** - ChatWindow component, landing page, responsive design
- [ ] **Phase 5: Dark Mode & Polish** - Theme system, animations, transitions, micro-interactions
- [ ] **Phase 6: Embeddable Widget** - Widget page, loader script, iframe isolation
- [ ] **Phase 7: Embed Code Generator** - Admin copy-paste snippet, syntax highlighting, preview
- [ ] **Phase 8: Analytics Dashboard** - Chat volume, common questions, accuracy tracking
- [ ] **Phase 9: Out-of-KB Handling** - Contact form fallback, confidence thresholds, hallucination prevention
- [ ] **Phase 10: Production Hardening** - Rate limiting, cost controls, deployment to Vercel

## Phase Details

### Phase 1: Database & RAG Foundation

**Goal**: RAG pipeline infrastructure exists and can embed, store, and retrieve document chunks with measurable accuracy
**Depends on**: Nothing (first phase)
**Requirements**: RAG-01, RAG-02, RAG-03, RAG-04
**Success Criteria** (what must be TRUE):

  1. Documents can be split into ~500 token chunks with 10-20% overlap
  2. Chunks are embedded via OpenAI text-embedding-3-small and stored in Supabase pgvector
  3. User queries are embedded and matched against chunks via similarity search
  4. Top 3-5 relevant chunks are retrieved with similarity scores > 0.7
  5. Retrieval quality is measurable via precision@k and recall@k metrics

**Plans**: 4 plans

Plans:

- [x] 01-01-PLAN.md -- Database schema (SQL) + heading-aware markdown chunker with token counting
- [x] 01-02-PLAN.md -- FlowBoard test fixtures (10 docs) + evaluation ground truth queries (18 cases)
- [x] 01-03-PLAN.md -- Embedding generation, similarity search, and seed script
- [x] 01-04-PLAN.md -- Evaluation framework (precision@k, recall@k) + end-to-end pipeline verification

### Phase 2: Admin Panel & Content Upload

**Goal**: Admin can upload documents, view knowledge base, and FlowBoard demo content is pre-loaded
**Depends on**: Phase 1
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04, LAND-05
**Success Criteria** (what must be TRUE):

  1. Admin panel is accessible only with correct password
  2. Admin can upload text documents which are automatically chunked and embedded
  3. Admin can view list of all uploaded documents with titles and dates
  4. Admin can delete documents (removal cascades to chunks and embeddings)
  5. 15-20 realistic FlowBoard demo documents exist in knowledge base

**Plans**: 4 plans

Plans:

- [x] 02-01-PLAN.md -- Auth gate with iron-session (login page, middleware, session management)
- [x] 02-02-PLAN.md -- FlowBoard content expansion (8 new docs to reach 18 total)
- [x] 02-03-PLAN.md -- Document management (upload, list, delete, chunk preview, admin dashboard)
- [x] 02-04-PLAN.md -- E2E verification (seed database, human-verify full admin flow)

### Phase 3: Chat API & Streaming

**Goal**: API endpoint streams RAG-grounded responses and persists conversation history
**Depends on**: Phase 2
**Requirements**: RAG-04, RAG-05, CHAT-01, CHAT-02
**Success Criteria** (what must be TRUE):

  1. POST /api/chat accepts user messages and returns streaming responses
  2. Bot responses cite which document(s) the answer came from
  3. Conversation history persists to Supabase and loads across page refreshes
  4. Streaming works token-by-token without blocking on database writes
  5. API handles mid-stream errors gracefully with retry capability

**Plans**: 2 plans

Plans:

- [x] 03-01-PLAN.md -- Chat infrastructure modules (system prompt, context builder, conversation persistence)
- [x] 03-02-PLAN.md -- Streaming chat API route (RAG + streaming + citations + abort + persistence)

### Phase 4: Full-Page Chat UI

**Goal**: Users can interact with the chatbot on /chat with smooth streaming UI and conversation history
**Depends on**: Phase 3
**Requirements**: CHAT-03, CHAT-04, CHAT-05, LAND-01, LAND-04
**Success Criteria** (what must be TRUE):

  1. Chat interface displays bot identity (avatar, name, "AI assistant" disclaimer)
  2. Messages stream token-by-token with typing indicators and loading states
  3. Previous conversation messages load and display correctly
  4. UI is responsive across desktop, tablet, and mobile breakpoints
  5. Landing page provides zero-friction demo entry (instant chat access, no signup)

**Plans**: 2 plans

Plans:

- [x] 04-01-PLAN.md -- Chat UI components (MessageBubble, ChatInput, TypingIndicator, MessageSkeleton, ChatWindow) + /chat page with useChat integration
- [x] 04-02-PLAN.md -- Landing page with zero-friction demo CTA + full-flow human verification

### Phase 5: Dark Mode & Polish

**Goal**: App supports light/dark modes with system preference detection and has premium polish
**Depends on**: Phase 4
**Requirements**: LAND-02, LAND-03
**Success Criteria** (what must be TRUE):

  1. User can toggle between light and dark modes via UI control
  2. App detects and applies system dark mode preference on load
  3. Theme transitions smoothly without flash of unstyled content
  4. Message appearances have smooth animations (fade in, slide up)
  5. Interactive elements have hover states, focus rings, and micro-interactions

**Plans**: 2 plans

Plans:

- [ ] 05-01-PLAN.md -- Dark mode infrastructure (next-themes, Tailwind v4 custom variant, ThemeToggle) + chat and landing page dark mode
- [ ] 05-02-PLAN.md -- Admin pages dark mode + message animations (Motion) + micro-interactions + human verification

### Phase 6: Embeddable Widget

**Goal**: Widget embeds on external sites via script tag with floating bubble UI
**Depends on**: Phase 5
**Requirements**: WIDG-01, WIDG-02, WIDG-03, WIDG-04, WIDG-05
**Success Criteria** (what must be TRUE):

  1. Floating bubble appears in bottom-right corner when script tag is added to page
  2. Widget loads in iframe with complete DOM/CSS isolation from host page
  3. Widget expands to full-screen on mobile devices, stays windowed on desktop
  4. Widget loads asynchronously without blocking host page rendering
  5. Widget communicates with parent page via secure postMessage API

**Plans**: TBD

Plans:

- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Embed Code Generator

**Goal**: Admin can copy ready-to-paste embed code with syntax highlighting and preview
**Depends on**: Phase 6
**Requirements**: ADMN-06
**Success Criteria** (what must be TRUE):

  1. Admin panel displays embed code snippet with correct script tag
  2. Code snippet includes syntax highlighting for readability
  3. "Copy to clipboard" button copies code with one click
  4. Live preview shows widget as it would appear on external site
  5. Instructions explain where to paste code in website HTML

**Plans**: TBD

Plans:

- [ ] 07-01: TBD

### Phase 8: Analytics Dashboard

**Goal**: Admin can view chat metrics, common questions, and response accuracy
**Depends on**: Phase 3
**Requirements**: ANLY-01, ANLY-02, ANLY-03
**Success Criteria** (what must be TRUE):

  1. Dashboard shows total conversations and messages per day/week
  2. Dashboard displays most common question topics via query clustering
  3. Dashboard shows percentage of queries answered from KB vs fallback
  4. Charts visualize trends over time (daily/weekly conversation volume)
  5. Metrics update in real-time as new conversations occur

**Plans**: TBD

Plans:

- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: Out-of-KB Handling

**Goal**: Bot gracefully handles queries outside knowledge base with contact form fallback
**Depends on**: Phase 3
**Requirements**: RAG-06
**Success Criteria** (what must be TRUE):

  1. Low-confidence answers (similarity < 0.7) trigger special handling
  2. Bot displays inline contact form instead of hallucinating answer
  3. Contact form collects name, email, and original question
  4. Form submissions are saved to database and visible in admin panel
  5. Bot explicitly states "I don't have information on that" before showing form

**Plans**: TBD

Plans:

- [ ] 09-01: TBD

### Phase 10: Production Hardening

**Goal**: App is deployed to Vercel with rate limiting and cost controls active
**Depends on**: Phase 9
**Requirements**: DEPL-01, DEPL-02, ADMN-05
**Success Criteria** (what must be TRUE):

  1. App is live at public Vercel URL accessible from any browser
  2. Environment variables are configured in Vercel dashboard
  3. Rate limiting restricts users to 20 requests/hour, 100 requests/day
  4. Responses are capped at 300 tokens to control OpenAI costs
  5. Admin can toggle "try it yourself" mode for prospect document uploads
  6. Cost monitoring alerts trigger at $100/day OpenAI usage

**Plans**: TBD

Plans:

- [ ] 10-01: TBD
- [ ] 10-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Database & RAG Foundation | 4/4 | Complete | 2026-02-08 |
| 2. Admin Panel & Content Upload | 4/4 | Complete | 2026-02-08 |
| 3. Chat API & Streaming | 2/2 | Complete | 2026-02-09 |
| 4. Full-Page Chat UI | 2/2 | Complete | 2026-02-09 |
| 5. Dark Mode & Polish | 0/0 | Not started | - |
| 6. Embeddable Widget | 0/0 | Not started | - |
| 7. Embed Code Generator | 0/0 | Not started | - |
| 8. Analytics Dashboard | 0/0 | Not started | - |
| 9. Out-of-KB Handling | 0/0 | Not started | - |
| 10. Production Hardening | 0/0 | Not started | - |
