---
phase: 03-chat-api-streaming
plan: 02
subsystem: chat-api
tags: [ai, streaming, rag, persistence, api]

dependency_graph:
  requires:
    - 03-01 (chat infrastructure modules)
    - 01-02 (similarity search)
    - 01-04 (Supabase server client)
  provides:
    - POST /api/chat streaming endpoint with full RAG pipeline
    - Citation metadata in response headers
    - Conversation persistence with message cap enforcement
  affects:
    - Phase 04 (chat UI will consume this API)
    - Phase 05 (widget will use this endpoint)

tech_stack:
  added:
    - @ai-sdk/openai package for OpenAI provider
  patterns:
    - Vercel AI SDK v6 streamText with toUIMessageStreamResponse
    - Fire-and-forget persistence in onFinish callback
    - Custom headers for conversationId and citation sources
    - Type-safe message casting for AI SDK compatibility

key_files:
  created:
    - src/app/api/chat/route.ts (134 lines)
  modified:
    - package.json (added @ai-sdk/openai dependency)
    - package-lock.json

decisions:
  - gpt-4.1-mini model used (gpt-4o-mini retiring Feb 13)
  - toUIMessageStreamResponse for streaming (AI SDK v6 standard)
  - Citation sources limited to top 2 chunks for response headers
  - maxOutputTokens: 1024, temperature: 0.7 for balanced responses
  - Conversation creation happens BEFORE streaming to prevent race conditions
  - Fire-and-forget persistence pattern (no await on saveMessages)
  - Custom headers for metadata (X-Conversation-Id, X-Sources)

metrics:
  duration: 7 minutes
  completed: 2026-02-09
  tasks_completed: 2
  files_created: 1
  commits: 1
---

# Phase 3 Plan 02: Streaming Chat API Summary

**Created the POST /api/chat endpoint that wires together RAG retrieval, Vercel AI SDK streaming, source citations, conversation persistence, abort signal support, and comprehensive error handling.**

## What Was Built

Implemented a fully functional streaming chat API route at `src/app/api/chat/route.ts` that:

1. Validates incoming chat requests (messages array, last message is user)
2. Enforces 50-message conversation cap
3. Creates new conversations or reuses existing ones (BEFORE streaming)
4. Performs RAG similarity search to retrieve relevant KB chunks
5. Builds system prompt with Flo personality and RAG context
6. Manages token budget for conversation history
7. Streams responses token-by-token using Vercel AI SDK
8. Persists conversations to Supabase via fire-and-forget
9. Returns citation sources in response headers
10. Supports abort signal for stop button functionality

## Implementation Details

### Request Flow

**Request body:**
```typescript
{
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  conversationId: string | null;
}
```

**Response:**
- Streaming response using AI SDK's `toUIMessageStreamResponse()`
- Custom headers:
  - `X-Conversation-Id`: UUID of the conversation
  - `X-Sources`: JSON array of top 2 citation sources

### Key Components Integration

**1. Input Validation (lines 30-43)**
- Validates messages array is non-empty
- Ensures last message has role 'user'
- Returns 400 with descriptive error if invalid

**2. Message Cap Enforcement (lines 46-57)**
- Checks message count via `getMessageCount(conversationId)`
- Returns 400 if >= 50 messages: "Conversation limit reached. Please start a new conversation."

**3. Conversation Creation (lines 59-61)**
- Creates conversation BEFORE streaming (critical for race condition prevention)
- Reuses existing conversationId if provided
- Ensures conversationId exists for persistence callback

**4. RAG Retrieval (lines 64-79)**
- Calls `searchSimilarChunks(userMessage, { threshold: 0.7, count: 5 })`
- Selects top 2 chunks for citation sources (title, heading, snippet, similarity)
- Formats all 5 chunks for RAG context injection

**5. Token Budget Management (lines 81-92)**
- Counts system prompt tokens and RAG context tokens
- Calculates available budget (120K - system - RAG)
- Selects last 10 messages within budget via `selectHistoryMessages`
- Casts messages to AI SDK compatible format

**6. Streaming with Vercel AI SDK (lines 94-112)**
```typescript
const result = streamText({
  model: openaiProvider("gpt-4.1-mini"),
  system: systemPrompt,
  messages: coreMessages,
  abortSignal: req.signal,
  maxOutputTokens: 1024,
  temperature: 0.7,
  onFinish: async ({ text }) => {
    saveMessages(conversationId, userMessage, text).catch(...);
  },
});
```

**7. Fire-and-Forget Persistence (lines 107-111)**
- `saveMessages()` called in `onFinish` callback
- Wrapped in `.catch()` to prevent stream interruption on DB errors
- Logs errors but doesn't throw (fire-and-forget pattern)

**8. Response with Metadata (lines 114-124)**
- Uses `toUIMessageStreamResponse({ headers })` for proper AI SDK v6 streaming
- Includes conversationId and citation sources in custom headers
- Headers accessible to frontend for displaying sources

### Error Handling

**Pre-stream errors (try/catch wrapper):**
- RAG search failures
- Database connection issues
- Invalid input
- Returns 500 JSON: `{ error: "Failed to generate response. Please try again." }`

**Mid-stream errors:**
- Handled automatically by Vercel AI SDK
- Sends error SSE event to client
- Partial text is preserved

## Verification Results

All verification steps passed:

- ✓ `npm run build` - TypeScript compilation successful, no errors
- ✓ `npm run check` - Biome linting and formatting passed
- ✓ Route exports POST function
- ✓ All imports from dependencies resolve correctly:
  - `streamText` from `ai`
  - `createOpenAI` from `@ai-sdk/openai`
  - `searchSimilarChunks` from similarity-search module
  - `buildSystemPrompt` from prompt module
  - `formatRagContext`, `selectHistoryMessages`, `calculateAvailableBudget` from context-builder
  - `createConversation`, `saveMessages`, `getMessageCount`, `MAX_MESSAGES_PER_CONVERSATION` from conversation module
  - `countTokens` from token-counter module
- ✓ gpt-4.1-mini model string used (not retiring gpt-4o-mini)
- ✓ `abortSignal: req.signal` present for stop button support
- ✓ Conversation created BEFORE streaming starts (race condition prevented)
- ✓ Fire-and-forget pattern confirmed (no await on saveMessages)
- ✓ Citation sources returned via X-Sources header
- ✓ 50-message cap enforced via getMessageCount check
- ✓ No hardcoded API keys (uses process.env.OPENAI_API_KEY)

### API Contract Verification (Code Inspection)

- ✓ Empty messages array → 400 error
- ✓ Last message not user role → 400 error
- ✓ Conversation limit exceeded (>= 50 messages) → 400 error with "start new conversation" message
- ✓ No conversationId provided → creates new conversation before streaming
- ✓ Valid request → streams response with X-Conversation-Id and X-Sources headers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Missing Dependency] Added @ai-sdk/openai package**
- **Found during:** Task 1 implementation
- **Issue:** Plan specified using `createOpenAI` from `@ai-sdk/openai`, but package was not installed
- **Fix:** Ran `npm install @ai-sdk/openai` to add the provider package
- **Files modified:** package.json, package-lock.json
- **Commit:** Included in main feature commit (75b9611)

**2. [Rule 1 - Type Incompatibility] Fixed AI SDK message type compatibility**
- **Found during:** Task 1 TypeScript build
- **Issue:** AI SDK expects specific message types, our simple object didn't match
- **Fix:** Added type casting for messages: `role: msg.role as "user" | "assistant"`
- **Files modified:** src/app/api/chat/route.ts (lines 89-92)
- **Commit:** Included in main feature commit (75b9611)

**3. [Rule 1 - Incorrect Property Name] Changed maxTokens to maxOutputTokens**
- **Found during:** Task 1 TypeScript build
- **Issue:** AI SDK v6 uses `maxOutputTokens`, not `maxTokens`
- **Fix:** Updated property name in streamText config
- **Files modified:** src/app/api/chat/route.ts (line 104)
- **Commit:** Included in main feature commit (75b9611)

**4. [Rule 1 - Incorrect Method Name] Changed toDataStreamResponse to toUIMessageStreamResponse**
- **Found during:** Task 1 TypeScript build
- **Issue:** Plan referenced outdated method name; AI SDK v6 uses `toUIMessageStreamResponse`
- **Fix:** Updated to use correct method with headers parameter
- **Files modified:** src/app/api/chat/route.ts (lines 114-124)
- **Commit:** Included in main feature commit (75b9611)

## Dependencies Installed

- **@ai-sdk/openai** - OpenAI provider for Vercel AI SDK (1 package, 0 vulnerabilities)

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| 75b9611 | feat(03-02): create streaming chat API with RAG, citations, and persistence | package.json, package-lock.json, src/app/api/chat/route.ts |

## Self-Check: PASSED

All files created and verified:

```bash
✓ FOUND: src/app/api/chat/route.ts
✓ FOUND: node_modules/@ai-sdk/openai/package.json
```

All commits exist:

```bash
✓ FOUND: 75b9611
```

Export verification:

```bash
✓ POST function exported from route.ts
```

Build verification:

```bash
✓ npm run build exits 0
✓ npm run check exits 0
✓ No TypeScript errors
```

## Next Steps

Ready for Phase 04: Build the chat UI components that will consume this API:

1. Create ChatWindow component with message display
2. Implement streaming text rendering
3. Add source citation display
4. Integrate abort controller for stop button
5. Handle conversation persistence via conversationId header
