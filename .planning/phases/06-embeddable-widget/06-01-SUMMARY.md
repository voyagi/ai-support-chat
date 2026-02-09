---
phase: 06-embeddable-widget
plan: 01
subsystem: ui
tags: [iframe, postMessage, widget, next-themes, ChatWindow]

# Dependency graph
requires:
  - phase: 04-full-page-chat-ui
    provides: ChatWindow component with full chat interface
  - phase: 05-dark-mode-polish
    provides: ThemeProvider and dark mode support
provides:
  - Widget iframe page at /widget rendering ChatWindow in compact mode
  - postMessage protocol for iframe-parent communication (WIDGET_READY, RESIZE, THEME_UPDATE)
  - Widget mode prop for ChatWindow (hides header, uses h-full container)
affects: [06-02-widget-embed, 06-03-widget-loader]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Widget mode prop pattern for component variants (widget vs full-page)"
    - "postMessage communication with origin validation"
    - "ResizeObserver for dynamic iframe height reporting"
    - "Minimal iframe layout pattern (no duplicate chrome)"

key-files:
  created:
    - src/app/widget/page.tsx
    - src/app/widget/layout.tsx
  modified:
    - src/components/chat/ChatWindow.tsx

key-decisions:
  - "Widget layout does NOT duplicate ThemeProvider (root layout already provides it)"
  - "postMessage uses '*' targetOrigin for iframe→parent (no sensitive data, parent origin unknown at build time)"
  - "Origin validation for parent→iframe messages (dev: all origins, prod: NEXT_PUBLIC_APP_URL only)"
  - "ResizeObserver on document.body for height tracking (reports to parent for dynamic iframe sizing)"
  - "widget mode uses h-full instead of h-screen to fill iframe container"

patterns-established:
  - "Component mode props (widget?: boolean) for dual-context usage"
  - "postMessage protocol with type-based message routing"
  - "Origin validation pattern for cross-origin iframe security"

# Metrics
duration: 3min
completed: 2026-02-09
---

# Phase 6 Plan 1: Widget Iframe Page Summary

**Widget iframe page with ChatWindow in compact mode, postMessage communication for theme sync, height reporting, and ready signaling**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-09T12:47:14Z
- **Completed:** 2026-02-09T12:50:47Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- ChatWindow component supports widget mode (no header, h-full container)
- Widget page at /widget renders minimal chat interface for iframe embedding
- bidirectional postMessage communication wired for parent-iframe coordination

## Task Commits

Each task was committed atomically:

1. **Task 1: Add widget mode to ChatWindow component** - `6ee3231` (feat)
2. **Task 2: Create widget iframe page with postMessage communication** - `8603799` (feat)

## Files Created/Modified

- `src/components/chat/ChatWindow.tsx` - Added optional widget prop (hides header, uses h-full)
- `src/app/widget/page.tsx` - Widget iframe content with postMessage protocol
- `src/app/widget/layout.tsx` - Minimal layout for iframe (noindex, overflow-hidden)

## Decisions Made

Widget layout ThemeProvider handling: Widget layout does NOT add a second ThemeProvider. The root layout already wraps all pages (including /widget) with ThemeProvider. Widget page uses useTheme() from that existing provider and overrides via postMessage.

postMessage targetOrigin strategy:

- iframe→parent messages use `"*"` (parent origin unknown at build time, no sensitive data sent)
- parent→iframe messages validate origin (dev: allow all, prod: check NEXT_PUBLIC_APP_URL)

Height tracking: ResizeObserver on document.body sends RESIZE messages to parent whenever content height changes, enabling dynamic iframe sizing.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Widget iframe page complete. Ready for:

- Phase 06-02: Widget embed component (renders iframe + bubble UI)
- Phase 06-03: Widget loader script (client-side initialization)

No blockers.

## Self-Check: PASSED

All claimed files verified:

- FOUND: src/app/widget/page.tsx
- FOUND: src/app/widget/layout.tsx
- FOUND: src/components/chat/ChatWindow.tsx

All claimed commits verified:

- FOUND: 6ee3231 (Task 1)
- FOUND: 8603799 (Task 2)

---
*Phase: 06-embeddable-widget*
*Completed: 2026-02-09*
