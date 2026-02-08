# Phase 3: Chat API & Streaming - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>

## Phase Boundary

API endpoint that streams RAG-grounded responses and persists conversation history. Users send messages via POST /api/chat and receive token-by-token streaming responses with source citations. Conversations are saved to Supabase for analytics. Chat UI is Phase 4 — this phase delivers the API and streaming infrastructure.

</domain>

<decisions>

## Implementation Decisions

### Response & citation format

- Expandable source cards below each bot message (not inline numbered refs)
- Each card shows document title + relevant chunk snippet
- Show 1-2 most relevant sources per response (not all retrieved chunks)
- Source cards appear after streaming completes (text streams first, then cards fade in)

### Streaming behavior

- Token-by-token streaming granularity (ChatGPT-style typewriter effect)
- Use Vercel AI SDK (streamText/useChat) for streaming infrastructure
- On mid-stream error: keep partial text, show error message + "Retry" button
- Stop button available during streaming — aborts generation, keeps partial text

### Conversation persistence

- Per-page-load scope — each page visit starts a fresh conversation (no session cookies or localStorage)
- All conversations saved to Supabase (even though not reloaded client-side) — needed for Phase 8 analytics
- Conversation row created on first user message (not on page load) — no empty records in DB
- Cap at ~50 messages per conversation — after limit, show "Start a new conversation"

### System prompt & personality

- Friendly & professional tone — warm but competent, like a helpful support agent
- Named bot with role: "Hi! I'm Flo, FlowBoard's AI support assistant. How can I help?"
- Strict KB grounding — only answer from retrieved chunks, never make up information
- Include last 10 messages (5 user + 5 assistant) as conversation context per LLM call

### Claude's Discretion

- Exact system prompt wording (beyond the decisions above)
- Token limit per response
- Similarity threshold for "no relevant chunks found"
- Database write timing (fire-and-forget vs await)

</decisions>

<specifics>

## Specific Ideas

- Bot name is "Flo" (FlowBoard assistant)
- Source cards should feel like documentation references, not raw database dumps
- Retry button on error should re-send the same user message, not require retyping
- Stop button implies the API needs an abort signal mechanism

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-chat-api-streaming*
*Context gathered: 2026-02-08*
