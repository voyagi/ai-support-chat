# Phase 2: Admin Panel & Content Upload - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>

## Phase Boundary

Admin can upload documents, view/manage the knowledge base, and FlowBoard demo content is pre-loaded. Covers: password-gated admin access, document upload with chunking/embedding, document list management, and seeding 15-20 FlowBoard demo docs. Chat UI, widget, analytics, and embed code are separate phases.

</domain>

<decisions>

## Implementation Decisions

### Auth gate experience

- Password stored as environment variable, entered on a login page
- Session persists for 24 hours via persistent cookie
- Wrong password shows shake animation + "Incorrect password" message — no lockout
- Login page is polished: centered card with logo/branding, gradient background, smooth transitions

### Document upload flow

- Accepts plain text (.txt) and Markdown (.md) files only
- Multi-file drag & drop upload supported
- Processing feedback via status badges per file: "Processing..." → "Ready" (not progress bars)
- Document title auto-extracted from filename, editable by admin before confirming

### Knowledge base view

- Table layout with sortable columns: title, upload date, chunk count, processing status
- Expandable rows — click a document to see its chunks inline without navigating away
- Delete uses a confirm dialog: "Delete 'X'? This removes all chunks and embeddings."

### FlowBoard demo content

- Broad coverage across 5+ categories: product features, support/troubleshooting, billing/pricing, onboarding, integrations, API docs
- Friendly professional tone (Notion/Linear style — approachable, not corporate)
- Mix of doc lengths: some short FAQ entries (~200-400 words), some longer guides (~400-800 words)
- Content seeded automatically via script AND available as .md files for re-upload demos through the admin UI

### Claude's Discretion

- Exact password cookie/session implementation details
- Table sorting mechanics and default sort order
- Drag & drop zone styling and file validation UX
- Chunk display format in expandable rows
- Specific FlowBoard doc topics within the agreed categories

</decisions>

<specifics>

## Specific Ideas

- Login page should feel premium — this is the first thing a prospect sees when exploring the admin side
- Status badges (not progress bars) for processing feedback — keep it clean
- FlowBoard docs already have established context from Phase 1: Founded 2021, Free/Pro/Enterprise tiers — maintain consistency
- Expandable table rows for chunk inspection lets prospects see the RAG pipeline at work without extra navigation

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-admin-panel-content-upload*
*Context gathered: 2026-02-08*
