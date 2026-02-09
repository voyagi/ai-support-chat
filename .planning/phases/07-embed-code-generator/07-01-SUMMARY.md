---
phase: 07-embed-code-generator
plan: 01
subsystem: admin-ui
tags: [embed-code, admin-panel, ui-components, copy-to-clipboard]
dependency_graph:
  requires:
    - phase: 06
      plan: 02
      reason: "Widget loader pattern with data attributes"
    - phase: 05
      plan: 01
      reason: "Dark mode Tailwind classes"
  provides:
    - capability: "embed-code-generator"
      description: "Self-service widget embed code with visual config"
      consumers: ["admin-users"]
  affects:
    - component: "admin-navigation"
      change: "Added Embed Widget nav link"
    - component: "admin-dashboard"
      change: "Added Get Embed Code CTA"
tech_stack:
  added: []
  patterns:
    - "Client component with useState config management"
    - "Hand-rolled HTML tokenizer for syntax highlighting"
    - "postMessage protocol for iframe config updates"
    - "useId for accessible form controls"
key_files:
  created:
    - path: "src/components/admin/ConfigPanel.tsx"
      purpose: "Widget config controls (position, theme, greeting)"
      loc: 98
    - path: "src/components/admin/CodeBlock.tsx"
      purpose: "Syntax-highlighted code block with copy button"
      loc: 115
    - path: "src/components/admin/BrowserPreview.tsx"
      purpose: "Browser mockup frame with widget iframe"
      loc: 59
    - path: "src/components/admin/EmbedPage.tsx"
      purpose: "Two-column embed page layout"
      loc: 68
    - path: "src/app/admin/embed/page.tsx"
      purpose: "Auth-protected embed page route"
      loc: 14
  modified:
    - path: "src/app/admin/layout.tsx"
      changes: "Added Knowledge Base and Embed Widget nav links"
    - path: "src/app/admin/AdminDashboard.tsx"
      changes: "Added Get Embed Code CTA button"
decisions: []
metrics:
  duration_minutes: 5
  tasks_completed: 2
  files_created: 5
  files_modified: 2
  commits: 2
  completed_at: "2026-02-09T16:24:14Z"
---

# Phase 07 Plan 01: Embed Code Generator Summary

**One-liner:** Self-service embed code page with live config, syntax-highlighted code block, copy-to-clipboard, and browser mockup preview

## What Was Built

Built the complete `/admin/embed` page with a two-column layout: configuration controls on the left (position, theme, custom greeting), syntax-highlighted code block with copy button, and browser mockup with live iframe preview on the right. Admin navigation now includes "Embed Widget" link and dashboard has "Get Embed Code" CTA.

### Component Architecture

**ConfigPanel** - Three form controls (position select, theme select, greeting textarea) with React `useId()` for accessibility. Updates parent config state via `onChange` callback.

**CodeBlock** - Hand-rolled HTML tokenizer using regex to parse script tags into tokens (tag, attr, string, text). Renders with fixed dark background (`bg-gray-900`) and colored syntax tokens (pink tags, cyan attributes, green strings, gray text). Copy button uses Clipboard API with 2-second checkmark feedback.

**BrowserPreview** - Browser mockup with macOS window dots, fake address bar, and iframe pointing to `/widget`. Uses `useEffect` to send config updates via postMessage when config changes. Handles iframe load event to ensure config reaches the widget.

**EmbedPage** - Parent client component managing `WidgetConfig` state. Generates embed code dynamically based on config (only includes non-default attributes). Two-column grid layout with instruction text.

**Page Route** - Server Component at `/admin/embed/page.tsx` with auth protection following Data Access Layer pattern (same as admin dashboard).

### Navigation Integration

- Admin layout nav bar: added "Knowledge Base" and "Embed Widget" links between brand and logout
- Admin dashboard: added blue "Get Embed Code" CTA button (right-aligned next to heading)

## Technical Approach

### Syntax Highlighting Strategy

Chose inline tokenization over syntax highlighting libraries to:
- Avoid bundle size overhead (only highlighting one specific format: HTML script tag)
- Keep dark background fixed (not theme-dependent) while rest of admin UI is theme-aware
- Maintain full control over token colors (pink/cyan/green/gray palette)

Tokenizer regex: `/<(\w+)|<\/(\w+)>|(\w[\w-]*)=|"([^"]*)"|([^<>"=]+)/g` captures:
- Opening tags: `<script`, `<div>`
- Closing tags: `</script>`
- Attributes: `src=`, `data-theme=`
- String values: `"https://..."`
- Text/whitespace: everything else

### Embed Code Generation

Only includes attributes that differ from defaults:
- `data-theme` only if not "light" (default)
- `data-position` only if not "bottom-right" (default)
- `data-greeting` only if non-empty

Keeps embed code minimal for typical use cases. Origin detection uses `window.location.origin` with SSR fallback.

### iframe Config Updates

BrowserPreview sends config via postMessage on two triggers:
1. When config state changes (`useEffect` dependency)
2. When iframe fires `load` event

This ensures widget always receives latest config, even if iframe reloads. Target origin is `window.location.origin` (same-origin only).

## Testing Performed

1. **Biome lint/format** - Passed after fixing:
   - `useId()` for form element IDs (accessibility)
   - Optional chain for `config.greeting?.trim()`
   - Refactored while loop to avoid assignment-in-expression
   - Added biome-ignore for array index key (tokens are static)

2. **Production build** - Passed clean, route appears in build output:
   ```
   ƒ /admin/embed                         2.81 kB         105 kB
   ```

3. **Visual verification** - NOT YET PERFORMED (requires dev server + browser testing)

## Deviations from Plan

None - plan executed exactly as written.

## Outstanding Work

### For Plan 02 (Widget Config Updates)
- Widget page must listen for `CONFIG_UPDATE` postMessage events
- Apply received config to ChatWindow positioning and theme
- Handle greeting message injection

### Future Enhancements (Nice-to-Have)
- Active nav link styling (highlight current page)
- Code block line numbers
- Preview size selector (mobile/tablet/desktop viewports)
- Direct test button (opens widget in new tab with config params)

## Commits

- `24e0971`: feat(07-01): create embed page components
- `36f0b61`: feat(07-01): add embed page route and admin navigation

## Self-Check: PASSED

### Files Created
```bash
FOUND: src/components/admin/ConfigPanel.tsx
FOUND: src/components/admin/CodeBlock.tsx
FOUND: src/components/admin/BrowserPreview.tsx
FOUND: src/components/admin/EmbedPage.tsx
FOUND: src/app/admin/embed/page.tsx
```

### Files Modified
```bash
FOUND: src/app/admin/layout.tsx (nav links added)
FOUND: src/app/admin/AdminDashboard.tsx (CTA button added)
```

### Commits Exist
```bash
FOUND: 24e0971 (Task 1 - components)
FOUND: 36f0b61 (Task 2 - route and navigation)
```

All artifacts verified successfully.
