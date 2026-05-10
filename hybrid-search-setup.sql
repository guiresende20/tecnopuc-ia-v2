-- TecnoPUC Chatbot - Hybrid Search Setup (Fase 1)
-- Adiciona Full-Text Search ao lado do pgvector existente.
-- Idempotente: pode rodar varias vezes.
-- Pre-requisito: tabela documents existe (supabase-setup.sql).

-- ============================================================
-- BLOCO 1 - Coluna tsvector multi-config
-- ============================================================
-- 'simple' captura siglas literais (IPaq, FabLab, Apple).
-- 'portuguese' e 'english' removem stopwords e fazem stemming
-- para que frases naturais com "a", "the", "is" tambem casem.

ALTER TABLE documents DROP COLUMN IF EXISTS content_tsv;

ALTER TABLE documents
  ADD COLUMN content_tsv tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',     coalesce(content, '')) ||
    to_tsvector('portuguese', coalesce(content, '')) ||
    to_tsvector('english',    coalesce(content, ''))
  ) STORED;

-- ============================================================
-- BLOCO 2 - Indice GIN
-- ============================================================

DROP INDEX IF EXISTS documents_tsv_idx;
CREATE INDEX documents_tsv_idx ON documents USING GIN (content_tsv);

-- ============================================================
-- BLOCO 3 - Funcao hybrid_match_documents (RRF)
-- ============================================================
-- Combina ranking de vector e FTS via Reciprocal Rank Fusion.
-- rrf_k=60 e o valor canonico (Cormack et al., 2009).

DROP FUNCTION IF EXISTS hybrid_match_documents;

CREATE OR REPLACE FUNCTION hybrid_match_documents(
  query_embedding VECTOR(768),
  query_text      TEXT,
  match_count     INT DEFAULT 10,
  rrf_k           INT DEFAULT 60
)
RETURNS TABLE(
  id          BIGINT,
  content     TEXT,
  metadata    JSONB,
  similarity  FLOAT,
  fts_rank    FLOAT,
  rrf_score   FLOAT
)
LANGUAGE sql STABLE AS $$
  WITH vec AS (
    SELECT
      d.id, d.content, d.metadata,
      1 - (d.embedding <=> query_embedding) AS sim,
      row_number() OVER (ORDER BY d.embedding <=> query_embedding) AS rnk
    FROM documents d
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count
  ),
  fts AS (
    SELECT
      d.id, d.content, d.metadata,
      GREATEST(
        ts_rank_cd(d.content_tsv, websearch_to_tsquery('simple',     query_text)),
        ts_rank_cd(d.content_tsv, websearch_to_tsquery('portuguese', query_text)),
        ts_rank_cd(d.content_tsv, websearch_to_tsquery('english',    query_text))
      ) AS rk_score,
      row_number() OVER (
        ORDER BY GREATEST(
          ts_rank_cd(d.content_tsv, websearch_to_tsquery('simple',     query_text)),
          ts_rank_cd(d.content_tsv, websearch_to_tsquery('portuguese', query_text)),
          ts_rank_cd(d.content_tsv, websearch_to_tsquery('english',    query_text))
        ) DESC
      ) AS rnk
    FROM documents d
    WHERE d.content_tsv @@ websearch_to_tsquery('simple',     query_text)
       OR d.content_tsv @@ websearch_to_tsquery('portuguese', query_text)
       OR d.content_tsv @@ websearch_to_tsquery('english',    query_text)
    LIMIT match_count
  )
  SELECT
    COALESCE(v.id, f.id)             AS id,
    COALESCE(v.content, f.content)   AS content,
    COALESCE(v.metadata, f.metadata) AS metadata,
    v.sim                            AS similarity,
    f.rk_score                       AS fts_rank,
    COALESCE(1.0 / (rrf_k + v.rnk), 0) +
    COALESCE(1.0 / (rrf_k + f.rnk), 0) AS rrf_score
  FROM vec v
  FULL OUTER JOIN fts f ON v.id = f.id
  ORDER BY rrf_score DESC
  LIMIT match_count;
$$;
