---
phase: 10-production-hardening
plan: 01
subsystem: rate-limiting-cost-tracking
tags: [production, security, cost-control, upstash, resend]
dependency_graph:
  requires: [chat-api, admin-panel]
  provides: [rate-limiting, cost-tracking, cost-alerts]
  affects: [chat-ui, widget, admin-dashboard]
tech_stack:
  added: [upstash-ratelimit, upstash-redis, resend]
  patterns: [dual-rate-limiting, token-based-cost-tracking, email-alerts, redis-deduplication]
key_files:
  created:
    - src/lib/rate-limit.ts
    - src/lib/cost-tracking.ts
    - src/lib/cost-alerts.ts
    - src/app/api/admin/cost-status/route.ts
    - src/components/admin/CostAlertBanner.tsx
  modified:
    - src/middleware.ts
    - src/app/api/chat/route.ts
    - src/components/chat/ChatInput.tsx
    - src/components/chat/ChatWindow.tsx
    - src/app/admin/layout.tsx
    - package.json
decisions:
  - Dual rate limiting (20/hour AND 100/day) enforces tighter limit, prevents both burst and sustained abuse
  - Per-IP identification via x-forwarded-for header with Vercel request.ip fallback
  - Token-based cost tracking using OpenAI gpt-4.1-mini pricing ($0.15/$0.60 per 1M tokens)
  - Daily budget cap at $10, returns 503 when exceeded
  - Response size capped at 300 tokens (reduced from 1024) to control costs
  - Email alerts sent at 50% (warning) and 80% (critical) thresholds via Resend
  - Redis-based alert deduplication ensures one email per day per threshold
  - Admin banner shows real-time cost status with dismissible UI
  - Widget iframe shares same /api/chat endpoint, inherits per-IP rate limits
  - Graceful degradation when RESEND_API_KEY is not configured (logs warning, continues)
metrics:
  duration: 27min
  tasks_completed: 4
  files_created: 5
  files_modified: 6
  commits: 4
  completed_date: 2026-02-12
---

# Phase 10 Plan 01: Rate Limiting & Cost Tracking Summary

**One-liner:** Dual rate limiting (20/hour, 100/day) via Upstash Redis middleware with token-based OpenAI cost tracking, $10 daily budget cap, and email alerts at 50%/80% thresholds

## What Was Built

Complete production-ready abuse prevention and cost control infrastructure:

1. **Rate Limiting Infrastructure**
   - Upstash Redis-based dual rate limiting: 20 requests/hour AND 100 requests/day per IP
   - Middleware intercepts `/api/chat` requests before streaming begins
   - Returns 429 with reset timestamp when either limit exceeded
   - Returns tighter of the two limits in X-RateLimit-Remaining header
   - Widget iframe inherits same rate limits (shared /api/chat endpoint)

2. **Cost Tracking System**
   - Token-based cost calculation using OpenAI gpt-4.1-mini pricing
   - Redis storage with daily key rotation (cost:YYYY-MM-DD)
   - Budget check at chat API start: returns 503 if $10 daily budget exceeded
   - Cost tracked in onFinish callback after streaming completes
   - Atomic Redis increment with 2-day TTL for cost data

3. **Email Alert Notifications**
   - Resend integration for email alerts at 50% (warning) and 80% (critical) thresholds
   - Redis-based deduplication prevents duplicate emails per day per threshold
   - Alert emails include current cost, budget, percentage, and admin dashboard link
   - Graceful degradation if RESEND_API_KEY is not configured

4. **Admin Dashboard Integration**
   - Real-time cost status API endpoint (/api/admin/cost-status)
   - CostAlertBanner component with dismissible UI
   - Color-coded severity: amber (50%), red (80%), dark red (100%)
   - Rendered in admin layout between nav and main content

5. **Chat UI Feedback**
   - Amber warning at 80% rate limit usage (4 messages left)
   - Red alert with countdown timer when rate limit exceeded
   - Disabled input with "Demo temporarily unavailable" when budget exceeded
   - Countdown timer ticks every second, shows minutes or seconds remaining
   - CTA message: "Want this for your business? Get in touch."

## Technical Implementation

### Rate Limiting Architecture

```typescript
// Dual rate limiters (singletons for edge caching)
export const hourlyLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  prefix: "@upwork-ai-chatbot:hourly",
});

export const dailyLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 d"),
  prefix: "@upwork-ai-chatbot:daily",
});

// Returns tighter limit
export async function checkRateLimit(identifier: string) {
  const [hourlyResult, dailyResult] = await Promise.all([...]);
  return {
    success: hourlyResult.success && dailyResult.success,
    remaining: Math.min(hourlyRemaining, dailyRemaining),
    reset: tighterLimit.reset,
  };
}
```

### Cost Tracking Flow

```
Chat Request
  ↓
Budget Check → 503 if exceeded
  ↓
Stream Response
  ↓
onFinish Callback:
  1. Count tokens (input + output)
  2. Calculate cost ($0.15/$0.60 per 1M)
  3. Increment Redis cost:{date} key
  4. Get updated cost
  5. Check alert thresholds
  6. Send email if 50%/80% hit (once per day)
```

### Environment Variables

New required variables (documented in plan user_setup):

- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL for rate limiting and cost tracking
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token
- `RESEND_API_KEY` - Resend API key for email alerts (optional, graceful degradation)
- `COST_ALERT_EMAIL` - Email address to receive cost alerts

## Deviations from Plan

None - plan executed exactly as written.

## Verification

All tasks completed and verified:

1. ✅ Upstash dependencies installed (@upstash/ratelimit, @upstash/redis)
2. ✅ rate-limit.ts exports hourlyLimit, dailyLimit, checkRateLimit, getIpAddress
3. ✅ cost-tracking.ts exports getCurrentCost, trackChatCost, checkBudgetRemaining, checkCostAlerts
4. ✅ Middleware enforces dual rate limiting on /api/chat
5. ✅ Chat API checks budget before streaming, tracks cost in onFinish
6. ✅ maxOutputTokens reduced to 300 (was 1024)
7. ✅ ChatInput shows warnings and disabled states based on rate limit props
8. ✅ ChatWindow parses rate limit headers and manages countdown timer
9. ✅ cost-alerts.ts sends emails via Resend with Redis deduplication
10. ✅ CostAlertBanner renders in admin layout with color-coded severity
11. ✅ Widget shares /api/chat endpoint, inherits rate limiting
12. ✅ `npm run check` passes (Biome lint + format)
13. ✅ `npm run build` compiles without TypeScript errors

## Key Learnings

- Upstash Redis `fromEnv()` validates env vars at module load time, causing build-time warnings when credentials not set (expected, harmless)
- Dual rate limiting pattern ensures both burst (hourly) and sustained (daily) abuse protection
- Returning tighter limit in headers provides accurate UX feedback regardless which limit triggered
- Fire-and-forget pattern for cost tracking/alerts prevents blocking the streaming response
- Redis TTL management requires checking ttl value (-1 = exists but no expiration)
- Email alert deduplication critical to prevent spam if multiple requests cross threshold simultaneously
- Graceful degradation for optional services (Resend) improves development experience

## Files Modified

**Created (5 files):**
- `src/lib/rate-limit.ts` - Dual rate limiting with Upstash Redis
- `src/lib/cost-tracking.ts` - Token-based cost tracking with daily budget
- `src/lib/cost-alerts.ts` - Email alerts via Resend with deduplication
- `src/app/api/admin/cost-status/route.ts` - Cost status API for admin banner
- `src/components/admin/CostAlertBanner.tsx` - Admin dashboard cost alert banner

**Modified (6 files):**
- `src/middleware.ts` - Added rate limiting for /api/chat requests
- `src/app/api/chat/route.ts` - Budget check, cost tracking, email alerts
- `src/components/chat/ChatInput.tsx` - Warning/disabled states for rate limits
- `src/components/chat/ChatWindow.tsx` - Rate limit header parsing, countdown timer
- `src/app/admin/layout.tsx` - Render CostAlertBanner in admin shell
- `package.json` - Added @upstash/ratelimit, @upstash/redis, resend

## Commits

1. `541dbb1` - chore(10-01): install Upstash and create rate limit + cost tracking libraries
2. `9023c2d` - feat(10-01): add rate limiting middleware and cost tracking to chat API
3. `68914fb` - feat(10-01): add rate limit warnings and disabled states to chat UI
4. `ff46d53` - feat(10-01): add cost alert email notifications and admin dashboard banner

## Next Steps

This plan provides the infrastructure for production deployment. Before going live:

1. Create Upstash Redis database (free tier sufficient)
2. Create Resend account and verify sender domain (or use onboarding@resend.dev for testing)
3. Add environment variables to Vercel project settings
4. Test rate limiting with multiple requests from same IP
5. Test budget cap by manually setting low daily budget threshold
6. Verify email alerts are received at configured address

Phase 10 Plan 02 (Security Headers & Error Boundaries) can proceed independently.

## Self-Check: PASSED

**Files created:**
- ✅ FOUND: src/lib/rate-limit.ts
- ✅ FOUND: src/lib/cost-tracking.ts
- ✅ FOUND: src/lib/cost-alerts.ts
- ✅ FOUND: src/app/api/admin/cost-status/route.ts
- ✅ FOUND: src/components/admin/CostAlertBanner.tsx

**Commits exist:**
- ✅ FOUND: 541dbb1 (Task 1: dependencies and libraries)
- ✅ FOUND: 9023c2d (Task 2: middleware and chat API)
- ✅ FOUND: 68914fb (Task 3: chat UI warnings)
- ✅ FOUND: ff46d53 (Task 4: email alerts and admin banner)

**Key integrations verified:**
- ✅ Middleware matcher includes "/api/chat"
- ✅ Chat route has checkBudgetRemaining() before streaming
- ✅ Chat route has trackChatCost() in onFinish
- ✅ Chat route has sendCostAlertEmail() after cost tracking
- ✅ ChatInput receives rate limit props from ChatWindow
- ✅ Admin layout renders CostAlertBanner
- ✅ All TypeScript compilation successful
