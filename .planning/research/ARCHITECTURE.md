# Architecture Research

**Domain:** RAG-Powered AI Customer Support Chatbot
**Researched:** 2026-02-08
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Full-Page   │  │   Widget     │  │   Admin      │           │
│  │  Chat UI     │  │   (iframe)   │  │   Panel      │           │
│  │              │  │              │  │              │           │
│  │  useChat()   │  │ postMessage  │  │ Doc Upload   │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                   │
├─────────┼─────────────────┼─────────────────┼───────────────────┤
│         ↓                 ↓                 ↓                   │
│                      API LAYER (Route Handlers)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ /api/chat    │  │ /api/docs    │  │ /api/convos  │           │
│  │              │  │              │  │              │           │
│  │ streamText() │  │ Chunking +   │  │ Save/Load    │           │
│  │ + RAG Tools  │  │ Embeddings   │  │ History      │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                   │
├─────────┼─────────────────┼─────────────────┼───────────────────┤
│         ↓                 ↓                 ↓                   │
│                    SERVICE LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Embedding   │  │  Retrieval   │  │   OpenAI     │           │
│  │  Generator   │  │  Service     │  │   Client     │           │
│  │              │  │              │  │              │           │
│  │ text-        │  │ pgvector     │  │ gpt-4o-mini  │           │
│  │ embedding-3  │  │ similarity   │  │ streaming    │           │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘           │
│         │                 │                                     │
├─────────┼─────────────────┼─────────────────────────────────────┤
│         ↓                 ↓                                     │
│                      DATA LAYER (Supabase)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────────┐       │
│  │   PostgreSQL DB     │  │      Storage Bucket         │       │
│  │                     │  │                             │       │
│  │ • document_chunks   │  │ • Uploaded PDFs/text files  │       │
│  │   (with pgvector)   │  │                             │       │
│  │ • documents         │  │                             │       │
│  │ • conversations     │  │                             │       │
│  │ • messages          │  │                             │       │
│  └─────────────────────┘  └─────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Chat UI (Full-page)** | Render messages, handle input, display streaming responses | React component using Vercel AI SDK's `useChat()` hook |
| **Widget (Embeddable)** | Provide iframe-isolated chat interface for third-party sites | Isolated Next.js page + script tag loader + postMessage bridge |
| **Admin Panel** | Document upload, knowledge base management | Protected Next.js pages with simple password/env var gate |
| **/api/chat** | Stream AI responses with RAG context | Route handler using `streamText()` with retrieval tools |
| **/api/docs** | Process documents into chunks + embeddings | Route handler + Server Action for chunking/embedding pipeline |
| **/api/conversations** | Persist/retrieve chat history | CRUD operations via Supabase client |
| **Embedding Service** | Generate vectors from text | OpenAI `text-embedding-3-small` API |
| **Retrieval Service** | Find relevant chunks via semantic search | pgvector cosine similarity query |
| **PostgreSQL + pgvector** | Store embeddings, enable vector search | Supabase-hosted Postgres with pgvector extension |

## Recommended Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page with demo
│   ├── chat/
│   │   └── page.tsx                # Full-page chat interface
│   ├── admin/
│   │   ├── layout.tsx              # Password gate wrapper
│   │   ├── page.tsx                # Knowledge base dashboard
│   │   └── upload/
│   │       └── page.tsx            # Document upload UI
│   ├── widget/
│   │   └── page.tsx                # Embeddable widget (rendered in iframe)
│   └── api/
│       ├── chat/
│       │   └── route.ts            # POST: streaming chat with RAG
│       ├── documents/
│       │   └── route.ts            # POST: upload + process docs
│       └── conversations/
│           └── route.ts            # GET/POST: conversation history
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx          # Shared by full-page & widget
│   │   ├── MessageBubble.tsx       # Individual message component
│   │   └── ChatInput.tsx           # Input field + send button
│   ├── widget/
│   │   ├── WidgetLoader.tsx        # Script tag that creates iframe
│   │   └── WidgetBridge.ts         # postMessage communication layer
│   ├── admin/
│   │   ├── DocumentList.tsx        # Table of uploaded docs
│   │   └── UploadForm.tsx          # File upload UI
│   └── ui/                         # Shared Tailwind components
│       ├── button.tsx
│       ├── input.tsx
│       └── card.tsx
├── lib/
│   ├── ai/
│   │   ├── openai.ts               # OpenAI client + config
│   │   ├── embeddings.ts           # Embedding generation utilities
│   │   └── retrieval.ts            # RAG retrieval logic
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server-side client
│   │   └── middleware.ts           # Auth middleware (optional)
│   ├── actions/
│   │   └── documents.ts            # Server Actions for doc management
│   └── utils/
│       ├── cn.ts                   # Tailwind class merger
│       └── chunking.ts             # Text chunking strategies
└── middleware.ts                    # (Optional) Route protection
```

### Structure Rationale

- **app/**: Next.js App Router convention. Route handlers co-locate with UI pages.
- **components/chat/**: `ChatWindow` is reusable across full-page and widget contexts. The widget iframe renders the same component as the full-page chat, ensuring feature parity.
- **lib/ai/**: Centralizes all AI operations (OpenAI, embeddings, retrieval). Makes it easy to swap providers later.
- **lib/supabase/**: Separates browser vs server clients per Supabase SSR best practices. Avoids accidental client usage in server components.
- **lib/actions/**: Server Actions for document processing. Keeps heavy operations (chunking, embedding) server-side.

## Architectural Patterns

### Pattern 1: RAG Pipeline (Ingest → Retrieve → Generate)

**What:** Three-phase architecture for retrieval-augmented generation.

**When to use:** Any chatbot that needs to answer questions grounded in specific documents/knowledge base.

**Trade-offs:**
- **Pros:** Reduces hallucinations, provides source attribution, knowledge updates without retraining
- **Cons:** Adds latency (embedding + retrieval), requires vector storage, chunking strategy impacts quality

**Example:**

```typescript
// Phase 1: INGEST (document upload)
async function ingestDocument(file: File) {
  // 1. Extract text from PDF/text file
  const text = await extractText(file);

  // 2. Split into chunks (~500 tokens, 50 token overlap)
  const chunks = chunkText(text, { size: 500, overlap: 50 });

  // 3. Generate embeddings for each chunk
  const embeddings = await Promise.all(
    chunks.map(chunk => openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunk
    }))
  );

  // 4. Store in Supabase
  await supabase.from('document_chunks').insert(
    chunks.map((chunk, i) => ({
      content: chunk,
      embedding: embeddings[i].data[0].embedding,
      document_id: documentId
    }))
  );
}

// Phase 2: RETRIEVE (query time)
async function retrieveContext(query: string, topK = 3) {
  // 1. Embed the user's question
  const { data } = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  });
  const queryEmbedding = data[0].embedding;

  // 2. Similarity search via pgvector
  const { data: chunks } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: topK
  });

  return chunks.map(c => c.content).join('\n\n');
}

// Phase 3: GENERATE (streaming response)
async function generateAnswer(question: string, context: string) {
  return streamText({
    model: openai('gpt-4o-mini'),
    messages: [
      { role: 'system', content: `Answer based on this context:\n\n${context}` },
      { role: 'user', content: question }
    ]
  });
}
```

### Pattern 2: AI SDK Tools for RAG

**What:** Use Vercel AI SDK's tool calling system to encapsulate retrieval as a model-invocable function.

**When to use:** When you want the LLM to decide whether to retrieve context vs answer directly (for follow-ups, clarifications).

**Trade-offs:**
- **Pros:** More dynamic (model chooses when to retrieve), cleaner abstraction, multi-step reasoning
- **Cons:** Adds an extra LLM call (tool invocation), requires careful tool definition, slightly higher cost

**Example:**

```typescript
// Define retrieval as a tool
const retrievalTool = {
  name: 'getKnowledgeBaseInfo',
  description: 'Retrieve information from the knowledge base to answer user questions',
  parameters: z.object({
    query: z.string().describe('The search query')
  }),
  execute: async ({ query }: { query: string }) => {
    const context = await retrieveContext(query);
    return { context };
  }
};

// Route handler uses tools
export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    messages,
    tools: { getKnowledgeBaseInfo: retrievalTool },
    maxSteps: 5 // Allow multi-step tool calls
  });

  return result.toDataStreamResponse();
}
```

### Pattern 3: Embeddable Widget via iframe + postMessage

**What:** Isolate widget in iframe, communicate with parent page via postMessage API.

**When to use:** When building widgets for third-party sites (cross-origin security, style isolation, independent routing).

**Trade-offs:**
- **Pros:** Full DOM/CSS isolation, no conflicts with parent page, independent history/routing, ServiceWorker support
- **Cons:** Slightly slower initial load (iframe overhead), cross-origin complexity, can't access parent DOM

**Example:**

```typescript
// 1. Widget loader script (users embed this)
// public/widget.js
(function() {
  const iframe = document.createElement('iframe');
  iframe.src = 'https://your-app.vercel.app/widget';
  iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;z-index:9999;';
  document.body.appendChild(iframe);

  // Listen for messages from iframe
  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://your-app.vercel.app') return; // Security check

    if (event.data.type === 'WIDGET_RESIZE') {
      iframe.style.height = event.data.height + 'px';
    }
  });
})();

// 2. Widget component (renders inside iframe)
// app/widget/page.tsx
'use client';

export default function WidgetPage() {
  const sendMessageToParent = (type: string, data: any) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type, ...data }, '*'); // In production, specify targetOrigin
    }
  };

  useEffect(() => {
    // Notify parent when height changes
    const resizeObserver = new ResizeObserver(() => {
      sendMessageToParent('WIDGET_RESIZE', { height: document.body.scrollHeight });
    });
    resizeObserver.observe(document.body);
  }, []);

  return <ChatWindow onMessage={(msg) => {
    // Handle chat logic
  }} />;
}
```

### Pattern 4: Chunking Strategy (Semantic with Overlap)

**What:** Split documents into chunks based on semantic boundaries (paragraphs, sections) with overlap to preserve context.

**When to use:** Always for RAG. Chunking quality directly impacts retrieval accuracy.

**Trade-offs:**
- **Fixed-size chunks (500 tokens):** Simple, predictable, but may split mid-sentence
- **Semantic chunks (by paragraph/section):** Better context preservation, variable size (handle with max limit)
- **Overlap (50-100 tokens):** Improves retrieval at sentence boundaries, increases storage

**Example:**

```typescript
function chunkText(text: string, options = { size: 500, overlap: 50 }) {
  // Option 1: Simple fixed-size (naive)
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += options.size - options.overlap) {
    const chunk = words.slice(i, i + options.size).join(' ');
    chunks.push(chunk);
  }

  return chunks;

  // Option 2: Semantic (by paragraph, respecting max size)
  // const paragraphs = text.split(/\n\n+/);
  // return paragraphs.map(p => {
  //   if (p.split(/\s+/).length > options.size) {
  //     // Split large paragraphs using Option 1
  //     return chunkText(p, options);
  //   }
  //   return p;
  // }).flat();
}
```

### Pattern 5: Streaming with Conversation History

**What:** Persist messages to database, include recent context in LLM prompt, stream response to client.

**When to use:** Multi-turn conversations where context matters.

**Trade-offs:**
- **Pros:** Better coherence, user can reference earlier messages
- **Cons:** Token usage grows, need to truncate old messages, database writes on every message

**Example:**

```typescript
export async function POST(req: Request) {
  const { message, conversationId } = await req.json();

  // 1. Load conversation history
  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(10); // Last 10 messages to avoid token explosion

  // 2. Retrieve RAG context
  const context = await retrieveContext(message);

  // 3. Build messages array
  const messages = [
    { role: 'system', content: `You are a support assistant. Use this context:\n${context}` },
    ...history, // Previous conversation
    { role: 'user', content: message }
  ];

  // 4. Stream response
  const result = await streamText({
    model: openai('gpt-4o-mini'),
    messages
  });

  // 5. Save messages asynchronously (don't block stream)
  const response = result.toDataStreamResponse();

  // Fire-and-forget save (avoid awaiting to not block response)
  result.then(async ({ text }) => {
    await supabase.from('messages').insert([
      { conversation_id: conversationId, role: 'user', content: message },
      { conversation_id: conversationId, role: 'assistant', content: text }
    ]);
  });

  return response;
}
```

## Data Flow

### Request Flow (Chat Query)

```
[User types message]
    ↓
[ChatWindow component] → [POST /api/chat] → [Load conversation history]
    ↓                                              ↓
[useChat hook]                          [Embed user query with OpenAI]
    ↓                                              ↓
[Receives stream] ←─────────────────── [pgvector similarity search]
    ↓                                              ↓
[Updates UI]                            [Retrieve top 3-5 chunks as context]
                                                   ↓
                                        [streamText with context + history]
                                                   ↓
                                        [Stream response back to client]
                                                   ↓
                                        [Save user + assistant messages]
```

### Document Upload Flow

```
[Admin uploads PDF/text file]
    ↓
[UploadForm] → [POST /api/documents] → [Upload to Supabase Storage]
    ↓                                         ↓
[Show progress]                    [Extract text from file]
    ↓                                         ↓
[Redirect to dashboard]            [Split into chunks (500 tokens, 50 overlap)]
                                              ↓
                                   [Generate embeddings (text-embedding-3-small)]
                                              ↓
                                   [Insert into document_chunks table]
                                              ↓
                                   [Return success]
```

### Widget Embed Flow

```
[Site owner adds <script> tag to their page]
    ↓
[widget.js loads] → [Creates iframe pointing to /widget]
    ↓                              ↓
[Appends iframe to body]    [Widget page loads in isolation]
    ↓                              ↓
[Listens for postMessage]   [ChatWindow renders inside iframe]
    ↓                              ↓
[Receives resize events]    [User interacts with chat]
    ↓                              ↓
[Adjusts iframe height]     [Sends messages via postMessage to parent]
                                   ↓
                            [Parent forwards analytics/events (optional)]
```

### Key Data Flows

1. **RAG Retrieval Flow:** User query → OpenAI embeddings → pgvector cosine similarity → top K chunks → inject into LLM prompt → generate response
2. **Conversation Persistence:** Each message pair (user + assistant) saved to `messages` table linked to `conversation_id`
3. **Widget Isolation:** Widget runs in iframe (different origin OK), communicates via postMessage, parent never accesses widget DOM

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-1k users** | Monolith (single Next.js app) on Vercel, Supabase free tier, no caching needed |
| **1k-10k users** | Add Redis for conversation history caching, enable Vercel edge caching for static assets, consider Supabase Pro for connection pooling |
| **10k-100k users** | Move embeddings generation to background job queue (Inngest/BullMQ), add CDN for widget script, implement rate limiting per user/IP |
| **100k+ users** | Consider dedicated vector DB (Pinecone/Weaviate) if pgvector query latency >100ms, split API into separate service (Next.js frontend + FastAPI for RAG), add Redis cluster for distributed caching |

### Scaling Priorities

1. **First bottleneck (at ~5k users):** Embedding generation during document upload blocks API response. **Fix:** Move chunking + embedding to async job, return immediately and update status via polling/webhook.

2. **Second bottleneck (at ~20k users):** pgvector similarity search slows down as chunk count grows. **Fix:** Add HNSW index to `document_chunks.embedding` column, tune `match_threshold` to reduce results scanned, consider pre-filtering by document metadata (e.g., category, date).

3. **Third bottleneck (at ~50k users):** OpenAI rate limits hit during concurrent chat requests. **Fix:** Implement request queuing with exponential backoff, use streaming to show partial responses faster (perceived performance), consider fallback model or self-hosted LLM for overflow.

## Anti-Patterns

### Anti-Pattern 1: Embedding Every Request (No Caching)

**What people do:** Generate embeddings for the same user query multiple times across conversations.

**Why it's wrong:** Embeddings API is ~$0.0001/1K tokens. For repeated queries (e.g., "What are your hours?"), this is wasteful and adds latency.

**Do this instead:** Cache query embeddings in Redis with TTL (1 hour). Key by hash of query text. Check cache before calling OpenAI.

```typescript
async function getQueryEmbedding(query: string) {
  const cacheKey = `embed:${hashString(query)}`;
  const cached = await redis.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const { data } = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  });

  await redis.set(cacheKey, JSON.stringify(data[0].embedding), { ex: 3600 });
  return data[0].embedding;
}
```

### Anti-Pattern 2: Storing Full Documents in Vector DB

**What people do:** Store entire documents as single embeddings instead of chunking.

**Why it's wrong:** LLMs have context limits (~8K tokens for gpt-4o-mini). A 10-page document exceeds this. Also, embeddings lose granularity—you can't pinpoint the relevant section.

**Do this instead:** Always chunk. Store chunks with metadata linking back to parent document. Retrieve chunks, not documents.

### Anti-Pattern 3: Ignoring Chunk Overlap

**What people do:** Split text at exact boundaries (e.g., every 500 words) with no overlap.

**Why it's wrong:** A sentence split across two chunks loses context. Retrieval may miss relevant info if query keywords span the boundary.

**Do this instead:** Use 10-20% overlap (e.g., 50 tokens for 500-token chunks). Redundant storage is worth the retrieval accuracy gain.

### Anti-Pattern 4: Blocking Response While Saving to DB

**What people do:** Await database save before returning streamed response.

```typescript
// BAD
const result = await streamText({ ... });
const text = await result.text; // Blocks stream
await saveToDatabase(text);
return result.toDataStreamResponse(); // User waits for DB write
```

**Why it's wrong:** User sees delay before streaming starts. DB writes should never block the response.

**Do this instead:** Fire-and-forget save. Return stream immediately.

```typescript
// GOOD
const result = streamText({ ... });
const response = result.toDataStreamResponse();

// Save asynchronously (don't await)
result.then(async ({ text }) => {
  await saveToDatabase(text); // Happens in background
});

return response; // User gets stream immediately
```

### Anti-Pattern 5: Using Wildcard Origin in postMessage

**What people do:** Send messages to parent without verifying origin.

```typescript
// BAD
window.parent.postMessage({ type: 'WIDGET_EVENT' }, '*'); // Any site can intercept
```

**Why it's wrong:** Malicious site could embed your widget and intercept messages containing user data.

**Do this instead:** Always specify targetOrigin for outbound messages, verify event.origin for inbound.

```typescript
// GOOD (outbound)
window.parent.postMessage({ type: 'WIDGET_EVENT' }, 'https://trusted-site.com');

// GOOD (inbound)
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://your-app.vercel.app') return;
  // Process event.data
});
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **OpenAI API** | Server-side only (API key in env var), use `openai` SDK v5+ | Never expose API key to client. Route all calls through `/api/chat`. |
| **Supabase** | Dual clients (browser for UI, server for API routes), `@supabase/ssr` package | Browser client for real-time subscriptions (optional), server client for auth/data in API routes. |
| **Vercel AI SDK** | `streamText()` in route handlers, `useChat()` in client components | Handles streaming, tool calling, message state. Use `toDataStreamResponse()` for compatibility. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Client components ↔ API routes** | HTTP (POST /api/chat with JSON body) | Client uses `fetch()` or `useChat()` hook. API returns streaming response or JSON. |
| **Server components ↔ Supabase** | Direct database queries via Supabase client | Server components can read directly; mutations use Server Actions. |
| **Widget iframe ↔ Parent page** | postMessage API (cross-origin safe) | Widget sends events (e.g., 'chat_started'), parent can send config (e.g., user metadata). |
| **API routes ↔ OpenAI** | HTTPS with API key in headers | Use official `openai` SDK. Always server-side to protect key. |
| **Document upload ↔ Processing** | Server Actions invoked from client forms | Server Action handles file upload → Supabase Storage → chunking → embedding → DB insert. All server-side. |

## Build Order Recommendations

Based on dependency analysis, suggested implementation order:

### Phase 1: Core RAG Infrastructure (Foundation)

1. **Database schema:** Create `documents`, `document_chunks`, `conversations`, `messages` tables with pgvector setup
2. **Supabase clients:** Set up browser/server clients in `lib/supabase/`
3. **OpenAI client:** Initialize in `lib/ai/openai.ts` with API key from env
4. **Embedding service:** Write `generateEmbedding()` and `retrieveContext()` functions
5. **Chunking utility:** Implement text splitting in `lib/utils/chunking.ts`

**Why this order:** Everything depends on the database schema. Once that's set, you can build services that interact with it.

### Phase 2: Admin Panel (Content Creation)

1. **Simple password gate:** Create `app/admin/layout.tsx` with middleware or env var check
2. **Upload form:** Build `app/admin/upload/page.tsx` with file input
3. **Document processing API:** Create `POST /api/documents` route that chunks + embeds + stores
4. **Document list:** Display uploaded docs in `app/admin/page.tsx` with delete option

**Why this order:** Need to populate knowledge base before testing chat. Admin panel is simpler than chat UI (no streaming complexity).

### Phase 3: Chat Interface (Core Feature)

1. **Chat API route:** Create `POST /api/chat` with `streamText()` and RAG retrieval
2. **Chat components:** Build `ChatWindow`, `MessageBubble`, `ChatInput` in `components/chat/`
3. **Full-page chat:** Create `app/chat/page.tsx` using `useChat()` hook
4. **Conversation persistence:** Add save/load logic to `/api/conversations`
5. **Landing page:** Create demo on `app/page.tsx` with "Try it now" link to `/chat`

**Why this order:** API route is foundation for UI. Components are reusable for widget. Persistence is last since it's not required for basic functionality.

### Phase 4: Embeddable Widget (Advanced Feature)

1. **Widget page:** Create `app/widget/page.tsx` that renders `ChatWindow` in minimal layout
2. **Widget loader script:** Write `public/widget.js` that creates iframe
3. **postMessage bridge:** Add communication layer in widget page to send events to parent
4. **Embed code generator:** Create UI in admin panel to copy/paste script tag
5. **Test on external site:** Verify cross-origin works, styles don't leak

**Why this order:** Widget reuses chat components built in Phase 3. Loader script comes last since it requires deployed widget URL.

## Sources

- [5 Essential Steps to Build a RAG Chatbot with LangChain (And Why Most Teams Get Stuck) | ChatRAG Blog](https://www.chatrag.ai/blog/2026-02-02-5-essential-steps-to-build-a-rag-chatbot-with-langchain-and-why-most-teams-get-stuck)
- [Building Production RAG Systems in 2026: Complete Architecture Guide | Likhon's Gen AI Blog](https://brlikhon.engineer/blog/building-production-rag-systems-in-2026-complete-architecture-guide)
- [RAG Architecture Diagram Explained | 2026 Guide](https://www.clickittech.com/ai/rag-architecture-diagram/)
- [RAG with Vercel AI SDK](https://vercel.com/templates/next.js/ai-sdk-rag)
- [Guides: RAG Agent - Vercel AI SDK Cookbook](https://ai-sdk.dev/cookbook/guides/rag-chatbot)
- [Building a RAG Chatbot with Upstash, OpenAI, Clerk, and Next.js | Upstash Blog](https://upstash.com/blog/rag-chatbot-upstash-openai-clerk-nextjs)
- [🚀 Building a Full-Stack AI Chatbot (RAG) with LangChain, FastAPI & Next.js | Medium](https://medium.com/@mail2ajoyshil/building-a-full-stack-ai-chatbot-rag-with-langchain-fastapi-next-js-de04c5dd04ab)
- [Web widgets (Bonus): Why iframe? | chatscope](https://chatscope.io/blog/web-widgets-bonus-why-iframe/)
- [Securing Cross-Window Communication: A Guide to postMessage](https://www.bindbee.dev/blog/secure-cross-window-communication)
- [Window: postMessage() method - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [pgvector: Key features, tutorial, and pros and cons [2026 guide]](https://www.instaclustr.com/education/vector-database/pgvector-key-features-tutorial-and-pros-and-cons-2026-guide/)
- [Which RAG Chunking and Formatting Strategy Is Best for Your App With Pgvector | Tiger Data](https://www.tigerdata.com/blog/which-rag-chunking-and-formatting-strategy-is-best)
- [Chunking Strategies for Retrieval-Augmented Generation (RAG): A Comprehensive Guide | Medium](https://medium.com/@adnanmasood/chunking-strategies-for-retrieval-augmented-generation-rag-a-comprehensive-guide-5522c4ea2a90)
- [Getting Started: Next.js App Router - Vercel AI SDK](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)
- [Using Server-Sent Events (SSE) to stream LLM responses in Next.js | Upstash Blog](https://upstash.com/blog/sse-streaming-llm-responses)
- [Supabase Auth with the Next.js App Router](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Setting up Server-Side Auth for Next.js | Supabase Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Basic Auth Password Protection - Vercel Template](https://vercel.com/templates/next.js/basic-auth-password)
- [Password protecting routes in Next.js App Router — Alex Chan](https://www.alexchantastic.com/password-protecting-next)

---

*Architecture research for: AI Support Chat (RAG-Powered Customer Support Chatbot)*
*Researched: 2026-02-08*
