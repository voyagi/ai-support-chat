-- Contact submissions table for out-of-KB queries
-- Users can submit contact requests when bot doesn't have confident answers

CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  original_question TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'contacted', 'resolved')) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for admin dashboard queries (filter by status, sort by date)
CREATE INDEX idx_contact_submissions_status_created ON contact_submissions(status, created_at DESC);

-- Index for conversation lookups
CREATE INDEX idx_contact_submissions_conversation ON contact_submissions(conversation_id);

-- Add comment for documentation
COMMENT ON TABLE contact_submissions IS 'Contact form submissions from users when bot lacks confident answer (similarity < 0.7)';
COMMENT ON COLUMN contact_submissions.status IS 'Workflow status: pending (new), contacted (reached out), resolved (handled)';
