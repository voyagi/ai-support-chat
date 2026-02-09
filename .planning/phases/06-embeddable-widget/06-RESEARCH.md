# Phase 06: Embeddable Widget - Research

**Researched:** 2026-02-09
**Domain:** Embeddable web widgets with iframe isolation
**Confidence:** HIGH

## Summary

Embeddable chat widgets use a **script tag + iframe** architecture for maximum compatibility and security. The standard pattern involves an IIFE-based loader script that creates an iframe pointing to a dedicated widget page, with postMessage API for secure cross-origin communication. Modern implementations prioritize async loading to avoid blocking host page performance, mobile-first responsive design (fullscreen on mobile, windowed on desktop), and proper CSP/CORS configuration.

The Next.js ecosystem doesn't have built-in widget generation, but the proven approach uses **Rollup or standalone webpack builds** to create an IIFE bundle separate from the Next.js app build. This creates a vanilla JavaScript loader that works on any site regardless of their framework.

**Primary recommendation:** Build a dedicated `/widget` Next.js page (iframe content), create a separate Rollup build for the loader script (injected via script tag), use postMessage for height adjustment and theme synchronization, and implement mobile-first breakpoint logic (fullscreen below 768px, windowed above).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Rollup** | Latest | Widget script bundler | Industry standard for library bundling; produces clean IIFE output without Next.js framework overhead |
| **postMessage API** | Native | iframe ↔ parent communication | W3C standard for secure cross-origin messaging; no library needed |
| **ResizeObserver** | Native | Content height tracking | Native browser API for responsive iframe sizing; better than polling |
| **Tailwind CSS** (scoped) | v4 | Widget styling | Already in project stack; requires scoping to prevent host page conflicts |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tailwindcss-scoped-preflight` | Latest | Scope Tailwind preflight styles | Essential for iframe isolation—prevents widget styles from leaking to host page |
| `motion` | Latest | Bubble expand/collapse animation | Already in project; use for smooth widget open/close transitions |
| `@rollup/plugin-node-resolve` | Latest | Bundle dependencies | Required to bundle React/ReactDOM into widget loader |
| `@rollup/plugin-terser` | Latest | Minify widget script | Keep script size minimal for fast loading |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Script + iframe | Web Component (Shadow DOM) | Web Components have better style isolation but worse browser compatibility and harder theme synchronization |
| Rollup | Webpack standalone build | Webpack works but produces larger bundles; Rollup optimized for libraries |
| postMessage | Direct DOM manipulation | Only works same-origin; breaks security model |

**Installation:**

```bash
npm install --save-dev rollup @rollup/plugin-node-resolve @rollup/plugin-terser @rollup/plugin-commonjs rollup-plugin-postcss
npm install tailwindcss-scoped-preflight
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── widget/
│   │   └── page.tsx           # Widget iframe content (ChatWindow component)
├── widget-loader/
│   ├── index.ts               # Loader script entry (IIFE)
│   ├── iframe-manager.ts      # Iframe creation, positioning, resize
│   ├── bubble.ts              # Floating bubble UI
│   └── postmessage-bridge.ts  # Parent ↔ iframe communication
├── components/
│   └── chat/
│       └── ChatWindow.tsx     # Reused by /chat and /widget
public/
└── widget.js                  # Built loader script (Rollup output)
rollup.config.js               # Rollup bundler config
```

### Pattern 1: Script Tag + Iframe Embedding

**What:** Loader script creates iframe, bubble UI, and communication bridge
**When to use:** Standard for third-party embeds (Intercom, Crisp, HubSpot all use this)
**Example:**

```typescript
// widget-loader/index.ts
// Source: https://ahmadrosid.com/blog/building-chat-widget-with-nextjs

(function() {
  'use strict';

  // Extract config from script tag
  const script = document.currentScript as HTMLScriptElement;
  const accountId = script.dataset.accountId;
  const widgetUrl = script.dataset.widgetUrl || 'https://yourapp.com';

  // Create bubble button
  const bubble = document.createElement('button');
  bubble.id = 'chat-widget-bubble';
  bubble.innerHTML = '💬';
  Object.assign(bubble.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#0070f3',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    zIndex: '999999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  });

  // Create iframe container
  const container = document.createElement('div');
  container.id = 'chat-widget-container';
  Object.assign(container.style, {
    position: 'fixed',
    bottom: '90px',
    right: '20px',
    width: '400px',
    height: '600px',
    maxWidth: 'calc(100vw - 40px)',
    maxHeight: 'calc(100vh - 110px)',
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    zIndex: '999998',
    overflow: 'hidden',
    display: 'none'
  });

  const iframe = document.createElement('iframe');
  iframe.src = `${widgetUrl}/widget?accountId=${accountId}`;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  container.appendChild(iframe);

  // Toggle visibility
  bubble.addEventListener('click', () => {
    const isHidden = container.style.display === 'none';
    container.style.display = isHidden ? 'block' : 'none';
  });

  // Mobile responsive: fullscreen on small screens
  const updateLayout = () => {
    if (window.innerWidth < 768) {
      Object.assign(container.style, {
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        borderRadius: '0'
      });
    } else {
      Object.assign(container.style, {
        top: 'auto',
        left: 'auto',
        bottom: '90px',
        right: '20px',
        width: '400px',
        height: '600px',
        maxWidth: 'calc(100vw - 40px)',
        maxHeight: 'calc(100vh - 110px)',
        borderRadius: '12px'
      });
    }
  };

  window.addEventListener('resize', updateLayout);
  updateLayout();

  // Mount to DOM
  document.body.appendChild(bubble);
  document.body.appendChild(container);
})();
```

### Pattern 2: Secure postMessage Communication

**What:** Bidirectional messaging with origin validation
**When to use:** Always — required for iframe ↔ parent communication
**Example:**

```typescript
// widget-loader/postmessage-bridge.ts
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage

const ALLOWED_ORIGIN = 'https://yourapp.com';

// Parent window: listen for iframe messages
window.addEventListener('message', (event) => {
  // CRITICAL: Always validate origin first
  if (event.origin !== ALLOWED_ORIGIN) return;

  const { type, data } = event.data;

  switch (type) {
    case 'WIDGET_READY':
      console.log('Widget loaded');
      break;
    case 'RESIZE':
      // Adjust iframe height based on content
      const iframe = document.querySelector('#chat-widget-container iframe') as HTMLIFrameElement;
      if (iframe && data.height) {
        iframe.style.height = `${data.height}px`;
      }
      break;
    case 'THEME_SYNC':
      // Send current theme to widget
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      iframe?.contentWindow?.postMessage(
        { type: 'THEME_UPDATE', theme },
        ALLOWED_ORIGIN
      );
      break;
  }
});

// Widget iframe (inside Next.js page): send messages to parent
// src/app/widget/page.tsx
useEffect(() => {
  // Notify parent when ready
  window.parent.postMessage(
    { type: 'WIDGET_READY' },
    ALLOWED_ORIGIN // NEVER use "*" in production
  );

  // Send height updates when content changes
  const observer = new ResizeObserver(() => {
    const height = document.body.scrollHeight;
    window.parent.postMessage(
      { type: 'RESIZE', data: { height } },
      ALLOWED_ORIGIN
    );
  });

  observer.observe(document.body);

  return () => observer.disconnect();
}, []);
```

### Pattern 3: Async Script Loading (Non-blocking)

**What:** Load widget script after pageload to avoid blocking
**When to use:** Always for third-party widgets
**Example:**

```html
<!-- Host page embeds this -->
<!-- Source: https://www.intercom.com/help/en/articles/5053693 -->

<script>
  // Option 1: Deferred initialization
  window.addEventListener('load', function() {
    const script = document.createElement('script');
    script.src = 'https://yourapp.com/widget.js';
    script.async = true;
    script.dataset.accountId = 'your-account-id';
    document.body.appendChild(script);
  });

  // Option 2: Lazy load on interaction (even better for performance)
  let widgetLoaded = false;
  function loadWidget() {
    if (widgetLoaded) return;
    widgetLoaded = true;

    const script = document.createElement('script');
    script.src = 'https://yourapp.com/widget.js';
    script.async = true;
    script.dataset.accountId = 'your-account-id';
    document.body.appendChild(script);
  }

  // Load on scroll or 5 seconds after page load (whichever comes first)
  window.addEventListener('scroll', loadWidget, { once: true });
  setTimeout(loadWidget, 5000);
</script>
```

### Pattern 4: Mobile-First Responsive Breakpoints

**What:** Fullscreen on mobile (<768px), windowed on desktop
**When to use:** Standard for chat widgets
**Example:**

```typescript
// widget-loader/iframe-manager.ts
// Source: https://mui.com/material-ui/react-dialog/

const MOBILE_BREAKPOINT = 768; // px

function applyResponsiveLayout(container: HTMLElement) {
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

  if (isMobile) {
    // Fullscreen modal on mobile
    Object.assign(container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      width: '100%',
      height: '100%',
      maxWidth: '100%',
      maxHeight: '100%',
      borderRadius: '0',
      // Add safe area insets for notched devices
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    });
  } else {
    // Windowed chat on desktop
    Object.assign(container.style, {
      position: 'fixed',
      top: 'auto',
      left: 'auto',
      bottom: '90px',
      right: '20px',
      width: '400px',
      height: '600px',
      maxWidth: 'calc(100vw - 40px)',
      maxHeight: 'calc(100vh - 110px)',
      borderRadius: '12px',
      padding: '0'
    });
  }
}

// Respond to orientation/resize changes
window.addEventListener('resize', () => applyResponsiveLayout(container));
window.addEventListener('orientationchange', () => applyResponsiveLayout(container));
```

### Anti-Patterns to Avoid

- **Using `targetOrigin: "*"` in postMessage:** Exposes data to malicious sites. Always specify exact origin.
- **No origin validation in message listener:** Any site can send messages. Always check `event.origin`.
- **Loading widget synchronously:** Blocks host page render. Always load async after pageload.
- **Global Tailwind preflight without scoping:** Widget resets host page styles. Use `tailwindcss-scoped-preflight`.
- **Fixed z-index without considering host page:** Use very high values (999998+) to avoid conflicts.
- **Polling for iframe height changes:** Use ResizeObserver + postMessage instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-origin messaging | Custom iframe bridge with window refs | `window.postMessage()` API | Edge cases: origin spoofing, race conditions, browser quirks. postMessage is battle-tested and secure. |
| Iframe content resizing | setInterval polling for height | ResizeObserver + postMessage | Polling wastes CPU, misses rapid changes, causes jank. ResizeObserver is precise and efficient. |
| Widget script bundling | Manual concatenation + minification | Rollup with IIFE format | Rollup handles module resolution, tree-shaking, and produces optimal IIFE bundles for browser globals. |
| Tailwind style isolation | Manual CSS prefixing or renaming | `tailwindcss-scoped-preflight` plugin | Preflight resets affect 40+ HTML elements. Plugin handles all edge cases correctly. |
| Mobile breakpoint detection | Custom JS media query listeners | CSS `@media` with breakpoint + postMessage for behavior changes | CSS handles visual responsive, JS only for behavior. Avoids layout thrashing. |

**Key insight:** Widget embedding is deceptively complex due to security (CSP, CORS, origin validation), performance (async loading, bundle size), and compatibility (different host page environments). Use proven patterns and native APIs instead of custom solutions.

## Common Pitfalls

### Pitfall 1: Content Security Policy (CSP) Blocking

**What goes wrong:** Host page CSP headers block iframe from loading or postMessage from working.
**Why it happens:** Modern security practices include strict CSP. Default policies often restrict `frame-src` and `script-src`.
**How to avoid:**
- Document CSP requirements in widget installation guide: host page must allow `frame-src https://yourapp.com`
- Test widget on pages with strict CSP policies during development
- Provide troubleshooting guide for common CSP errors in browser console
**Warning signs:** Console errors like "Refused to frame 'https://yourapp.com' because it violates the following Content Security Policy directive"

### Pitfall 2: Unvalidated postMessage Origins

**What goes wrong:** Malicious sites send fake messages to steal data or inject content.
**Why it happens:** Developers skip origin validation for "simplicity" or use `event.origin !== "null"` check.
**How to avoid:**
- **ALWAYS** validate origin: `if (event.origin !== ALLOWED_ORIGIN) return;`
- Whitelist exact origins, never wildcards
- Add message schema validation (check message type, required fields)
- Document in code comments: "SECURITY: Do not remove origin check"
**Warning signs:** Widget behaves differently on different sites, unexpected data in messages

### Pitfall 3: Z-Index Conflicts with Host Page

**What goes wrong:** Widget appears behind host page modals, dropdowns, or sticky headers.
**Why it happens:** Host page uses high z-index values (9999+), widget uses default stacking context.
**How to avoid:**
- Use very high z-index for widget: `999998` for iframe, `999999` for bubble
- Create new stacking context with `position: fixed` + `z-index`
- Test on popular frameworks (Bootstrap, Material-UI) which use known z-index ranges
- Document z-index in comments: "Intentionally high to avoid conflicts with host page"
**Warning signs:** Widget disappears when host page modals open, bubble hidden behind page elements

### Pitfall 4: Tailwind Preflight Polluting Host Page

**What goes wrong:** Widget's Tailwind preflight styles reset host page typography, spacing, and form styles.
**Why it happens:** Tailwind's preflight applies globally to all HTML elements, affecting parent page through iframe boundary leakage or direct injection.
**How to avoid:**
- Use `tailwindcss-scoped-preflight` plugin to scope preflight to `.widget-root` class
- Apply scoped class to widget container div only
- Test widget on pages with existing styles (WordPress, Shopify, custom designs)
- Build widget CSS separately from main app CSS
**Warning signs:** Host page fonts change, margins reset, buttons lose styling after widget loads

### Pitfall 5: Mobile Viewport Not Handling Fullscreen Properly

**What goes wrong:** Widget appears tiny on mobile, or fullscreen mode has scrolling issues, or safe areas (notches) overlap content.
**Why it happens:** Fixed viewport calculations don't account for mobile browser chrome (address bar, toolbars) or device safe areas.
**How to avoid:**
- Use `vh` units with awareness that mobile browser chrome changes viewport height
- Use `env(safe-area-inset-*)` for notched devices (iPhone X+)
- Test on real mobile devices, not just browser DevTools
- Implement orientation change handling
- Use `maxHeight: 'calc(100vh - 110px)'` instead of `100vh` on desktop to account for bubble
**Warning signs:** Content cut off by notch, widget doesn't resize when address bar shows/hides, awkward scrolling behavior

### Pitfall 6: Widget Script Blocking Page Load

**What goes wrong:** Host page becomes slow to interactive, lighthouse scores drop, users see blank page longer.
**Why it happens:** Widget script loaded synchronously in `<head>` or early `<body>`, blocking HTML parser.
**How to avoid:**
- Always load widget with `async` attribute
- Better: Defer loading until `window.onload` or user interaction
- Best: Lazy load on scroll or after timeout (Intercom pattern)
- Keep widget bundle size under 50KB (gzipped)
- Use code splitting to load React components only when widget opens
**Warning signs:** PageSpeed Insights shows "Eliminate render-blocking resources", Time to Interactive (TTI) increases after widget added

## Code Examples

Verified patterns from official sources:

### Rollup Config for Widget Bundler

```javascript
// rollup.config.js
// Source: https://makerkit.dev/courses/nextjs-turbo/building-javascript-widget

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  input: 'src/widget-loader/index.ts',
  output: {
    file: 'public/widget.js',
    format: 'iife',
    name: 'ChatWidget',
    sourcemap: false
  },
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    postcss({
      plugins: [
        tailwindcss('./tailwind.widget.config.js'),
        autoprefixer()
      ],
      inject: true, // Inject CSS into JS bundle
      minimize: true
    }),
    terser({
      mangle: {
        toplevel: true
      },
      compress: {
        drop_console: true,
        passes: 2
      }
    })
  ]
};
```

### Scoped Tailwind Config for Widget

```javascript
// tailwind.widget.config.js
// Source: https://www.npmjs.com/package/tailwindcss-scoped-preflight

const scopedPreflightStyles = require('tailwindcss-scoped-preflight');

module.exports = {
  content: [
    './src/widget-loader/**/*.{ts,tsx}',
    './src/app/widget/**/*.{ts,tsx}',
    './src/components/chat/**/*.{ts,tsx}'
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {}
  },
  plugins: [
    scopedPreflightStyles({
      isolationStrategy: scopedPreflightStyles.isolateInsideOfContainer('.widget-root')
    })
  ]
};
```

### Widget Page with Theme Support

```typescript
// src/app/widget/page.tsx
// Source: https://github.com/andriishupta/cross-origin-iframe-communication-with-nextjs

'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import ChatWindow from '@/components/chat/ChatWindow';

const PARENT_ORIGIN = process.env.NEXT_PUBLIC_PARENT_ORIGIN || '*';

export default function WidgetPage() {
  const { setTheme } = useTheme();
  const [conversationId, setConversationId] = useState<string>();

  useEffect(() => {
    // Listen for theme updates from parent
    const handleMessage = (event: MessageEvent) => {
      // Validate origin in production
      if (process.env.NODE_ENV === 'production' && event.origin !== PARENT_ORIGIN) {
        return;
      }

      const { type, theme, conversationId: newConvId } = event.data;

      if (type === 'THEME_UPDATE' && theme) {
        setTheme(theme);
      }

      if (type === 'INIT' && newConvId) {
        setConversationId(newConvId);
      }
    };

    window.addEventListener('message', handleMessage);

    // Notify parent widget is ready
    window.parent.postMessage(
      { type: 'WIDGET_READY' },
      PARENT_ORIGIN
    );

    // Send height updates
    const observer = new ResizeObserver(() => {
      const height = document.body.scrollHeight;
      window.parent.postMessage(
        { type: 'RESIZE', data: { height } },
        PARENT_ORIGIN
      );
    });

    observer.observe(document.body);

    return () => {
      window.removeEventListener('message', handleMessage);
      observer.disconnect();
    };
  }, [setTheme]);

  return (
    <div className="widget-root h-full">
      <ChatWindow conversationId={conversationId} />
    </div>
  );
}
```

### Widget Installation Code Generator

```typescript
// src/app/admin/widget/page.tsx
// Generates embed code for users

export default function WidgetEmbedCodePage() {
  const accountId = 'user-account-id'; // From auth session
  const widgetUrl = process.env.NEXT_PUBLIC_APP_URL;

  const embedCode = `<!-- AI Support Chat Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${widgetUrl}/widget.js';
    script.async = true;
    script.dataset.accountId = '${accountId}';
    script.dataset.widgetUrl = '${widgetUrl}';
    document.body.appendChild(script);
  })();
</script>`;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Embed Your Widget</h1>
      <p className="mb-4">Copy and paste this code before the closing &lt;/body&gt; tag on your website:</p>
      <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
        <code>{embedCode}</code>
      </pre>
      <button
        onClick={() => navigator.clipboard.writeText(embedCode)}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Copy to Clipboard
      </button>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct iframe embedding | Script tag + dynamic iframe injection | ~2020 | Better async loading, no layout shift, easier analytics tracking |
| Shadow DOM encapsulation | Iframe isolation | Ongoing | Iframes have better compatibility, simpler debugging, clearer security model |
| Manual height polling | ResizeObserver + postMessage | 2020 (ResizeObserver support) | Eliminates polling overhead, instant updates, battery-friendly |
| `window.parent` direct access | postMessage API only | 2010+ (security tightening) | Required for cross-origin security, enforced by modern browsers |
| Single mobile breakpoint | Progressive breakpoints with safe areas | 2019 (notched devices) | Better support for iPhone X+, foldables, tablets in landscape |

**Deprecated/outdated:**
- **Shadow DOM for widgets:** Browser support still inconsistent (especially Safari), harder to debug, theme syncing complex. Iframes remain standard.
- **jQuery-based widgets:** Modern vanilla JS is smaller, faster, and has better browser API support. No framework needed for loader script.
- **Web Components without polyfills:** Adoption stalled. Stick with iframes for maximum compatibility.
- **Synchronous script loading:** All modern widgets use async/deferred loading. Google PageSpeed Insights flags sync scripts.

## Open Questions

1. **How to handle GDPR/cookie consent banners?**
   - What we know: Widget may need to respect host page consent status
   - What's unclear: Best pattern for consent communication parent → widget
   - Recommendation: Start without consent handling, add postMessage-based consent sync if needed in later phases

2. **Should widget support offline mode?**
   - What we know: Service workers can cache widget resources
   - What's unclear: Complexity vs benefit for MVP
   - Recommendation: Defer to post-MVP. Focus on online experience first.

3. **How to handle host page navigation (SPA routing)?**
   - What we know: Widget should persist conversation across page changes in SPAs
   - What's unclear: Detection mechanism for soft navigation
   - Recommendation: Use sessionStorage to persist conversation ID across same-tab navigation. Test with React Router, Next.js App Router.

## Sources

### Primary (HIGH confidence)

- [MDN: window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) - Security best practices, API syntax
- [MDN: Content-Security-Policy: frame-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-src) - CSP configuration
- [tailwindcss-scoped-preflight npm package](https://www.npmjs.com/package/tailwindcss-scoped-preflight) - Preflight isolation approach
- [Ahmad Rosid: Building Chat Widget with Next.js](https://ahmadrosid.com/blog/building-chat-widget-with-nextjs) - Architecture and embedding pattern
- [Makerkit: Creating a Javascript Widget](https://makerkit.dev/courses/nextjs-turbo/building-javascript-widget) - Rollup bundling strategy
- [Motion.dev: React Animation](https://motion.dev/docs/react-animation) - Animation library API

### Secondary (MEDIUM confidence)

- [This Dot Labs: Using Message Events to Resize an IFrame](https://www.thisdot.co/blog/using-message-events-to-resize-an-iframe) - ResizeObserver + postMessage pattern
- [Bindbee: Securing Cross-Window Communication](https://www.bindbee.dev/blog/secure-cross-window-communication) - postMessage security guide
- [Qrvey: 2026 Iframe Security Risks](https://qrvey.com/blog/iframe-security/) - Modern iframe security considerations
- [Material-UI: React Dialog](https://mui.com/material-ui/react-dialog/) - Mobile fullscreen breakpoint pattern
- [Intercom Help: Delay Loading Intercom](https://www.intercom.com/help/en/articles/5053693-can-i-delay-loading-intercom-on-my-site-to-reduce-the-js-load) - Async loading strategy
- [GitHub: vercel/next.js#15989](https://github.com/vercel/next.js/discussions/15989) - Next.js widget creation discussion
- [Ryan Baker: Embedded Widget with React & Redux](https://ryan-baker.medium.com/how-to-build-an-embedded-widget-with-react-redux-52a26604ccca) - IIFE widget pattern
- [Caisy: How to Use Iframes in Next.js](https://caisy.io/blog/nextjs-iframe-implementation) - Next.js iframe best practices
- [Smashing Magazine: Managing CSS Z-Index In Large Projects](https://www.smashingmagazine.com/2021/02/css-z-index-large-projects/) - Z-index strategy
- [W3C: Content Security Policy: Embedded Enforcement](https://w3c.github.io/webappsec-cspee/) - CSP specification for iframes

### Tertiary (LOW confidence)

- Various WordPress plugin documentation - Pattern validation only
- Community forum posts - Cross-referenced with official sources

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - Rollup, postMessage, ResizeObserver are proven industry patterns with extensive documentation
- Architecture: **HIGH** - Script + iframe is the de facto standard (Intercom, Crisp, Drift all use it). Next.js integration verified from multiple sources.
- Pitfalls: **HIGH** - CSP, postMessage security, z-index conflicts are well-documented and verified across multiple authoritative sources
- Mobile responsive: **MEDIUM** - Breakpoint values are industry convention but not standardized; need to test on real devices

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days - relatively stable domain)
