-- Supabase Database Schema for AI Support Chat RAG System
-- This file is designed to be copy-pasted into the Supabase SQL Editor
-- All statements are idempotent (safe to run multiple times)

-- Enable pgvector extension for vector similarity search
create extension if not exists vector with schema extensions;

-- Documents table: stores the original knowledge base documents
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz default now(),
  -- Unique constraint to prevent duplicate uploads and enable re-upload detection
  constraint documents_title_key unique (title)
);

-- Document chunks table: stores chunked documents with embeddings and enriched metadata
-- Each chunk carries context metadata for better retrieval and citation
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  -- Enriched metadata columns for context and citation
  document_title text not null,
  section_heading text not null,
  content text not null,
  chunk_position int not null,
  total_chunks int not null,
  -- OpenAI embeddings are normalized, so we use inner product for similarity
  embedding vector(1536),
  created_at timestamptz default now()
);

-- HNSW index for fast approximate nearest neighbor search on embeddings
-- Using vector_ip_ops (inner product) operator for normalized OpenAI embeddings
-- HNSW is faster than IVFFlat for read-heavy workloads like RAG search
create index if not exists document_chunks_embedding_idx
  on document_chunks
  using hnsw (embedding vector_ip_ops);

-- Conversations table: stores chat sessions
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

-- Messages table: stores individual messages within conversations
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- RPC function for similarity search on document chunks
-- Returns top matching chunks with enriched metadata for citation
-- Uses negative inner product (<#>) operator for normalized embeddings
create or replace function match_document_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  document_id uuid,
  document_title text,
  section_heading text,
  content text,
  chunk_position int,
  total_chunks int,
  similarity float
)
language sql stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.document_title,
    dc.section_heading,
    dc.content,
    dc.chunk_position,
    dc.total_chunks,
    -- Convert negative inner product to similarity score (0-1 range)
    1 - (dc.embedding <#> query_embedding) as similarity
  from document_chunks dc
  where 1 - (dc.embedding <#> query_embedding) > match_threshold
  order by dc.embedding <#> query_embedding
  limit match_count;
$$;
