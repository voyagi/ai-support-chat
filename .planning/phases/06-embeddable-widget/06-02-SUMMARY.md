---
phase: 06-embeddable-widget
plan: 02
subsystem: widget
tags: [rollup, iife, vanilla-js, responsive, postmessage]

# Dependency graph
requires:
  - phase: 06-01
    provides: Widget page route at /widget
provides:
  - Widget loader IIFE source with bubble button and iframe container
  - Rollup build pipeline producing standalone public/widget.js bundle
  - Responsive layout (mobile fullscreen, desktop windowed)
  - PostMessage bridge for parent-iframe communication
affects: [06-03]

# Tech tracking
tech-stack:
  added: [rollup, @rollup/plugin-typescript, @rollup/plugin-terser]
  patterns: [IIFE pattern for external scripts, inline styles to avoid conflicts, responsive breakpoint at 768px]

key-files:
  created:
    - src/widget-loader/index.ts
    - rollup.config.mjs
    - public/widget.js
  modified:
    - package.json
    - biome.json
    - .gitignore

key-decisions:
  - "Vanilla TypeScript IIFE (no React/Next.js dependencies) for maximum compatibility"
  - "Rollup with TypeScript and Terser plugins for minified standalone bundle"
  - "Inline styles only (no CSS classes) to prevent host page style conflicts"
  - "768px breakpoint: mobile fullscreen below, desktop windowed above"
  - "PostMessage bridge for WIDGET_READY and RESIZE events"
  - "Configuration via script data attributes (data-widget-url, data-theme, data-position)"
  - "Origin validation on postMessage to prevent spoofing"
  - "public/widget.js gitignored as build artifact, rebuilt on Vercel deploy"

patterns-established:
  - "IIFE self-executing function pattern for external script embedding"
  - "Prefixed element IDs (ai-chat-widget-*) to avoid host page conflicts"
  - "Responsive layout via window.resize + orientationchange listeners"
  - "Bubble hides on mobile when widget open (fullscreen covers it)"

# Metrics
duration: 4min
completed: 2026-02-09
---

# Phase 6 Plan 2: Widget Loader IIFE Summary

**Standalone widget loader script with bubble button, responsive iframe container, and postMessage bridge — 2.9KB minified bundle**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-09T12:47:19Z
- **Completed:** 2026-02-09T12:51:55Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Widget loader IIFE source with vanilla TypeScript (no framework dependencies)
- Rollup build pipeline producing 2.9KB minified bundle at public/widget.js
- Bubble button with chat/close icon toggle and hover scale effect
- Responsive iframe container (mobile fullscreen < 768px, desktop windowed >= 768px)
- PostMessage bridge for WIDGET_READY and THEME_UPDATE events
- Configuration extraction from script tag data attributes
- Origin validation to prevent message spoofing

## Task Commits

Each task was committed atomically:

1. **Task 1: Create widget loader IIFE source** - `6193759` (feat)
   - src/widget-loader/index.ts (208 lines)
   - Bubble button with inline SVG icons
   - Iframe container with responsive layout logic
   - PostMessage listener with origin validation
   - DOM mounting with readyState check

2. **Task 2: Configure Rollup build and npm script** - `c88b134` (chore)
   - rollup.config.mjs with TypeScript + Terser plugins
   - package.json: build:widget script, updated build script
   - biome.json: added src/widget-loader to includes
   - .gitignore: added public/widget.js
   - npm install: rollup, @rollup/plugin-typescript, @rollup/plugin-terser

**Plan metadata:** (not yet committed - will be committed with STATE.md update)

## Files Created/Modified

**Created:**
- `src/widget-loader/index.ts` - Widget loader IIFE source (vanilla TypeScript, 208 lines)
- `rollup.config.mjs` - Rollup configuration for IIFE bundling with TypeScript and Terser
- `public/widget.js` - Minified widget bundle (2.9KB, gitignored build artifact)

**Modified:**
- `package.json` - Added build:widget script, updated build to run Rollup first
- `biome.json` - Added src/widget-loader/** to includes for linting
- `.gitignore` - Added /public/widget.js (build artifact)

## Decisions Made

**IIFE pattern for external embedding:**
- Vanilla TypeScript with no React/Next.js dependencies ensures the loader works on any website
- Self-executing function wraps all widget code to avoid global namespace pollution
- Standalone bundle size: 2.9KB (well under 10KB target)

**Inline styles to prevent conflicts:**
- All styles applied via Object.assign(el.style, {...}) instead of CSS classes
- Prevents host page styles from breaking widget layout
- Element IDs prefixed with `ai-chat-widget-*` to avoid collisions

**Responsive layout breakpoint at 768px:**
- Mobile (<768px): fullscreen layout with safe-area-inset padding for notched devices
- Desktop (>=768px): windowed 400x600px container, bottom-right positioning
- Bubble hides when widget opens on mobile (fullscreen covers bubble anyway)

**Configuration via script tag data attributes:**
- `data-widget-url`: Base URL of the app (falls back to inferring from script src)
- `data-theme`: Initial theme (light/dark)
- `data-position`: Reserved for future customization
- Follows standard embed script pattern (like Google Analytics)

**PostMessage bridge:**
- Parent listens for WIDGET_READY from iframe, responds with THEME_UPDATE
- Origin validation prevents other iframes from spoofing messages
- RESIZE event stored for potential future dynamic height

**Rollup build pipeline:**
- TypeScript plugin with standalone compilerOptions (ignores project tsconfig.json)
- Terser minification with drop_console: false (keep "Widget loaded" log)
- Output format: IIFE with name "AIChat"
- include: ["src/widget-loader/**/*.ts"] prevents type-checking entire project

**Build artifact handling:**
- public/widget.js gitignored as build artifact
- Vercel runs `npm run build` which includes `rollup -c` step
- Widget rebuilt on every deploy automatically

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Rollup TypeScript plugin type-checking entire project**
- **Found during:** Task 2 (npm run build:widget)
- **Issue:** @rollup/plugin-typescript was attempting to type-check all src/ files, causing errors about missing @/ path aliases in non-widget files
- **Fix:** Added `include: ["src/widget-loader/**/*.ts"]` and `skipLibCheck: true` to Rollup TypeScript plugin config to limit scope to widget-loader directory only
- **Files modified:** rollup.config.mjs
- **Verification:** `npm run build:widget` succeeds, produces public/widget.js without type errors
- **Committed in:** c88b134 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fix was necessary to complete the build. Widget loader is self-contained with no imports, so limiting TypeScript plugin scope was the correct solution.

## Issues Encountered

None - build pipeline works correctly after TypeScript plugin scope fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 06-03 (Widget embed demo page). The widget loader bundle is built and ready to be embedded via script tag. Next plan will create a demo page showing host site integration.

**Blockers:** None
**Concerns:** None - bundle size is excellent (2.9KB), all functionality implemented as specified

---
*Phase: 06-embeddable-widget*
*Completed: 2026-02-09*

## Self-Check: PASSED

All claimed files and commits verified:

**Files:**
- ✓ src/widget-loader/index.ts exists
- ✓ rollup.config.mjs exists
- ✓ public/widget.js exists (2888 bytes, under 10KB target)

**Commits:**
- ✓ 6193759 (feat: widget loader IIFE source)
- ✓ c88b134 (chore: Rollup build configuration)
