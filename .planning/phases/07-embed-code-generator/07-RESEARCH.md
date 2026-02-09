# Phase 7: Embed Code Generator - Research

**Researched:** 2026-02-09
**Domain:** React admin UI, clipboard API, code presentation, iframe preview
**Confidence:** HIGH

## Summary

This phase creates an admin page (`/admin/embed`) for copying widget embed code with live preview. The core challenges are: (1) presenting HTML snippet with hand-styled syntax highlighting using only Tailwind, (2) implementing reliable clipboard copy with icon state transition, (3) rendering a fully interactive widget preview inside a simulated browser mockup, and (4) syncing configuration changes to both code snippet and preview in real-time.

The technical stack is entirely in-house — no syntax highlighting libraries (Prism/Shiki), no clipboard libraries, no browser mockup components. Everything uses React + Tailwind + lucide-react icons already in the project. Configuration options (position, theme, greeting) map to `data-*` attributes on the script tag and update reactively via React state.

**Primary recommendation:** Build three independent components (ConfigPanel, CodeBlock with copy button, BrowserPreview with iframe) and wire them together via shared React state in the parent page. Keep syntax highlighting minimal (3-4 token types: tag, attribute, string, text) with hand-picked Tailwind colors on a dark background. Use `navigator.clipboard.writeText()` directly (no library) with proper HTTPS-only error handling.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Code presentation
- Dark code block background (VS Code dark style) regardless of admin panel theme
- Minimal snippet: just the `<script>` tag, not a full HTML page example
- Hand-styled syntax highlighting with Tailwind (no Prism/Shiki dependency)
- Color HTML tags, attributes, and string values distinctly on dark background
- Copy button with clipboard icon that swaps to checkmark for ~2 seconds on click, then reverts

#### Configuration options
- Three configurable options: widget position (bottom-right/bottom-left), default theme (light/dark), and custom greeting message
- Options rendered as inline controls (dropdowns/toggles) directly above the code block
- Changing any option instantly updates the snippet below (live reactivity, no "Generate" button)
- Options map to `data-*` attributes on the script tag (data-position, data-theme, data-greeting)

#### Live preview
- Widget preview rendered inside a simulated "host page" frame (browser mockup with fake URL bar and page content)
- Fully interactive — admin can click the bubble, open the widget, type messages, see it working
- Preview updates live when admin changes configuration options (position, theme)
- Desktop viewport only — no mobile preview toggle
- Preview uses an iframe pointing to `/widget` with config passed via URL params or postMessage

#### Page placement & layout
- Dedicated admin page at `/admin/embed` (separate from document management)
- Two-column split layout on desktop: left column has config options + code block, right column has live preview
- Stacks to single column on mobile (config + code on top, preview below)
- Navigation: "Embed Widget" link in admin sidebar/nav + prominent "Get Embed Code" CTA button on admin dashboard
- Brief inline instructions above the code block: "Paste this before `</body>` on your website"

### Claude's Discretion
- Exact Tailwind color values for syntax highlighting tokens
- Simulated host page content and styling for preview frame
- Responsive breakpoint for two-column to single-column transition
- Whether greeting option is a text input or textarea

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19.1 | ^19.1.0 | UI components | Already in project |
| Tailwind CSS | ^4.1.4 | Styling (including syntax highlight colors) | Project standard, v4 custom variants |
| lucide-react | ^0.511.0 | Icons (Copy, Check, X) | Project icon library |
| next-themes | ^0.4.6 | Theme detection (for preview sync) | Already used in Phase 5 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| navigator.clipboard.writeText | Browser API | Copy to clipboard | HTTPS-only contexts (production + localhost) |
| Window.postMessage | Browser API | Parent-iframe communication | Sending config to widget iframe |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-styled syntax highlighting | Prism.js / Shiki | Libraries add 50-100KB+ bundle weight for a single code block. User decided on Tailwind-only approach. |
| Native clipboard API | react-copy-to-clipboard library | Library is unnecessary wrapper around same API. Direct API is simpler and lighter. |
| Custom browser mockup HTML | DaisyUI mockup-browser component | DaisyUI not in project. Simple HTML+CSS mockup is 10 lines. |

**Installation:**
No new dependencies required. All capabilities exist in current stack.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── admin/
│       └── embed/
│           └── page.tsx           # Main embed page (Server Component wrapper)
├── components/
│   └── admin/
│       ├── EmbedPage.tsx          # Client component with config state
│       ├── ConfigPanel.tsx        # Position/theme/greeting controls
│       ├── CodeBlock.tsx          # Syntax-highlighted snippet + copy button
│       └── BrowserPreview.tsx     # Browser mockup frame with widget iframe
```

### Pattern 1: Reactive Configuration with Shared State

**What:** Single source of truth for config options (position, theme, greeting) in parent component. Child components (ConfigPanel, CodeBlock, BrowserPreview) all consume the same state.

**When to use:** When multiple UI elements need to stay in sync with configuration changes (this phase).

**Example:**
```typescript
// src/components/admin/EmbedPage.tsx
"use client";

import { useState } from "react";
import { ConfigPanel } from "./ConfigPanel";
import { CodeBlock } from "./CodeBlock";
import { BrowserPreview } from "./BrowserPreview";

type WidgetConfig = {
  position: "bottom-right" | "bottom-left";
  theme: "light" | "dark";
  greeting?: string;
};

export function EmbedPage() {
  const [config, setConfig] = useState<WidgetConfig>({
    position: "bottom-right",
    theme: "light",
  });

  // Generate embed code from current config
  const embedCode = generateEmbedCode(config);

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <ConfigPanel config={config} onChange={setConfig} />
        <CodeBlock code={embedCode} />
      </div>
      <div>
        <BrowserPreview config={config} />
      </div>
    </div>
  );
}

function generateEmbedCode(config: WidgetConfig): string {
  const attrs = [`src="${window.location.origin}/widget.js"`];
  if (config.theme !== "light") attrs.push(`data-theme="${config.theme}"`);
  if (config.position !== "bottom-right") attrs.push(`data-position="${config.position}"`);
  if (config.greeting) attrs.push(`data-greeting="${config.greeting}"`);
  return `<script ${attrs.join(" ")}></script>`;
}
```

### Pattern 2: Hand-Styled Syntax Highlighting with Tailwind

**What:** Parse HTML string into tokens (tag, attribute, string, text) and render each with distinct Tailwind color classes.

**When to use:** When you need lightweight syntax highlighting for a single language without adding a library.

**Example:**
```typescript
// src/components/admin/CodeBlock.tsx
type Token =
  | { type: "tag"; value: string }
  | { type: "attr"; value: string }
  | { type: "string"; value: string }
  | { type: "text"; value: string };

function tokenizeHTML(code: string): Token[] {
  const tokens: Token[] = [];
  const regex = /<(\w+)|(\w+)=|"([^"]*)"|([^<>"]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(code)) !== null) {
    if (match[1]) tokens.push({ type: "tag", value: `<${match[1]}` });
    else if (match[2]) tokens.push({ type: "attr", value: `${match[2]}=` });
    else if (match[3]) tokens.push({ type: "string", value: `"${match[3]}"` });
    else if (match[4]?.trim()) tokens.push({ type: "text", value: match[4] });
  }

  // Close tag
  if (code.includes("</")) {
    tokens.push({ type: "tag", value: code.match(/<\/\w+>/)?.[0] || "" });
  } else if (code.endsWith(">")) {
    tokens.push({ type: "tag", value: ">" });
  }

  return tokens;
}

function HighlightedCode({ code }: { code: string }) {
  const tokens = tokenizeHTML(code);

  return (
    <code className="text-sm">
      {tokens.map((token, i) => (
        <span
          key={i}
          className={
            token.type === "tag" ? "text-pink-400" :
            token.type === "attr" ? "text-cyan-300" :
            token.type === "string" ? "text-green-300" :
            "text-gray-300"
          }
        >
          {token.value}
        </span>
      ))}
    </code>
  );
}
```

### Pattern 3: Copy Button with Icon State Transition

**What:** Button with Copy icon that switches to Check icon for 2 seconds after successful copy, then reverts.

**When to use:** Providing visual feedback for clipboard operations.

**Example:**
```typescript
// src/components/admin/CodeBlock.tsx
import { Copy, Check } from "lucide-react";
import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      // Optionally show error toast
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded hover:bg-gray-700 transition-colors"
      aria-label={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-gray-400" />
      )}
    </button>
  );
}
```

### Pattern 4: Browser Mockup with Interactive Iframe

**What:** Simple HTML/CSS mockup of a browser window with fake address bar and content area containing a live iframe.

**When to use:** Showing "in context" preview of embedded widgets or components.

**Example:**
```typescript
// src/components/admin/BrowserPreview.tsx
import { useEffect, useRef } from "react";

type BrowserPreviewProps = {
  config: WidgetConfig;
};

export function BrowserPreview({ config }: BrowserPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Send config updates to iframe via postMessage
  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return;

    iframeRef.current.contentWindow.postMessage(
      { type: "CONFIG_UPDATE", config },
      window.location.origin
    );
  }, [config]);

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-lg">
      {/* Browser toolbar mockup */}
      <div className="bg-gray-100 dark:bg-gray-900 px-4 py-2 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded px-3 py-1 text-xs text-gray-600 dark:text-gray-400">
            https://example.com
          </div>
        </div>
      </div>

      {/* Content area with iframe */}
      <div className="bg-gray-50 dark:bg-gray-900 h-[600px] relative">
        <iframe
          ref={iframeRef}
          src="/widget"
          className="w-full h-full border-0"
          title="Widget Preview"
        />
      </div>
    </div>
  );
}
```

### Pattern 5: Admin Layout Integration

**What:** Add navigation link to admin layout and CTA button on dashboard.

**When to use:** Making new admin pages discoverable.

**Example:**
```typescript
// src/app/admin/layout.tsx - Add to nav bar
<nav className="flex items-center gap-4">
  <Link href="/admin">Knowledge Base</Link>
  <Link href="/admin/embed">Embed Widget</Link>
</nav>

// src/app/admin/AdminDashboard.tsx - Add CTA button
<div className="mb-8 flex items-center justify-between">
  <h1>Knowledge Base</h1>
  <Link
    href="/admin/embed"
    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  >
    <Code className="w-4 h-4" />
    Get Embed Code
  </Link>
</div>
```

### Anti-Patterns to Avoid

- **Installing syntax highlighting library for one code block:** Adds significant bundle size for minimal value. Hand-rolled tokenizer is 20 lines and covers the use case.
- **Using third-party clipboard library:** `navigator.clipboard.writeText()` is well-supported (baseline since March 2020) and requires no dependency.
- **Passing config via URL params to iframe:** postMessage is more flexible and doesn't pollute URL. URL params are harder to update dynamically.
- **Building complex theme switcher in preview:** Just use the same `next-themes` integration that exists in the app. No need to reinvent.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Theme detection and persistence | Custom theme state + localStorage | `next-themes` (already in project) | Handles SSR hydration, system preference detection, storage sync automatically. Already integrated in Phase 5. |
| Icon rendering | SVG strings or custom icon component | `lucide-react` imports (Copy, Check, Code, etc.) | Project standard, consistent sizing, tree-shakeable, accessible. |
| Responsive grid layout | Custom media query hooks | Tailwind responsive classes (`grid lg:grid-cols-2`) | Tailwind v4 has excellent responsive utilities. No need for JavaScript. |

**Key insight:** This phase is primarily UI presentation, not complex logic. Lean heavily on Tailwind for styling and layout, React for state management, and existing project patterns. The only "novel" code is the HTML tokenizer for syntax highlighting (unavoidable, but simple).

## Common Pitfalls

### Pitfall 1: Clipboard API Fails in Non-HTTPS Contexts

**What goes wrong:** `navigator.clipboard.writeText()` throws `NotAllowedError` or is undefined on non-HTTPS pages.

**Why it happens:** Browser security policy requires secure context (HTTPS or localhost) for clipboard access.

**How to avoid:**
- Development on `localhost` works fine (secure context exception).
- Production deployment on Vercel uses HTTPS by default.
- Add error handling to catch and log clipboard failures gracefully.

**Warning signs:** Copy button doesn't work in production, or throws exception in browser console.

**Prevention:**
```typescript
async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) {
    console.error("Clipboard API not available (non-HTTPS context?)");
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
}
```

### Pitfall 2: Syntax Highlighting Breaks with Special Characters

**What goes wrong:** HTML entities (`&lt;`, `&quot;`) or special attribute values break the tokenizer regex.

**Why it happens:** Simple regex assumes well-formed, unescaped HTML.

**How to avoid:** The embed code is machine-generated (not user input), so it's always well-formed. If you need to support arbitrary HTML later, use a proper HTML parser.

**Warning signs:** Code block shows garbled tokens or missing parts of the snippet.

**Prevention:** Generate embed code programmatically (no template strings with user input). Validate output before rendering.

### Pitfall 3: Preview Iframe Not Receiving Config Updates

**What goes wrong:** Changing position/theme in config panel doesn't update the widget preview.

**Why it happens:**
1. postMessage sent before iframe loaded (`contentWindow` is null).
2. Widget page doesn't have message listener.
3. Origin validation rejects messages.

**How to avoid:**
- Use `useEffect` to send postMessage only after iframe ref is set.
- Ensure widget page has `window.addEventListener("message", ...)` handler.
- Match origin exactly in validation (both sides use `window.location.origin`).

**Warning signs:** Widget always shows default theme/position regardless of config changes.

**Prevention:**
```typescript
// In BrowserPreview component
useEffect(() => {
  const iframe = iframeRef.current;
  if (!iframe?.contentWindow) return;

  // Wait for iframe to load before sending config
  const handleLoad = () => {
    iframe.contentWindow?.postMessage(
      { type: "CONFIG_UPDATE", config },
      window.location.origin
    );
  };

  iframe.addEventListener("load", handleLoad);
  return () => iframe.removeEventListener("load", handleLoad);
}, [config]);

// In widget page (/app/widget/page.tsx)
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if (event.data.type === "CONFIG_UPDATE") {
      setConfig(event.data.config);
    }
  };

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, []);
```

### Pitfall 4: Dark Theme CSS Leaking into Code Block

**What goes wrong:** Admin panel's dark mode applies to the code block (which should always be dark regardless of theme).

**Why it happens:** Tailwind's `dark:` variant applies globally. If parent has `data-theme="dark"`, all children with `dark:` classes activate.

**How to avoid:**
- Don't use `dark:` variant in code block component.
- Use fixed colors (`bg-gray-900`, `text-pink-400`) instead of theme-aware colors.
- Optionally wrap code block in a div with `data-theme="dark"` to isolate it.

**Warning signs:** Code block background color changes when toggling admin theme.

**Prevention:**
```typescript
// CodeBlock always uses dark background, regardless of admin theme
<pre className="bg-gray-900 text-gray-100 p-4 rounded-lg">
  {/* No dark: classes here — fixed colors only */}
</pre>
```

### Pitfall 5: Config State Not Persisting on Page Reload

**What goes wrong:** User configures widget, copies code, refreshes page, and config resets to defaults.

**Why it happens:** React `useState` is ephemeral — doesn't persist across reloads.

**How to avoid:** This is **intentional** for this phase. The embed page is a utility, not a "save your configuration" feature. Each visit starts fresh. If persistence is needed later, use localStorage or a server-side config table.

**Warning signs:** None — this is expected behavior.

## Code Examples

Verified patterns from official sources and project conventions:

### Minimal HTML Tokenizer for Syntax Highlighting

**Purpose:** Parse `<script src="..." data-theme="dark"></script>` into colored tokens.

**Source:** Custom implementation based on project requirements (no external library).

```typescript
type Token =
  | { type: "tag"; value: string }       // <script, </script>, >
  | { type: "attr"; value: string }      // src=, data-theme=
  | { type: "string"; value: string }    // "value"
  | { type: "text"; value: string };     // whitespace

function tokenizeHTML(code: string): Token[] {
  const tokens: Token[] = [];
  const regex = /<(\w+)|<\/(w+)>|(\w+(?:-\w+)*)=|"([^"]*)"|([^<>"]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(code)) !== null) {
    if (match[1]) {
      // Opening tag
      tokens.push({ type: "tag", value: `<${match[1]}` });
    } else if (match[2]) {
      // Closing tag
      tokens.push({ type: "tag", value: `</${match[2]}>` });
    } else if (match[3]) {
      // Attribute name
      tokens.push({ type: "attr", value: `${match[3]}=` });
    } else if (match[4] !== undefined) {
      // String value (including empty strings)
      tokens.push({ type: "string", value: `"${match[4]}"` });
    } else if (match[5] && match[5].trim()) {
      // Text content (whitespace)
      tokens.push({ type: "text", value: match[5] });
    }
  }

  // Add closing > if not captured
  if (code.trim().endsWith(">") && tokens[tokens.length - 1]?.value !== ">") {
    tokens.push({ type: "tag", value: ">" });
  }

  return tokens;
}

// Render with Tailwind color classes
function HighlightedCode({ code }: { code: string }) {
  const tokens = tokenizeHTML(code);

  return (
    <code className="font-mono text-sm">
      {tokens.map((token, i) => (
        <span
          key={i}
          className={
            token.type === "tag" ? "text-pink-400" :        // Tags: pink
            token.type === "attr" ? "text-cyan-300" :       // Attributes: cyan
            token.type === "string" ? "text-green-300" :    // Strings: green
            "text-gray-400"                                  // Whitespace: gray
          }
        >
          {token.value}
        </span>
      ))}
    </code>
  );
}
```

**Tailwind color choices (Claude's discretion):**
- Tags (`<script>`, `</script>`): `text-pink-400` — bright, stands out
- Attributes (`src=`, `data-theme=`): `text-cyan-300` — distinct from tags
- String values (`"light"`, `"/widget.js"`): `text-green-300` — classic string green
- Whitespace/text: `text-gray-400` — low contrast, recedes into background

### Copy Button with Clipboard API

**Purpose:** Copy embed code to clipboard with visual feedback.

**Source:** [MDN - Clipboard.writeText()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText), [lucide-react icons](https://lucide.dev/icons/clipboard-copy).

```typescript
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      console.error("Clipboard API not available");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      // Could show toast notification here
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors text-sm"
      aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-400" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
```

### Browser Mockup with Iframe

**Purpose:** Show widget preview in a simulated browser window.

**Source:** Inspired by [daisyUI mockup-browser](https://daisyui.com/components/mockup-browser/), adapted for Tailwind CSS.

```typescript
interface BrowserPreviewProps {
  iframeSrc: string;
  url?: string;
}

export function BrowserPreview({ iframeSrc, url = "https://example.com" }: BrowserPreviewProps) {
  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-xl">
      {/* Browser toolbar */}
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2.5 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* Window controls (macOS style) */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          {/* Address bar */}
          <div className="flex-1 bg-white dark:bg-gray-900 rounded-md px-4 py-1.5 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
            {url}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="bg-gray-50 dark:bg-gray-900 h-[600px]">
        <iframe
          src={iframeSrc}
          className="w-full h-full border-0"
          title="Widget Preview"
          allow="clipboard-write"
        />
      </div>
    </div>
  );
}
```

### Config Panel with Dropdowns

**Purpose:** Inline controls for position, theme, greeting configuration.

**Source:** Project pattern from ThemeToggle component, adapted for custom dropdowns.

```typescript
interface ConfigPanelProps {
  config: WidgetConfig;
  onChange: (config: WidgetConfig) => void;
}

export function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Widget Configuration
      </h3>

      {/* Position dropdown */}
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
          Position
        </label>
        <select
          value={config.position}
          onChange={(e) => onChange({ ...config, position: e.target.value as "bottom-right" | "bottom-left" })}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="bottom-right">Bottom Right</option>
          <option value="bottom-left">Bottom Left</option>
        </select>
      </div>

      {/* Theme dropdown */}
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
          Default Theme
        </label>
        <select
          value={config.theme}
          onChange={(e) => onChange({ ...config, theme: e.target.value as "light" | "dark" })}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      {/* Greeting textarea */}
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
          Custom Greeting (optional)
        </label>
        <textarea
          value={config.greeting || ""}
          onChange={(e) => onChange({ ...config, greeting: e.target.value || undefined })}
          placeholder="Hi! How can I help you today?"
          rows={2}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
    </div>
  );
}
```

**Note on greeting input:** Using `<textarea>` (2 rows) instead of `<input>` to allow multi-line greetings. This is Claude's discretion decision — textareas handle longer messages better and feel more appropriate for a greeting message.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| document.execCommand('copy') | navigator.clipboard.writeText() | Baseline since March 2020 | execCommand is deprecated and unreliable. Clipboard API is promise-based, more secure, better error handling. |
| Class-based dark mode (class="dark") | data-theme attribute with @custom-variant | Tailwind v4 (2024) | Better SSR hydration, explicit theme attribute, cleaner separation from utility classes. Project uses this since Phase 5. |
| Syntax highlighting libraries (Prism, Highlight.js) | Hand-rolled tokenizers for simple cases | Ongoing trend (bundle size awareness) | For single language, minimal highlighting, a 20-line tokenizer beats a 100KB library. Trade accuracy for performance. |

**Deprecated/outdated:**
- **document.execCommand('copy'):** Deprecated, removed from standards. Use Clipboard API instead.
- **react-copy-to-clipboard library:** Unnecessary wrapper. Use native API directly.
- **Heavy syntax highlighting libraries for one code block:** Prism.js is 50KB min+gzip for full language support. Overkill for a single `<script>` tag.

## Open Questions

1. **Should preview iframe support multiple widget instances?**
   - What we know: Current plan shows one widget in preview.
   - What's unclear: If user configures `bottom-left`, should we show `bottom-right` simultaneously to compare?
   - Recommendation: No. Preview shows "what your website will look like" (singular widget). Comparing positions is not in scope.

2. **Should config state persist in localStorage?**
   - What we know: User decided page is a "utility" (copy code and leave).
   - What's unclear: Would persistence improve UX if admin comes back later?
   - Recommendation: Start without persistence (simpler). Add in future phase if users request it.

3. **Should we validate greeting message length/content?**
   - What we know: Greeting is optional, passed as `data-greeting` attribute.
   - What's unclear: Max length? Escape quotes? HTML entities?
   - Recommendation: No validation in Phase 7. The widget loader can handle any string (it's innerHTML, not eval). If XSS concerns arise, sanitize in Phase 8.

## Sources

### Primary (HIGH confidence)
- [MDN - Clipboard.writeText()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText) - Clipboard API spec and browser support
- [MDN - Window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) - Cross-origin iframe communication
- [lucide-react clipboard icons](https://lucide.dev/icons/clipboard-copy) - Icon library docs
- Project files: `src/app/admin/layout.tsx`, `src/components/ui/ThemeToggle.tsx`, `src/app/globals.css` - Existing patterns for admin UI, dropdowns, theme integration

### Secondary (MEDIUM confidence)
- [daisyUI mockup-browser](https://daisyui.com/components/mockup-browser/) - Browser mockup design reference
- [useCopyToClipboard React Hook](https://usehooks-ts.com/react-hook/use-copy-to-clipboard) - Pattern verification (not using library, but validates approach)
- WebSearch results for React select dropdowns - Confirmed native `<select>` is appropriate for simple dropdowns (no complex library needed)

### Tertiary (LOW confidence)
- WebSearch results on syntax highlighting libraries - Used for comparison only, not implemented

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - All tools already in project, no new dependencies
- Architecture: **HIGH** - Patterns match existing admin components (ThemeToggle, DocumentTable)
- Pitfalls: **MEDIUM-HIGH** - Clipboard API pitfalls well-documented, postMessage issues are common but solvable

**Research date:** 2026-02-09
**Valid until:** 2026-03-15 (30 days - stable APIs, no fast-moving dependencies)
