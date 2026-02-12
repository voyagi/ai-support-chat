---
phase: 10
plan: 03
subsystem: production
tags: [branding, deployment, metadata, vercel]
dependency-graph:
  requires: [10-02-sandbox-mode]
  provides: [production-deployment, og-metadata, favicon]
  affects: [landing-page, seo, social-sharing]
tech-stack:
  added: [next-og, vercel-cli]
  patterns: [dynamic-metadata, edge-og-generation]
key-files:
  created:
    - src/app/opengraph-image.tsx
    - src/app/icon.tsx
    - src/app/apple-icon.tsx
  modified:
    - src/app/layout.tsx
    - src/app/page.tsx
    - .env.example
    - src/lib/cost-alerts.ts
decisions:
  - Next.js OG image generation at edge (no static file needed)
  - Blue gradient branded OG card (667eea to 764ba2)
  - Dynamic favicon/apple-icon using same pattern (blue "F" on blue bg)
  - Builder credit footer with direct Upwork profile link
  - FlowBoard as single-word brand name (not "Flow Board")
  - Environment variables documented in .env.example for deployment checklist
metrics:
  duration: 4 minutes (execution) + 6h15m (human verification + env setup)
  tasks-completed: 3
  files-changed: 7
  commits: 1
  deployment: https://upwork-ai-chatbot.vercel.app
  completed: 2026-02-12
---

# Phase 10 Plan 03: Production Deployment and Branding Summary

**One-liner:** Deploy FlowBoard to Vercel with branded OG cards, dynamic favicon, and builder credit footer.

## What Was Built

Production deployment with complete branding and social sharing metadata:

1. **FlowBoard Branding**
   - Rebranded landing page from "AI Support Chat" to "FlowBoard"
   - Single-word brand identity throughout the app
   - Blue gradient visual theme (667eea to 764ba2)

2. **Dynamic OG Images**
   - `opengraph-image.tsx` - 1200x630 branded card with gradient background
   - `icon.tsx` - 32x32 favicon with blue "F" logo
   - `apple-icon.tsx` - 180x180 Apple touch icon
   - All generated at edge runtime (no static files needed)

3. **SEO Metadata**
   - Comprehensive OpenGraph tags in layout.tsx
   - Twitter card metadata
   - Dynamic title template: "%s | FlowBoard"
   - Description optimized for social sharing

4. **Builder Credit**
   - Footer with Upwork profile link (Ahmad Elarabi)
   - Clear attribution for portfolio showcase
   - Non-intrusive placement below feature highlights

5. **Production Deployment**
   - Deployed to Vercel via CLI: `https://upwork-ai-chatbot.vercel.app`
   - Connected to GitHub repo (voyagi/upwork-ai-chatbot)
   - Environment variables configured in Vercel dashboard
   - Build warnings addressed (Upstash env vars gracefully degrade)

6. **Documentation**
   - Updated .env.example with all new environment variables
   - Upstash Redis (rate limiting)
   - Resend (email alerts)
   - Sandbox mode flag
   - Cron secret for cleanup job

## Verification Results

All 10 verification items passed:

1. ✅ FlowBoard branding loads correctly
2. ✅ Dynamic favicon returns 200 (blue "F" logo)
3. ✅ Footer shows builder credit with Upwork link
4. ✅ Chat works with streaming + RAG sources
5. ✅ Rate limit headers present (x-ratelimit-remaining)
6. ✅ Sandbox upload working (1 of 3 documents)
7. ✅ Flo answers from uploaded sandbox content
8. ✅ OG card tags present, image returns 200
9. ✅ Cost alert API returns {"level":"ok"}
10. ✅ Sandbox uploads don't count toward chat rate limit

## Technical Highlights

**Dynamic OG Generation**

Used Next.js OG image generation (edge runtime) instead of static files:

```tsx
export const runtime = "edge";
export const size = { width: 1200, height: 630 };

export default async function OGImage() {
  return new ImageResponse(/* JSX with gradient bg */);
}
```

Benefits:
- No static file management
- Consistent branding via code
- Easy to update across all devices (favicon, apple-icon, og-image)

**Vercel CLI Deployment**

Single command deployment with automatic GitHub linking:

```bash
npx vercel --prod --yes
```

Vercel automatically:
- Detected Next.js project settings
- Linked to GitHub repo
- Created production deployment
- Assigned custom domain alias

**Environment Variable Checklist**

Updated .env.example with 13 environment variables needed for production:
- Core services (OpenAI, Supabase)
- Rate limiting (Upstash Redis)
- Email alerts (Resend)
- Sandbox mode
- Cron security
- Admin auth

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused import in cost-alerts.ts**
- **Found during:** Task 1 (Biome check)
- **Issue:** `AlertLevel` type imported but never used after Phase 10-01 refactoring
- **Fix:** Removed the unused import to pass lint checks
- **Files modified:** src/lib/cost-alerts.ts
- **Commit:** 71bbd53 (included in Task 1 commit)

## Key Decisions

**FlowBoard as single-word brand**
- Chose "FlowBoard" over "Flow Board" or "FlowBoard AI"
- Reasoning: Cleaner, more memorable, fits tech product naming conventions
- Applied consistently: page titles, OG cards, footer, favicon

**Blue gradient for brand identity**
- Primary: #667eea (blue) to #764ba2 (purple)
- Reasoning: Professional, tech-forward, high contrast with white text
- Applied to: OG image background, favicon background, apple-icon background

**Dynamic metadata generation over static files**
- Used Next.js OG generation for all image assets
- Reasoning: Easier maintenance, code-driven consistency, no file upload needed
- Trade-off: Slightly slower first load (edge generation), but cached after that

**Builder credit placement**
- Footer below feature highlights, not header
- Reasoning: Non-intrusive, clear attribution, links to Upwork profile
- Format: "Built by Ahmad Elarabi" with direct profile link

**Environment variable documentation**
- Added all new env vars to .env.example immediately
- Reasoning: Deployment checklist clarity, reduces setup friction
- Includes: Upstash, Resend, sandbox, cron secret

## Commits

| Hash | Message |
|------|---------|
| 71bbd53 | feat(10-03): add FlowBoard branding, OG image, favicon, and builder credit |

## Files Changed

**Created (3 files):**
- src/app/opengraph-image.tsx - Dynamic OG card with gradient branding
- src/app/icon.tsx - 32x32 favicon with blue "F" logo
- src/app/apple-icon.tsx - 180x180 Apple touch icon

**Modified (4 files):**
- src/app/layout.tsx - Comprehensive metadata (OG + Twitter cards)
- src/app/page.tsx - FlowBoard branding + builder credit footer
- .env.example - Added 13 new environment variables
- src/lib/cost-alerts.ts - Removed unused AlertLevel import

## Self-Check

Verifying created files exist:

```bash
[ -f "src/app/opengraph-image.tsx" ] && echo "FOUND"
[ -f "src/app/icon.tsx" ] && echo "FOUND"
[ -f "src/app/apple-icon.tsx" ] && echo "FOUND"
```

All files: **FOUND**

Verifying commits exist:

```bash
git log --oneline --all | grep -q "71bbd53" && echo "FOUND"
```

Commit 71bbd53: **FOUND**

Verifying deployment:

Production URL: https://upwork-ai-chatbot.vercel.app
Status: **LIVE** (verified by user - all 10 checks passed)

## Self-Check: PASSED

All created files exist, commit is in git history, deployment is live and fully verified.

## Next Steps

Phase 10 (Production Hardening) is now complete. The FlowBoard AI support demo is:

1. ✅ Deployed to production (Vercel)
2. ✅ Fully branded (OG cards, favicon, landing page)
3. ✅ Rate limited (20 req/hour + 100 req/day)
4. ✅ Cost tracked (with email alerts)
5. ✅ Sandbox enabled (prospects can upload their own docs)
6. ✅ Production-ready (all environment variables configured)

**Portfolio showcase ready** - The live demo at https://upwork-ai-chatbot.vercel.app can now be added to Upwork profile as Project #1 of 4 portfolio pieces.

**Recommended post-deployment:**
- Add production URL to GitHub repo description
- Test on mobile devices (PWA-like experience with apple-icon)
- Monitor cost dashboard for first week of traffic
- Consider adding analytics (Vercel Analytics or Google Analytics)
