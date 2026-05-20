-- video-embeds-setup.sql
-- Feature: vídeo embed automático no chat.
-- Adiciona uma coluna JSONB em knowledge_sources que guarda os vídeos
-- detectados no conteúdo do documento (YouTube/Vimeo/Loom).
--
-- Rodar UMA vez no SQL Editor do Supabase. É idempotente e additive —
-- não altera dados existentes nem participa do RAG (vídeo não vira embedding).
--
-- shape de cada item: { "provider": "youtube"|"vimeo"|"loom", "id": "...", "url": "..." }

ALTER TABLE knowledge_sources
  ADD COLUMN IF NOT EXISTS video_embeds JSONB NOT NULL DEFAULT '[]'::jsonb;
