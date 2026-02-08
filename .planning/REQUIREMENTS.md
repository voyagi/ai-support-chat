# Requirements: AI Support Chat

**Defined:** 2026-02-08
**Core Value:** A prospect interacts with the demo and thinks "I want this, but for my business"

## v1 Requirements

### RAG Pipeline

- [x] **RAG-01**: User query is embedded and matched against document chunks via pgvector similarity search
- [x] **RAG-02**: Documents are split into ~500 token chunks with overlap during upload
- [x] **RAG-03**: Each chunk is embedded via OpenAI text-embedding-3-small and stored with vector
- [x] **RAG-04**: Top 3-5 relevant chunks are injected as context into the GPT prompt
- [ ] **RAG-05**: Bot responses cite which document(s) the answer came from
- [ ] **RAG-06**: Low-confidence answers trigger inline contact form instead of hallucinated response

### Chat Interface

- [ ] **CHAT-01**: User can send messages and receive streaming responses (token-by-token)
- [ ] **CHAT-02**: Conversation history persists in Supabase across page refreshes
- [ ] **CHAT-03**: Bot has clear identity (avatar, name, "AI assistant" disclaimer)
- [ ] **CHAT-04**: Chat shows loading states (typing indicator, skeleton loading, smooth transitions)
- [ ] **CHAT-05**: Full-page chat UI at /chat route with conversation thread

### Embeddable Widget

- [ ] **WIDG-01**: Floating bubble trigger in bottom-right corner (Intercom-style)
- [ ] **WIDG-02**: Widget embeds via script tag that injects an iframe
- [ ] **WIDG-03**: Widget is mobile-first: full-screen on phones, touch-optimized
- [ ] **WIDG-04**: Widget loads asynchronously without blocking host page
- [ ] **WIDG-05**: Widget communicates with parent page via postMessage API

### Admin Panel

- [ ] **ADMN-01**: Admin panel is protected by a simple shared password
- [ ] **ADMN-02**: Admin can upload text documents to the knowledge base
- [ ] **ADMN-03**: Admin can view list of all uploaded documents
- [ ] **ADMN-04**: Admin can delete documents (cascades to chunks)
- [ ] **ADMN-05**: Admin can toggle "try it yourself" mode for prospect doc uploads
- [ ] **ADMN-06**: Admin can copy embed code snippet (script tag with syntax highlighting)

### Analytics

- [ ] **ANLY-01**: Dashboard shows chat volume (total conversations, messages per day/week)
- [ ] **ANLY-02**: Dashboard shows common questions (most asked topics)
- [ ] **ANLY-03**: Dashboard shows response accuracy (% answered from KB vs fallback)

### Landing Page & Polish

- [ ] **LAND-01**: Landing page provides zero-friction demo entry (no signup, instant chat access)
- [ ] **LAND-02**: Dark mode with light/dark toggle and system preference detection
- [ ] **LAND-03**: Animations and transitions on state changes, message appearances, page loads
- [ ] **LAND-04**: Responsive design across desktop, tablet, and mobile
- [ ] **LAND-05**: 15-20 realistic FlowBoard demo documents pre-loaded in knowledge base

### Deployment

- [ ] **DEPL-01**: App deployed to Vercel with live URL for Upwork profile
- [ ] **DEPL-02**: Environment variables configured for production (OpenAI, Supabase keys)

## v2 Requirements

### Widget Customization

- **WIDG-06**: Widget supports color/brand customization with live preview
- **WIDG-07**: Multiple theme presets for different brand styles

### Content Processing

- **RAG-07**: PDF document upload with text extraction
- **RAG-08**: URL import (scrape and chunk a web page)

### Feedback & Analytics

- **ANLY-04**: "Was this helpful?" thumbs up/down on bot responses
- **ANLY-05**: Sentiment analysis on conversations
- **ANLY-06**: Export conversations as CSV/JSON

### Multi-tenancy

- **MULT-01**: Multiple knowledge bases (different bots per business)
- **MULT-02**: Per-tenant API keys and usage tracking

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real authentication (OAuth, email/password) | Demo project — password gate is sufficient, no user management overhead |
| Real-time typing indicators | Streaming responses provide enough "live" feeling — WebSocket complexity not justified |
| Rate limiting | Demo with low traffic — premature optimization |
| npm package for widget | Script tag + iframe reaches broader audience (WordPress, Shopify, no-code sites) |
| Voice input | Adds permissions UX, mic detection, transcription costs — novelty over utility |
| Conversation branching / decision trees | Defeats RAG value prop of natural conversation |
| GDPR consent banners | Demo doesn't store PII beyond admin contact form |
| A/B testing | No traffic to split-test in demo |
| Mobile native app | Web-first, responsive design covers mobile |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RAG-01 | Phase 1 | Complete |
| RAG-02 | Phase 1 | Complete |
| RAG-03 | Phase 1 | Complete |
| RAG-04 | Phase 1 | Complete |
| RAG-05 | Phase 3 | Pending |
| RAG-06 | Phase 9 | Pending |
| CHAT-01 | Phase 3 | Pending |
| CHAT-02 | Phase 3 | Pending |
| CHAT-03 | Phase 4 | Pending |
| CHAT-04 | Phase 4 | Pending |
| CHAT-05 | Phase 4 | Pending |
| WIDG-01 | Phase 6 | Pending |
| WIDG-02 | Phase 6 | Pending |
| WIDG-03 | Phase 6 | Pending |
| WIDG-04 | Phase 6 | Pending |
| WIDG-05 | Phase 6 | Pending |
| ADMN-01 | Phase 2 | Pending |
| ADMN-02 | Phase 2 | Pending |
| ADMN-03 | Phase 2 | Pending |
| ADMN-04 | Phase 2 | Pending |
| ADMN-05 | Phase 10 | Pending |
| ADMN-06 | Phase 7 | Pending |
| ANLY-01 | Phase 8 | Pending |
| ANLY-02 | Phase 8 | Pending |
| ANLY-03 | Phase 8 | Pending |
| LAND-01 | Phase 4 | Pending |
| LAND-02 | Phase 5 | Pending |
| LAND-03 | Phase 5 | Pending |
| LAND-04 | Phase 4 | Pending |
| LAND-05 | Phase 2 | Pending |
| DEPL-01 | Phase 10 | Pending |
| DEPL-02 | Phase 10 | Pending |

**Coverage:**

- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-02-08*
*Last updated: 2026-02-08 after Phase 1 completion*
