# Phase 02: User Setup Required

**Generated:** 2026-02-08
**Phase:** 02-admin-panel-content-upload
**Status:** Incomplete

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `ADMIN_PASSWORD` | Choose any password for the admin gate | `.env.local` |
| [ ] | `SESSION_SECRET` | Generate with `openssl rand -hex 32` (must be 32+ chars) | `.env.local` |

## Setup Steps

1. Open `.env.local` in the project root
2. Add the two variables above with your chosen values
3. Restart the dev server if running

## Verification

```bash
# Start the dev server
npm run dev

# Visit http://localhost:3000/admin
# Should redirect to /admin/login

# Enter the password you set as ADMIN_PASSWORD
# Should redirect to /admin dashboard

# Click "Log out" in the nav bar
# Should redirect back to /admin/login
```

---
**Once all items complete:** Mark status as "Complete"
