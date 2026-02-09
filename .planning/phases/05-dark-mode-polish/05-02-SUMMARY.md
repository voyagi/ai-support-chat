---
phase: 05-dark-mode-polish
plan: 02
subsystem: ui-theming
tags: [dark-mode, admin, animations, motion, micro-interactions, accessibility]
dependency_graph:
  requires: [05-01-dark-mode-infrastructure]
  provides: [admin-dark-mode, message-animations, micro-interactions, reduced-motion]
  affects: [admin-pages, chat-ui, landing-page]
tech_stack:
  added: []
  patterns: [motion-animation, prefers-reduced-motion, scale-micro-interactions]
key_files:
  created: []
  modified:
    - src/app/admin/layout.tsx
    - src/app/admin/login/page.tsx
    - src/app/admin/AdminDashboard.tsx
    - src/components/admin/LoginForm.tsx
    - src/components/admin/UploadZone.tsx
    - src/components/admin/DocumentTable.tsx
    - src/components/admin/ChunkPreview.tsx
    - src/components/chat/MessageBubble.tsx
    - src/components/chat/ChatInput.tsx
    - src/components/chat/TypingIndicator.tsx
    - src/components/ui/ThemeToggle.tsx
    - src/app/page.tsx
    - src/app/globals.css
decisions:
  - title: "Body bg-white/dark:bg-gray-900 for FOUC prevention"
    rationale: "Without explicit body background, initial paint shows default white before next-themes applies"
    alternatives: "CSS-only solution with color-scheme property"
    trade_offs: "Slightly redundant with page-level gradients but prevents visible flash"
  - title: "Motion fade-in/slide-up for message bubbles"
    rationale: "Subtle y:12 + 300ms easeOut creates natural chat feel without being distracting"
    alternatives: "CSS keyframes (simpler but less control), y:20 (too much movement)"
    trade_offs: "Adds motion dependency to MessageBubble, but motion already installed in 05-01"
  - title: "Scale micro-interactions only on primary action buttons"
    rationale: "hover:scale-[1.02]/active:scale-[0.98] adds premium feel without being overdone"
    alternatives: "Scale on all interactive elements (too busy), no scale at all (less polished)"
    trade_offs: "Minimal approach — only CTA, login submit, and send buttons get scale"
metrics:
  duration_minutes: 12
  tasks_completed: 2
  files_modified: 13
  files_created: 0
  commits: 2
  completed_at: "2026-02-09T11:30:00Z"
---

# Phase 5 Plan 2: Admin Dark Mode + Animations Summary

**One-liner:** Admin pages dark-moded, message bubbles animated with Motion, micro-interactions on CTAs, prefers-reduced-motion accessibility.

## What Was Built

### Admin Dark Mode (Task 1 Part A)

Applied comprehensive `dark:` variants to all admin pages:

- **admin/layout.tsx**: Dark nav bar, ThemeToggle next to logout button, dark brand text and hover states
- **admin/login/page.tsx**: Dark gradient background, dark card with shadow, dark heading/subtitle
- **LoginForm.tsx**: Dark input fields, labels, error states, focus rings, submit button
- **AdminDashboard.tsx**: Dark heading, document count badge
- **UploadZone.tsx**: Dark dropzone borders/backgrounds, dark file rows, dark status badges (amber/green/red variants)
- **DocumentTable.tsx**: Dark table container, headers, rows with hover, badges, delete button, expanded row
- **ChunkPreview.tsx**: Dark chunk cards, position text, content text, expand/collapse buttons

### Message Animations (Task 1 Part B)

- Wrapped MessageBubble outer divs in `motion.div` with fade-in/slide-up animation
- `initial={{ opacity: 0, y: 12 }}` → `animate={{ opacity: 1, y: 0 }}`
- 300ms duration with easeOut timing (natural deceleration)
- Applied to both user and assistant message renders

### Micro-Interactions (Task 1 Part C)

- CTA buttons (landing page, login submit): `hover:scale-[1.02] active:scale-[0.98]` with `transition-all duration-200`
- Send button (ChatInput): `hover:scale-105 active:scale-95 transition-all duration-200`
- Focus rings maintained on all interactive elements

### Reduced Motion Support (Task 1 Part D)

- Added `@media (prefers-reduced-motion: reduce)` to globals.css
- Disables all CSS animations and transitions for accessibility
- Motion library also respects this preference automatically

### Human Verification Fixes

Fixes applied during visual testing:

| File | Fix |
|------|-----|
| layout.tsx | Added `bg-white dark:bg-gray-900` to `<body>` to prevent FOUC |
| UploadZone.tsx | Added `dark:text-amber-400/green-400/red-400` to StatusBadge states |
| TypingIndicator.tsx | Dots: `dark:bg-gray-500` changed to `dark:bg-gray-400` for better contrast |
| MessageBubble.tsx | Source cards: `dark:bg-gray-800/50` changed to `dark:bg-gray-700/60` for visibility |

### Human Verification Results

| # | Test | Result |
|---|------|--------|
| 1 | Landing page | PASS |
| 2 | Chat page | PASS |
| 3 | Admin login | PASS |
| 4 | Admin dashboard | PASS |
| 5 | FOUC test | PASS |

## Deviations from Plan

Minor adjustments discovered during human verification — all documented in fixes table above. No architectural changes.

## Verification Results

### Build & Lint

```bash
✓ npm run build - compiled successfully
✓ npm run check - Biome passed
✓ dark: variants in admin/layout.tsx (5+ occurrences)
✓ motion import and usage in MessageBubble.tsx (5 occurrences)
✓ prefers-reduced-motion in globals.css
✓ Human verified all pages in both light and dark modes
```

## Self-Check: PASSED

### Commits Verified

```bash
✓ bdf9f40 - feat(05-02): apply dark mode to admin and add animations
✓ a80964d - fix(05-02): polish dark mode contrast and prevent FOUC
```

### Modified Files Verified

All 13 files contain expected dark: variants, motion animations, and micro-interactions.

## What's Solid

- **Complete coverage**: Every page in the app now has dark mode support (landing, chat, admin login, admin dashboard)
- **ThemeToggle in 3 locations**: Landing page (fixed top-right), chat header, admin nav bar
- **Natural animations**: 300ms fade-in/slide-up on messages feels premium without being slow
- **Accessibility**: prefers-reduced-motion disables all animations globally
- **FOUC prevention**: Body background + next-themes blocking script = no flash

## What's Risky

Nothing significant. Very low risk:

- New admin components added in future phases need manual dark: variant addition
- Motion animation on every message could accumulate if conversation has 50+ messages (negligible performance impact)

## Trade-offs Made

1. **Subtle scale transforms**: Only 1.02x/0.98x on CTAs — enough to feel premium without being gimmicky
2. **Global reduced-motion**: Blanket `!important` override is aggressive but ensures no animation leaks through
3. **Body bg fix**: Slightly redundant with page gradients but critical for FOUC prevention

## Performance Impact

- **Bundle size**: No new dependencies (motion already installed in 05-01)
- **Runtime cost**: Motion animations use GPU-accelerated transforms (opacity, translateY)
- **Lighthouse**: No expected impact — animations don't affect FCP/LCP
