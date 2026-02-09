---
phase: 04-full-page-chat-ui
plan: 01
subsystem: ui
tags: [react, ai-sdk, streaming, chat-ui, tailwind, lucide-react]

dependency_graph:
  requires:
    - phase: 03-chat-api-streaming
      plan: 02
      provides: "POST /api/chat streaming endpoint with RAG, citations, and conversation persistence"
  provides:
    - "ChatWindow component with AI SDK v6 useChat hook integration"
    - "Full-page /chat route with streaming message display"
    - "Presentational chat components (MessageBubble, ChatInput, TypingIndicator, MessageSkeleton)"
    - "IntersectionObserver-based auto-scroll that respects user scroll position"
    - "Citation sources display with expandable sections"
    - "Error handling with retry capability"
  affects:
    - phase: 05-widget
      reason: "Widget will reuse ChatWindow and presentational components"
    - phase: 06-landing
      reason: "Landing page will link to /chat route"

tech_stack:
  added:
    - "@ai-sdk/react@3.0.79 for React hooks integration with AI SDK v6"
  patterns:
    - "AI SDK v6 Chat + DefaultChatTransport pattern for API communication"
    - "Custom fetch function to extract response headers (X-Conversation-Id, X-Sources)"
    - "IntersectionObserver for intelligent auto-scroll (only when user at bottom)"
    - "UIMessage parts extraction helper for text content rendering"
    - "Status-based UI rendering (streaming, ready, error states)"

key_files:
  created:
    - src/components/chat/MessageBubble.tsx
    - src/components/chat/ChatInput.tsx
    - src/components/chat/TypingIndicator.tsx
    - src/components/chat/MessageSkeleton.tsx
    - src/components/chat/ChatWindow.tsx
    - src/app/chat/page.tsx
  modified:
    - package.json
    - package-lock.json

decisions:
  - "AI SDK v6 architecture uses Chat instance with DefaultChatTransport instead of direct useChat config"
  - "UIMessage has parts array (not content string) - created getMessageText helper to extract text parts"
  - "sendMessage expects {text: string} not {role, content} format"
  - "Filter out system messages from display - only show user/assistant messages"
  - "Message limit warning triggers at 30 messages (15 exchanges) to prevent hitting API cap"
  - "useMemo for Chat instance to prevent recreation on every conversationId change"
  - "Custom fetch intercepts headers before AI SDK consumes the stream"

patterns_established:
  - "Presentational components accept primitive props (no AI SDK types exposed)"
  - "Container components handle AI SDK integration and state management"
  - "Bot identity (Flo name, avatar, subtitle) displayed in header"
  - "Empty state shows welcome message from Flo with bot avatar"
  - "Citation sources stored in sourcesMap keyed by message ID"
  - "Pending sources (_pending key) associated with latest assistant message once ID available"

metrics:
  duration: 16 minutes
  completed: 2026-02-09
  tasks_completed: 2
  files_created: 6
  commits: 2
---

# Phase 4 Plan 01: Full-Page Chat UI Summary

**Complete streaming chat interface with AI SDK v6 useChat integration, IntersectionObserver auto-scroll, citation sources display, error recovery, and responsive mobile-first design**

## Performance

- **Duration:** 16 min
- **Started:** 2026-02-09T07:32:32Z
- **Completed:** 2026-02-09T07:48:46Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Built 4 presentational chat components (MessageBubble, ChatInput, TypingIndicator, MessageSkeleton) with proper accessibility
- Created ChatWindow container integrating AI SDK v6's useChat hook with DefaultChatTransport
- Implemented /chat page route with proper metadata
- Intelligent auto-scroll using IntersectionObserver (scrolls only when user at bottom)
- Citation sources extraction from X-Sources header with expandable UI
- Error handling with regenerate() retry button
- Message limit warning at 30 messages with "Start new chat" option
- Responsive layout with mobile-first Tailwind CSS

## Task Commits

Each task was committed atomically:

1. **Task 1: Build presentational chat components** - `7753fe1` (feat)
   - MessageBubble with user/assistant styling, sources display
   - ChatInput with Enter-to-send, useId for accessibility
   - TypingIndicator with staggered bounce animation
   - MessageSkeleton for loading states

2. **Task 2: Build ChatWindow container and /chat page** - `cfe00f1` (feat)
   - ChatWindow with AI SDK v6 Chat + DefaultChatTransport
   - IntersectionObserver auto-scroll
   - Custom fetch for header extraction
   - /chat page route

## Files Created/Modified

**Created:**
- `src/components/chat/MessageBubble.tsx` - User/assistant message display with role-based styling and expandable citation sources
- `src/components/chat/ChatInput.tsx` - Textarea input with Enter-to-send, Shift+Enter for newlines, disabled state during streaming
- `src/components/chat/TypingIndicator.tsx` - Animated three-dot indicator for streaming state
- `src/components/chat/MessageSkeleton.tsx` - Loading placeholder mimicking message layout
- `src/components/chat/ChatWindow.tsx` - Main chat container with useChat integration, auto-scroll, error handling
- `src/app/chat/page.tsx` - Full-page chat route

**Modified:**
- `package.json` - Added @ai-sdk/react dependency
- `package-lock.json` - Updated lockfile

## Decisions Made

**AI SDK v6 Architecture Discovery:**
- AI SDK v6 uses `Chat` class + `DefaultChatTransport` pattern, not direct config in useChat
- `useChat` accepts `{ chat: Chat }` where Chat instance contains transport configuration
- `DefaultChatTransport` accepts `api`, `body`, `fetch` options for HTTP communication

**API Differences from Research:**
- `sendMessage` expects `{ text: string }` not `{ role, content }` structure
- `UIMessage` has `parts` array (not `content` string) - created helper to extract text parts
- Messages can include `role: "system"` which must be filtered from UI display
- Status is `"streaming" | "submitted" | "ready" | "error"` not just boolean `isLoading`

**Header Extraction:**
- Custom fetch function must extract headers BEFORE returning response (headers consumed by streaming)
- Sources stored in temporary `_pending` key, then associated with message ID once available

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Missing Dependency] Installed @ai-sdk/react package**
- **Found during:** Task 2 build attempt
- **Issue:** Plan assumed `useChat` from `ai/react` but AI SDK v6 uses separate `@ai-sdk/react` package
- **Fix:** Ran `npm install @ai-sdk/react` to add React hooks package
- **Files modified:** package.json, package-lock.json
- **Verification:** Build passes, imports resolve correctly
- **Committed in:** cfe00f1 (Task 2 commit)

**2. [Rule 1 - API Incompatibility] Updated to AI SDK v6 Chat + Transport pattern**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** Direct `api`, `body`, `fetch` config not valid for useChat - v6 uses Chat instance with transport
- **Fix:** Created Chat instance with DefaultChatTransport, passed to useChat as `{ chat }`
- **Files modified:** src/components/chat/ChatWindow.tsx
- **Verification:** TypeScript compiles, types match AI SDK v6 API
- **Committed in:** cfe00f1 (Task 2 commit)

**3. [Rule 1 - Type Mismatch] Changed sendMessage call to use {text} format**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** sendMessage signature expects `{ text: string }` not `{ role, content }` structure
- **Fix:** Updated handleSendMessage to pass `{ text: message }` instead of `{ role: "user", content: message }`
- **Files modified:** src/components/chat/ChatWindow.tsx
- **Verification:** TypeScript compiles with no errors
- **Committed in:** cfe00f1 (Task 2 commit)

**4. [Rule 1 - Data Structure] Created getMessageText helper for UIMessage parts extraction**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** UIMessage has `parts: Array<UIMessagePart>` not `content: string` - cannot access `msg.content` directly
- **Fix:** Created helper function to filter text parts and extract text content
- **Files modified:** src/components/chat/ChatWindow.tsx
- **Verification:** TypeScript compiles, text renders correctly in MessageBubble
- **Committed in:** cfe00f1 (Task 2 commit)

**5. [Rule 1 - Type Safety] Filter system messages and cast role type**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** UIMessage role includes "system" but MessageBubble only accepts "user" | "assistant"
- **Fix:** Filter messages where `role !== "system"` and cast to `"user" | "assistant"`
- **Files modified:** src/components/chat/ChatWindow.tsx
- **Verification:** TypeScript compiles, only user/assistant messages display
- **Committed in:** cfe00f1 (Task 2 commit)

**6. [Rule 1 - Linting] Fixed unused import and hardcoded ID warnings**
- **Found during:** Task 1 Biome check
- **Issue:** Unused `cn` import in MessageBubble, hardcoded "chat-input" ID in ChatInput
- **Fix:** Removed unused import, used React useId() hook for dynamic ID generation
- **Files modified:** src/components/chat/MessageBubble.tsx, src/components/chat/ChatInput.tsx
- **Verification:** Biome check passes with no errors
- **Committed in:** 7753fe1 (Task 1 commit)

**7. [Rule 1 - Dependency Issue] Added biome-ignore comment for useEffect dependency**
- **Found during:** Task 2 Biome check
- **Issue:** Biome flagged `messages.length` as unnecessary dependency in auto-scroll useEffect
- **Fix:** Added `biome-ignore` comment explaining that messages.length triggers scroll on new messages
- **Files modified:** src/components/chat/ChatWindow.tsx
- **Verification:** Biome check passes, scroll behavior correct
- **Committed in:** cfe00f1 (Task 2 commit)

---

**Total deviations:** 7 auto-fixed (5 API incompatibilities, 1 missing dependency, 1 linting)
**Impact on plan:** All auto-fixes were necessary adaptations to AI SDK v6's actual API surface (different from research expectations). No scope creep - all planned functionality delivered.

## Issues Encountered

**AI SDK v6 API Differences:**
- Research file referenced older or different version of AI SDK
- Actual v6 uses Chat + Transport pattern, not direct hook configuration
- Message structure uses `parts` array instead of `content` string
- Required multiple iterations to discover correct API usage through TypeScript errors and type definitions

**Resolution:** Inspected `@ai-sdk/react` and `ai` package type definitions directly to understand correct usage patterns. All issues resolved through proper API usage per official type definitions.

## User Setup Required

None - no external service configuration required. All dependencies installed automatically via npm.

## Next Phase Readiness

Ready for Phase 4 Plan 2 (if additional chat UI features) or Phase 5 (widget implementation).

**What's ready:**
- Complete chat UI component tree
- Streaming text display working
- Citation sources extracted and displayed
- Error recovery with retry
- Conversation persistence via API
- Responsive mobile-first layout

**No blockers.**

---
*Phase: 04-full-page-chat-ui*
*Completed: 2026-02-09*

## Self-Check: PASSED

All files created and verified:

```
✓ FOUND: src/components/chat/MessageBubble.tsx
✓ FOUND: src/components/chat/ChatInput.tsx
✓ FOUND: src/components/chat/TypingIndicator.tsx
✓ FOUND: src/components/chat/MessageSkeleton.tsx
✓ FOUND: src/components/chat/ChatWindow.tsx
✓ FOUND: src/app/chat/page.tsx
```

All commits exist:

```
✓ FOUND: 7753fe1 (Task 1 - presentational components)
✓ FOUND: cfe00f1 (Task 2 - ChatWindow and page route)
```

Build verification:

```
✓ npm run build exits 0
✓ npm run check exits 0
✓ No TypeScript errors
✓ All 6 components export correctly
```
