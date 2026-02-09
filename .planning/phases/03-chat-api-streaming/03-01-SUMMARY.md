---
phase: 03-chat-api-streaming
plan: 01
subsystem: chat-infrastructure
tags: [ai, rag, conversation, streaming-prep]

dependency_graph:
  requires:
    - 01-01 (embeddings token counter)
    - 01-02 (similarity search)
    - 01-04 (Supabase server client)
  provides:
    - System prompt builder with RAG context injection
    - Conversation history manager with token budgeting
    - Conversation persistence helpers (create/save/count)
  affects:
    - 03-02 (streaming chat API endpoint will consume these modules)

tech_stack:
  added:
    - Vercel AI SDK (ai@^6.x) for streaming infrastructure
  patterns:
    - Strict knowledge base grounding in system prompt
    - Token budget management with gpt-tokenizer
    - Atomic message persistence (user + assistant in single insert)

key_files:
  created:
    - src/lib/chat/prompt.ts (125 lines)
    - src/lib/chat/context-builder.ts (93 lines)
    - src/lib/chat/conversation.ts (91 lines)
  modified:
    - package.json (added ai dependency)

decisions:
  - System prompt enforces strict KB grounding with Flo personality
  - RAG context formatted with document title and section heading
  - Conversation history limited to last 10 messages (5 pairs)
  - Token budget management reserves 8K from 128K context window
  - Message cap of 50 per conversation enforced via exported constant
  - All Supabase operations use service role client (server-side)

metrics:
  duration: 4 minutes
  completed: 2026-02-09
  tasks_completed: 2
  files_created: 3
  commits: 2
---

# Phase 3 Plan 01: Chat Infrastructure Modules Summary

**Built the foundational modules for the streaming chat API: system prompt builder, conversation history manager with token budgeting, and Supabase conversation persistence helpers.**

## What Was Built

Created three core infrastructure modules in `src/lib/chat/`:

1. **prompt.ts**: System prompt builder with Flo personality and strict KB grounding rules
2. **context-builder.ts**: RAG context formatter and conversation history selector with token budget management
3. **conversation.ts**: Supabase persistence helpers for creating conversations and saving messages

These modules are the building blocks for the streaming chat API endpoint (Plan 03-02).

## Implementation Details

### System Prompt (prompt.ts)

**buildSystemPrompt(ragContext: string): string**

- Bot identity: "You are Flo, FlowBoard's AI support assistant"
- Friendly and professional tone with concise responses (2-3 paragraphs max)
- Strict KB grounding rules:
  - "ONLY use information from the Context section below"
  - "Never make up features, pricing, or details"
  - "Never use your general knowledge about project management software"
  - If context doesn't contain relevant info, direct users to support@flowboard.io
- Injected RAG context under "## Context (Knowledge Base)" section

### Context Builder (context-builder.ts)

**formatRagContext(chunks: SimilarChunk[]): string**

- Formats each chunk with: `[{documentTitle} - {sectionHeading}]`
- Joins chunks with `\n\n---\n\n` separator
- Returns readable context string for system prompt injection

**selectHistoryMessages(messages, budgetTokens): Message[]**

- Takes last 10 messages (5 user + 5 assistant pairs) per locked decision
- Calculates total token count using gpt-tokenizer (o200k_base encoding)
- If over budget, drops oldest messages until within budget (keeps minimum 2)
- Logs warnings when truncation occurs
- Returns selected messages for LLM context

**calculateAvailableBudget(systemPromptTokens, ragContextTokens): number**

- MAX_INPUT_TOKENS = 120,000 (reserves 8K from 128K context window)
- Subtracts system prompt and RAG context tokens
- Returns remaining budget for conversation history

### Conversation Persistence (conversation.ts)

**createConversation(): Promise<string>**

- Inserts new row into `conversations` table
- Returns conversation UUID
- Throws descriptive error on failure

**saveMessages(conversationId, userContent, assistantContent): Promise<void>**

- Inserts both user and assistant messages atomically (single insert call)
- Uses service role client for server-side access
- Throws descriptive error including Supabase error message

**getMessageCount(conversationId): Promise<number>**

- Queries message count for a conversation
- Used to enforce 50-message cap (MAX_MESSAGES_PER_CONVERSATION)
- Returns 0 if conversationId is null/undefined

## Verification Results

All verification steps passed:

- ✓ `npm run check` - Biome linting and formatting passed (no issues)
- ✓ `npm run build` - TypeScript compilation successful
- ✓ All three files exist in `src/lib/chat/`
- ✓ Vercel AI SDK `ai` installed in `node_modules/`
- ✓ All required functions and constants exported
- ✓ No hardcoded secrets or API keys

## Deviations from Plan

None - plan executed exactly as written.

## Dependencies Installed

- **ai@^6.x** (Vercel AI SDK) - 10 packages added, no vulnerabilities

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| b6bf26c | feat(03-01): add chat infrastructure modules with Vercel AI SDK | package.json, package-lock.json, src/lib/chat/prompt.ts, src/lib/chat/context-builder.ts |
| dcc7e3a | feat(03-01): add conversation persistence helpers | src/lib/chat/conversation.ts |

## Self-Check: PASSED

All files created and verified:

```bash
✓ FOUND: src/lib/chat/prompt.ts
✓ FOUND: src/lib/chat/context-builder.ts
✓ FOUND: src/lib/chat/conversation.ts
✓ FOUND: node_modules/ai/package.json
```

All commits exist:

```bash
✓ FOUND: b6bf26c
✓ FOUND: dcc7e3a
```

All exports verified:

```bash
✓ buildSystemPrompt exported from prompt.ts
✓ formatRagContext exported from context-builder.ts
✓ selectHistoryMessages exported from context-builder.ts
✓ calculateAvailableBudget exported from context-builder.ts
✓ MAX_INPUT_TOKENS exported from context-builder.ts
✓ createConversation exported from conversation.ts
✓ saveMessages exported from conversation.ts
✓ getMessageCount exported from conversation.ts
✓ MAX_MESSAGES_PER_CONVERSATION exported from conversation.ts
```

## Next Steps

Ready for Plan 03-02: Create the streaming chat API endpoint (`/api/chat`) that uses these infrastructure modules to:

1. Accept user messages
2. Search for relevant KB chunks via similarity search
3. Build system prompt with RAG context
4. Select conversation history within token budget
5. Stream LLM response using Vercel AI SDK
6. Persist messages to Supabase
7. Enforce 50-message conversation cap
