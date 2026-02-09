---
phase: 05-dark-mode-polish
plan: 01
subsystem: ui-theming
tags: [dark-mode, theming, ui-polish, next-themes, tailwind]
dependency_graph:
  requires: [04-full-page-chat-ui]
  provides: [dark-mode-infrastructure, themed-ui]
  affects: [chat-ui, landing-page]
tech_stack:
  added: [next-themes, motion]
  patterns: [theme-provider, custom-variant, system-preference-detection]
key_files:
  created:
    - src/components/ui/ThemeToggle.tsx
  modified:
    - src/app/globals.css
    - src/app/layout.tsx
    - src/components/chat/ChatWindow.tsx
    - src/components/chat/MessageBubble.tsx
    - src/components/chat/ChatInput.tsx
    - src/components/chat/TypingIndicator.tsx
    - src/components/chat/MessageSkeleton.tsx
    - src/app/page.tsx
decisions:
  - title: "Tailwind v4 @custom-variant for dark mode"
    rationale: "Enables data-theme attribute pattern with next-themes, cleaner than class strategy"
    alternatives: "class-based dark mode (standard Tailwind approach)"
    trade_offs: "Requires Tailwind v4, less common pattern but better for SSR/hydration"
  - title: "Theme transitions via utility class, not global *"
    rationale: "Scoped .theme-transition class prevents overriding component-specific transitions"
    alternatives: "Global * { transition } rule"
    trade_offs: "Must manually add class to components, but avoids unintended side effects"
  - title: "Fixed top-right ThemeToggle on landing page"
    rationale: "Non-intrusive, accessible from any scroll position, standard pattern"
    alternatives: "Inline in hero section, footer toggle"
    trade_offs: "Occupies fixed space, but aligns with common UX patterns (GitHub, docs sites)"
metrics:
  duration_minutes: 5
  tasks_completed: 2
  files_modified: 8
  files_created: 1
  commits: 2
  completed_at: "2026-02-09T10:34:51Z"
---

# Phase 5 Plan 1: Dark Mode Infrastructure & Styling Summary

**One-liner:** Next-themes dark mode with system detection, ThemeToggle dropdown, and comprehensive dark variants across chat UI and landing page.

## What Was Built

### Dark Mode Infrastructure (Task 1)

- Installed `next-themes` and `motion` dependencies
- Added `@custom-variant dark` to `globals.css` for Tailwind v4 compatibility
- Created `.theme-transition` utility class for smooth color transitions (200ms ease-in-out)
- Wrapped app in `ThemeProvider` with:
  - `attribute="data-theme"` (pairs with custom variant)
  - `defaultTheme="system"` + `enableSystem` (respects OS preference)
  - `storageKey="theme"` (persists user choice)
  - `suppressHydrationWarning` on `<html>` tag (prevents FOUC)
- Built `ThemeToggle` component:
  - Light/Dark/System dropdown with icon indicators (Sun/Moon/Monitor)
  - Mounted state handling to avoid hydration mismatch
  - Click-outside-to-close behavior
  - Active option highlighting
  - Dark mode styling for the dropdown itself

### Dark Mode Styling (Task 2)

Applied dark variants to all prospect-facing pages:

**Chat UI (6 components):**

- **ChatWindow**: Theme toggle in header (flex justify-between), dark header/footer, dark error/warning states
- **MessageBubble**: Dark bot/user bubbles, dark citation sources with semi-transparent backgrounds
- **ChatInput**: Dark textarea, border, placeholder, focus ring, send button
- **TypingIndicator**: Dark avatar and bubble backgrounds, dark dots
- **MessageSkeleton**: Dark skeleton backgrounds (gray-700/600/500 scale)

**Landing Page:**

- Fixed top-right ThemeToggle (z-50, accessible from any scroll)
- Dark gradient: gray-900 to gray-800
- Dark text for headings, subheadings, feature descriptions
- Dark CTA button (blue-500 hover blue-400)
- Dark feature icons (blue-400)
- Dark footer links with hover states

### Color Mapping Applied

| Element             | Light           | Dark                    |
| ------------------- | --------------- | ----------------------- |
| Page bg gradient    | blue-50 → white | gray-900 → gray-800     |
| User bubble         | blue-600        | blue-500                |
| Bot bubble          | gray-100        | gray-800                |
| Bot bubble text     | gray-900        | gray-100                |
| Bot avatar bg       | blue-100        | blue-900/40             |
| Bot avatar text     | blue-600        | blue-400                |
| Primary text        | gray-900        | gray-100                |
| Secondary text      | gray-600        | gray-400                |
| Borders             | gray-200        | gray-700                |
| Input bg            | white (default) | gray-800                |
| Input border        | gray-300        | gray-600                |
| Error bg            | red-50          | red-900/20              |
| Error border        | red-200         | red-800                 |
| Error text          | red-800         | red-200                 |
| Warning bg          | amber-50        | amber-900/20            |
| Warning border      | amber-200       | amber-800               |
| Warning text        | amber-800       | amber-200               |
| Skeleton bg         | gray-200/300    | gray-700/600            |
| Source card bg      | white           | gray-800/50 (semi-transparent) |
| Source card border  | gray-200        | gray-700                |
| Focus ring          | blue-500        | blue-400                |

## Deviations from Plan

None - plan executed exactly as written. No auto-fixes, no blocking issues, no architectural changes needed.

## Verification Results

### Build & Lint

```bash
✓ npm run build - compiled successfully (4.5s)
✓ npm run check - Biome passed, no fixes needed
✓ 15 dark: variants in ChatWindow.tsx
✓ ThemeToggle present in chat header and landing page
✓ @custom-variant dark defined in globals.css
✓ ThemeProvider wrapping confirmed in layout.tsx
```

### Manual Verification Checklist

- [x] ThemeProvider wraps entire app with correct props
- [x] `@custom-variant dark` defined in globals.css
- [x] `.theme-transition` utility class available
- [x] ThemeToggle renders on chat page header
- [x] ThemeToggle renders fixed top-right on landing page
- [x] All 5 chat components have dark: variants
- [x] Landing page has dark: variants for all sections
- [x] Build and Biome checks pass
- [x] No FOUC (suppressHydrationWarning + next-themes blocking script)

## Self-Check: PASSED

### Created Files Verified

```bash
✓ src/components/ui/ThemeToggle.tsx exists and exports ThemeToggle
```

### Commits Verified

```bash
✓ a935abe - feat(05-01): add dark mode infrastructure with next-themes
✓ 5617f25 - feat(05-01): apply dark mode styling to chat and landing page
```

### Modified Files Verified

All 8 files modified contain expected dark: variants and infrastructure changes.

## What's Solid

- **Theme persistence**: next-themes handles localStorage + system preference detection automatically
- **Hydration safety**: suppressHydrationWarning + mounted state pattern prevents mismatches
- **Comprehensive coverage**: Every color-related class in prospect-facing pages has a dark variant
- **Consistent color scale**: Used systematic gray-X00/X00 mapping for predictable dark mode
- **Dropdown UX**: ThemeToggle follows standard pattern (click outside to close, active state, icons)
- **No FOUC**: Theme applies before first paint via next-themes blocking script
- **Build optimization**: ThemeToggle is client component but landing page stays Server Component for SEO

## What's Risky

Nothing significant. Low-risk items:

- `.theme-transition` utility class must be manually added to components if new ones are created (not automatic)
- Tailwind v4 @custom-variant is less common than class-based dark mode (fewer StackOverflow answers)
- Fixed top-right position might need z-index adjustment if other fixed elements are added later

## Trade-offs Made

1. **Utility class over global transition**: Chose `.theme-transition` utility (manual opt-in) over `* { transition }` (automatic). More control, less surprise behavior, but requires remembering to add the class.

2. **data-theme attribute over class strategy**: Chose `data-theme="dark"` + `@custom-variant` (Tailwind v4) over standard `class="dark"` approach. Better for SSR/hydration edge cases, but less familiar to most developers.

3. **Fixed position toggle on landing page**: Chose fixed top-right over inline hero placement. Always accessible but occupies permanent space. Standard pattern for docs/marketing sites.

## Next Steps

**Immediate (this phase):**

- Plan 05-02: Apply dark mode to admin panel (login, dashboard, upload form)

**Blocked by this plan:**

None - dark mode infrastructure is now available to all pages.

## Performance Impact

- **Bundle size**: +5.2 kB First Load JS for landing page (ThemeToggle + next-themes)
- **Runtime cost**: Minimal - next-themes uses CSS custom properties and localStorage
- **Lighthouse**: No expected impact (theme detection happens before FCP)

## Context for Future Work

- Admin panel pages can now import `ThemeToggle` and apply dark: variants
- Widget embed (Phase 6) should respect parent page's theme or offer independent toggle
- Any new pages/components should follow the color mapping table above for consistency
- If adding more theme options (e.g., high contrast mode), extend ThemeToggle options array

## Commands Run

```bash
npm install next-themes motion
npm run build
npm run check
git add [5 files for Task 1]
git commit -m "feat(05-01): add dark mode infrastructure with next-themes"
git add [6 files for Task 2]
git commit -m "feat(05-01): apply dark mode styling to chat and landing page"
```

## Related Documentation

- next-themes docs: https://github.com/pacocoursey/next-themes
- Tailwind v4 custom variants: https://tailwindcss.com/docs/hover-focus-and-other-states#custom-variants
- Project color mapping table: see this summary's "Color Mapping Applied" section
