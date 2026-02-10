# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-08)

**Core value:** A prospect interacts with the demo and thinks "I want this, but for my business"
**Current focus:** Phase 9 in progress — Out-of-KB Handling

## Current Position

Phase: 9 of 10 (Out-of-KB Handling)
Plan: 2 of 2 in current phase
Status: Complete
Last activity: 2026-02-10 - Completed 09-02-PLAN.md (contact form UI and admin dashboard)

Progress: [████████████████████░] 100% (22 of 22 plans)

## Performance Metrics

### Velocity

- Total plans completed: 20
- Average duration: 6.8 min
- Total execution time: 2.58 hours

### By Phase

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-database-rag-foundation | 4/4 | 37min | 9.3min |
| 02-admin-panel-content-upload | 4/4 | 57min | 14.3min |
| 03-chat-api-streaming | 2/2 | 11min | 5.5min |
| 04-full-page-chat-ui | 2/2 | 18min | 9.0min |
| 05-dark-mode-polish | 2/2 | 17min | 8.5min |
| 06-embeddable-widget | 3/3 | 12min | 4.0min |
| 07-embed-code-generator | 2/2 | 8min | 4.0min |
| 08-analytics-dashboard | 2/2 | TBD | TBD |
| 09-out-of-kb-handling | 2/2 | 20min | 10.0min |

### Recent Trend

- Last 5 plans: 08-01, 08-02, 09-01 (5min), 09-02 (15min)
- Trend: Phase 9 complete - out-of-KB handling with contact form and admin dashboard.

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- FlowBoard (PM SaaS) as demo business - Broad appeal, rich FAQ content, relatable to most Upwork clients
- Script tag + iframe for widget - Matches Intercom UX, works on any site, simpler than npm package
- Inline contact form for out-of-KB - Shows lead capture value, builds trust by not hallucinating
- Dark mode as must-have - "Feels premium" polish bar, signals attention to detail
- HNSW index with vector_ip_ops for normalized embeddings - Faster than IVFFlat for read-heavy RAG (01-01)
- Enriched chunks with metadata (title, heading, position) - Better citation and context (01-01)
- FAQ sections preserved as individual Q&A chunks - Maintains semantic coherence (01-01)
- Section headings prepended to chunk content - Improves embedding context and retrieval (01-01)
- FlowBoard context: Founded 2021, Free/Pro/Enterprise tiers - Internally consistent across all docs (01-02)
- Lazy-loaded OpenAI client via Proxy pattern - Enables dry-run without credentials (01-03)
- Relative imports in scripts/ (not @/ aliases) - tsx doesn't reliably resolve tsconfig paths (01-03)
- Supabase env vars renamed to PUBLISHABLE_KEY/SECRET_KEY - New Supabase convention (01-04)
- Quality gate thresholds: precision@5 >= 0.7, recall@20 >= 0.8 (01-04)
- Data Access Layer auth pattern: session verified in Server Components + Server Actions, not just middleware (02-01)
- Lazy getSessionOptions() instead of module-level constant for iron-session config (02-01)
- serverActions config under experimental key for Next.js 15.5.x (02-01)
- FAQ-style docs use ### sub-headings for chunker FAQ detection (02-02)
- 18 total FlowBoard docs covering all knowledge base categories (02-02)
- Sequential file upload to avoid overwhelming OpenAI embedding API (02-03)
- Orphan cleanup: delete document if embedding fails after insert (02-03)
- Server Component + Client wrapper pattern for pages needing SSR data + interactivity (02-03)
- 223 chunks from 18 documents confirms appropriate chunking granularity (02-04)
- Flo personality with strict KB grounding in system prompt - Friendly but won't hallucinate (03-01)
- 120K token input budget (8K reserve from 128K context) - Ensures room for output + safety (03-01)
- Last 10 messages for conversation history - 5 user + 5 assistant pairs max (03-01)
- Atomic message persistence (user + assistant in single insert) - Cleaner transactions (03-01)
- gpt-4.1-mini model for chat (gpt-4o-mini retiring Feb 13) - Future-proof model choice (03-02)
- toUIMessageStreamResponse for streaming - AI SDK v6 standard response method (03-02)
- Citation sources limited to top 2 chunks - Balance between usefulness and response size (03-02)
- Conversation creation before streaming - Prevents race conditions in fire-and-forget persistence (03-02)
- Fire-and-forget persistence pattern - onFinish callback doesn't block stream, logs errors only (03-02)
- Custom headers for metadata (X-Conversation-Id, X-Sources) - Simple metadata transport without data stream complexity (03-02)
- AI SDK v6 uses Chat + DefaultChatTransport pattern - useChat accepts {chat: Chat} not direct API config (04-01)
- UIMessage has parts array not content string - Created getMessageText helper to extract text (04-01)
- sendMessage expects {text: string} format - Not {role, content} structure (04-01)
- IntersectionObserver-based auto-scroll - Only scrolls when user at bottom, respects manual scrolling (04-01)
- Message limit warning at 30 messages - Prevents hitting 50-message API cap with buffer (04-01)
- Citation sources with expandable UI - Collapsed by default, shows title/heading/snippet/similarity (04-01)
- Bot identity in header (Flo name + avatar) - Consistent branding across UI (04-01)
- [Phase 04-02]: Landing page as Server Component for SEO optimization without client interactivity
- [Phase 04-02]: Zero-friction CTA positioning - direct /chat link with no signup gates
- API route must handle both {content} and {parts} message formats for AI SDK v6 compatibility (04-02 fix)
- Chat instance (useMemo) must NOT depend on state that changes mid-stream — use useRef for conversationId (04-02 fix)
- Tailwind v4 @custom-variant for dark mode with data-theme attribute - Cleaner SSR/hydration than class strategy (05-01)
- Theme transitions via scoped .theme-transition utility - Prevents overriding component-specific transitions (05-01)
- Fixed top-right ThemeToggle on landing page - Non-intrusive, accessible, follows standard UX patterns (05-01)
- Body bg-white/dark:bg-gray-900 prevents FOUC flash on initial paint (05-02 fix)
- Motion fade-in y:12 300ms easeOut for message bubbles - Subtle premium feel (05-02)
- Scale micro-interactions only on primary CTAs (1.02x/0.98x) - Polish without being gimmicky (05-02)
- Global prefers-reduced-motion override with !important - Ensures no animation leaks for accessibility (05-02)
- Widget mode prop for ChatWindow (hides header, h-full container) - Dual-context component pattern (06-01)
- postMessage protocol with origin validation - iframe→parent uses '*', parent→iframe validates origin (06-01)
- ResizeObserver on document.body for iframe height tracking - Enables dynamic iframe sizing (06-01)
- Widget layout does NOT duplicate ThemeProvider - Root layout already wraps /widget route (06-01)
- [Phase 06-02]: Vanilla TypeScript IIFE for widget loader (no React/Next.js deps) ensures max compatibility — Works on any website, 2.9KB bundle size
- [Phase 06-02]: Inline styles only (no CSS classes) to prevent host page style conflicts — Object.assign pattern with ai-chat-widget-* prefixed IDs
- [Phase 06-03]: Route-specific permissive headers (X-Frame-Options ALLOWALL, CSP frame-ancestors *, CORS *) only on /widget and /widget.js — Rest of app keeps restrictive security headers
- [Phase 06-03]: Console Ninja dev tool interference with widget.js documented as local-only issue (production builds unaffected)
- [Phase 07-01]: Hand-rolled HTML tokenizer for syntax highlighting — Keeps bundle small, dark background fixed (not theme-dependent)
- [Phase 07-01]: useId for form element IDs — Ensures accessibility when component used multiple times
- [Phase 07-01]: postMessage config updates to iframe widget — BrowserPreview sends config on load and state changes
- [Phase 07-embed-code-generator]: CONFIG_UPDATE handler updates theme only (position/greeting are loader concerns, not iframe concerns)
- [Phase 08-01]: Recharts instead of Tremor — Tremor incompatible with Tailwind CSS v4
- [Phase 08-01]: answered_from_kb boolean on messages tracks RAG accuracy (defaults true for existing data)
- [Phase 08-01]: Count queries for accuracy metrics — efficient, no row content transfer
- [Phase 08-01]: 111 conversations, 648 messages seeded over 30 days for chart testing
- [Phase 08-02]: Recharts AreaChart for volume, PieChart donut for accuracy — SVG-based, dark mode compatible
- [Phase 08-02]: Supabase Realtime graceful degradation — counters work without Realtime enabled, refresh fallback
- [Phase 08-02]: AccuracyMetrics interface must match API response shape exactly (bug fix: total→totalMessages, percentage→kbPercentage)
- [Phase 09-01]: createUIMessageStream with text-delta + data-contact-form parts for low-confidence responses (AI SDK v6 pattern)
- [Phase 09-01]: Confidence threshold 0.7 (consistent with existing RAG threshold and answered_from_kb logic)
- [Phase 09-01]: contact_submissions table with status workflow (pending/contacted/resolved) for admin tracking
- [Phase 09-02]: ContactForm uses useId for accessible form input IDs (Phase 07 embed generator pattern)
- [Phase 09-02]: contactFormMap state pattern (same as sourcesMap) for persisting form data across renders
- [Phase 09-02]: Status badges with semantic color coding (amber=pending, blue=contacted, green=resolved)
- [Phase 09-02]: Responsive ContactsTable with desktop table and mobile card layouts
- [Phase 09-02]: Amber/warm tones for contact form signals "needs attention" without alarm

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-10T21:31:38Z
Stopped at: Completed 09-02-PLAN.md (contact form UI and admin dashboard)
Resume file: None
