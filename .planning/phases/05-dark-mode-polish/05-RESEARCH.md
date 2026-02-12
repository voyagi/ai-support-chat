# Phase 5 Research: Dark Mode & Polish

**Research Question**: What do I need to know to PLAN this phase well?

**Date**: 2026-02-09

---

## Phase Goals

1. User can toggle between light and dark modes via UI control
2. App detects and applies system dark mode preference on load
3. Theme transitions smoothly without flash of unstyled content (FOUC)
4. Message appearances have smooth animations (fade in, slide up)
5. Interactive elements have hover states, focus rings, and micro-interactions

---

## 1. Dark Mode Implementation Strategy

### 1.1 Tailwind CSS v4 Dark Mode Approach

Tailwind CSS v4 has significant changes from v3:

- **No more `tailwind.config.js`**: Configuration moved to CSS
- **No `darkMode: "class"` option**: Must define dark mode in global CSS
- **CSS variables for theming**: Uses `var(--color-name)` pattern for all colors
- **Custom variant syntax**: Use `@custom-variant` directive in CSS

**Recommended approach for this project**:

```css
/* In globals.css */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

This creates a `dark:` variant that applies when `data-theme="dark"` is on any parent element.

**Alternative**: Use `prefers-color-scheme` media query (Tailwind v4 default), but this doesn't allow manual toggle without JS.

### 1.2 Theme Detection & Persistence

**Library recommendation: `next-themes`**

Why `next-themes`:
- Industry standard for Next.js dark mode (17.8k+ GitHub stars)
- Solves FOUC with inline blocking script
- Handles system preference detection via `prefers-color-scheme`
- Persists choice in localStorage
- Zero-config for Next.js App Router

**Key features**:
- `enableSystem: true` — Respects system preference
- `defaultTheme: "system"` — Default to OS setting
- `attribute: "data-theme"` — Sets `data-theme` on `<html>`
- `storageKey: "theme"` — localStorage key
- Automatic script injection to prevent FOUC

**Installation**:
```bash
npm install next-themes
```

**Bundle size**: ~2.5kb minified (negligible impact)

---

## 2. Preventing Flash of Unstyled Content (FOUC)

### 2.1 The Problem

When using SSR (Next.js), the server doesn't know the user's theme preference. The initial HTML renders with default (light) styles, then after hydration on the client, dark mode is applied — causing a flash.

### 2.2 Solution: Inline Blocking Script

`next-themes` solves this by injecting a `<script>` in the `<head>` that:
1. **Runs synchronously** before page render
2. Reads `localStorage` for saved theme
3. Reads `prefers-color-scheme` if no saved preference
4. Sets `data-theme` attribute on `<html>` immediately

**Implementation**:
```tsx
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          storageKey="theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Critical**: `suppressHydrationWarning` on `<html>` is required because `next-themes` modifies the `data-theme` attribute before React hydration.

### 2.3 Additional FOUC Prevention

1. **Import styles in `layout.tsx`**: Ensure all CSS is loaded before components render
2. **Hydration guard for theme UI**: Wrap theme toggle in `useEffect` to avoid mismatch

---

## 3. Color Scheme Design

### 3.1 Current Color Palette Analysis

From `MessageBubble.tsx` and `page.tsx`:

**Light mode colors**:
- User bubbles: `bg-blue-600` (primary action)
- Bot bubbles: `bg-gray-100`, `text-gray-900`
- Bot avatar: `bg-blue-100`, `text-blue-600`
- Backgrounds: `bg-gradient-to-b from-blue-50 to-white`
- Text: `text-gray-900`, `text-gray-600`, `text-gray-500`
- Borders: `border-gray-200`

**Interactive states**:
- Hover: `hover:bg-blue-700`, `hover:text-gray-900`
- Transitions: `transition-colors`

### 3.2 Dark Mode Color Mapping Strategy

**Approach**: Use Tailwind's semantic color utilities with `dark:` variants

**Recommended mappings**:

| Element | Light | Dark |
|---------|-------|------|
| Page background | `bg-gradient-to-b from-blue-50 to-white` | `dark:from-gray-900 dark:to-gray-800` |
| User bubble | `bg-blue-600` | `dark:bg-blue-500` (slightly lighter) |
| Bot bubble | `bg-gray-100` | `dark:bg-gray-800` |
| Bot bubble text | `text-gray-900` | `dark:text-gray-100` |
| Bot avatar | `bg-blue-100` | `dark:bg-blue-900/40` |
| Primary text | `text-gray-900` | `dark:text-gray-100` |
| Secondary text | `text-gray-600` | `dark:text-gray-400` |
| Tertiary text | `text-gray-500` | `dark:text-gray-500` |
| Borders | `border-gray-200` | `dark:border-gray-700` |
| Input background | `bg-white` | `dark:bg-gray-800` |
| Card background | `bg-white` | `dark:bg-gray-800` |

**Key principles**:
- Maintain blue accent color in both modes (brand consistency)
- Increase contrast in dark mode for readability
- Use warmer grays for dark mode (gray-800/900 instead of pure black)
- Preserve visual hierarchy (primary/secondary/tertiary text)

### 3.3 Accessibility Considerations

**WCAG 2.1 AA Contrast Requirements**:
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

**Test tool**: Use Chrome DevTools Lighthouse or [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Dark mode specific concerns**:
- Avoid pure white text on dark backgrounds (causes eye strain)
- Use off-white (`text-gray-100` or `text-gray-200`) instead
- Avoid pure black backgrounds (use `bg-gray-900` or `bg-gray-950`)

---

## 4. Animation Strategy

### 4.1 Animation Requirements

From success criteria:
- Message appearances: fade in, slide up
- Interactive elements: hover states, focus rings, micro-interactions
- Theme transitions: smooth (no jarring changes)

### 4.2 Animation Library Evaluation

**Options considered**:

1. **Motion (formerly Framer Motion)** — De-facto standard for React animations in 2026
   - Declarative API (`<motion.div>`)
   - Built-in spring physics
   - SSR/RSC compatible
   - Bundle size: ~50kb
   - **Recommendation**: Use for message animations

2. **React Spring** — Physics-based animations
   - Natural, realistic motion
   - Steeper learning curve
   - Best for data visualization
   - **Skip**: Overkill for this project

3. **GSAP** — High-performance, framework-agnostic
   - Advanced timeline control
   - Great for complex sequences
   - Requires refs (not as React-idiomatic)
   - **Skip**: Too heavy for simple micro-interactions

4. **CSS-only animations** — Native browser animations
   - Zero JS overhead
   - Tailwind arbitrary CSS animations
   - Limited to simple transitions
   - **Recommendation**: Use for hover/focus states

**Decision**: **Hybrid approach**
- **Motion** for message fade-in/slide-up (one-time appearance animations)
- **CSS transitions** for hover/focus/theme changes (state-based)

### 4.3 Message Animation Pattern

Using Motion for message appearance:

```tsx
import { motion } from 'motion/react'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  {/* Message content */}
</motion.div>
```

**Animation timing**:
- Duration: 300ms (standard UI timing)
- Easing: `ease-out` (decelerating motion feels more natural)
- Y offset: 20px (subtle slide-up)

### 4.4 Hover State & Micro-Interaction Patterns

**CSS-only approach** (Tailwind):

```tsx
// Button hover
className="transition-all duration-200 hover:scale-105 hover:shadow-lg"

// Focus ring
className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"

// Interactive cards
className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
```

**Best practices**:
- Use `transition-all` sparingly (prefer `transition-colors`, `transition-transform`)
- Keep duration under 300ms (longer feels sluggish)
- Use `hover:scale-*` for "clickable" feedback (101-105% scale)
- Always include focus states for keyboard navigation

### 4.5 Theme Transition Animation

To smooth theme changes:

```css
/* In globals.css */
* {
  transition-property: background-color, border-color, color;
  transition-duration: 200ms;
  transition-timing-function: ease-in-out;
}
```

**Trade-off**: Adds 200ms transition to ALL color changes. Alternative is to scope it to specific elements.

**Alternative (scoped)**:
```tsx
className="transition-colors duration-200"
```

Apply to all color-changing elements (backgrounds, text, borders).

---

## 5. Theme Toggle UI Component

### 5.1 Design Patterns

**Common patterns**:
1. **Icon toggle** — Sun/Moon icons that swap on click
2. **Dropdown menu** — Light / Dark / System options
3. **Switch toggle** — iOS-style switch

**Recommendation for this project**: **Icon toggle with dropdown**

Why:
- Reveals all 3 options (Light, Dark, System)
- Clearer than just Sun/Moon (what does clicking do?)
- Matches modern design patterns (GitHub, Vercel, etc.)

### 5.2 Placement

**Options**:
- Top-right corner of landing page header
- Chat page header (next to "Flo" title)
- Both locations (consistent placement)

**Recommendation**: **Top-right on all pages** (persistent, expected location)

### 5.3 Implementation with `next-themes`

```tsx
'use client'
import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useState, useEffect } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className="relative">
      <button onClick={() => {/* toggle dropdown */}}>
        {theme === 'light' && <Sun />}
        {theme === 'dark' && <Moon />}
        {theme === 'system' && <Monitor />}
      </button>
      {/* Dropdown with Light/Dark/System options */}
    </div>
  )
}
```

**Key details**:
- `mounted` state prevents hydration mismatch (theme is only known client-side)
- Return `null` during SSR to avoid flash
- Use `lucide-react` icons (already in dependencies)

---

## 6. Component Audit: Dark Mode Coverage

### 6.1 Components Requiring Dark Mode Styles

From project structure:

**Chat components**:
- `ChatWindow.tsx` — Main container, input area, message list background
- `MessageBubble.tsx` — User/bot bubbles, source cards, text colors
- `ChatInput.tsx` — Input field, send button, borders
- `TypingIndicator.tsx` — Animated dots (likely uses gray colors)
- `MessageSkeleton.tsx` — Loading skeleton (gray backgrounds)

**Admin components**:
- `LoginForm.tsx` — Form fields, labels, error states
- `UploadZone.tsx` — Drag-drop area, borders, hover states
- `DocumentTable.tsx` — Table rows, borders, hover states
- `ChunkPreview.tsx` — Code/text preview areas

**Pages**:
- `page.tsx` (landing) — Hero gradient, feature cards, text
- `chat/page.tsx` — Page background, layout
- `admin/page.tsx` — Dashboard cards, stats
- `admin/login/page.tsx` — Login page background

**Total**: ~12 files to update with `dark:` variants

### 6.2 Systematic Approach

**Step 1**: Define color token CSS variables (optional, but cleaner)
**Step 2**: Update `globals.css` with `@custom-variant dark`
**Step 3**: Update each component file with `dark:` classes
**Step 4**: Test each component in dark mode

**Verification**: Use dev-browser skill to screenshot each page in both modes

---

## 7. Installation & Setup

### 7.1 Dependencies to Add

```bash
npm install next-themes motion
```

**Bundle impact**:
- `next-themes`: ~2.5kb
- `motion`: ~50kb

**Total added**: ~52.5kb (acceptable for feature scope)

### 7.2 Configuration Changes

**File: `src/app/globals.css`**
```css
@import "tailwindcss";

/* Dark mode variant */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

/* Theme transition (optional) */
* {
  transition-property: background-color, border-color, color;
  transition-duration: 200ms;
  transition-timing-function: ease-in-out;
}

/* Existing animations */
@keyframes shake { /* ... */ }
```

**File: `src/app/layout.tsx`**
- Wrap children in `<ThemeProvider>`
- Add `suppressHydrationWarning` to `<html>`

---

## 8. Testing Strategy

### 8.1 Manual Testing Checklist

**Theme switching**:
- [ ] Toggle between Light/Dark/System modes
- [ ] Theme persists on page reload
- [ ] System preference change is detected (if System mode active)
- [ ] No FOUC on initial load in any mode

**Visual consistency**:
- [ ] All text is readable (contrast check)
- [ ] Colors match design intent in both modes
- [ ] Gradients/shadows look good in dark mode
- [ ] Images/icons have sufficient contrast

**Animations**:
- [ ] Messages fade in smoothly on send
- [ ] Buttons have hover/focus states
- [ ] Theme transition is smooth (no jarring changes)
- [ ] No animation conflicts (e.g., fade + slide overlap)

### 8.2 Browser Testing with dev-browser Skill

**Approach**:
1. Start dev server (`npm run dev`)
2. Use dev-browser in extension mode
3. Screenshot each page in Light/Dark modes
4. Compare side-by-side for consistency

**Script template**:
```tsx
import { connect } from "@/client.js";
const client = await connect();
const page = await client.page("theme-test");

// Test light mode
await page.goto('http://localhost:3001/chat');
await page.screenshot({ path: 'light-mode.png' });

// Switch to dark mode
await page.evaluate(() => {
  localStorage.setItem('theme', 'dark');
  document.documentElement.setAttribute('data-theme', 'dark');
});
await page.reload();
await page.screenshot({ path: 'dark-mode.png' });

await client.disconnect();
```

### 8.3 Accessibility Testing

**Tools**:
- Chrome DevTools Lighthouse (Accessibility audit)
- axe DevTools extension
- Manual keyboard navigation test

**Focus areas**:
- Focus ring visibility in both modes
- Color contrast ratios (WCAG AA)
- Theme toggle keyboard accessibility

---

## 9. Risks & Mitigations

### 9.1 Risk: FOUC Despite next-themes

**Likelihood**: Low (next-themes is battle-tested)

**Scenario**: If SSR/SSG caching causes issues

**Mitigation**:
- Test on production build (`npm run build && npm start`)
- Add fallback: `<style>` tag with default dark mode colors in `<head>`
- Use `app/layout.tsx` to force client-side rendering if needed

### 9.2 Risk: Animation Performance

**Likelihood**: Medium (too many animations can cause jank)

**Scenario**: Message list with 50+ messages causes scroll lag

**Mitigation**:
- Use `will-change: transform` CSS hint for animated elements
- Limit animations to viewport-visible messages (Intersection Observer)
- Profile with Chrome DevTools Performance tab
- Fallback: `prefers-reduced-motion` media query to disable animations

### 9.3 Risk: Color Contrast Failures

**Likelihood**: Medium (dark mode colors are tricky)

**Scenario**: Text becomes unreadable in dark mode

**Mitigation**:
- Use contrast checker during implementation
- Test with actual dark mode users (accessibility testing)
- Provide manual contrast override option (future enhancement)

### 9.4 Risk: Bundle Size Bloat

**Likelihood**: Low (~52kb added is reasonable)

**Scenario**: Motion library too heavy for production

**Mitigation**:
- Tree-shake unused Motion features
- Consider CSS-only animations instead
- Monitor bundle size with `npm run build` analysis

---

## 10. Implementation Order

**Recommended sequence**:

1. **Install dependencies** (`next-themes`, `motion`)
2. **Set up dark mode infrastructure** (globals.css, layout.tsx, ThemeProvider)
3. **Create ThemeToggle component** (UI control)
4. **Update landing page** (easiest to test, server component)
5. **Update chat components** (MessageBubble, ChatWindow, ChatInput)
6. **Add message animations** (Motion integration)
7. **Update admin components** (lower priority for demo)
8. **Add hover/focus micro-interactions** (final polish)
9. **Browser test with dev-browser** (screenshot verification)
10. **Accessibility audit** (Lighthouse, keyboard nav)

---

## 11. Open Questions for Planning

1. **Should theme toggle be in header or floating?**
   - Recommendation: Fixed top-right corner on all pages
   - Alternative: Floating bottom-right (like chat widget)

2. **Should animations be configurable?**
   - Recommendation: No — keep it simple for MVP
   - Alternative: Add `prefers-reduced-motion` support (accessibility win)

3. **Should dark mode be default for first-time visitors?**
   - Recommendation: No — default to "system" mode
   - Rationale: Respects user's OS preference, less opinionated

4. **Should admin panel match chat theme?**
   - Recommendation: Yes — consistent experience
   - Trade-off: Admin panel is low-priority for portfolio demo

---

## 12. Sources

**Dark Mode Implementation**:
- [Tailwind CSS Dark Mode Docs](https://tailwindcss.com/docs/dark-mode)
- [Tailwind v4 CSS Variables Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/15083)
- [Dark Mode with Tailwind v4 & Next.js Guide](https://www.thingsaboutweb.dev/en/posts/dark-mode-with-tailwind-v4-nextjs)
- [Next.js Dark Mode Guide](https://eastondev.com/blog/en/posts/dev/20251220-nextjs-dark-mode-guide/)

**Preventing FOUC**:
- [next-themes GitHub](https://github.com/pacocoursey/next-themes)
- [Fixing Dark Mode Flickering](https://notanumber.in/blog/fixing-react-dark-mode-flickering)
- [Preventing FOUC in Next.js](https://medium.com/@mohantaankit2002/how-to-prevent-flash-of-unstyled-content-fouc-in-next-js-78fb7c1b0b74)

**Animation Libraries**:
- [Motion.dev (Framer Motion)](https://motion.dev)
- [Top React Animation Libraries 2026](https://www.syncfusion.com/blogs/post/top-react-animation-libraries)
- [React Spring Guide](https://stackoverflow.blog/2020/01/16/how-to-create-micro-interactions-with-react-spring-part-1/)

**Tailwind v4 Custom Variants**:
- [Tailwind CSS v4 Blog Post](https://tailwindcss.com/blog/tailwindcss-v4)
- [Custom Themes in Tailwind v4](https://dev.to/vrauuss_softwares/-create-custom-themes-in-tailwind-css-v4-custom-variant-12-2nf0)
- [Tailwind v4 Custom Styles Guide](https://kitemetric.com/blogs/tailwind-css-v4-mastering-custom-styles-the-new-plugin-approach)

---

## 13. Summary: Key Decisions for Planning

| Decision Area | Recommendation | Rationale |
|---------------|----------------|-----------|
| Dark mode library | `next-themes` | Solves FOUC, industry standard, 2.5kb |
| Animation library | `motion` + CSS | Motion for messages, CSS for micro-interactions |
| Dark mode approach | `@custom-variant dark` in CSS | Tailwind v4 best practice |
| Theme toggle UI | Icon toggle with dropdown | Clear 3-option selection |
| Color strategy | Semantic `dark:` variants | Maintainable, Tailwind-native |
| Animation timing | 300ms fade + slide | Standard UI timing, not distracting |
| Theme transition | 200ms CSS transition | Smooth, not jarring |
| Default theme | `"system"` | Respects user OS preference |
| Testing approach | dev-browser screenshots | Visual verification in both modes |

**Ready for planning**: Yes — all major decisions have research backing.
