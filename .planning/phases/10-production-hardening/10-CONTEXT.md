# Phase 10: Production Hardening - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy the app to Vercel with rate limiting, cost controls, and a "try it yourself" mode for prospects. The app goes from localhost to a public URL that anyone can visit. This phase does NOT add new features - it hardens what exists for public access.

</domain>

<decisions>
## Implementation Decisions

### "Try it yourself" mode
- Prospect starts with FlowBoard demo data pre-loaded, plus ability to upload their own docs alongside it
- Upload limits: 3 documents max, 10 pages each, text/PDF only
- Data persists for 24 hours, then auto-cleaned (background cleanup job needed)
- Each prospect gets an isolated sandbox - their uploads don't affect other visitors or the main demo KB
- Admin toggle controls whether this mode is available

### Rate limit experience
- Limits: 20 requests/hour, 100 requests/day (from roadmap success criteria)
- Applies to BOTH full-page chat and embedded widget with a shared counter per IP
- Warning at 80% usage: "You have 4 messages left this hour"
- On limit hit: input field and send button disabled (greyed out)
- Limit message shows countdown timer + CTA: "You've reached the demo limit. Try again in X minutes. Want this for your business? Get in touch." with link to contact/Upwork profile

### Cost overage behavior
- Budget cap: $10/day (lowered from $100 - this is a portfolio demo, not production SaaS)
- Early warning alerts at 50% ($5) and 80% ($8)
- Alerts via both email notification AND admin dashboard banner
- Hard shutoff when cap is hit - bot shows "Demo temporarily unavailable" message
- Chat input disabled during shutoff (same pattern as rate limiting)

### Deployment identity
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

</decisions>

<specifics>
## Specific Ideas

- Rate limit CTA doubles as lead gen - turns a friction point into a conversion opportunity
- FlowBoard branding on the deployed site makes it feel like a real product, not a student project
- Builder credit is subtle but discoverable - footer placement, not a splash screen
- 24-hour data cleanup keeps the sandbox fresh without manual intervention

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 10-production-hardening*
*Context gathered: 2026-02-11*
