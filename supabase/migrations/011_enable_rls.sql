-- Enable Row Level Security on all public tables
-- All server-side code uses service_role (bypasses RLS)
-- Only anon key needs policies for client-side admin dashboard

-- 1. Enable RLS on all tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- 2. documents: no anon access (all access via service_role)
-- No policies = anon is blocked by default when RLS is enabled

-- 3. document_chunks: no anon access (RAG search uses service_role RPC)
-- No policies = anon is blocked by default when RLS is enabled

-- 4. conversations: anon can read (admin dashboard realtime metrics)
CREATE POLICY "anon_select_conversations"
  ON conversations FOR SELECT
  TO anon
  USING (true);

-- 5. messages: anon can read (admin dashboard recent questions + realtime)
CREATE POLICY "anon_select_messages"
  ON messages FOR SELECT
  TO anon
  USING (true);

-- 6. contact_submissions: no anon access (all access via service_role)
-- No policies = anon is blocked by default when RLS is enabled
