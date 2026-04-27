-- ============================================================
-- TecnoPUC Chatbot — Purga automática de contribuições
-- ============================================================
-- Agenda dois jobs diários via pg_cron:
--   1. Apaga 'aguardando_email' não verificadas após 24h
--      (e-mail nunca foi confirmado — token expirou e o registro virou lixo)
--   2. Apaga 'rejeitada' após 15 dias
--      (mantém histórico curto pra auditoria, depois limpa)
--
-- PRÉ-REQUISITO — habilitar a extensão pg_cron no Supabase:
--   1. Dashboard → Database → Extensions
--   2. Procurar "pg_cron"
--   3. Toggle "Enable extension"
--   4. (Só então rodar este SQL no SQL Editor)
--
-- Os jobs rodam no fuso UTC. As 03:00 UTC = 00:00 BRT.
-- ============================================================

-- 1. Garante que a extensão está habilitada (idempotente).
--    Se a UI já habilitou, isso é no-op. Se não, falha aqui — precisa habilitar pela UI.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Job de purga das não verificadas (24h).
--    Usa cron.schedule(jobname, schedule, command). Idempotente: se o job já existe
--    com o mesmo nome, atualiza o agendamento.
SELECT cron.schedule(
  'purge-contribuicoes-nao-verificadas',
  '0 3 * * *',  -- todos os dias às 03:00 UTC
  $$
    DELETE FROM contribuicoes
    WHERE status = 'aguardando_email'
      AND criada_em < now() - interval '24 hours';
  $$
);

-- 3. Job de purga das rejeitadas (15 dias).
--    Roda 5min depois pra evitar contention (não que tenha — é só boa prática).
SELECT cron.schedule(
  'purge-contribuicoes-rejeitadas',
  '5 3 * * *',  -- 03:05 UTC
  $$
    DELETE FROM contribuicoes
    WHERE status = 'rejeitada'
      AND revisada_em < now() - interval '15 days';
  $$
);

-- ============================================================
-- VERIFICAÇÃO — rodar na mão pra confirmar que ficaram agendados
-- ============================================================
-- SELECT jobid, jobname, schedule, command, active
-- FROM cron.job
-- WHERE jobname LIKE 'purge-contribuicoes-%';
--
-- Esperado: 2 linhas, ambas com active=true.

-- ============================================================
-- HISTÓRICO DE EXECUÇÕES (depois que rodarem pela primeira vez)
-- ============================================================
-- SELECT jobid, runid, start_time, end_time, status, return_message
-- FROM cron.job_run_details
-- WHERE jobid IN (
--   SELECT jobid FROM cron.job WHERE jobname LIKE 'purge-contribuicoes-%'
-- )
-- ORDER BY start_time DESC
-- LIMIT 20;

-- ============================================================
-- DRY RUN — quanta coisa seria apagada AGORA se os jobs rodassem?
-- (rodar isto antes de agendar pra ter ideia do impacto)
-- ============================================================
-- SELECT 'aguardando_email > 24h' AS regra, COUNT(*) AS linhas_a_apagar
-- FROM contribuicoes
-- WHERE status = 'aguardando_email' AND criada_em < now() - interval '24 hours'
-- UNION ALL
-- SELECT 'rejeitada > 15 dias', COUNT(*)
-- FROM contribuicoes
-- WHERE status = 'rejeitada' AND revisada_em < now() - interval '15 days';

-- ============================================================
-- DESAGENDAR (rollback)
-- ============================================================
-- SELECT cron.unschedule('purge-contribuicoes-nao-verificadas');
-- SELECT cron.unschedule('purge-contribuicoes-rejeitadas');

-- ============================================================
-- ALTERNATIVA: PURGA MANUAL (se preferir não usar pg_cron)
-- Rodar quando quiser limpar. Faz exatamente o mesmo que os jobs.
-- ============================================================
-- DELETE FROM contribuicoes
--   WHERE status = 'aguardando_email'
--     AND criada_em < now() - interval '24 hours';
--
-- DELETE FROM contribuicoes
--   WHERE status = 'rejeitada'
--     AND revisada_em < now() - interval '15 days';
