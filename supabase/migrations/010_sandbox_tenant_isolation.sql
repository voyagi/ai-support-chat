-- Phase 10-02: Add tenant isolation for sandbox mode
-- Allows per-IP document uploads with automatic cleanup

-- Add tenant_id column to documents table
-- NULL = main demo KB, non-NULL = tenant-specific uploads
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS tenant_id TEXT;

-- Add tenant_id column to document_chunks table
ALTER TABLE document_chunks
ADD COLUMN IF NOT EXISTS tenant_id TEXT;

-- Create indexes for tenant filtering
CREATE INDEX IF NOT EXISTS documents_tenant_id_idx ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS document_chunks_tenant_id_idx ON document_chunks(tenant_id);

-- Update match_document_chunks RPC to support tenant isolation
-- When tenant_id is provided, returns BOTH main KB (tenant_id IS NULL) AND tenant chunks
-- When tenant_id is NULL, returns only main KB chunks
-- Drop both possible signatures (3-param original and 4-param with collision bug)
DROP FUNCTION IF EXISTS match_document_chunks(vector(1536), float, int);
DROP FUNCTION IF EXISTS match_document_chunks(vector(1536), float, int, text);

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_tenant_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  document_title text,
  section_heading text,
  content text,
  chunk_position int,
  total_chunks int,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.document_title,
    dc.section_heading,
    dc.content,
    dc.chunk_position,
    dc.total_chunks,
    1 - (dc.embedding <#> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE
    1 - (dc.embedding <#> query_embedding) > match_threshold
    AND (
      -- If p_tenant_id is provided, include both main KB and tenant docs
      -- If p_tenant_id is NULL, only include main KB docs
      (p_tenant_id IS NULL AND dc.tenant_id IS NULL)
      OR (p_tenant_id IS NOT NULL AND (dc.tenant_id IS NULL OR dc.tenant_id = p_tenant_id))
    )
  ORDER BY dc.embedding <#> query_embedding
  LIMIT match_count;
$$;
