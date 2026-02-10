---
phase: 09-out-of-kb-handling
plan: 01
subsystem: backend-infrastructure
tags: [rag, contact-form, database, api]
dependency-graph:
  requires: [08-analytics-dashboard]
  provides: [contact-submissions-table, contact-api, low-confidence-detection]
  affects: [chat-api]
tech-stack:
  added: [contact_submissions-table]
  patterns: [createUIMessageStream, text-delta-streaming, data-parts]
key-files:
  created:
    - supabase/migrations/009_contact_submissions.sql
    - src/app/api/contact/route.ts
  modified:
    - src/app/api/chat/route.ts
decisions:
  - createUIMessageStream with text-delta + data-contact-form parts for low-confidence responses
  - Confidence threshold remains 0.7 (consistent with existing RAG threshold)
  - Fire-and-forget persistence for low-confidence branch (matches high-confidence pattern)
  - status enum (pending/contacted/resolved) for workflow tracking in admin dashboard
metrics:
  duration: 5min
  tasks: 2
  files: 3
  commits: 2
  completed: 2026-02-10
---

# Phase 09 Plan 01: Out-of-KB Backend Infrastructure Summary

**One-liner:** Low-confidence RAG detection streams contact-form data parts instead of LLM responses, backed by contact_submissions table and validation API.

## What Was Built

Backend infrastructure for handling out-of-knowledge-base queries without hallucination:

1. **Database Layer**: `contact_submissions` table with status workflow (pending/contacted/resolved), conversation FK, and indexes for admin queries
2. **Contact API**: POST `/api/contact` endpoint with field validation (name, email, question) and email regex check
3. **Low-Confidence Detection**: Chat route now branches at confidence threshold (similarity < 0.7) to stream contact-form data parts instead of calling OpenAI

**Key Behavior Change**: When RAG retrieval returns no confident matches (empty chunks or all below 0.7 similarity), the bot now:
- Streams a fixed "I don't have information..." text via `text-delta`
- Streams a `data-contact-form` part with conversationId + originalQuestion
- Persists messages with `answered_from_kb: false`
- Returns early without calling the LLM

## Implementation Details

### Database Schema

```sql
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  original_question TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'contacted', 'resolved')) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Indexes on `(status, created_at DESC)` for admin dashboard and `conversation_id` for lookups.

### Contact API Validation

- Required fields: name, email, question (all non-empty strings)
- Email validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Returns `{ success: true, id: UUID }` on success
- Returns `{ error: "descriptive message" }` with 400/500 on failure
- No authentication (public endpoint called from chat UI)

### Chat Route Branching

```typescript
const hasConfidentAnswer = chunks.length > 0 && chunks[0].similarity > 0.7;

if (!hasConfidentAnswer) {
  // createUIMessageStream with text-delta + data-contact-form parts
  // Persist with answeredFromKb: false
  // Return early (no LLM call)
}

// High-confidence branch: existing LLM streaming flow
```

The `hasConfidentAnswer` check mirrors the existing `answeredFromKb` logic on line 148, ensuring consistency.

## Deviations from Plan

None - plan executed exactly as written. AI SDK v6 types required using `text-delta` (with `delta` property) and `data-contact-form` (with `data` property) instead of generic `type: "text"` and `type: "data"`.

## Architecture Impact

**New Flow**:
1. User asks question → RAG retrieval
2. If `similarity < 0.7` or `chunks.length === 0`:
   - Stream text: "I don't have information..."
   - Stream data part: `{ type: "contact-form", conversationId, originalQuestion }`
   - Frontend (next plan) will render ContactForm component
3. User fills form → POST `/api/contact` → saved to `contact_submissions`
4. Admin can view submissions in future analytics extension

**Files Modified**: 1 (chat route)
**Files Created**: 2 (migration, contact API)

## Testing Notes

**Manual Test Cases** (for Phase 09-02 verification):
1. Ask question with no KB match → should trigger contact form
2. Submit form with valid data → should save to database
3. Submit form with invalid email → should return 400 error
4. Submit form with missing fields → should return 400 error
5. Ask question with KB match (similarity > 0.7) → should use LLM (no contact form)

**Edge Case Handled**: `conversationId` is optional in contact API (can be null if conversation creation fails edge case).

## Verification

All verification criteria passed:
- ✅ `npm run check` passes with no lint errors
- ✅ `npm run build` succeeds
- ✅ Chat route contains `hasConfidentAnswer` check before LLM streaming
- ✅ Low-confidence path uses `createUIMessageStream` with text-delta + data-contact-form
- ✅ Contact API validates input and returns proper error codes (400/500)
- ✅ SQL migration has all required columns, constraints, and indexes

## Self-Check: PASSED

**Created Files**:
- ✅ FOUND: supabase/migrations/009_contact_submissions.sql
- ✅ FOUND: src/app/api/contact/route.ts

**Modified Files**:
- ✅ FOUND: src/app/api/chat/route.ts (48 insertions, 1 deletion)

**Commits**:
- ✅ FOUND: dbb84d2 (feat(09-01): add contact submissions table and API endpoint)
- ✅ FOUND: feb040a (feat(09-01): add low-confidence detection with contact-form data part)

## Next Steps

Phase 09-02 will build the frontend ContactForm component that:
1. Listens for `data-contact-form` parts in the AI SDK stream
2. Renders an inline form with name, email fields (pre-filled originalQuestion)
3. Calls POST `/api/contact` on submit
4. Shows success/error states

This completes the backend half of the out-of-KB handling feature.
