# Phase 3: Chat API & Streaming - Research

**Researched:** 2026-02-09
**Domain:** Streaming chat API with RAG integration, conversation persistence
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Response & citation format:**
- Expandable source cards below each bot message (not inline numbered refs)
- Each card shows document title + relevant chunk snippet
- Show 1-2 most relevant sources per response (not all retrieved chunks)
- Source cards appear after streaming completes (text streams first, then cards fade in)

**Streaming behavior:**
- Token-by-token streaming granularity (ChatGPT-style typewriter effect)
- Use Vercel AI SDK (streamText/useChat) for streaming infrastructure
- On mid-stream error: keep partial text, show error message + "Retry" button
- Stop button available during streaming — aborts generation, keeps partial text

**Conversation persistence:**
- Per-page-load scope — each page visit starts a fresh conversation (no session cookies or localStorage)
- All conversations saved to Supabase (even though not reloaded client-side) — needed for Phase 8 analytics
- Conversation row created on first user message (not on page load) — no empty records in DB
- Cap at ~50 messages per conversation — after limit, show "Start a new conversation"

**System prompt & personality:**
- Friendly & professional tone — warm but competent, like a helpful support agent
- Named bot with role: "Hi! I'm Flo, FlowBoard's AI support assistant. How can I help?"
- Strict KB grounding — only answer from retrieved chunks, never make up information
- Include last 10 messages (5 user + 5 assistant) as conversation context per LLM call

### Claude's Discretion

- Exact system prompt wording (beyond the decisions above)
- Token limit per response
- Similarity threshold for "no relevant chunks found"
- Database write timing (fire-and-forget vs await)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

## Summary

Phase 3 implements a streaming chat API endpoint that retrieves relevant knowledge base chunks via RAG, generates contextual responses with GPT-4o-mini (note: GPT-4o-mini is being retired Feb 13, 2026 — will need to migrate to GPT-4.1-mini or gpt-4o), and persists conversations for analytics. The core technical domains are: Vercel AI SDK streaming infrastructure, abort controller integration for stop functionality, RAG context injection, conversation history management, and error recovery patterns.

**Key findings:**
- Vercel AI SDK's `streamText` + `toUIMessageStreamResponse` handle streaming with minimal boilerplate
- Abort signals work via `abortSignal` parameter passed from client request — but NOT compatible with stream resumption
- `onFinish` callback receives full message array for database persistence (fire-and-forget recommended)
- System prompts must explicitly enforce "only use provided context" — models hallucinate without strict grounding instructions
- Error handling in streaming is fragile: errors after stream starts (200 OK sent) arrive as SSE events, not HTTP errors
- Token-by-token streaming is default behavior — no configuration needed
- GPT-4o-mini: 128K context window, 4K max output tokens (but model being retired — check replacement limits)

**Primary recommendation:** Use Vercel AI SDK `streamText` with OpenAI provider, inject RAG chunks + conversation history into messages array, implement `onFinish` for async database writes, and use `abortSignal` for stop button (forgo resumable streams). Source citations: return metadata array alongside response text, render as expandable cards client-side after stream completes.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai (Vercel AI SDK) | ^6.0.77 | Streaming infrastructure | Provider-agnostic, handles SSE/abort/errors, `useChat` hook for React, `streamText` API for server. Industry standard for Next.js AI apps. |
| openai | ^5.1.0 (already installed) | OpenAI provider for AI SDK | Official client, works seamlessly with Vercel AI SDK, streaming support built-in |
| @supabase/supabase-js | ^2.49.4 (already installed) | Database client for persistence | Official client, handles async inserts for conversation/message records |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| gpt-tokenizer | ^3.4.0 (already installed) | Token counting for context window management | Calculate total tokens in system prompt + RAG chunks + history to stay under 128K input limit |
| zod | ^3.x (optional) | Runtime validation for API payloads | Validate client requests (message text, conversationId) before processing |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vercel AI SDK (ai) | OpenAI SDK directly with manual SSE handling | Raw OpenAI SDK requires manual stream parsing, error handling, and state management. AI SDK abstracts all this. Use raw SDK only if need fine-grained control over stream chunks. |
| streamText | createStreamDataTransformer (lower-level) | streamText is higher-level, handles message array format, tools, errors automatically. Only use lower-level APIs for custom streaming protocols. |
| onFinish callback | Await database insert in stream | Awaiting database writes blocks stream completion — client sees delay. Fire-and-forget (async insert without await) is faster, but risks silent failures. Recommended: fire-and-forget with separate error monitoring. |

**Installation:**

```bash
npm install ai       # Vercel AI SDK for streaming
npm install zod      # Optional: request validation
```

**Already installed** (from Phase 1-2):
- openai@^5.1.0
- @supabase/supabase-js@^2.49.4
- @supabase/ssr@^0.6.1
- gpt-tokenizer@^3.4.0

## Architecture Patterns

### Recommended Project Structure

```
src/
  app/
    api/
      chat/
        route.ts              # POST: streaming chat endpoint
  lib/
    chat/
      prompt.ts               # System prompt builder
      context-builder.ts      # RAG chunk formatting + history management
      conversation.ts         # Conversation/message persistence helpers
    rag/
      similarity-search.ts    # Already exists from Phase 1
```

### Pattern 1: Streaming Chat Endpoint with Vercel AI SDK

**What:** API route that streams GPT responses using `streamText` and returns UIMessageStreamResponse

**When to use:** All streaming chat implementations in Next.js App Router (standard pattern)

**Example:**

```typescript
// app/api/chat/route.ts
import { streamText, createOpenAI } from 'ai'
import { searchSimilarChunks } from '@/lib/rag/similarity-search'
import { buildSystemPrompt } from '@/lib/chat/prompt'
import { saveConversation } from '@/lib/chat/conversation'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json()

  // Extract latest user message for RAG search
  const lastMessage = messages[messages.length - 1]

  // Retrieve relevant chunks
  const chunks = await searchSimilarChunks(lastMessage.content, {
    threshold: 0.7,
    count: 5,
  })

  // Select top 1-2 for citations (user decision)
  const citationSources = chunks.slice(0, 2)

  // Build context from chunks
  const ragContext = chunks
    .map(c => `[${c.documentTitle} - ${c.sectionHeading}]\n${c.content}`)
    .join('\n\n')

  // Inject system prompt with RAG context
  const systemPrompt = buildSystemPrompt(ragContext)

  // Keep last 10 messages (5 user + 5 assistant) for conversation history
  const conversationHistory = messages.slice(-10)

  // Stream response
  const result = streamText({
    model: openai('gpt-4o-mini'),  // Note: retiring Feb 13, 2026
    system: systemPrompt,
    messages: conversationHistory,
    abortSignal: req.signal,  // Enable stop button
    maxTokens: 1024,  // Limit response length
    temperature: 0.7,
    onFinish: async ({ text, usage }) => {
      // Fire-and-forget: save to database without blocking stream
      saveConversation(conversationId, messages, text, usage).catch(err => {
        console.error('Failed to persist conversation:', err)
        // Send to monitoring service (e.g., Sentry) in production
      })
    },
  })

  // Return UIMessageStreamResponse with citation metadata
  return result.toUIMessageStreamResponse({
    // Inject citation sources into response metadata
    metadata: {
      sources: citationSources.map(c => ({
        documentTitle: c.documentTitle,
        sectionHeading: c.sectionHeading,
        snippet: c.content.substring(0, 200), // First 200 chars
        similarity: c.similarity,
      })),
    },
  })
}
```

**Source:** [AI SDK Core: streamText](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text), [LogRocket: Real-time AI in Next.js](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/)

### Pattern 2: System Prompt with Strict KB Grounding

**What:** System prompt that explicitly instructs model to only use provided context, with bot personality and citation requirements

**When to use:** All RAG chat applications (prevents hallucination)

**Example:**

```typescript
// lib/chat/prompt.ts
export function buildSystemPrompt(ragContext: string): string {
  return `You are Flo, FlowBoard's AI support assistant. You are friendly, professional, and helpful.

## Your Role
Help users with questions about FlowBoard (a project management SaaS platform). Provide accurate, concise answers based on the knowledge base.

## Critical Rules
1. **ONLY use information from the Context section below.** Never make up features, pricing, or details.
2. If the Context doesn't contain relevant information, say: "I don't have that information in my knowledge base. You can contact FlowBoard support at support@flowboard.com for help."
3. Be conversational and warm, but never sacrifice accuracy for friendliness.
4. Keep answers concise (2-3 paragraphs max). If the topic is complex, offer to explain specific parts in more detail.

## Context (Knowledge Base)
${ragContext}

## Conversation Guidelines
- Greet users warmly on first message
- Ask clarifying questions if the user's request is vague
- Use bullet points for lists or step-by-step instructions
- End with "Is there anything else I can help with?" for closure

Remember: You represent FlowBoard. Accuracy is more important than being comprehensive.`
}
```

**Key insights:**
- Explicit "ONLY use provided context" prevents hallucination
- Provide fallback response for out-of-KB questions (contact support)
- Bot personality (Flo, friendly, professional) sets tone
- Conciseness instruction prevents long-winded responses

**Source:** [Prompt Engineering for RAG Pipelines (2026)](https://www.stack-ai.com/blog/prompt-engineering-for-rag-pipelines-the-complete-guide-to-prompt-engineering-for-retrieval-augmented-generation), [Building Production RAG Systems 2026](https://brlikhon.engineer/blog/building-production-rag-systems-in-2026-complete-architecture-guide)

### Pattern 3: Conversation History Management (Sliding Window)

**What:** Keep only last N messages in context to prevent token explosion, while persisting all messages to database

**When to use:** Multi-turn conversations (all chatbot applications)

**Example:**

```typescript
// lib/chat/context-builder.ts
import { Message } from 'ai'
import { countTokens } from 'gpt-tokenizer'

interface ContextBudget {
  maxTotal: number      // e.g., 100_000 tokens (reserve 28K for response)
  systemPrompt: number  // Measured after RAG injection
  ragContext: number    // Measured from chunks
}

/**
 * Select conversation history messages that fit within context budget
 * User decision: Keep last 10 messages (5 user + 5 assistant)
 */
export function selectHistoryMessages(
  messages: Message[],
  budget: ContextBudget,
): Message[] {
  // User constraint: last 10 messages
  const recentMessages = messages.slice(-10)

  // Calculate tokens for history
  const historyTokens = recentMessages.reduce((sum, msg) => {
    return sum + countTokens(msg.content)
  }, 0)

  const availableTokens = budget.maxTotal - budget.systemPrompt - budget.ragContext

  // If over budget, reduce window size
  if (historyTokens > availableTokens) {
    console.warn(`History exceeds budget (${historyTokens} > ${availableTokens}), truncating`)
    // Drop oldest messages until under budget
    let truncated = [...recentMessages]
    let currentTokens = historyTokens

    while (currentTokens > availableTokens && truncated.length > 2) {
      const removed = truncated.shift()!
      currentTokens -= countTokens(removed.content)
    }

    return truncated
  }

  return recentMessages
}
```

**Token budget guidance (GPT-4o-mini):**
- Input limit: 128K tokens
- Output limit: 4K tokens
- Reserve for output: 4K tokens
- Reserve for safety: 4K tokens
- Available for input: ~120K tokens
- Typical breakdown:
  - System prompt: ~500 tokens
  - RAG context (5 chunks × 500 tokens): ~2,500 tokens
  - Conversation history (10 messages × 100 tokens): ~1,000 tokens
  - **Total: ~4,000 tokens** (well under limit)

**Source:** [Context Window Management for AI Agents (2026)](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/), [RAG is not dead: factors for large prompts](https://medium.com/@laurentkubaski/rag-is-not-dead-the-4-factors-to-consider-before-using-large-prompts-c5ba30407e74)

### Pattern 4: Conversation Persistence with Fire-and-Forget

**What:** Save conversations asynchronously in `onFinish` callback without blocking stream completion

**When to use:** All chat applications with database persistence (prioritizes UX speed over write guarantees)

**Example:**

```typescript
// lib/chat/conversation.ts
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Message } from 'ai'

export async function saveConversation(
  conversationId: string | null,
  messages: Message[],
  assistantResponse: string,
  usage: { promptTokens: number; completionTokens: number },
): Promise<void> {
  const supabase = createServiceRoleClient()

  // Create conversation on first message (user constraint)
  let finalConversationId = conversationId
  if (!conversationId) {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ created_at: new Date().toISOString() })
      .select('id')
      .single()

    if (error) throw new Error(`Failed to create conversation: ${error.message}`)
    finalConversationId = data.id
  }

  // Save user message + assistant response
  const userMessage = messages[messages.length - 1]

  const { error: insertError } = await supabase
    .from('messages')
    .insert([
      {
        conversation_id: finalConversationId,
        role: 'user',
        content: userMessage.content,
        created_at: new Date().toISOString(),
      },
      {
        conversation_id: finalConversationId,
        role: 'assistant',
        content: assistantResponse,
        created_at: new Date().toISOString(),
        token_count: usage.completionTokens,
      },
    ])

  if (insertError) {
    throw new Error(`Failed to save messages: ${insertError.message}`)
  }
}
```

**Fire-and-forget usage in `onFinish`:**

```typescript
onFinish: async ({ text, usage }) => {
  // Don't await — let stream complete immediately
  saveConversation(conversationId, messages, text, usage).catch(err => {
    console.error('Persistence failed:', err)
    // Send to monitoring (Sentry, Datadog, etc.)
  })
}
```

**Tradeoff:** Silent failures if database is down. Recommended: monitor error logs and retry failed writes via background job.

**Source:** [AI SDK UI: Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence), [Vercel Labs: ai-sdk-persistence-db](https://github.com/vercel-labs/ai-sdk-persistence-db)

### Pattern 5: Abort Signal for Stop Button

**What:** Pass request abort signal to `streamText` to enable client-side stop functionality

**When to use:** All streaming chat UIs (standard UX for AI chat)

**Example:**

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  // ... setup code

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages: conversationHistory,
    abortSignal: req.signal,  // 👈 Forwards client abort to OpenAI
    // ... other options
  })

  return result.toUIMessageStreamResponse()
}
```

**Client-side usage (with useChat hook):**

```typescript
// components/ChatWindow.tsx
'use client'
import { useChat } from 'ai/react'

export function ChatWindow() {
  const { messages, input, handleInputChange, handleSubmit, stop, isLoading } = useChat({
    api: '/api/chat',
  })

  return (
    <div>
      {/* Messages */}
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      {/* Input + Stop button */}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit">Send</button>
        {isLoading && <button type="button" onClick={stop}>Stop</button>}
      </form>
    </div>
  )
}
```

**Important:** Stop functionality is **NOT compatible with resumable streams**. User constraint requires stop button, so do NOT use `resume: true` in `useChat`.

**Source:** [AI SDK: Stopping Streams](https://ai-sdk.dev/docs/advanced/stopping-streams), [GitHub Issue #6502: resumable stream abort](https://github.com/vercel/ai/issues/6502)

### Pattern 6: Error Handling with Partial Response Preservation

**What:** Handle streaming errors gracefully by keeping partial text and showing retry button

**When to use:** All production streaming implementations (user constraint)

**Example:**

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  try {
    // ... RAG + streaming setup

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: conversationHistory,
      abortSignal: req.signal,
      onFinish: async ({ text, usage, error }) => {
        // error parameter indicates stream failure
        if (error) {
          console.error('Stream failed:', error)
          // Send to monitoring
        }

        // Save partial response even on error (for analytics)
        if (text) {
          await saveConversation(conversationId, messages, text, usage)
        }
      },
    })

    return result.toUIMessageStreamResponse()

  } catch (error) {
    // Pre-stream errors (before 200 OK sent)
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate response' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
```

**Client-side error handling:**

```typescript
// components/ChatWindow.tsx
'use client'
import { useChat } from 'ai/react'

export function ChatWindow() {
  const { messages, error, reload } = useChat({
    api: '/api/chat',
    onError: (error) => {
      console.error('Chat error:', error)
      // Keep partial message visible (useChat handles this)
    },
  })

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      {/* Error state with retry (user constraint) */}
      {error && (
        <div className="text-red-500">
          {error.message}
          <button onClick={() => reload()}>Retry</button>
        </div>
      )}
    </div>
  )
}
```

**Error types:**
- **Pre-stream errors** (before 200 OK): Return 500 response, caught by `useChat` error handler
- **Mid-stream errors** (after 200 OK): Sent as SSE event, partial text preserved, `reload()` re-sends same message

**Source:** [Production AI Streaming Next.js Patterns (2026)](https://vladimirsiedykh.com/blog/ai-streaming-responses-nextjs-production-patterns), [Next.js Streaming Error Handling](https://betterstack.com/community/guides/scaling-nodejs/error-handling-nextjs/)

### Anti-Patterns to Avoid

- **Awaiting database writes in stream** — Blocks stream completion, users see delay after text finishes. Use fire-and-forget.
- **Including all retrieved chunks in system prompt** — Wastes tokens, confuses model. Use top 5 chunks for context, top 1-2 for citations (user decision).
- **No explicit "only use context" instruction** — Models hallucinate without strict grounding. Always include in system prompt.
- **Loading full conversation history** — Causes token explosion. Use sliding window (last 10 messages per user decision).
- **Trusting client-provided conversationId** — Client could forge IDs. Validate conversationId exists in database before appending messages.
- **Using resumable streams with abort** — Incompatible features. User requires stop button, so forgo resumption.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE stream parsing | Manual `ReadableStream` + EventSource handling | Vercel AI SDK `streamText` + `useChat` | Edge cases: stream errors, abort signals, backpressure, browser compatibility. AI SDK handles all this. |
| Token counting for context window | Character count × 4 approximation | `gpt-tokenizer` with `countTokens()` | GPT tokenizer uses BPE encoding — character approximations are 20-50% wrong, causing context overflow errors. |
| Conversation history truncation | "Keep last N messages" without token check | Token-aware sliding window (Pattern 3) | Messages vary in length. Token-based truncation prevents context overflow. |
| System prompt engineering | Generic "You are an AI assistant" | RAG-specific grounding prompt (Pattern 2) | Generic prompts don't prevent hallucination. Explicit "only use context" is required for RAG. |
| Streaming error recovery | Abort on error, lose partial text | Preserve partial text + show retry button | User constraint requires keeping partial text. Manual abort loses context. |

**Key insight:** The Vercel AI SDK's abstraction is crucial — raw OpenAI streaming requires ~200 lines of boilerplate for SSE parsing, error handling, and state management. AI SDK reduces this to ~20 lines with `streamText` + `useChat`.

## Common Pitfalls

### Pitfall 1: GPT-4o-mini Retirement (Feb 13, 2026)

**What goes wrong:** API calls fail with "model not found" after Feb 13, 2026

**Why it happens:** OpenAI is retiring GPT-4o-mini and replacing with GPT-4.1-mini

**How to avoid:**
1. Migrate to `gpt-4.1-mini` before Feb 13, 2026
2. Or use `gpt-4o` (full model, more expensive but not retiring yet)
3. Update model name in `streamText()` call: `model: openai('gpt-4.1-mini')`

**Warning signs:**
- OpenAI API returns 404 "model not found" error
- Deployment fails after Feb 13, 2026

**Recommendation:** Switch to `gpt-4.1-mini` immediately to avoid disruption. Verify context window limits (likely same 128K input, 4K output).

**Source:** [ChatGPT Enterprise Models & Limits](https://help.openai.com/en/articles/11165333-chatgpt-enterprise-and-edu-models-limits), [OpenAI Changelog](https://platform.openai.com/docs/changelog)

### Pitfall 2: Token Budget Miscalculation (Context Overflow)

**What goes wrong:** OpenAI API returns 400 error: "maximum context length exceeded"

**Why it happens:** System prompt + RAG chunks + conversation history > 128K input tokens

**How to avoid:**
1. Measure actual token counts with `gpt-tokenizer` before each request
2. Implement token budget system (Pattern 3)
3. Truncate conversation history if total exceeds limit
4. Reduce RAG chunks from 5 to 3 if needed

**Warning signs:**
- 400 errors from OpenAI API mentioning "context length"
- Users report chat stops working after many messages

**Example fix:**

```typescript
import { countTokens } from 'gpt-tokenizer'

const systemTokens = countTokens(systemPrompt)
const ragTokens = chunks.reduce((sum, c) => sum + countTokens(c.content), 0)
const historyTokens = messages.reduce((sum, m) => sum + countTokens(m.content), 0)

const total = systemTokens + ragTokens + historyTokens
const MAX_INPUT = 120_000 // Reserve 8K for output + safety

if (total > MAX_INPUT) {
  // Truncate conversation history
  while (total > MAX_INPUT && messages.length > 2) {
    const removed = messages.shift()!
    total -= countTokens(removed.content)
  }
}
```

**Source:** [Context Window Management (2026)](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/)

### Pitfall 3: Database Write Blocking Stream Completion

**What goes wrong:** User sees "loading" indicator for 1-2 seconds after text finishes streaming

**Why it happens:** Awaiting database insert in `onFinish` blocks stream completion

**How to avoid:** Use fire-and-forget pattern (don't await)

**Warning signs:**
- Stream completes but UI shows loading
- "Slower than ChatGPT" feedback from users

**Bad (blocking):**

```typescript
onFinish: async ({ text, usage }) => {
  await saveConversation(conversationId, messages, text, usage) // 🚫 Blocks
}
```

**Good (fire-and-forget):**

```typescript
onFinish: async ({ text, usage }) => {
  saveConversation(conversationId, messages, text, usage).catch(err => {
    console.error('Persistence failed:', err)
  })
}
```

**Source:** [Storing AI SDK Chat Messages](https://upstash.com/blog/ai-sdk-chat-history), [AI SDK Persistence DB](https://github.com/vercel-labs/ai-sdk-persistence-db)

### Pitfall 4: Missing Abort Signal (Stop Button Doesn't Work)

**What goes wrong:** User clicks "Stop" but generation continues for 10-30 seconds

**Why it happens:** Forgot to pass `abortSignal: req.signal` to `streamText()`

**How to avoid:** Always include abort signal parameter

**Warning signs:**
- Stop button doesn't stop generation immediately
- Generation completes even after abort

**Fix:**

```typescript
const result = streamText({
  model: openai('gpt-4.1-mini'),
  // ... other params
  abortSignal: req.signal,  // 👈 Required for stop functionality
})
```

**Source:** [AI SDK: Stopping Streams](https://ai-sdk.dev/docs/advanced/stopping-streams)

### Pitfall 5: Hallucination Without Strict Grounding

**What goes wrong:** Bot makes up features, prices, or details not in knowledge base

**Why it happens:** System prompt doesn't explicitly forbid using model's pre-trained knowledge

**How to avoid:** Use strict grounding instructions (Pattern 2)

**Warning signs:**
- User reports incorrect information
- Bot confidently describes non-existent features
- Answers questions outside knowledge base without saying "I don't know"

**Required system prompt clause:**

```typescript
const systemPrompt = `
## Critical Rules
1. ONLY use information from the Context section below. Never make up features, pricing, or details.
2. If the Context doesn't contain relevant information, say: "I don't have that information in my knowledge base."
3. Never use your general knowledge about project management software — only use the provided Context.

## Context (Knowledge Base)
${ragContext}
`
```

**Source:** [Prompt Engineering for RAG (2026)](https://www.stack-ai.com/blog/prompt-engineering-for-rag-pipelines-the-complete-guide-to-prompt-engineering-for-retrieval-augmented-generation)

### Pitfall 6: Race Condition in Conversation Creation

**What goes wrong:** Multiple messages create duplicate conversation rows

**Why it happens:** Client sends 2nd message before 1st message's `onFinish` creates conversation

**How to avoid:** Create conversation row on first API call, return conversationId to client immediately

**Warning signs:**
- Multiple conversation rows with same messages
- Database shows duplicate conversations

**Fix:**

```typescript
export async function POST(req: Request) {
  let { messages, conversationId } = await req.json()

  // Create conversation BEFORE streaming (not in onFinish)
  if (!conversationId) {
    const supabase = createServiceRoleClient()
    const { data } = await supabase
      .from('conversations')
      .insert({ created_at: new Date().toISOString() })
      .select('id')
      .single()

    conversationId = data.id
  }

  // Now stream with existing conversationId
  const result = streamText({
    // ... config
    onFinish: async ({ text }) => {
      // Append to existing conversation (no creation)
      await saveMessage(conversationId, text)
    }
  })

  // Return conversationId in response metadata
  return result.toUIMessageStreamResponse({
    metadata: { conversationId }
  })
}
```

**Source:** [AI SDK UI: Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence)

## Code Examples

Verified patterns from official sources:

### Minimal Streaming Chat Endpoint

```typescript
// app/api/chat/route.ts
import { streamText, createOpenAI } from 'ai'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai('gpt-4.1-mini'),
    messages,
  })

  return result.toUIMessageStreamResponse()
}
```

### Client-Side Chat UI with useChat Hook

```typescript
// components/ChatWindow.tsx
'use client'
import { useChat } from 'ai/react'

export function ChatWindow() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  })

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
```

### RAG Context Injection

```typescript
import { searchSimilarChunks } from '@/lib/rag/similarity-search'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const lastMessage = messages[messages.length - 1]

  // Retrieve RAG chunks
  const chunks = await searchSimilarChunks(lastMessage.content, {
    threshold: 0.7,
    count: 5,
  })

  // Format as context
  const ragContext = chunks
    .map(c => `[${c.documentTitle}]\n${c.content}`)
    .join('\n\n---\n\n')

  // Inject into system prompt
  const result = streamText({
    model: openai('gpt-4.1-mini'),
    system: `You are Flo, a helpful assistant. Only use this context:\n\n${ragContext}`,
    messages,
  })

  return result.toUIMessageStreamResponse()
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GPT-4o-mini | GPT-4.1-mini | Feb 2026 | Model retirement — must migrate to 4.1-mini or gpt-4o |
| Manual SSE parsing | Vercel AI SDK `streamText` | 2024-2025 | Abstracts streaming complexity, reduces boilerplate by ~90% |
| text-davinci-003 (completion API) | Chat Completions API | 2023 | Chat format supports multi-turn conversations, system prompts |
| Synchronous RAG + LLM | Streaming RAG | 2024+ | Token-by-token streaming improves perceived latency by 3-5x |
| No conversation persistence | Fire-and-forget persistence | 2025+ | Analytics without blocking UX — requires monitoring for failures |

**Deprecated/outdated:**
- **GPT-4o-mini model**: Retiring Feb 13, 2026 — use `gpt-4.1-mini` or `gpt-4o`
- **OpenAI Completions API**: Deprecated — use Chat Completions API
- **Manual SSE with fetch + EventSource**: Use Vercel AI SDK instead
- **Awaiting database writes in stream**: Fire-and-forget is now standard

## Open Questions

1. **GPT-4.1-mini context window limits**
   - What we know: GPT-4o-mini has 128K input, 4K output
   - What's unclear: GPT-4.1-mini limits not documented yet (model just released Feb 2026)
   - Recommendation: Assume same limits until verified with OpenAI docs. Test with token budget system (Pattern 3).

2. **Optimal similarity threshold for "no relevant chunks found"**
   - What we know: Default threshold is 0.7 (from Phase 1 evaluation)
   - What's unclear: Should we use lower threshold for fallback message ("I don't have that info")?
   - Recommendation: Use 0.7 for normal retrieval. If zero chunks returned, try 0.5 threshold as fallback before "I don't know" message.

3. **Fire-and-forget monitoring strategy**
   - What we know: Fire-and-forget improves UX but risks silent failures
   - What's unclear: How to detect and recover from failed database writes
   - Recommendation: Log errors to console.error (caught by Vercel logs). In production, send to monitoring service (Sentry, Datadog). Run daily job to check for orphaned conversations.

4. **Token budget for streaming abort**
   - What we know: OpenAI charges for all tokens generated before abort
   - What's unclear: Does abort save money or just stop client-side rendering?
   - Recommendation: Assume abort stops generation server-side (saves tokens). Verify with OpenAI usage logs after implementing.

5. **Source card rendering strategy**
   - What we know: User wants cards to appear after streaming completes
   - What's unclear: Should cards fade in together or sequentially?
   - Recommendation: Fade all cards in together after 200ms delay (single animation feels smoother than staggered).

## Sources

### Primary (HIGH confidence)

- [AI SDK Core: streamText](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) - Official API reference
- [AI SDK UI: Stream Protocols](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) - UIMessageStreamResponse format
- [AI SDK: Stopping Streams](https://ai-sdk.dev/docs/advanced/stopping-streams) - Abort signal usage
- [AI SDK UI: Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) - Official persistence guide
- [OpenAI Streaming API Reference](https://platform.openai.com/docs/api-reference/responses-streaming) - SSE event types
- [OpenAI Streaming Guide](https://platform.openai.com/docs/guides/streaming-responses) - Best practices

### Secondary (MEDIUM confidence)

- [LogRocket: Real-time AI in Next.js (2026)](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/) - Practical tutorial
- [Production AI Streaming Patterns (2026)](https://vladimirsiedykh.com/blog/ai-streaming-responses-nextjs-production-patterns) - Error handling patterns
- [Prompt Engineering for RAG (2026)](https://www.stack-ai.com/blog/prompt-engineering-for-rag-pipelines-the-complete-guide-to-prompt-engineering-for-retrieval-augmented-generation) - System prompt best practices
- [Building Production RAG Systems 2026](https://brlikhon.engineer/blog/building-production-rag-systems-in-2026-complete-architecture-guide) - Architecture patterns
- [Context Window Management (2026)](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/) - Token budget strategies
- [Vercel Labs: ai-sdk-persistence-db](https://github.com/vercel-labs/ai-sdk-persistence-db) - Example implementation
- [Supabase Vercel AI Chatbot](https://github.com/supabase-community/vercel-ai-chatbot) - Full reference app

### Tertiary (LOW confidence)

- [Upstash: SSE Streaming LLM Responses](https://upstash.com/blog/sse-streaming-llm-responses) - Alternative approaches
- [Context Engineering: RAG vs Prompt](https://www.regal.ai/blog/context-engineering-for-ai-agents) - High-level strategy
- [GitHub Discussion #4845: Persistence Guidance](https://github.com/vercel/ai/discussions/4845) - Community patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Vercel AI SDK is official Vercel product with comprehensive docs
- Architecture patterns: HIGH - Patterns verified against official AI SDK docs and reference apps
- Streaming mechanics: HIGH - Directly from OpenAI and Vercel official documentation
- RAG integration: HIGH - Combines Phase 1 patterns (already validated) with AI SDK
- Pitfalls: HIGH - Sourced from official docs, GitHub issues, and production experience blogs

**Research date:** 2026-02-09
**Valid until:** ~14 days (GPT-4o-mini retiring Feb 13, 2026 — URGENT migration needed)

**Critical action required:**
- Migrate from `gpt-4o-mini` to `gpt-4.1-mini` before Feb 13, 2026
- Verify GPT-4.1-mini context window limits (assume 128K/4K until confirmed)
- Update model name in all `streamText()` calls

---

*Research for Phase 3: Chat API & Streaming*
*Prepared: 2026-02-09*
