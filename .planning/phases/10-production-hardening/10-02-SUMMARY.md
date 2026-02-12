---
phase: 10-production-hardening
plan: 02
subsystem: sandbox-mode
tags: [rag, multi-tenant, tenant-isolation, demo-enhancement]

dependency_graph:
  requires:
    - "01-rag: similarity search infrastructure"
    - "01-embeddings: document chunking and embedding generation"
    - "09-out-of-kb: confident answer detection threshold"
  provides:
    - "sandbox-upload: tenant-isolated document upload API"
    - "tenant-rag: multi-tenant RAG search"
    - "cleanup-cron: automatic tenant data expiration"
  affects:
    - "chat-api: now passes tenant ID to RAG search when sandbox enabled"
    - "chat-page: conditionally shows sandbox uploader UI"

tech_stack:
  added:
    - "vercel-cron: daily cleanup scheduler"
  patterns:
    - "IP-based tenant ID generation via SHA-256 hashing"
    - "Shared constants pattern (client/server split)"
    - "Graceful RPC parameter extension (optional tenant_id)"

key_files:
  created:
    - "src/lib/sandbox/tenant-id.ts: IP hashing and extraction"
    - "src/lib/sandbox/upload-limits.ts: upload validation"
    - "src/lib/sandbox/constants.ts: client-safe limits"
    - "src/app/api/sandbox/upload/route.ts: tenant upload endpoint"
    - "src/app/api/cron/cleanup-sandbox/route.ts: daily cleanup"
    - "src/app/chat/SandboxUploader.tsx: upload UI component"
    - "supabase/migrations/010_sandbox_tenant_isolation.sql: schema changes"
    - "vercel.json: cron schedule configuration"
  modified:
    - "src/lib/rag/similarity-search.ts: added optional tenantId parameter"
    - "src/app/api/chat/route.ts: passes tenant ID when sandbox enabled"
    - "src/app/chat/page.tsx: conditionally renders SandboxUploader"

decisions:
  - what: "Use IP-based tenant IDs instead of session/cookie-based"
    why: "Simpler for demo, no auth required, consistent per-IP across visits"
    trade_off: "Shared IPs (office networks) see same tenant data"

  - what: "Skip RLS, use direct tenant_id filtering in queries"
    why: "Serverless environments make set_config unreliable, RLS adds complexity"
    trade_off: "Must remember to filter by tenant_id in all queries"

  - what: "Update match_document_chunks RPC with optional tenant_id parameter"
    why: "Returns BOTH main KB (tenant_id IS NULL) AND tenant docs in single query"
    trade_off: "Slightly more complex RPC logic, but avoids separate queries"

  - what: "Extract SANDBOX_LIMITS to constants.ts"
    why: "Client components can't import server-side Supabase module"
    trade_off: "Constants split across two files, but clear separation of concerns"

  - what: "24-hour retention for tenant data"
    why: "Long enough for demo sessions, short enough to avoid storage bloat"
    trade_off: "Prospects can't return after 24h to same docs"

metrics:
  duration: 8min
  tasks_completed: 3
  files_created: 8
  files_modified: 3
  commits: 3
  completed_at: 2026-02-12T09:41:52Z
---

# Phase 10 Plan 02: Sandbox Mode with Tenant Isolation Summary

**One-liner:** IP-based tenant isolation for prospect document uploads with automatic 24-hour cleanup via Vercel Cron.

## What Was Built

Added "try it yourself" sandbox mode that lets prospects upload their own documents and immediately chat with them alongside the FlowBoard demo KB. Documents are isolated per IP address (hashed for privacy) and automatically deleted after 24 hours.

**Core features:**
- Per-IP tenant ID generation (SHA-256 hash)
- Upload limits (3 docs, 5MB, .txt/.md/.pdf)
- Tenant-aware RAG search (returns main KB + tenant docs)
- Daily cleanup cron at 3 AM UTC
- Collapsible upload UI on chat page

## Technical Implementation

### Task 1: Tenant Isolation Library and Upload API

**Migration (010_sandbox_tenant_isolation.sql):**
- Added `tenant_id TEXT` column to `documents` and `document_chunks` tables
- Created indexes for efficient tenant filtering
- Updated `match_document_chunks` RPC to accept optional `tenant_id` parameter
- RPC returns both main KB (tenant_id IS NULL) and tenant docs when tenant_id provided

**Tenant ID Generation:**
- Extracts IP from `x-forwarded-for` header (Vercel standard)
- Hashes with SHA-256 for privacy
- Returns `tenant_${hash.substring(0, 12)}`

**Upload Validation:**
- Checks current document count per tenant
- Enforces 3-document limit
- Validates file type and size (5MB max)

**Upload Endpoint (/api/sandbox/upload):**
- Returns 403 if `NEXT_PUBLIC_SANDBOX_ENABLED !== 'true'`
- Returns 429 if tenant at document limit
- Follows same chunking/embedding pattern as admin upload
- Sets `tenant_id` on both documents and document_chunks inserts
- Orphan cleanup on failure

### Task 2: Tenant-Aware RAG and Cleanup Cron

**RAG Search Updates:**
- Added optional `tenantId` to `SearchOptions` interface
- Conditionally passes `tenant_id` to RPC call
- Chat API extracts IP and generates tenant ID when sandbox enabled
- RAG search includes tenant docs alongside main KB

**Cleanup Cron (/api/cron/cleanup-sandbox):**
- Verifies `Bearer ${CRON_SECRET}` authorization
- Calculates cutoff: 24 hours ago
- Deletes documents where `tenant_id IS NOT NULL AND created_at < cutoffTime`
- FK cascade automatically deletes corresponding chunks
- Scheduled via `vercel.json` at 3 AM UTC daily

**Main KB Protection:**
- Cleanup only targets rows with `tenant_id IS NOT NULL`
- Main demo KB (tenant_id IS NULL) never touched

### Task 3: Sandbox Upload UI

**SandboxUploader Component:**
- Collapsible panel (collapsed by default)
- Shows upload count: "X of 3 documents uploaded"
- Lists uploaded docs with chunk counts
- Upload button disabled when limit reached
- Shows file type and size limits
- Displays 24-hour availability notice
- Error handling with user-friendly messages
- Uses `useId` for accessible form IDs

**Chat Page Integration:**
- Server Component checks `NEXT_PUBLIC_SANDBOX_ENABLED`
- Conditionally renders SandboxUploader above ChatWindow
- Responsive flex layout (panel + chat window)

**Client/Server Split:**
- Extracted `SANDBOX_LIMITS` to `constants.ts` (client-safe)
- Re-exported from `upload-limits.ts` for server-side use
- Avoids importing server Supabase module in client components

## Verification Results

- ✅ `npm run check` passes (Biome lint + format)
- ✅ `npm run build` compiles without errors
- ✅ Sandbox upload API checks `NEXT_PUBLIC_SANDBOX_ENABLED` before allowing uploads
- ✅ Upload sets `tenant_id` on both documents and document_chunks
- ✅ RAG search accepts optional `tenantId` and passes to RPC
- ✅ Chat API passes tenant ID when sandbox enabled
- ✅ Cleanup cron only deletes `tenant_id IS NOT NULL` rows
- ✅ vercel.json has valid cron configuration (0 3 * * *)
- ✅ SandboxUploader shows when sandbox enabled, hidden otherwise

## Deviations from Plan

**1. [Rule 3 - Missing Functionality] Extracted SANDBOX_LIMITS to separate constants.ts**
- **Found during:** Task 3 build
- **Issue:** SandboxUploader (client component) imported SANDBOX_LIMITS from upload-limits.ts, which imports server-side Supabase client. Build failed with "You're importing a component that needs next/headers".
- **Fix:** Created `src/lib/sandbox/constants.ts` with just the limits constant. Updated `upload-limits.ts` to import and re-export it. Updated SandboxUploader to import from constants.ts.
- **Files modified:** constants.ts (new), upload-limits.ts, SandboxUploader.tsx
- **Commit:** Included in c269463

## Key Patterns

**IP-Based Tenant Isolation:**
```typescript
const ip = getIpFromRequest(request)  // x-forwarded-for or 127.0.0.1
const tenantId = getTenantIdFromIp(ip)  // tenant_${sha256(ip).substring(0, 12)}
```

**Multi-Tenant RPC Query:**
```sql
WHERE tenant_id IS NULL OR tenant_id = $tenant_id
```
Returns main KB docs for everyone, plus tenant docs when tenant_id provided.

**Client/Server Constants Split:**
```typescript
// constants.ts (client-safe)
export const SANDBOX_LIMITS = { ... }

// upload-limits.ts (server-side)
import { SANDBOX_LIMITS } from './constants'
export { SANDBOX_LIMITS }
export async function checkSandboxLimits(tenantId: string) { ... }
```

**Cleanup Cron Authorization:**
```typescript
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return 401
}
```

## User Setup Required

**Environment Variables (Vercel):**
1. Set `NEXT_PUBLIC_SANDBOX_ENABLED=true` to enable sandbox mode
2. Generate `CRON_SECRET`: `openssl rand -hex 32`
3. Add to Vercel environment variables

**Vercel Cron:**
- Automatically configured via `vercel.json`
- No manual dashboard setup needed
- Runs daily at 3 AM UTC

## Success Criteria Met

- ✅ Prospect can upload documents through chat page and immediately chat about their content
- ✅ Uploaded documents are isolated per IP (hashed tenant ID) and don't affect other visitors
- ✅ Main demo KB is always available alongside tenant docs
- ✅ Sandbox mode is controlled by a single environment variable (`NEXT_PUBLIC_SANDBOX_ENABLED`)
- ✅ Expired tenant data is automatically cleaned up daily (3 AM UTC)

## Commits

| Hash | Message |
|------|---------|
| 59f7c4e | feat(10-02): add tenant isolation library and sandbox upload API |
| adb3c4b | feat(10-02): wire tenant-aware RAG search and cleanup cron |
| c269463 | feat(10-02): add sandbox upload UI to chat page |

## Self-Check

Verifying all claimed files and commits exist:

**Created Files:**
- ✅ FOUND: src/lib/sandbox/tenant-id.ts
- ✅ FOUND: src/lib/sandbox/upload-limits.ts
- ✅ FOUND: src/lib/sandbox/constants.ts
- ✅ FOUND: src/app/api/sandbox/upload/route.ts
- ✅ FOUND: src/app/api/cron/cleanup-sandbox/route.ts
- ✅ FOUND: src/app/chat/SandboxUploader.tsx
- ✅ FOUND: supabase/migrations/010_sandbox_tenant_isolation.sql
- ✅ FOUND: vercel.json

**Modified Files:**
- ✅ FOUND: src/lib/rag/similarity-search.ts
- ✅ FOUND: src/app/api/chat/route.ts
- ✅ FOUND: src/app/chat/page.tsx

**Commits:**
- ✅ FOUND: 59f7c4e
- ✅ FOUND: adb3c4b
- ✅ FOUND: c269463

## Self-Check: PASSED
