-- ============================================================
-- TecnoPUC Chatbot — Setup da tabela contribuicoes
-- Adiciona moderação de contribuições da comunidade ao RAG.
-- Execute este SQL no Editor SQL do Supabase Dashboard, em sequência
-- após supabase-setup.sql e admin-setup.sql.
-- ============================================================

-- Tabela de contribuições da comunidade (moderação + auditoria)
CREATE TABLE IF NOT EXISTS contribuicoes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- conteúdo
  conteudo_original     TEXT NOT NULL,
  conteudo_aprovado     TEXT,                 -- preenchido na aprovação (pode diferir se admin editou)
  categoria             TEXT,                 -- categoria livre opcional

  -- contribuidor
  email                 TEXT NOT NULL,
  ip_address            TEXT,

  -- estado
  status                TEXT NOT NULL DEFAULT 'aguardando_email'
    CHECK (status IN ('aguardando_email', 'aguardando_revisao', 'aprovada', 'rejeitada')),

  -- validação de e-mail
  token_validacao       TEXT UNIQUE,
  token_expira_em       TIMESTAMPTZ,
  email_verificado_em   TIMESTAMPTZ,

  -- moderação
  revisada_por          TEXT,                 -- ADMIN username que aprovou/rejeitou
  revisada_em           TIMESTAMPTZ,
  motivo_rejeicao       TEXT,                 -- opcional

  -- rastreabilidade no RAG (preenchido após aprovação)
  knowledge_source_id   BIGINT,
  documents_ids         BIGINT[],

  -- timestamps
  criada_em             TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- extensibilidade
  metadata              JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_contribuicoes_status ON contribuicoes(status);
CREATE INDEX IF NOT EXISTS idx_contribuicoes_email  ON contribuicoes(email, criada_em DESC);
CREATE INDEX IF NOT EXISTS idx_contribuicoes_ip     ON contribuicoes(ip_address, criada_em DESC);
CREATE INDEX IF NOT EXISTS idx_contribuicoes_token  ON contribuicoes(token_validacao)
  WHERE token_validacao IS NOT NULL;

-- ============================================================
-- Purga (rodar periodicamente — pg_cron, edge function, ou cron externo):
--   • aguardando_email não verificadas: 24h
--   • rejeitadas: 15 dias
-- ============================================================
-- DELETE FROM contribuicoes
--   WHERE status = 'aguardando_email'
--     AND criada_em < now() - interval '24 hours';
--
-- DELETE FROM contribuicoes
--   WHERE status = 'rejeitada'
--     AND revisada_em < now() - interval '15 days';
