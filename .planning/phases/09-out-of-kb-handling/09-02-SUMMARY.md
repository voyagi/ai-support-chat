---
phase: 09-out-of-kb-handling
plan: 02
subsystem: frontend-ui-admin
tags: [contact-form, admin-dashboard, ui-components, dark-mode]
dependency-graph:
  requires: [09-01]
  provides: [contact-form-ui, admin-contacts-dashboard]
  affects: [chat-ui, admin-nav]
tech-stack:
  added: [ContactForm-component, ContactsTable-component]
  patterns: [data-parts-rendering, useId-accessibility, responsive-tables]
key-files:
  created:
    - src/components/chat/ContactForm.tsx
    - src/app/admin/contacts/page.tsx
    - src/app/admin/contacts/ContactsTable.tsx
  modified:
    - src/components/chat/MessageBubble.tsx
    - src/components/chat/ChatWindow.tsx
    - src/app/admin/layout.tsx
decisions:
  - ContactForm uses useId for accessible form input IDs (Phase 07 pattern)
  - contactFormMap state pattern (same as sourcesMap) for persisting form across renders
  - Status badges with semantic color coding (amber=pending, blue=contacted, green=resolved)
  - Responsive design with desktop table and mobile card layout
  - Amber/warm tones for contact form to signal "needs attention" without alarm
metrics:
  duration: 15min
  tasks: 3
  files: 6
  commits: 2
  completed: 2026-02-10
---

# Phase 09 Plan 02: Out-of-KB Frontend UI Summary

**One-liner:** Inline ContactForm component renders from data parts in chat messages, submits to backend API, with admin dashboard showing all submissions in responsive table/card layouts.

## What Was Built

Frontend completion of the out-of-knowledge-base handling feature:

1. **ContactForm Component**: Inline form with name/email fields, submission states (submitting/submitted/error), amber/warm styling for visual distinction
2. **Chat Integration**: MessageBubble detects contact-form data parts, ChatWindow passes parts through, form persists via contactFormMap state
3. **Admin Contacts Dashboard**: Server Component fetching submissions from database, responsive ContactsTable with desktop table and mobile card layouts
4. **Admin Nav Update**: Added Contacts link between Analytics and end (4 total nav links)

**Key User Flow**: User asks out-of-KB question → bot streams "I don't have information..." + contact-form data part → ContactForm renders inline → user fills name/email → POST to /api/contact → success confirmation → admin views submission at /admin/contacts.

## Implementation Details

### ContactForm Component

```typescript
// src/components/chat/ContactForm.tsx
- Props: conversationId (string), originalQuestion (string)
- State: name, email, submitting, submitted, error
- Form submission: POST /api/contact with JSON body
- Success: green confirmation "Thanks! Our team will get back to you soon."
- Error: red error message with retry option
- Accessibility: useId() for input IDs (prevents duplicate IDs if component used multiple times)
- Styling: amber/warm tones (bg-amber-50 dark:bg-amber-900/20) for "needs attention" feel
```

### MessageBubble Integration

**Data Part Detection**:
```typescript
const dataPart = parts.find((part) => part.type === "data");
if (dataPart && Array.isArray(dataPart.data)) {
  const contactFormData = dataPart.data.find(
    (item: { type?: string }) => item.type === "contact-form",
  );
  // Extract conversationId + originalQuestion, render ContactForm
}
```

AI SDK v6 data parts arrive as `{ type: 'data', data: [...] }` on the message parts array. The contact-form item contains `{ type: 'contact-form', conversationId, originalQuestion }`.

### ChatWindow State Management

**contactFormMap Pattern** (matches sourcesMap pattern from Phase 04):
```typescript
const [contactFormMap, setContactFormMap] = useState<Record<string, ContactFormData>>({});

// In DefaultChatTransport fetch wrapper:
// Extract contact form data from response, store with _pending key
// After message finalized, associate with message.id
```

This pattern ensures the contact form persists across re-renders and doesn't get lost during streaming.

### Admin Contacts Dashboard

**Server Component** (`src/app/admin/contacts/page.tsx`):
- Auth check via getSession() + redirect pattern (Data Access Layer)
- Queries contact_submissions table: id, name, email, original_question, status, created_at, conversation_id
- Orders by created_at DESC (newest first)
- Passes data to ContactsTable client component

**ContactsTable Component** (`src/app/admin/contacts/ContactsTable.tsx`):
- Desktop: Full table with columns (Date, Name, Email, Question, Status)
- Mobile: Card layout with all fields stacked
- Status badges: Pending (amber), Contacted (blue), Resolved (green)
- Question truncation: 80 chars with ellipsis, full text on hover (title attribute)
- Date formatting: `toLocaleDateString` + `toLocaleTimeString`
- Empty state: "No contact submissions yet"

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Issue] Contact form lost on re-render during debugging**
- **Found during:** Task 3 human verification (debugging session prior to this execution)
- **Issue:** ContactForm was being extracted from last message's parts on every render, causing loss of form state when message updates
- **Fix:** Implemented contactFormMap state pattern (same as sourcesMap) to persist contact form data across renders
- **Files modified:** ChatWindow.tsx (added contactFormMap state + fetch wrapper logic)
- **Commit:** Applied during debugging session before this plan execution

**2. [Rule 3 - Blocking Issue] MessageBubble had inline test components**
- **Found during:** Task 3 human verification (debugging session prior to this execution)
- **Issue:** MinimalHookTest and inline InlineContactForm were left in MessageBubble from debugging
- **Fix:** Removed test components, ensured clean import of standalone ContactForm
- **Files modified:** MessageBubble.tsx
- **Commit:** Applied during debugging session before this plan execution

**3. [Rule 3 - Blocking Issue] contact_submissions migration not applied to Supabase**
- **Found during:** Task 3 human verification (debugging session prior to this execution)
- **Issue:** Migration 009_contact_submissions.sql existed in repo but wasn't applied to Supabase project
- **Fix:** Ran migration via Supabase SQL editor
- **Commit:** N/A (database operation, not code change)

**Note:** These fixes were discovered and applied during a debugging session that occurred between the plan execution start and the human verification checkpoint. The issues were blocking Task 3 verification, so they were fixed according to Rule 3 (auto-fix blocking issues).

## Architecture Impact

**New Components**:
- `ContactForm` - Reusable inline form component (could be used in other contexts if needed)
- `ContactsTable` - Admin-only component for viewing submissions

**Modified Flow**:
1. Chat route detects low confidence → streams contact-form data part (Phase 09-01)
2. ChatWindow receives data part via AI SDK stream → stores in contactFormMap
3. MessageBubble detects data part in message.parts → renders ContactForm
4. User submits form → POST /api/contact → success confirmation
5. Admin views /admin/contacts → sees all submissions with status badges

**Admin Navigation**: 4 links total (Knowledge Base, Embed Widget, Analytics, Contacts)

## Testing Notes

**Verified during Task 3 human verification**:
1. Out-of-KB question ("What's the weather in Tokyo?") triggers contact form ✓
2. Contact form renders inline below "I don't have information..." message ✓
3. Form submission works (name + email + auto-included question) ✓
4. Success confirmation shows after submission ✓
5. Admin contacts page shows submission with pending status ✓
6. In-KB question works normally with no contact form ✓
7. Admin nav has all 4 links ✓
8. Dark mode works throughout (form, table, badges) ✓
9. Responsive layout works (desktop table, mobile cards) ✓
10. Status badges have proper color coding ✓

**Edge Cases Handled**:
- Empty submissions list shows "No contact submissions yet" message
- Long questions truncated to 80 chars with full text on hover
- Form prevents double submission (disabled state while submitting)
- Form cannot be resubmitted after success (replaced with confirmation)

## Verification

All verification criteria passed:
- ✅ `npm run check` passes with no lint errors
- ✅ `npm run build` succeeds
- ✅ Out-of-KB query triggers contact form inline in chat
- ✅ In-KB query returns normal answer without contact form
- ✅ Contact form submission saves to database
- ✅ Admin contacts page lists submissions with status badges
- ✅ Admin nav includes Contacts link
- ✅ Responsive design works (desktop table, mobile cards)
- ✅ Dark mode works throughout

## Self-Check: PASSED

**Created Files**:
- ✅ FOUND: src/components/chat/ContactForm.tsx
- ✅ FOUND: src/app/admin/contacts/page.tsx
- ✅ FOUND: src/app/admin/contacts/ContactsTable.tsx

**Modified Files**:
- ✅ FOUND: src/components/chat/MessageBubble.tsx (contact form rendering logic)
- ✅ FOUND: src/components/chat/ChatWindow.tsx (parts prop passed to MessageBubble)
- ✅ FOUND: src/app/admin/layout.tsx (Contacts nav link added)

**Commits**:
- ✅ FOUND: 907c145 (feat(09-02): add ContactForm component and integrate into chat flow)
- ✅ FOUND: effdd1d (feat(09-02): add admin contacts dashboard page)

## Next Steps

Phase 09 is now complete! Out-of-KB handling works end-to-end:
- Low-confidence detection in backend (Phase 09-01)
- Contact form UI in chat (Phase 09-02)
- Admin dashboard for viewing submissions (Phase 09-02)

**Phase 10** (if it exists in roadmap) or final polish/deployment tasks would be next. The core portfolio demo is functionally complete with all major features:
- ✅ RAG-powered chat with knowledge base
- ✅ Admin panel for content management
- ✅ Embeddable widget for external sites
- ✅ Analytics dashboard
- ✅ Out-of-KB handling with lead capture

This completes the out-of-KB handling feature, demonstrating to Upwork prospects that the chatbot gracefully handles unknown questions without hallucinating, captures leads, and provides admin visibility into knowledge gaps.
