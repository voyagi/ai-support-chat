# Phase 7: Embed Code Generator - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>

## Phase Boundary

Admin page at `/admin/embed` where the admin copies a ready-to-paste embed code snippet for the widget built in Phase 6. Includes basic configuration options, syntax-highlighted code block with copy button, and a live interactive preview showing the widget in a simulated host page. This phase does NOT add new widget capabilities — it surfaces what already exists.

</domain>

<decisions>

## Implementation Decisions

### Code presentation

- Dark code block background (VS Code dark style) regardless of admin panel theme
- Minimal snippet: just the `<script>` tag, not a full HTML page example
- Hand-styled syntax highlighting with Tailwind (no Prism/Shiki dependency)
- Color HTML tags, attributes, and string values distinctly on dark background
- Copy button with clipboard icon that swaps to checkmark for ~2 seconds on click, then reverts

### Configuration options

- Three configurable options: widget position (bottom-right/bottom-left), default theme (light/dark), and custom greeting message
- Options rendered as inline controls (dropdowns/toggles) directly above the code block
- Changing any option instantly updates the snippet below (live reactivity, no "Generate" button)
- Options map to `data-*` attributes on the script tag (data-position, data-theme, data-greeting)

### Live preview

- Widget preview rendered inside a simulated "host page" frame (browser mockup with fake URL bar and page content)
- Fully interactive — admin can click the bubble, open the widget, type messages, see it working
- Preview updates live when admin changes configuration options (position, theme)
- Desktop viewport only — no mobile preview toggle
- Preview uses an iframe pointing to `/widget` with config passed via URL params or postMessage

### Page placement & layout

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

</decisions>

<specifics>

## Specific Ideas

- The preview should feel like Intercom's embed page — professional, shows the widget "in context" on a fake website
- Code block should be visually prominent — the main thing on the left column
- Keep it simple: this is a utility page, not a complex configurator

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-embed-code-generator*
*Context gathered: 2026-02-09*
