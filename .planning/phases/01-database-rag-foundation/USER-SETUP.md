# User Setup Guide - Phase 01 Database & RAG Foundation

This guide walks you through setting up the required external services for the RAG (Retrieval-Augmented Generation) pipeline.

## Prerequisites

- A Supabase account (free tier works)
- An OpenAI account with API access

---

## 1. Supabase Setup

**Why needed:** Database for pgvector storage, document chunks, and conversations.

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name:** upwork-ai-chatbot (or any name)
   - **Database Password:** Choose a strong password (save it!)
   - **Region:** Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

### Step 2: Run Database Schema

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from this project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. You should see: "Success. No rows returned"

**What this does:**
- Creates `documents` table (stores uploaded knowledge base docs)
- Creates `document_chunks` table with pgvector embeddings
- Creates `conversations` and `messages` tables
- Installs pgvector extension
- Creates HNSW index for fast similarity search
- Creates `match_document_chunks` RPC function

### Step 3: Get API Keys

1. In your Supabase dashboard, go to **Settings → API** (left sidebar)
2. Find **Project URL** - copy this
3. Find **Project API keys**:
   - **publishable** - copy this (safe to use in browser)
   - **secret** - copy this (⚠️ NEVER commit to git, server-side only)

### Step 4: Add Environment Variables

Create (or edit) `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...your-publishable-key...
SUPABASE_SECRET_KEY=sb_secret_...your-secret-key...
```

Replace the placeholder values with your actual keys from Step 3.

---

## 2. OpenAI Setup

**Why needed:** Embedding generation via `text-embedding-3-small` model.

### Step 1: Create API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in (or create account if needed)
3. Click **"Create new secret key"**
4. Give it a name: "upwork-ai-chatbot"
5. Click **"Create secret key"**
6. **Copy the key** (you won't see it again!)

### Step 2: Add Environment Variable

Add to `.env.local`:

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...your-api-key...
```

### Step 3: Add Credits (if needed)

- Free trial gives you $5 in credits (expires after 3 months)
- If expired or used up, go to **Settings → Billing → Add payment method**
- Minimum top-up: $5
- Embedding costs are very low: ~$0.0001 per 1000 tokens
- The seed script (~19K tokens) costs less than $0.002

---

## 3. Verify Setup

Your `.env.local` should now look like this:

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...your-actual-key...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...your-actual-publishable-key...
SUPABASE_SECRET_KEY=sb_secret_...your-actual-secret-key...

# App (optional, for deployment)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Test Without Credentials (Dry-Run)

```bash
npm run seed -- --dry-run
```

**Expected output:**
```
=== FlowBoard Knowledge Base Seeding ===
Mode: DRY RUN (no API calls)

Found 10 documents to seed:

  flowboard-api-reference.md: 15 chunks, 2381 tokens
  flowboard-billing-faq.md: 13 chunks, 1699 tokens
  ...

=== Summary ===
Documents processed: 10
  ✓ Success: 10
Total chunks: 142
Total tokens: 18993

✓ Seeding complete!
```

### Test With Credentials (Live)

```bash
npm run seed
```

**Expected output:**
```
=== FlowBoard Knowledge Base Seeding ===
Mode: LIVE

Found 10 documents to seed:

  flowboard-api-reference.md: 15 chunks, 2381 tokens
  flowboard-billing-faq.md: 13 chunks, 1699 tokens
  ...

=== Summary ===
Documents processed: 10
  ✓ Success: 10
Total chunks: 142
Total tokens: 18993

✓ Seeding complete!
```

**What this does:**
- Reads all 10 FlowBoard fixture documents
- Chunks them into 142 pieces (heading-aware)
- Generates embeddings via OpenAI API
- Stores chunks with embeddings in Supabase

### Verify in Supabase

1. Go to your Supabase dashboard
2. Click **Table Editor** (left sidebar)
3. Select **documents** table → you should see 10 rows
4. Select **document_chunks** table → you should see 142 rows
5. Click on any row → you should see an `embedding` column with a vector (array of 1536 numbers)

---

## Security Reminders

⚠️ **NEVER commit `.env.local` to git**
- The `.gitignore` file already excludes it
- The `SUPABASE_SECRET_KEY` bypasses Row Level Security (RLS)
- The `OPENAI_API_KEY` can incur charges if leaked

✅ **Safe to commit:**
- `.env.example` (template with placeholder values)

---

## Troubleshooting

### "Missing credentials" error in dry-run mode
- This should NOT happen after Plan 01-03
- If it does, the OpenAI client isn't lazy-loaded correctly
- Report as a bug

### "Failed to insert document" error
- Check that schema.sql ran successfully (Step 2)
- Verify `SUPABASE_SECRET_KEY` is correct (not the publishable key)

### "Failed to generate embeddings" error
- Check that `OPENAI_API_KEY` is correct
- Verify you have credits (check platform.openai.com/usage)
- Check for rate limits (free tier: 3 RPM, 40,000 TPM)

### "Connection refused" or "Project not found"
- Check that `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify project is not paused (Supabase pauses inactive projects after 1 week)

---

## Next Steps

After setup is complete:

1. **Run seed script:** `npm run seed`
2. **Verify data in Supabase:** Check tables have rows
3. **Ready for Plan 01-04:** Evaluation framework to test RAG quality

---

**Setup complete!** The RAG pipeline is now ready to use.
