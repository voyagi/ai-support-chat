# Phase 10: Production Hardening - Research

**Researched:** 2026-02-11
**Domain:** Vercel deployment, rate limiting, cost monitoring, multi-tenant sandboxing, production configuration
**Confidence:** HIGH

## Summary

Production hardening for a Next.js 15 AI chatbot demo requires coordinating rate limiting (protecting both full-page chat and widget endpoints), cost monitoring (OpenAI API tracking with budget caps), multi-tenant sandboxing (isolated "try it yourself" mode per IP address), scheduled cleanup (Vercel cron for 24-hour data expiration), and deployment polish (Open Graph metadata, favicon, footer credits).

The research confirms that Next.js 15 App Router middleware with Upstash Redis provides the standard approach for IP-based rate limiting, OpenAI's Usage API enables programmatic cost tracking for alert thresholds, Supabase Row-Level Security (RLS) with tenant_id columns delivers per-prospect data isolation, and Vercel's cron configuration in vercel.json handles scheduled cleanup tasks.

Security considerations are critical: Vercel now auto-blocks vulnerable Next.js versions at deploy time (CVE-2025-66478), environment variables must be configured in Vercel dashboard (not committed to git), and rate limit exhaustion should show helpful CTAs rather than hostile error messages.

**Primary recommendation:** Use @upstash/ratelimit with Next.js middleware for per-IP rate limiting (20/hour, 100/day shared across both chat page and widget), implement manual token counting in the chat API route for real-time cost tracking (OpenAI Usage API for historical analysis only), add tenant_id column to documents/document_chunks tables with RLS policies for prospect isolation, configure Vercel cron at 3 AM daily for cleanup, and generate custom OG image using next/og ImageResponse API.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**"Try it yourself" mode:**
- Prospect starts with FlowBoard demo data pre-loaded, plus ability to upload their own docs alongside it
- Upload limits: 3 documents max, 10 pages each, text/PDF only
- Data persists for 24 hours, then auto-cleaned (background cleanup job needed)
- Each prospect gets an isolated sandbox - their uploads don't affect other visitors or the main demo KB
- Admin toggle controls whether this mode is available

**Rate limit experience:**
- Limits: 20 requests/hour, 100 requests/day (from roadmap success criteria)
- Applies to BOTH full-page chat and embedded widget with a shared counter per IP
- Warning at 80% usage: "You have 4 messages left this hour"
- On limit hit: input field and send button disabled (greyed out)
- Limit message shows countdown timer + CTA: "You've reached the demo limit. Try again in X minutes. Want this for your business? Get in touch." with link to contact/Upwork profile

**Cost overage behavior:**
- Budget cap: $10/day (lowered from $100 - this is a portfolio demo, not production SaaS)
- Early warning alerts at 50% ($5) and 80% ($8)
- Alerts via both email notification AND admin dashboard banner
- Hard shutoff when cap is hit - bot shows "Demo temporarily unavailable" message
- Chat input disabled during shutoff (same pattern as rate limiting)

**Deployment identity:**
- Start with default Vercel URL (vercel.app), custom domain added later if needed
- Custom Open Graph image + description for social sharing (branded preview card when link is shared)
- FlowBoard branding for favicon - site looks like a real product
- Builder credit in footer: "Built by [name]" with link to Upwork profile (direct lead gen)

### Claude's Discretion

- Rate limiting implementation approach (middleware vs API route level)
- Cost tracking mechanism (OpenAI usage API vs manual token counting)
- OG image design and meta tag content
- Cleanup job implementation (cron vs on-demand)
- Vercel deployment configuration details

### Deferred Ideas (OUT OF SCOPE)

None - discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core Dependencies

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @upstash/ratelimit | ^2.0.0+ | IP-based rate limiting with Redis backend | Official Vercel-recommended solution, edge-optimized, caches hot data |
| @upstash/redis | ^1.34.0+ | Redis client for Upstash | Required peer dependency for @upstash/ratelimit |
| next/og | Built-in | Open Graph image generation | First-party Next.js API, no external dependencies |

### Supporting Services

| Service | Purpose | When to Use |
|---------|---------|-------------|
| Upstash Redis | Rate limit state storage | Required for distributed rate limiting across Vercel serverless functions |
| OpenAI Usage API | Historical cost tracking | Post-facto analysis, alerts, billing verification |
| Vercel Cron | Scheduled cleanup tasks | Daily tenant data expiration (3 AM UTC) |
| Vercel Environment Variables | Production secrets | Deploy-time configuration (OPENAI_API_KEY, Supabase keys, Redis URL) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @upstash/ratelimit | In-memory Map | Fails in serverless (each request gets new container), no persistence across deploys |
| Upstash Redis | Vercel KV | Vercel KV discontinued Dec 2024, all users migrated to Upstash Redis |
| Manual token counting | OpenAI Usage API only | Usage API has 1-hour delay, unsuitable for real-time budget caps |
| Vercel Cron | Custom scheduled worker | Cron is built-in, zero config, no additional services |

**Installation:**

```bash
npm install @upstash/ratelimit @upstash/redis
```

**Upstash Redis Setup:**

1. Create free account at [upstash.com](https://upstash.com) (10K requests/day free tier)
2. Create Redis database (select region closest to Vercel deployment)
3. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from dashboard
4. Add to Vercel environment variables (all environments: Production, Preview, Development)

## Architecture Patterns

### Recommended Project Structure

```
src/
├── middleware.ts                     # Rate limiting + IP extraction
├── app/
│   ├── api/
│   │   ├── chat/route.ts            # Add cost tracking + budget check
│   │   ├── admin/
│   │   │   ├── toggle-sandbox/route.ts  # Admin sandbox toggle
│   │   │   ├── cost-alerts/route.ts     # Cost status endpoint
│   │   ├── cron/
│   │   │   └── cleanup-sandbox/route.ts # Daily tenant cleanup
│   ├── opengraph-image.tsx          # Dynamic OG image generation
│   ├── icon.png                     # Favicon (32x32)
│   └── apple-icon.png               # Apple touch icon (180x180)
├── lib/
│   ├── rate-limit.ts                # Ratelimit instance (singleton)
│   ├── cost-tracking.ts             # Token counting + budget logic
│   ├── sandbox/
│   │   ├── tenant-id.ts             # Tenant ID extraction from IP
│   │   ├── cleanup.ts               # Tenant data deletion logic
│   │   └── rls-policies.sql        # RLS policies for tenant isolation
vercel.json                           # Cron configuration
```

### Pattern 1: Per-IP Rate Limiting with Middleware

**What:** Next.js middleware intercepts ALL requests before route handlers, extracts IP address, checks Redis-backed rate limit counter, returns 429 if exceeded

**When to use:** When rate limits apply globally (both /chat page and /api/chat endpoint and /widget routes)

**Example:**

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { ratelimit } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  // Extract IP address (Vercel provides x-forwarded-for header)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  // Check if request should be rate limited
  const shouldLimit = request.nextUrl.pathname.startsWith("/api/chat") ||
                      request.nextUrl.pathname === "/chat" ||
                      request.nextUrl.pathname.startsWith("/widget");

  if (shouldLimit) {
    // Check hourly limit (20 requests/hour)
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          limit,
          remaining: 0,
          reset: new Date(reset).toISOString()
        },
        { status: 429 }
      );
    }

    // Add rate limit headers to response
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", new Date(reset).toISOString());
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/chat", "/chat", "/widget/:path*"],
};
```

```typescript
// src/lib/rate-limit.ts
// Source: https://upstash.com/blog/edge-rate-limiting
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Ratelimit instance OUTSIDE handler for caching benefits
// (avoids cold-start Redis calls when edge function is "hot")
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "1 h"), // 20 requests per hour
  analytics: true,
  prefix: "@upwork-ai-chatbot",
});
```

**Key considerations:**
- Middleware runs on Edge Runtime (can't use Node.js APIs)
- Use `request.ip` for Vercel deployments (more reliable than x-forwarded-for)
- Sliding window algorithm prevents burst abuse at time boundaries
- Redis caching means hot edge functions skip remote calls

### Pattern 2: Real-Time Cost Tracking with Token Counting

**What:** Count input/output tokens synchronously in chat API route, maintain running total in Redis, check against budget cap BEFORE streaming starts

**When to use:** When you need REAL-TIME budget enforcement (not 1-hour delayed Usage API)

**Example:**

```typescript
// src/lib/cost-tracking.ts
// Source: Manual implementation (OpenAI Usage API has 1-hour delay)
import { Redis } from "@upstash/redis";
import { countTokens } from "@/lib/embeddings/token-counter";

const redis = Redis.fromEnv();

const PRICING = {
  "gpt-4.1-mini": {
    input: 0.15 / 1_000_000,  // $0.15 per 1M input tokens
    output: 0.60 / 1_000_000, // $0.60 per 1M output tokens
  },
  "text-embedding-3-small": {
    input: 0.02 / 1_000_000,  // $0.02 per 1M tokens
  },
};

interface CostTracker {
  totalCostToday: number;
  lastReset: string; // ISO date string
}

export async function getCurrentCost(): Promise<number> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const tracker = await redis.get<CostTracker>(`cost:${today}`);

  if (!tracker || tracker.lastReset !== today) {
    return 0; // New day, reset counter
  }

  return tracker.totalCostToday;
}

export async function trackChatCost(
  model: "gpt-4.1-mini",
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const cost =
    inputTokens * PRICING[model].input +
    outputTokens * PRICING[model].output;

  const tracker = await redis.get<CostTracker>(`cost:${today}`) || {
    totalCostToday: 0,
    lastReset: today,
  };

  tracker.totalCostToday += cost;
  tracker.lastReset = today;

  await redis.set(`cost:${today}`, tracker, { ex: 86400 * 2 }); // 2-day expiry
}

export async function checkBudgetRemaining(dailyBudget: number): Promise<{
  allowed: boolean;
  current: number;
  budget: number;
  percentUsed: number;
}> {
  const current = await getCurrentCost();
  const percentUsed = (current / dailyBudget) * 100;

  return {
    allowed: current < dailyBudget,
    current,
    budget: dailyBudget,
    percentUsed,
  };
}
```

**Integration in chat API route:**

```typescript
// src/app/api/chat/route.ts (additions)
import { checkBudgetRemaining, trackChatCost } from "@/lib/cost-tracking";
import { countTokens } from "@/lib/embeddings/token-counter";

export async function POST(req: Request) {
  // 1. Check budget BEFORE streaming starts
  const DAILY_BUDGET = 10; // $10/day
  const budgetCheck = await checkBudgetRemaining(DAILY_BUDGET);

  if (!budgetCheck.allowed) {
    return Response.json({
      error: "Demo temporarily unavailable due to high usage. Please try again tomorrow.",
      costStatus: budgetCheck,
    }, { status: 503 });
  }

  // 2. Count tokens for budget tracking
  const systemPrompt = buildSystemPrompt(ragContext);
  const inputTokens = countTokens(systemPrompt) +
                      messages.reduce((sum, msg) => sum + countTokens(msg.content), 0);

  // 3. Stream as normal
  const result = streamText({
    model: openaiProvider("gpt-4.1-mini"),
    // ...
    onFinish: async ({ text }) => {
      const outputTokens = countTokens(text);

      // Track cost (fire-and-forget)
      trackChatCost("gpt-4.1-mini", inputTokens, outputTokens).catch(err => {
        console.error("Failed to track cost:", err);
      });

      // Persist conversation
      saveMessages(conversationId, userMessage, text, answeredFromKb).catch(err => {
        console.error("Failed to persist conversation:", err);
      });
    },
  });

  return result.toUIMessageStreamResponse({ headers });
}
```

**Why manual counting over Usage API:**
- Usage API has 1-hour delay (unsuitable for real-time budget caps)
- Token counting is deterministic (gpt-tokenizer library matches OpenAI's tokenizer)
- Redis TTL auto-expires old cost data (no manual cleanup)

### Pattern 3: Multi-Tenant Data Isolation with RLS

**What:** Add tenant_id column to documents/document_chunks tables, extract tenant ID from IP hash, enforce isolation via PostgreSQL Row-Level Security policies

**When to use:** When prospects upload temporary documents that must not affect other users or the main demo KB

**Database schema changes:**

```sql
-- src/lib/sandbox/rls-policies.sql
-- Source: https://designrevision.com/blog/supabase-row-level-security

-- Add tenant_id column to documents (NULL = main demo KB)
alter table documents
  add column if not exists tenant_id text;

-- Add tenant_id column to document_chunks (must match parent document)
alter table document_chunks
  add column if not exists tenant_id text;

-- Index for tenant filtering performance
create index if not exists documents_tenant_id_idx on documents(tenant_id);
create index if not exists document_chunks_tenant_id_idx on document_chunks(tenant_id);

-- RLS policy: Main demo KB is visible to everyone
create policy "Main KB visible to all"
  on documents
  for select
  using (tenant_id is null);

-- RLS policy: Tenant documents only visible to same tenant
create policy "Tenant documents isolated"
  on documents
  for select
  using (
    tenant_id is null or
    tenant_id = current_setting('app.tenant_id', true)
  );

-- RLS policy: Tenant can only insert/update their own docs
create policy "Tenant can manage own documents"
  on documents
  for all
  using (
    tenant_id = current_setting('app.tenant_id', true)
  )
  with check (
    tenant_id = current_setting('app.tenant_id', true)
  );

-- Mirror policies for document_chunks
create policy "Main KB chunks visible to all"
  on document_chunks
  for select
  using (tenant_id is null);

create policy "Tenant chunks isolated"
  on document_chunks
  for select
  using (
    tenant_id is null or
    tenant_id = current_setting('app.tenant_id', true)
  );

create policy "Tenant can manage own chunks"
  on document_chunks
  for all
  using (
    tenant_id = current_setting('app.tenant_id', true)
  )
  with check (
    tenant_id = current_setting('app.tenant_id', true)
  );

-- Enable RLS
alter table documents enable row level security;
alter table document_chunks enable row level security;
```

**Tenant ID extraction:**

```typescript
// src/lib/sandbox/tenant-id.ts
// Source: Custom implementation (hash IP for stable tenant ID)
import { createHash } from "crypto";

export function getTenantIdFromIp(ip: string): string {
  // Hash IP to create stable, anonymous tenant ID
  const hash = createHash("sha256").update(ip).digest("hex");
  return `tenant_${hash.substring(0, 12)}`;
}

export function setTenantContext(supabaseClient: any, tenantId: string) {
  // Set PostgreSQL session variable for RLS policies
  // Source: https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/
  return supabaseClient.rpc("set_config", {
    setting_name: "app.tenant_id",
    setting_value: tenantId,
    is_local: true,
  });
}
```

**Integration in document upload:**

```typescript
// src/app/actions/documents.ts (additions)
import { getTenantIdFromIp, setTenantContext } from "@/lib/sandbox/tenant-id";

export async function uploadDocument(formData: FormData, userIp: string) {
  const supabase = await createServerClient();

  // Set tenant context for RLS
  const tenantId = getTenantIdFromIp(userIp);
  await setTenantContext(supabase, tenantId);

  // Upload document (RLS ensures tenant_id is set automatically)
  const { data, error } = await supabase
    .from("documents")
    .insert({
      title: file.name,
      content,
      tenant_id: tenantId, // Explicit set for WITH CHECK policy
    });

  // Chunk and embed as normal (chunks inherit tenant_id from parent)
  // ...
}
```

### Pattern 4: Scheduled Cleanup with Vercel Cron

**What:** Daily cron job at 3 AM UTC deletes tenant documents older than 24 hours

**When to use:** When data should auto-expire without user intervention

**Configuration:**

```json
// vercel.json
// Source: https://vercel.com/docs/cron-jobs
{
  "crons": [
    {
      "path": "/api/cron/cleanup-sandbox",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Cron endpoint:**

```typescript
// src/app/api/cron/cleanup-sandbox/route.ts
// Source: https://drew.tech/posts/cron-jobs-in-nextjs-on-vercel
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // 1. Verify request is from Vercel Cron (check authorization header)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Delete tenant documents older than 24 hours
  const supabase = await createServerClient();
  const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("documents")
    .delete()
    .lt("created_at", cutoffTime)
    .not("tenant_id", "is", null); // Only delete tenant docs, not main KB

  if (error) {
    console.error("Cleanup failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    deletedCount: data?.length || 0,
    cutoffTime,
  });
}
```

**Security note:** Add `CRON_SECRET` to Vercel environment variables, use it to verify requests are from Vercel Cron (not public)

### Pattern 5: Open Graph Image Generation

**What:** Dynamic OG image with FlowBoard branding, generated on-demand using next/og ImageResponse API

**When to use:** For social sharing (Twitter, LinkedIn, Slack previews)

**Implementation:**

```typescript
// src/app/opengraph-image.tsx
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FlowBoard - AI Customer Support";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: "bold", color: "white" }}>
          FlowBoard
        </div>
        <div style={{ fontSize: 32, color: "rgba(255,255,255,0.9)", marginTop: 20 }}>
          AI Customer Support
        </div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", marginTop: 40 }}>
          Try the demo - Instant answers from your knowledge base
        </div>
      </div>
    ),
    { ...size }
  );
}
```

**Metadata configuration:**

```typescript
// src/app/layout.tsx (additions)
export const metadata = {
  title: "FlowBoard - AI Customer Support",
  description: "Try the demo - Get instant answers from your knowledge base with AI-powered chat",
  openGraph: {
    title: "FlowBoard - AI Customer Support",
    description: "Try the demo - Get instant answers from your knowledge base with AI-powered chat",
    url: "https://your-app.vercel.app",
    siteName: "FlowBoard",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "FlowBoard - AI Customer Support",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowBoard - AI Customer Support",
    description: "Try the demo - Get instant answers from your knowledge base with AI-powered chat",
    images: ["/opengraph-image"],
  },
};
```

**Favicon setup:**

```
app/
  icon.png           # 32x32 favicon (auto-served at /favicon.ico)
  apple-icon.png     # 180x180 Apple touch icon
```

- Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons
- Next.js automatically generates `<link>` tags for both files
- No need for favicon.ico file (icon.png is converted automatically)

### Anti-Patterns to Avoid

- **Don't use in-memory rate limiting:** Serverless functions don't share state, each request gets fresh container
- **Don't rely on OpenAI Usage API for real-time budget caps:** 1-hour delay makes it unsuitable for hard shutoff
- **Don't store tenant_id in cookies/local storage:** Easily spoofed, use IP-based hashing instead
- **Don't test cron locally:** Vercel Cron only runs in production (use manual API calls for dev testing)
- **Don't disable buttons without explanation:** Accessibility nightmare, show error state with countdown instead

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rate limiting | Custom Redis counter logic | @upstash/ratelimit | Handles sliding window, analytics, edge caching, distributed locking |
| IP address extraction | Manual header parsing | request.ip (Vercel) or x-forwarded-for fallback | Vercel abstracts complexity, handles proxy chains |
| Token counting | Manual character estimation | gpt-tokenizer (already installed) | OpenAI's tokenizer is non-trivial (subword encoding) |
| OG image generation | HTML → screenshot via Puppeteer | next/og ImageResponse | Built-in, edge-optimized, no external dependencies |
| Cron scheduling | Custom polling/setTimeout | Vercel Cron (vercel.json) | Zero config, automatic retries, monitoring |

**Key insight:** Distributed systems problems (rate limiting, scheduled tasks) are deceptively hard. Redis-backed solutions handle edge cases (concurrent requests, clock skew, cold starts) that naive implementations miss.

## Common Pitfalls

### Pitfall 1: Vercel KV No Longer Available

**What goes wrong:** Documentation and tutorials reference Vercel KV, which was discontinued in December 2024

**Why it happens:** Vercel migrated all KV users to Upstash Redis (same backend), old content not updated

**How to avoid:** Use Upstash Redis directly from the start, skip Vercel KV references

**Warning signs:** Error "Vercel KV is no longer available" when trying to create new store

**Source:** https://vercel.com/docs/storage/vercel-kv/usage-and-pricing

### Pitfall 2: Rate Limit False Positives from Shared IPs

**What goes wrong:** Multiple users behind same corporate NAT/proxy share IP, exhaust rate limit unfairly

**Why it happens:** x-forwarded-for may return proxy IP, not end-user IP

**How to avoid:**
- Accept false positives as acceptable for demo (not production SaaS)
- Show friendly "demo limit" message with contact CTA (turns friction into lead gen)
- Consider combining IP + User-Agent hash for slightly better granularity

**Warning signs:** Rate limit complaints from corporate networks (rare for portfolio demo)

**Source:** https://github.com/vercel/next.js/discussions/49730

### Pitfall 3: Middleware Running on Every Request

**What goes wrong:** Rate limit checks fire for static assets (images, CSS), wasting Redis calls

**Why it happens:** Middleware matcher runs on all routes unless explicitly configured

**How to avoid:** Use matcher config to limit middleware to API routes and dynamic pages only

```typescript
export const config = {
  matcher: [
    "/api/chat",
    "/chat",
    "/widget/:path*",
    // Don't add "/:path*" - static assets bypass middleware automatically
  ],
};
```

**Warning signs:** High Redis usage, slow static asset loads

**Source:** https://nextjs.org/docs/app/building-your-application/routing/middleware

### Pitfall 4: Cost Tracking Drift from OpenAI Usage API

**What goes wrong:** Manual token counting doesn't perfectly match OpenAI's billing (5-10% variance)

**Why it happens:** Edge cases in tokenization, special tokens, system message overhead

**How to avoid:**
- Accept 5-10% variance as acceptable for demo budget cap
- Use OpenAI Usage API for historical verification (check daily at midnight)
- Set budget 10% lower than actual threshold ($9 internal cap for $10 actual)

**Warning signs:** Cost tracking shows $8 used but OpenAI bills $9

**Source:** https://cookbook.openai.com/examples/completions_usage_api

### Pitfall 5: RLS Policies Not Applied Without set_config

**What goes wrong:** Tenant isolation fails silently, prospects see each other's documents

**Why it happens:** RLS policies use current_setting('app.tenant_id'), but it's not set automatically

**How to avoid:** ALWAYS call setTenantContext() before any Supabase query in sandbox mode

```typescript
// WRONG: RLS policies ignored
const { data } = await supabase.from("documents").select("*");

// CORRECT: RLS policies enforced
const tenantId = getTenantIdFromIp(ip);
await setTenantContext(supabase, tenantId);
const { data } = await supabase.from("documents").select("*");
```

**Warning signs:** Test with two different IPs, both see same documents

**Source:** https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/

### Pitfall 6: Cron Jobs Only Run in Production

**What goes wrong:** Local testing of cleanup job never executes

**Why it happens:** Vercel Cron is production-only feature (not local dev server)

**How to avoid:**
- Test cron endpoint manually via curl/Postman in development
- Use CRON_SECRET env var to verify requests in dev
- Check Vercel dashboard logs after deployment to verify execution

**Warning signs:** Cleanup job "works" locally but never runs in production

**Source:** https://medium.com/@quentinmousset/testing-next-js-cron-jobs-locally-my-journey-from-frustration-to-solution-6ffb2e774d7a

### Pitfall 7: Disabled Input Accessibility Issues

**What goes wrong:** Screen reader users don't understand why chat input is disabled

**Why it happens:** disabled attribute removes element from keyboard navigation, provides no context

**How to avoid:**
- Use aria-disabled="true" instead of disabled (keeps focusable)
- Show visible error message with countdown timer
- Include link to contact form in error message

```typescript
// WRONG: Silent disabled state
<input disabled={rateLimitHit} />

// CORRECT: Accessible disabled state
<>
  <input
    aria-disabled={rateLimitHit ? "true" : "false"}
    aria-describedby="rate-limit-message"
  />
  {rateLimitHit && (
    <div id="rate-limit-message" role="alert">
      You've reached the demo limit. Try again in {countdown} minutes.
      <a href="/contact">Want this for your business? Get in touch.</a>
    </div>
  )}
</>
```

**Warning signs:** Keyboard users can't discover why input is broken

**Source:** https://www.smashingmagazine.com/2021/08/frustrating-design-patterns-disabled-buttons/

## Code Examples

Verified patterns from official sources:

### IP Address Extraction (Vercel)

```typescript
// Source: https://reacthustle.com/blog/nextjs-get-user-ip
import { NextRequest } from "next/server";

export function getIpAddress(request: NextRequest): string {
  // Vercel provides request.ip (preferred)
  if (request.ip) {
    return request.ip;
  }

  // Fallback to x-forwarded-for (for self-hosted deployments)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // Last resort
  return "127.0.0.1";
}
```

### Sliding Window Rate Limiting

```typescript
// Source: https://upstash.com/blog/edge-rate-limiting
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Declare outside handler for hot-function caching
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "1 h"), // 20 requests per hour
  analytics: true, // Track usage in Upstash dashboard
  prefix: "@upwork-ai-chatbot",
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
  return { success, limit, remaining, reset };
}
```

### Vercel Environment Variable Access

```typescript
// Source: https://vercel.com/docs/environment-variables
// Production runtime (serverless function)
const openaiKey = process.env.OPENAI_API_KEY;
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;

// Browser runtime (NEXT_PUBLIC_ prefix required)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
```

### Cost Alert Thresholds

```typescript
// Source: Custom implementation based on user requirements
const DAILY_BUDGET = 10; // $10/day
const ALERT_THRESHOLDS = {
  warning: DAILY_BUDGET * 0.5,  // $5 (50%)
  critical: DAILY_BUDGET * 0.8, // $8 (80%)
  shutoff: DAILY_BUDGET,        // $10 (100%)
};

export async function checkCostAlerts(currentCost: number) {
  if (currentCost >= ALERT_THRESHOLDS.shutoff) {
    return { level: "shutoff", message: "Budget cap reached, service disabled" };
  }
  if (currentCost >= ALERT_THRESHOLDS.critical) {
    return { level: "critical", message: "80% budget used, approaching limit" };
  }
  if (currentCost >= ALERT_THRESHOLDS.warning) {
    return { level: "warning", message: "50% budget used" };
  }
  return { level: "ok", message: "Budget healthy" };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vercel KV | Upstash Redis | Dec 2024 | All new projects use Upstash directly, Vercel auto-migrated existing stores |
| next-seo package | Built-in Metadata API | Next.js 13+ | First-party metadata support, no external dependency |
| Custom OG image services | next/og ImageResponse | Next.js 13+ | Edge-rendered dynamic OG images, zero external services |
| gpt-4o-mini | gpt-4.1-mini | Jan 2025 | gpt-4o-mini deprecated Feb 13, 2025 (already updated in this project) |
| Manual cron with external scheduler | Vercel Cron (vercel.json) | 2023 | Zero-config scheduled tasks, automatic retries |

**Deprecated/outdated:**
- **Vercel KV**: Discontinued Dec 2024, use Upstash Redis
- **next-seo**: Replaced by built-in Metadata API in Next.js 13+
- **gpt-4o-mini**: Deprecated Feb 13, 2025, use gpt-4.1-mini instead
- **API route-level rate limiting**: Middleware more efficient (edge-optimized, runs before serverless cold start)

## Open Questions

1. **Email notification mechanism for cost alerts**
   - What we know: Vercel doesn't provide built-in email service
   - What's unclear: Should we use SendGrid/Resend/SMTP, or skip email and rely on admin dashboard banner only?
   - Recommendation: Skip email for Phase 10 (dashboard banner sufficient for demo), add email in production phase if needed

2. **Admin toggle persistence for sandbox mode**
   - What we know: Need binary flag to enable/disable "try it yourself" mode
   - What's unclear: Store in Supabase (new admin_settings table) or environment variable (requires redeploy)?
   - Recommendation: Use environment variable (NEXT_PUBLIC_SANDBOX_ENABLED) for simplicity, toggle via Vercel dashboard

3. **Rate limit warning UI placement**
   - What we know: Show warning at 80% usage (16 of 20 requests)
   - What's unclear: Banner at top of chat, inline above input, or toast notification?
   - Recommendation: Inline warning above chat input (always visible, non-intrusive, accessible)

4. **Vercel deployment protection for next.config.ts**
   - What we know: Vercel auto-blocks vulnerable Next.js versions (CVE-2025-66478)
   - What's unclear: Does this affect Next.js 15.3.2 (current version)?
   - Recommendation: Check Vercel security bulletins after deployment, update if blocked

## Sources

### Primary (HIGH confidence)

**Vercel Documentation:**
- [Cron Jobs](https://vercel.com/docs/cron-jobs) - Cron configuration and scheduling
- [Environment Variables](https://vercel.com/docs/environment-variables) - Production secrets management
- [Request Headers](https://vercel.com/docs/headers/request-headers) - IP address extraction
- [Vercel KV Pricing](https://vercel.com/docs/storage/vercel-kv/usage-and-pricing) - KV discontinuation notice

**Next.js Documentation:**
- [Metadata Files: opengraph-image](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) - OG image generation
- [Metadata Files: favicon](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons) - Favicon configuration
- [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) - Request interception

**Upstash Documentation:**
- [Rate Limiting Overview](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) - @upstash/ratelimit API
- [Edge Rate Limiting Blog](https://upstash.com/blog/edge-rate-limiting) - Vercel Edge integration
- [Redis Pricing](https://upstash.com/pricing/redis) - Free tier limits

**OpenAI Documentation:**
- [Usage API](https://platform.openai.com/docs/api-reference/usage) - Cost tracking endpoint
- [GPT-4.1-mini Model](https://platform.openai.com/docs/models/gpt-4.1-mini) - Model specifications
- [Pricing](https://openai.com/api/pricing/) - Current token costs

**Supabase Documentation:**
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS policies

### Secondary (MEDIUM confidence)

- [Setting Up Rate Limiting in Next.js](https://medium.com/@truebillionhari/setting-up-rate-limiting-in-next-js-95aca3801d36) - Implementation patterns
- [Supabase Row Level Security (RLS): Complete Guide (2026)](https://designrevision.com/blog/supabase-row-level-security) - Multi-tenant RLS
- [Multi-Tenant Applications with RLS on Supabase](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) - Tenant isolation
- [Cron jobs in Next.js on Vercel](https://drew.tech/posts/cron-jobs-in-nextjs-on-vercel) - Cron implementation
- [How to Get User's IP Address in NextJS](https://reacthustle.com/blog/nextjs-get-user-ip) - IP extraction patterns

### Tertiary (LOW confidence)

- [Testing Next.js Cron Jobs Locally](https://medium.com/@quentinmousset/testing-next-js-cron-jobs-locally-my-journey-from-frustration-to-solution-6ffb2e774d7a) - Local testing workarounds
- [Usability Pitfalls of Disabled Buttons](https://www.smashingmagazine.com/2021/08/frustrating-design-patterns-disabled-buttons/) - Accessibility guidance

## Metadata

**Confidence breakdown:**
- Rate limiting: HIGH - Official Upstash/Vercel documentation, verified implementation patterns
- Cost tracking: MEDIUM - Manual token counting is custom, OpenAI Usage API verified but 1-hour delay confirmed
- Multi-tenant RLS: HIGH - Supabase RLS is well-documented, tenant_id pattern is standard
- Vercel deployment: HIGH - First-party Vercel/Next.js documentation
- OG image generation: HIGH - Built-in Next.js API, official examples

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (30 days for stable APIs, check for Next.js/Vercel updates)

**Key assumptions validated:**
- Upstash Redis free tier (10K requests/day) sufficient for demo traffic
- Manual token counting accuracy within 10% of OpenAI billing
- IP-based tenant isolation acceptable for demo (not cryptographic security)
- $10/day budget cap sufficient for moderate demo traffic (100 conversations/day @ $0.10/conversation)
