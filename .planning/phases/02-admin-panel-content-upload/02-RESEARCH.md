# Phase 2: Admin Panel & Content Upload - Research

**Researched:** 2026-02-08
**Domain:** Next.js 15 App Router - Authentication, File Upload, Content Management
**Confidence:** HIGH

## Summary

Phase 2 implements password-gated admin access, document upload with drag-and-drop, knowledge base management with sortable/expandable tables, and FlowBoard demo content seeding. The core technical domains are: cookie-based session management in Next.js App Router, Server Actions for file upload, client-side file validation and drag-and-drop UX, and table sorting/expansion patterns.

**Current Next.js landscape (2026):** The App Router has matured significantly. The `cookies()` function is async, Server Actions are the standard for mutations including file uploads, and middleware/authentication patterns have shifted toward "Data Access Layer" validation rather than middleware-only protection. Note: Next.js 16 renames `middleware.ts` to `proxy.ts`, but since this project uses Next.js 15, we'll use the standard `middleware.ts` pattern.

**Primary recommendation:** Use `iron-session` for encrypted cookie-based sessions (simple password auth), Server Actions for file upload with FormData (no library needed), `react-dropzone` for drag-and-drop UX (requires `--legacy-peer-deps` for React 19), and native HTML table with client-side JavaScript sorting (no heavy library needed for this simple use case).

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| iron-session | ^8.x | Encrypted cookie session management | Lightweight (no DB needed), Next.js App Router native, recommended by Next.js docs, stateless encryption |
| react-dropzone | ^14.x | Drag-and-drop file upload UI | Most popular React drag-drop library (5M+ weekly downloads), HTML5 File API wrapper, excellent TypeScript support |
| Next.js Server Actions | Built-in | File upload with FormData | Native to Next.js 15 App Router, no external libraries needed, automatically handles multipart/formdata |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| file-type | ^19.x | Magic byte MIME validation | Security: verify actual file contents vs claimed MIME type (prevents spoofing) |
| lucide-react | ^0.511.0 | Icons for UI (already installed) | Sorting arrows, expand/collapse, upload icons |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| iron-session | NextAuth.js / Auth.js v5 | NextAuth is overkill for simple password auth (adds OAuth, database sessions, complex config). Use for multi-provider auth. |
| react-dropzone | native HTML5 drag events | react-dropzone handles browser quirks, file validation, and accessibility. Native requires more boilerplate. |
| Client-side table sorting | TanStack Table | TanStack Table is powerful but heavy for simple sorting. Use if you need virtualization, complex filtering, or server-side data. |
| Server Actions | Multer + API route | Server Actions are the App Router standard. Multer is for Pages Router or Express. Use Multer only for Pages Router. |

**Installation:**

```bash
npm install iron-session
npm install --legacy-peer-deps react-dropzone  # Peer dep conflict with React 19
npm install file-type  # Optional: for enhanced MIME validation
```

## Architecture Patterns

### Recommended Project Structure

```
src/
  app/
    admin/
      page.tsx              # Admin dashboard (protected)
      login/
        page.tsx            # Login form
      upload/
        page.tsx            # Upload interface (protected)
      documents/
        page.tsx            # Document list/management (protected)
      layout.tsx            # Admin layout wrapper (shows nav)
    api/
      auth/
        login/route.ts      # POST: validate password, set session
        logout/route.ts     # POST: clear session
      documents/
        route.ts            # GET: list documents, POST: upload (protected)
        [id]/route.ts       # DELETE: remove document (protected)
    actions/
      auth.ts               # Server Actions: login, logout
      documents.ts          # Server Actions: upload, delete documents
  components/
    admin/
      LoginForm.tsx         # Login UI with password input
      UploadZone.tsx        # Drag-drop zone using react-dropzone
      DocumentTable.tsx     # Sortable table with expandable rows
      ChunkPreview.tsx      # Displays chunks inline
  lib/
    auth/
      session.ts            # iron-session config and helpers
      middleware.ts         # Auth checking utilities
  middleware.ts             # Route protection (admin/* routes)
```

### Pattern 1: Encrypted Cookie Session with iron-session

**What:** Stateless session using signed, encrypted cookies (no database lookups)

**When to use:** Simple authentication (shared password, no user accounts), need fast session checks, want to avoid session table

**Example:**

```typescript
// lib/auth/session.ts
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  isAuthenticated: boolean
  createdAt: number
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET!, // Min 32 chars
  cookieName: 'admin_session',
  ttl: 60 * 60 * 24, // 24 hours
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  },
}

export async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

// Usage in Server Action
'use server'
export async function login(password: string) {
  if (password !== process.env.ADMIN_PASSWORD) {
    return { success: false, error: 'Incorrect password' }
  }

  const session = await getSession()
  session.isAuthenticated = true
  session.createdAt = Date.now()
  await session.save()

  return { success: true }
}
```

**Source:** [iron-session GitHub](https://github.com/vvo/iron-session), [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication)

### Pattern 2: File Upload via Server Actions with FormData

**What:** Server Actions receive FormData automatically from form submissions, extract files, process them

**When to use:** Any file upload in Next.js App Router (standard pattern)

**Example:**

```typescript
// app/actions/documents.ts
'use server'
import { redirect } from 'next/navigation'

export async function uploadDocument(formData: FormData) {
  const file = formData.get('file') as File

  // Validate
  if (!file || file.size === 0) {
    return { error: 'No file provided' }
  }

  const allowedTypes = ['text/plain', 'text/markdown']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Only .txt and .md files allowed' }
  }

  // Read file content
  const content = await file.text()

  // Process: chunk, embed, save to Supabase
  // (use existing lib/embeddings functions)

  redirect('/admin/documents')
}
```

**Important:** Max request body size is 1MB by default. Configure with `serverActionsBodySizeLimit` in `next.config.ts` if needed.

**Source:** [Strapi Next.js 15 File Upload Tutorial](https://strapi.io/blog/epic-next-js-15-tutorial-part-5-file-upload-using-server-actions), [Next.js Forms Guide](https://nextjs.org/docs/pages/guides/forms)

### Pattern 3: Drag & Drop with react-dropzone

**What:** React hook that wraps HTML5 drag-and-drop API with file validation and accessibility

**When to use:** Want polished drag-and-drop UX without manual event handling

**Example:**

```typescript
// components/admin/UploadZone.tsx
'use client'
import { useDropzone } from 'react-dropzone'
import { uploadDocument } from '@/app/actions/documents'

export function UploadZone() {
  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxFiles: 10,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: async (files) => {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        await uploadDocument(formData)
      }
    },
  })

  return (
    <div {...getRootProps()} className="border-2 border-dashed p-8">
      <input {...getInputProps()} />
      <p>Drag & drop .txt or .md files here, or click to select</p>
      {acceptedFiles.length > 0 && (
        <ul>
          {acceptedFiles.map((file) => (
            <li key={file.name}>{file.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

**Note:** React 19 compatibility requires `npm install --legacy-peer-deps react-dropzone` due to peer dependency constraints.

**Source:** [react-dropzone official docs](https://react-dropzone.js.org/), [react-dropzone npm](https://www.npmjs.com/package/react-dropzone)

### Pattern 4: Client-Side Table Sorting with Expandable Rows

**What:** Native HTML table with JavaScript click handlers for sorting, CSS transitions for row expansion

**When to use:** Simple data set (<500 rows), no server-side pagination needed, want lightweight solution

**Example:**

```typescript
'use client'
import { useState } from 'react'

interface Document {
  id: string
  title: string
  created_at: string
  chunk_count: number
  chunks?: Array<{ content: string }>
}

export function DocumentTable({ documents }: { documents: Document[] }) {
  const [sortKey, setSortKey] = useState<keyof Document>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const sorted = [...documents].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    const dir = sortDir === 'asc' ? 1 : -1
    return aVal < bVal ? -dir : dir
  })

  const toggleSort = (key: keyof Document) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const toggleExpand = (id: string) => {
    const next = new Set(expanded)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setExpanded(next)
  }

  return (
    <table>
      <thead>
        <tr>
          <th onClick={() => toggleSort('title')}>Title</th>
          <th onClick={() => toggleSort('created_at')}>Date</th>
          <th onClick={() => toggleSort('chunk_count')}>Chunks</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((doc) => (
          <>
            <tr key={doc.id} onClick={() => toggleExpand(doc.id)}>
              <td>{doc.title}</td>
              <td>{doc.created_at}</td>
              <td>{doc.chunk_count}</td>
            </tr>
            {expanded.has(doc.id) && (
              <tr>
                <td colSpan={3}>
                  {doc.chunks?.map((chunk, i) => (
                    <div key={i}>{chunk.content}</div>
                  ))}
                </td>
              </tr>
            )}
          </>
        ))}
      </tbody>
    </table>
  )
}
```

**Accessibility:** Add `role="button"`, `tabIndex={0}`, and keyboard handlers to expandable rows.

**Source:** [W3C Sortable Table Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/), [JSFiddle: Expandable & Sortable Rows](https://jsfiddle.net/KyleMit/dL3xqgu9/48/)

### Anti-Patterns to Avoid

- **Storing passwords in cookies** — Only store session tokens or encrypted session data. Never `{password: '...'}` in cookies.
- **Client-side-only file validation** — Always re-validate MIME type and size server-side. Client validation is easily bypassed.
- **Middleware-only authentication** — CVE-2025-29927 highlights risks. Always verify sessions in Server Components and Server Actions, not just middleware.
- **Trusting file.type** — MIME type is client-provided and can be spoofed. Use `file-type` library to check magic bytes for high-security scenarios.
- **Blocking UI during upload** — Use optimistic UI patterns. Show "Processing..." status immediately, process in background.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie encryption | Custom crypto utils | `iron-session` | Session security is hard (key rotation, padding attacks, timing attacks). Use battle-tested library. |
| Drag-and-drop file zone | Manual `ondragover`/`ondrop` handlers | `react-dropzone` | Browser quirks (IE, Safari), accessibility, file validation, error states. react-dropzone handles all this. |
| File MIME validation | `file.type` check only | `file-type` (magic bytes) + extension check | Attackers can spoof MIME types. Magic byte validation is required for security. |
| Password hashing | `crypto.createHash('sha256')` | Don't hash at all (use env var comparison) | For single shared password, hashing adds no security (no salt, no slow hash). Just compare directly. |

**Key insight:** For shared password auth (not user accounts), encryption is overkill. Compare `password === process.env.ADMIN_PASSWORD` directly in Server Action. Use `iron-session` to encrypt the SESSION COOKIE, not the password itself.

## Common Pitfalls

### Pitfall 1: React 19 + react-dropzone Peer Dependency Conflict

**What goes wrong:** `npm install react-dropzone` fails with peer dependency error: "requires react@^18"

**Why it happens:** Next.js 15.3.2 uses React 19.1.0, but react-dropzone 14.x declares React 18 as peer dependency

**How to avoid:** Use `npm install --legacy-peer-deps react-dropzone` to bypass peer dependency checks

**Warning signs:** `npm install` fails with ERESOLVE error mentioning react version conflict

**Source:** [react-dropzone React 18 compatibility](https://react-dropzone.js.org/)

### Pitfall 2: Async cookies() Not Awaited

**What goes wrong:** `cookies()` is called without `await`, causing TypeScript errors or runtime failures

**Why it happens:** Next.js 15 changed `cookies()` from synchronous to async function for React 19 compatibility

**How to avoid:** Always `const cookieStore = await cookies()` in Server Components and Server Actions. Use `async` function wrapper.

**Warning signs:** TypeScript error "Type 'Promise<RequestCookies>' is not assignable to type 'RequestCookies'"

**Source:** [Next.js cookies() API Reference](https://nextjs.org/docs/app/api-reference/functions/cookies)

### Pitfall 3: File Upload Body Size Limit (1MB Default)

**What goes wrong:** File uploads fail silently or return 413 errors for files >1MB

**Why it happens:** Next.js App Router has 1MB default limit for Server Action request bodies

**How to avoid:**
1. Set `serverActionsBodySizeLimit` in `next.config.ts`: `experimental: { serverActionsBodySizeLimit: '5mb' }`
2. Or stream large files via API routes instead of Server Actions

**Warning signs:** Uploads work for small files but fail for larger ones, no clear error message

**Source:** [Next.js Server Actions Body Size](https://nextjs.org/docs/app/api-reference/functions/server-actions)

### Pitfall 4: MIME Type Spoofing

**What goes wrong:** Attacker uploads malicious `.exe` file renamed to `.txt`, bypassing client-side checks

**Why it happens:** Browser file.type is based on filename extension, not actual content

**How to avoid:**
1. Server-side validation: check both extension AND MIME type
2. For high security: use `file-type` npm package to verify magic bytes
3. Whitelist allowed types (don't blacklist dangerous ones)

**Warning signs:** Security audit fails, file upload accepts unexpected types

**Example validation:**

```typescript
const allowedExtensions = ['.txt', '.md']
const allowedMimeTypes = ['text/plain', 'text/markdown']

const ext = file.name.substring(file.name.lastIndexOf('.'))
if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.type)) {
  throw new Error('Invalid file type')
}

// Optional: verify magic bytes with file-type
import { fileTypeFromBuffer } from 'file-type'
const buffer = await file.arrayBuffer()
const type = await fileTypeFromBuffer(buffer)
// text/plain has no magic bytes, so this mainly detects binary files disguised as text
```

**Source:** [Next.js File Upload Security](https://moldstud.com/articles/p-handling-file-uploads-in-nextjs-best-practices-and-security-considerations), [file-type npm](https://www.npmjs.com/package/file-type)

### Pitfall 5: Session Cookie Configuration Missing Flags

**What goes wrong:** Session cookies can be stolen via XSS, sent over HTTP, or used in CSRF attacks

**Why it happens:** Default cookie options are insecure (no httpOnly, no secure, no sameSite)

**How to avoid:** Always set:
- `httpOnly: true` — Prevents `document.cookie` access (XSS defense)
- `secure: process.env.NODE_ENV === 'production'` — HTTPS-only in production
- `sameSite: 'lax'` — CSRF protection (blocks cross-site POST requests)

**Warning signs:** Security audit flags session cookies as vulnerable

**Example (iron-session config):**

```typescript
export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'admin_session',
  ttl: 60 * 60 * 24, // 24 hours
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  },
}
```

**Source:** [MDN Secure Cookie Configuration](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies), [Cookie Security Guide](https://barrion.io/blog/cookie-security-best-practices)

### Pitfall 6: Middleware-Only Authentication (CVE-2025-29927)

**What goes wrong:** Attacker bypasses middleware protection, accesses protected Server Actions directly

**Why it happens:** Middleware runs only on initial requests, not on Server Action invocations. Cookies set in middleware don't propagate to downstream Server Components.

**How to avoid:** Use "Data Access Layer" pattern:
1. Middleware for optimistic redirect (fast, checks cookie existence)
2. Server Components/Actions verify session at data access point
3. Never trust that middleware guarantees authentication

**Warning signs:** Protected routes accessible via direct API calls, security audit flags authentication gaps

**Example:**

```typescript
// middleware.ts (optimistic check)
export function middleware(request: NextRequest) {
  const session = request.cookies.get('admin_session')
  if (!session && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
}

// app/admin/page.tsx (actual verification)
export default async function AdminPage() {
  const session = await getSession()
  if (!session.isAuthenticated) {
    redirect('/admin/login')
  }
  // ...render page
}
```

**Source:** [Complete Authentication Guide for Next.js](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router), [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication)

## Code Examples

Verified patterns from official sources:

### Reading Session in Server Component

```typescript
// app/admin/page.tsx
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const session = await getSession()

  if (!session.isAuthenticated) {
    redirect('/admin/login')
  }

  return <div>Welcome to admin panel</div>
}
```

### Login Form with Server Action

```typescript
// components/admin/LoginForm.tsx
'use client'
import { login } from '@/app/actions/auth'
import { useState } from 'react'

export function LoginForm() {
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    const password = formData.get('password') as string
    const result = await login(password)

    if (!result.success) {
      setError(result.error || 'Login failed')
    }
  }

  return (
    <form action={handleSubmit}>
      <input
        type="password"
        name="password"
        placeholder="Admin password"
        required
      />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit">Log in</button>
    </form>
  )
}
```

### Document Upload with Status Tracking

```typescript
// components/admin/UploadZone.tsx
'use client'
import { useDropzone } from 'react-dropzone'
import { useState } from 'react'
import { uploadDocument } from '@/app/actions/documents'

export function UploadZone() {
  const [files, setFiles] = useState<Array<{ name: string; status: string }>>([])

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'text/plain': ['.txt'], 'text/markdown': ['.md'] },
    maxFiles: 10,
    onDrop: async (acceptedFiles) => {
      // Initialize status
      setFiles(acceptedFiles.map(f => ({ name: f.name, status: 'Processing...' })))

      // Process each file
      for (const file of acceptedFiles) {
        const formData = new FormData()
        formData.append('file', file)

        try {
          await uploadDocument(formData)
          setFiles(prev => prev.map(f =>
            f.name === file.name ? { ...f, status: 'Ready' } : f
          ))
        } catch (err) {
          setFiles(prev => prev.map(f =>
            f.name === file.name ? { ...f, status: 'Failed' } : f
          ))
        }
      }
    },
  })

  return (
    <div>
      <div {...getRootProps()} className="border-2 border-dashed p-8 cursor-pointer">
        <input {...getInputProps()} />
        <p>Drag & drop .txt or .md files here</p>
      </div>

      {files.length > 0 && (
        <ul className="mt-4">
          {files.map((file) => (
            <li key={file.name} className="flex justify-between">
              <span>{file.name}</span>
              <span className={file.status === 'Ready' ? 'text-green-500' : ''}>
                {file.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `cookies()` synchronous | `cookies()` is async (requires await) | Next.js 15 (React 19) | All cookie access must use `await cookies()` |
| middleware.ts | proxy.ts | Next.js 16 | Rename coming soon, but Next.js 15 still uses middleware.ts |
| Middleware-only auth | Data Access Layer pattern | 2025 (post CVE-2025-29927) | Must verify auth in every Server Component/Action, not just middleware |
| Pages Router file upload (Multer) | App Router Server Actions (FormData) | Next.js 13+ | Server Actions are simpler, no Multer needed |
| react-dropzone for React 18 | react-dropzone with --legacy-peer-deps for React 19 | React 19 release (Next.js 15) | Peer dependency warning, but library works fine |

**Deprecated/outdated:**

- **next-auth** package name: Renamed to `@auth/nextjs` (part of Auth.js v5). Use `@auth/nextjs` for new projects.
- **getServerSideProps + Multer**: Pages Router pattern. In App Router, use Server Actions with FormData.
- **SameSite=None by default**: Modern browsers default to `SameSite=Lax`. Explicitly set to `'lax'` or `'strict'` for auth cookies.

## Open Questions

Things that couldn't be fully resolved:

1. **How many FlowBoard docs are needed?**
   - What we know: User requested 15-20 docs across 5+ categories. 10 docs already exist from Phase 1.
   - What's unclear: Should we create 5-10 more, or are the existing 10 sufficient if they cover all categories?
   - Recommendation: Audit existing 10 docs for category coverage. Create 5-10 more docs to reach 15-20 total, focusing on gaps (API docs, troubleshooting, integrations).

2. **Should chunks be fetched eagerly or lazily when expanding rows?**
   - What we know: Table shows documents with chunk_count. Expandable rows show chunks inline.
   - What's unclear: Should chunks be included in initial page load (eager) or fetched on expand (lazy)?
   - Recommendation: For <50 documents with ~10 chunks each (~500 total chunks), eager load is fine. Use lazy loading (API route) if >100 documents expected.

3. **Tailwind CSS v4 login page styling patterns?**
   - What we know: Project uses Tailwind v4. Login page should be "polished" with gradient background, smooth transitions.
   - What's unclear: Tailwind v4 (released Dec 2024) has new syntax. Are there breaking changes from v3?
   - Recommendation: Verify Tailwind v4 docs for gradient/transition syntax. Likely minimal changes, but confirm `bg-gradient-to-br`, `transition-all` still work.

## Sources

### Primary (HIGH confidence)

- [Next.js cookies() API Reference](https://nextjs.org/docs/app/api-reference/functions/cookies) - cookies() async pattern, options
- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication) - Data Access Layer pattern, session management
- [iron-session GitHub](https://github.com/vvo/iron-session) - v8 API, Next.js App Router integration
- [Strapi Next.js 15 File Upload Tutorial](https://strapi.io/blog/epic-next-js-15-tutorial-part-5-file-upload-using-server-actions) - Server Actions file upload pattern
- [react-dropzone npm](https://www.npmjs.com/package/react-dropzone) - API, React 19 peer dependency note

### Secondary (MEDIUM confidence)

- [Complete Authentication Guide for Next.js](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router) - Cookie session architecture, CVE-2025-29927 context
- [MDN Secure Cookie Configuration](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies) - httpOnly, secure, sameSite best practices
- [W3C Sortable Table Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/) - Accessibility patterns for sortable tables
- [Next.js File Upload Security](https://moldstud.com/articles/p-handling-file-uploads-in-nextjs-best-practices-and-security-considerations) - MIME validation, security best practices

### Tertiary (LOW confidence)

- [JSFiddle: Expandable & Sortable Rows](https://jsfiddle.net/KyleMit/dL3xqgu9/48/) - Example implementation (not production code)
- [TanStack Table React](https://tanstack.com/table/latest) - Alternative table library (not chosen for this phase)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - iron-session, react-dropzone, Server Actions are all well-documented and recommended by Next.js/React communities
- Architecture: HIGH - Patterns verified against official Next.js docs and recent CVE guidance
- Pitfalls: HIGH - All pitfalls sourced from official docs, security advisories, or common GitHub issues

**Research date:** 2026-02-08
**Valid until:** ~30 days (Next.js/React ecosystem is stable, but check for Next.js 16 release)

**Key assumptions:**

- Next.js 15.3.2 remains current (Next.js 16 not yet released)
- React 19 is stable (released with Next.js 15)
- Tailwind CSS v4 syntax is backward-compatible with v3 (verify gradients/transitions)
- FlowBoard demo content tone matches existing test fixtures (verified from flowboard-faq.md, flowboard-features.md)
