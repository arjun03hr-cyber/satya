-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create analysis_cache table
CREATE TABLE IF NOT EXISTS public.analysis_cache (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query_text        TEXT NOT NULL,
  query_embedding   vector(768) NOT NULL,
  url_hash          TEXT,
  source_urls       TEXT[] NOT NULL DEFAULT '{}',
  result            JSONB NOT NULL,
  credibility_score INTEGER NOT NULL DEFAULT 0,
  search_count      INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Hybrid Retrieval
-- 1. Semantic Vector Search (using hnsw for better recall with 768 dims)
CREATE INDEX IF NOT EXISTS analysis_cache_embedding_idx ON public.analysis_cache USING hnsw (query_embedding vector_cosine_ops);

-- 2. Keyword Search (GIN index on text)
CREATE INDEX IF NOT EXISTS analysis_cache_text_idx ON public.analysis_cache USING GIN (to_tsvector('english', query_text));

-- 3. Exact URL Match
CREATE INDEX IF NOT EXISTS analysis_cache_url_hash_idx ON public.analysis_cache (url_hash);

-- Match function for vector similarity
CREATE OR REPLACE FUNCTION public.match_analysis_cache(
  query_embedding vector(768),
  match_threshold float,
  match_count int DEFAULT 1
)
RETURNS TABLE (
  id uuid,
  query_text text,
  url_hash text,
  source_urls text[],
  result jsonb,
  credibility_score integer,
  search_count integer,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ac.id,
    ac.query_text,
    ac.url_hash,
    ac.source_urls,
    ac.result,
    ac.credibility_score,
    ac.search_count,
    ac.created_at,
    1 - (ac.query_embedding <=> query_embedding) AS similarity
  FROM public.analysis_cache ac
  WHERE 1 - (ac.query_embedding <=> query_embedding) > match_threshold
  ORDER BY ac.query_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS Policies
ALTER TABLE public.analysis_cache ENABLE ROW LEVEL SECURITY;

-- Backend uses service_role key to bypass RLS, but we can allow SELECT for anon as well if we want frontend to fetch directly
DROP POLICY IF EXISTS "Public cache select" ON public.analysis_cache;
CREATE POLICY "Public cache select" 
  ON public.analysis_cache FOR SELECT 
  USING (true);
