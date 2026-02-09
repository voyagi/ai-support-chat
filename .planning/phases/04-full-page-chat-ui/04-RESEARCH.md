# Phase 4: Full-Page Chat UI - Research

**Researched:** 2026-02-09
**Domain:** Streaming chat UI with Next.js App Router and Vercel AI SDK v6
**Confidence:** HIGH

## Summary

Phase 4 builds the user-facing chat interface that consumes the streaming API created in Phase 3. The core technical challenge is implementing real-time streaming text display with proper scroll behavior, loading states, and accessibility while maintaining responsive design across devices.

The Vercel AI SDK v6's `useChat` hook abstracts away streaming complexity, providing automatic state management for messages, streaming status, and error handling. The main implementation areas are: (1) client component with useChat integration, (2) streaming message display with typing indicators, (3) intelligent auto-scroll that respects user scroll position, (4) skeleton loading states, (5) responsive layout with Tailwind CSS v4, and (6) landing page with zero-friction demo entry.

**Primary recommendation:** Use `useChat` hook from `@ai-sdk/react` with custom headers for metadata extraction (conversation ID, citation sources), implement intersection observer-based auto-scroll that only scrolls when user is at bottom, use skeleton loading for initial conversation load, and follow WCAG 2.1 AA standards for keyboard navigation and screen reader support.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @ai-sdk/react | 6.0.77 (ai package) | useChat hook for streaming | Official Vercel AI SDK v6 React hooks - handles streaming, state management, error handling automatically |
| Next.js | 15.3.2 | App Router framework | Project standard, client components with 'use client' directive |
| React | 19.1.0 | UI library | Latest stable, project standard |
| Tailwind CSS | 4.1.4 | Styling | Project standard, v4 has 5x faster builds and CSS-first config |
| lucide-react | 0.511.0 | Icons | Project standard for UI icons |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.1.1 | Conditional classes | Already in project - use for dynamic styling |
| tailwind-merge | 3.3.0 | Merge Tailwind classes | Already in project - use with clsx via cn() utility |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native fetch streaming | useChat hook | useChat is strongly recommended - it handles all edge cases (reconnection, message state, error handling, streaming protocol) |
| Custom scroll logic | react-scroll-to-bottom | Built-in solution easier to maintain, library adds 40KB bundle size |
| date-fns | Native Intl.DateTimeFormat | Timestamps are nice-to-have for Phase 4, native API sufficient for basic formatting |
| React Loading Skeleton library | Custom Tailwind skeletons | Custom skeletons lighter weight (no library), sufficient for this use case |

**Installation:**

No additional packages required - all dependencies already in project.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page with demo CTA
│   ├── chat/
│   │   └── page.tsx          # Full-page chat route
│   └── api/
│       └── chat/route.ts     # Already built (Phase 3)
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx       # Main chat container (useChat integration)
│   │   ├── MessageList.tsx      # Scrollable message container
│   │   ├── MessageBubble.tsx    # Individual message display
│   │   ├── ChatInput.tsx        # Input form with send button
│   │   ├── TypingIndicator.tsx  # Loading animation during streaming
│   │   └── MessageSkeleton.tsx  # Loading placeholder for history
│   └── ui/                      # Shared UI primitives (if needed)
└── lib/
    └── cn.ts                    # clsx + tailwind-merge utility
```

### Pattern 1: useChat Integration with Custom Headers

**What:** useChat hook with custom fetch to extract headers for metadata

**When to use:** When API returns metadata via custom headers (X-Conversation-Id, X-Sources)

**Example:**

```typescript
// Source: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function ChatWindow() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);

  const { messages, sendMessage, status, error, regenerate } = useChat({
    api: '/api/chat',
    body: { conversationId }, // Send current conversation ID
    fetch: async (url, options) => {
      const response = await fetch(url, options);

      // Extract metadata from headers
      const convId = response.headers.get('X-Conversation-Id');
      const sourcesHeader = response.headers.get('X-Sources');

      if (convId && !conversationId) {
        setConversationId(convId);
      }
      if (sourcesHeader) {
        setSources(JSON.parse(sourcesHeader));
      }

      return response;
    },
  });

  return (
    <div>
      {/* Chat UI */}
    </div>
  );
}
```

### Pattern 2: Intelligent Auto-Scroll with Intersection Observer

**What:** Scroll to bottom automatically only when user is already at bottom

**When to use:** Always - prevents jarring scroll interruptions when user reads history

**Example:**

```typescript
// Source: https://davelage.com/posts/chat-scroll-react/
import { useRef, useEffect, useState } from 'react';

export function MessageList({ messages }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Track if user is at bottom using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (bottomRef.current) {
      observer.observe(bottomRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-scroll only if user is at bottom
  useEffect(() => {
    if (isAtBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  return (
    <div ref={containerRef} className="overflow-y-auto">
      {messages.map(msg => <MessageBubble key={msg.id} {...msg} />)}
      <div ref={bottomRef} />
    </div>
  );
}
```

### Pattern 3: Streaming Status Indicators

**What:** Show different UI states based on useChat status property

**When to use:** Always - provides feedback during streaming and loading

**Example:**

```typescript
// Source: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
const { status } = useChat();

// status values: 'submitted' | 'streaming' | 'ready' | 'error'

{status === 'streaming' && <TypingIndicator />}
{status === 'submitted' && <MessageSkeleton />}
{status === 'error' && <ErrorMessage error={error} onRetry={regenerate} />}
```

### Pattern 4: Skeleton Loading for Message History

**What:** Placeholder UI that mimics message layout during initial load

**When to use:** When loading conversation history or waiting for first response

**Example:**

```typescript
// Source: https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/
export function MessageSkeleton() {
  return (
    <div className="flex gap-3 p-4 animate-pulse">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gray-300" />
      {/* Message content */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-300 rounded w-3/4" />
        <div className="h-4 bg-gray-300 rounded w-1/2" />
      </div>
    </div>
  );
}
```

### Pattern 5: Responsive Chat Layout

**What:** Mobile-first responsive design with Tailwind CSS v4

**When to use:** Always - chat must work across all breakpoints

**Example:**

```typescript
// Source: https://tailwindcss.com/docs/responsive-design
export function ChatWindow() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header - fixed height */}
      <header className="border-b p-4">
        <h1 className="text-lg md:text-xl">Chat with FlowBoard AI</h1>
      </header>

      {/* Messages - flexible, scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />
      </div>

      {/* Input - fixed height, sticky bottom */}
      <div className="border-t p-4">
        <ChatInput onSubmit={sendMessage} disabled={status !== 'ready'} />
      </div>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Fetching without error handling:** Always use useChat's error state and regenerate() for retries
- **Unconditional auto-scroll:** Scrolls user away from content they're reading - use intersection observer
- **Large message arrays without virtualization:** For Phase 4 (20 message limit), virtualization not needed
- **Blocking the stream for persistence:** Phase 3 already uses fire-and-forget pattern - don't await saves
- **Using .then() chains for streaming:** useChat abstracts this - don't manually parse streams

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streaming text parsing | Custom SSE/fetch stream parser | useChat hook from @ai-sdk/react | Handles protocol complexity, reconnection, message accumulation, error recovery |
| Message state management | Custom useState/useReducer for messages | useChat hook | Provides messages array, sendMessage, status, error - battle-tested |
| Scroll position tracking | Manual scroll event listeners + state | IntersectionObserver API | Native, performant, declarative - detects visibility, not just scroll position |
| Date formatting | Custom relative time functions | Intl.RelativeTimeFormat or date-fns | Handles edge cases (timezone, locale, pluralization) |
| Retry logic with backoff | Custom setTimeout retry loops | useChat regenerate() + error state | Built-in retry with proper error handling |

**Key insight:** Streaming chat has many edge cases (connection drops, partial messages, race conditions). The AI SDK's useChat hook handles these - don't reimplement streaming logic manually.

## Common Pitfalls

### Pitfall 1: Not Extracting Custom Headers Before Stream Consumption

**What goes wrong:** Response headers disappear once stream is consumed by useChat

**Why it happens:** fetch() custom function receives response before AI SDK processes it

**How to avoid:** Extract headers in custom fetch() before returning response

**Warning signs:** conversationId stays null, citation sources never populate

```typescript
// CORRECT - Extract headers in custom fetch
fetch: async (url, options) => {
  const response = await fetch(url, options);
  const convId = response.headers.get('X-Conversation-Id'); // Read before stream consumed
  if (convId) setConversationId(convId);
  return response;
}
```

### Pitfall 2: Auto-Scrolling During User Read

**What goes wrong:** UI scrolls to bottom while user is reading older messages

**Why it happens:** useEffect triggers scroll on every new message without checking user position

**How to avoid:** Use IntersectionObserver to track if bottom is visible, only scroll if true

**Warning signs:** User complains they can't read history, scroll position jumps unexpectedly

### Pitfall 3: Forgetting 'use client' Directive

**What goes wrong:** "Hooks can only be used in client components" error

**Why it happens:** useChat requires client-side interactivity (useState, useEffect)

**How to avoid:** Add 'use client' at top of any file using useChat or React hooks

**Warning signs:** Next.js build error about server component hooks

### Pitfall 4: Not Handling Loading States

**What goes wrong:** Blank screen during initial conversation load, no feedback during streaming

**Why it happens:** No UI for intermediate states between "ready" and "messages visible"

**How to avoid:** Show skeleton loading for initial load, typing indicator for streaming

**Warning signs:** Users report "app seems frozen" or "not sure if it's working"

### Pitfall 5: Accessibility Gaps

**What goes wrong:** Screen readers announce every streaming token, keyboard users can't navigate

**Why it happens:** Lack of ARIA labels, improper focus management, no keyboard shortcuts

**How to avoid:**

- Add `aria-live="polite"` to message container (not "assertive" - too noisy during streaming)
- Ensure input field is focusable and has proper label
- Support Enter to send, Escape to clear
- Use semantic HTML (form, button, list)

**Warning signs:** Screen reader reads every token individually, tab navigation skips chat input

### Pitfall 6: Error States Without Recovery

**What goes wrong:** User sees "Something went wrong" but can't retry

**Why it happens:** Error displayed but no retry button, regenerate() not exposed

**How to avoid:** Show error message + retry button that calls regenerate()

**Warning signs:** User must refresh page to retry after network error

### Pitfall 7: Mobile Viewport Issues

**What goes wrong:** Chat input hidden by mobile keyboard, content not scrollable

**Why it happens:** Fixed positioning conflicts with virtual keyboard, viewport units miscalculated

**How to avoid:**

- Use `h-screen` sparingly - prefer flex layouts
- Test on actual mobile devices, not just browser DevTools
- Account for browser chrome and virtual keyboard

**Warning signs:** iOS users report input hidden, Android keyboard overlaps content

## Code Examples

Verified patterns from official sources.

### Complete Chat Window with useChat

```typescript
// Source: https://ai-sdk.dev/docs/getting-started/nextjs-app-router
'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error, regenerate } = useChat({
    api: '/api/chat',
    body: { conversationId },
    fetch: async (url, options) => {
      const response = await fetch(url, options);
      const convId = response.headers.get('X-Conversation-Id');
      if (convId && !conversationId) {
        setConversationId(convId);
      }
      return response;
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get('message') as string;
    if (text.trim()) {
      sendMessage({ text });
      e.currentTarget.reset();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <header className="border-b p-4">
        <h1 className="text-xl font-semibold">FlowBoard AI Support</h1>
        <p className="text-sm text-gray-600">AI assistant - answers based on documentation</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {msg.parts.map((part, i) => (
                <p key={i}>{part.text}</p>
              ))}
            </div>
          </div>
        ))}

        {status === 'streaming' && (
          <div className="flex gap-3">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce delay-100">●</span>
                <span className="animate-bounce delay-200">●</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Something went wrong. Please try again.</p>
            <button
              onClick={() => regenerate()}
              className="mt-2 text-red-600 underline"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            name="message"
            placeholder="Ask a question..."
            disabled={status === 'streaming'}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={status === 'streaming'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
```

### Landing Page with Zero-Friction Demo Entry

```typescript
// Source: Phase requirements + Next.js App Router patterns
export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-4">
            AI Support Chat
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Demo chatbot with RAG-powered answers from knowledge base
          </p>

          {/* Zero-friction CTA */}
          <a
            href="/chat"
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Demo Chat
          </a>

          <p className="mt-4 text-sm text-gray-500">
            No signup required • Instant access
          </p>
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid sm:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-2">Streaming Responses</h3>
            <p className="text-gray-600">See answers appear in real-time</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Knowledge Base RAG</h3>
            <p className="text-gray-600">Answers grounded in documentation</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Conversation History</h3>
            <p className="text-gray-600">Context-aware follow-up questions</p>
          </div>
        </div>
      </div>
    </main>
  );
}
```

### Accessible Chat Input with Keyboard Support

```typescript
// Source: https://www.cognigy.com/product-updates/webchat-accessibility-wcag-best-practices
export function ChatInput({ onSubmit, disabled }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <label htmlFor="chat-input" className="sr-only">
        Message
      </label>
      <textarea
        id="chat-input"
        name="message"
        placeholder="Ask a question..."
        disabled={disabled}
        onKeyDown={handleKeyDown}
        aria-label="Chat message input"
        rows={1}
        className="flex-1 px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={disabled}
        aria-label="Send message"
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual SSE parsing | useChat hook with streaming protocol | AI SDK v6 (2024) | Abstracts protocol complexity, handles reconnection |
| Tailwind v3 config files | Tailwind v4 @import directive | Tailwind v4.0 (2024) | Zero config, 5x faster builds |
| Custom message state | useChat messages array | AI SDK v6 | Automatic state management with streaming updates |
| Manual scroll calculations | IntersectionObserver API | Native browser API (2016+, stable 2020+) | Declarative, performant visibility detection |
| WCAG 2.1 | WCAG 2.2 Level AA | WCAG 2.2 ISO standard (2025) | Added focus appearance, dragging movements, target size requirements |

**Deprecated/outdated:**

- **@tailwind directives in CSS:** Tailwind v4 uses `@import "tailwindcss"` instead
- **AI SDK v5 streamText patterns:** v6 uses `toUIMessageStreamResponse()` with status property
- **React 18 patterns:** Project uses React 19 - be aware of updated hook behaviors

## Open Questions

1. **Conversation history loading strategy**
   - What we know: Phase 3 built conversation persistence but no load endpoint yet
   - What's unclear: Should history load on mount, or only after first message sent?
   - Recommendation: Load on mount if conversationId in URL params, otherwise start fresh. Add GET /api/conversations/[id] endpoint in Phase 4.

2. **Citation display in UI**
   - What we know: Phase 3 returns citation sources via X-Sources header
   - What's unclear: Should citations show inline, in tooltip, or separate panel?
   - Recommendation: Start simple - show sources as expandable section below message. Can enhance with tooltips in future phases.

3. **Message limit enforcement in UI**
   - What we know: API enforces 20 message cap
   - What's unclear: Should UI show warning before limit, or just handle error?
   - Recommendation: Show banner at 15 messages: "5 messages remaining in this conversation. [Start new chat]"

4. **Mobile keyboard handling**
   - What we know: Virtual keyboards can overlap chat input on mobile
   - What's unclear: Best approach for iOS vs Android differences
   - Recommendation: Use `visualViewport` API if available, fallback to `window.innerHeight` tracking. Test on actual devices.

## Sources

### Primary (HIGH confidence)

- [Vercel AI SDK v6 useChat reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) - Complete API surface
- [Vercel AI SDK Next.js App Router guide](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) - Official setup pattern
- [Vercel AI SDK error handling](https://ai-sdk.dev/docs/ai-sdk-ui/error-handling) - Error state and retry patterns
- [Tailwind CSS v4 announcement](https://tailwindcss.com/blog/tailwindcss-v4) - v4 features and migration
- [Tailwind CSS responsive design](https://tailwindcss.com/docs/responsive-design) - Mobile-first breakpoints
- [WCAG 2.2 ISO standard article](https://adaquickscan.com/blog/wcag-2-2-iso-standard-2025) - Accessibility compliance for 2026

### Secondary (MEDIUM confidence)

- [Streaming chat scroll behavior article](https://davelage.com/posts/chat-scroll-react/) - Auto-scroll patterns
- [React Loading Skeleton guide](https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/) - Loading state patterns
- [Cognigy webchat accessibility](https://www.cognigy.com/product-updates/webchat-accessibility-wcag-best-practices) - WCAG chat requirements
- [Smashing Magazine skeleton screens](https://www.smashingmagazine.com/2020/04/skeleton-screens-react/) - Skeleton screen implementation
- [LogRocket AI SDK streaming guide](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/) - Real-time streaming patterns

### Tertiary (LOW confidence - requires validation)

- Multiple Tailwind chat UI examples from CodePen/TailwindFlex - Used for layout inspiration only, not production patterns
- Various React typing animation libraries - Noted but not recommended (useChat handles streaming, no animation library needed)

## Metadata

**Confidence breakdown:**

- useChat integration: HIGH - Official Vercel AI SDK docs, exact API used in Phase 3
- Streaming UI patterns: HIGH - Official AI SDK docs + verified blog posts
- Scroll behavior: MEDIUM - IntersectionObserver is standard but implementation details vary
- Accessibility: HIGH - WCAG 2.2 is ISO standard for 2026, official guidelines
- Responsive design: HIGH - Tailwind v4 docs, project already using it
- Loading states: MEDIUM - Common patterns but no "one true way"

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days - stable ecosystem, AI SDK v6 unlikely to break)

## Notes for Planner

**Critical path items:**

1. ChatWindow component with useChat hook (custom fetch for header extraction)
2. MessageList with IntersectionObserver auto-scroll
3. MessageBubble with user/assistant styling
4. ChatInput with keyboard shortcuts and accessibility
5. TypingIndicator for streaming state
6. Error display with retry button
7. Landing page with demo CTA
8. Responsive layout testing

**Out of scope for Phase 4 (defer to later phases):**

- Dark mode toggle (Phase 5)
- Widget embed (Phase 6)
- Citation tooltip UI (can be basic expandable section for now)
- Conversation history sidebar (future enhancement)
- Message search/filtering (future enhancement)
- File upload in chat (not in requirements)

**Testing priorities:**

1. Streaming works and displays correctly
2. Auto-scroll only triggers when at bottom
3. Error states show retry option
4. Keyboard navigation functional (Tab, Enter, Escape)
5. Screen reader announces messages appropriately (aria-live="polite")
6. Mobile layout functional (test on real devices)
7. Works across Chrome, Firefox, Safari

**Known technical debt:**

- Conversation history loading not implemented yet (need GET endpoint)
- Citation display basic (can enhance with tooltips later)
- No message editing/deletion (out of scope)
- No typing indicators for multiple users (single-user demo)
