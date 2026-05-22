// scripts/reindex.ts
// Reindexa (regera o embedding) de TODOS os chunks já existentes em `documents`,
// in-place: lê o `content` que já está na linha, gera um novo vetor com o modelo
// atual (gemini-embedding-2-preview, 768d) e dá UPDATE só na coluna `embedding`.
//
// Não re-chunka, não mexe em metadata, não muda `id` — então referências como
// `contribuicoes.documents_ids` continuam válidas. É idempotente: pode rodar
// quantas vezes quiser.
//
// Use quando o modelo de embedding mudou e docs antigos ficaram num espaço
// vetorial incompatível (somem da busca vetorial mesmo existindo na base).
//
// Uso:
//   npx tsx scripts/reindex.ts          # só conta os chunks e estima o tempo (dry-run)
//   npx tsx scripts/reindex.ts --run    # executa o reindex de verdade
//
// Requer: .env.local com GEMINI_API_KEY e SUPABASE_*

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌  Variáveis de ambiente não configuradas. Verifique .env.local');
  process.exit(1);
}

const RUN = process.argv.includes('--run');

// Quantos chunks embedar em paralelo por lote. 5 espelha scripts/ingest.ts —
// equilíbrio entre throughput e não estourar o rate limit do Gemini.
const CONCURRENCY = 5;
const BATCH_DELAY_MS = 200; // respiro entre lotes
const PAGE_SIZE = 500;      // paginação da leitura (evita o teto de 1000 do PostgREST)
const MAX_RETRIES = 3;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-2-preview' });

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface DocRow {
  id: number;
  content: string;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }], role: 'user' },
    outputDimensionality: 768,
  } as Parameters<typeof embeddingModel.embedContent>[0]);
  return result.embedding.values;
}

// Tenta gerar o embedding com backoff — sobrevive a rate limit transitório (429).
async function embedWithRetry(text: string, attempt = 1): Promise<number[]> {
  try {
    return await generateEmbedding(text);
  } catch (err) {
    if (attempt >= MAX_RETRIES) throw err;
    const wait = 500 * 2 ** (attempt - 1); // 500ms, 1s, 2s...
    await new Promise((r) => setTimeout(r, wait));
    return embedWithRetry(text, attempt + 1);
  }
}

function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}min ${s % 60}s`;
}

async function main() {
  // Conta total de chunks (head:true → não traz linhas, só o count).
  const { count, error: countError } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true });

  if (countError || count == null) {
    console.error(`❌  Erro ao contar documents: ${countError?.message ?? 'sem retorno'}`);
    process.exit(1);
  }

  // Estimativa grosseira: ~300ms de latência por embedding, dividido pela concorrência.
  const estimateMs = (count * 300) / CONCURRENCY + Math.ceil(count / CONCURRENCY) * BATCH_DELAY_MS;
  console.log(`\n📊 ${count} chunk(s) em \`documents\`.`);
  console.log(`⏱️  Tempo estimado: ~${fmtDuration(estimateMs)} (concorrência ${CONCURRENCY}).`);
  console.log(`🎯 Modelo de embedding: gemini-embedding-2-preview (768d).`);
  console.log(`🗄️  Banco: ${SUPABASE_URL}\n`);

  if (!RUN) {
    console.log('🔎 Dry-run. Nada foi alterado.');
    console.log('▶️  Para executar o reindex de verdade:  npx tsx scripts/reindex.ts --run\n');
    return;
  }

  let processed = 0;
  let ok = 0;
  const failed: number[] = [];
  let lastId = 0;
  const startedAt = Date.now();

  // Keyset pagination por id crescente — robusto mesmo se o total mudar durante a run.
  for (;;) {
    const { data, error } = await supabase
      .from('documents')
      .select('id, content')
      .gt('id', lastId)
      .order('id', { ascending: true })
      .limit(PAGE_SIZE);

    if (error) {
      console.error(`\n❌  Erro ao ler página (id > ${lastId}): ${error.message}`);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    const rows = data as DocRow[];

    for (let i = 0; i < rows.length; i += CONCURRENCY) {
      const batch = rows.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (row) => {
          try {
            const embedding = await embedWithRetry(row.content);
            const { error: updErr } = await supabase
              .from('documents')
              .update({ embedding })
              .eq('id', row.id);
            if (updErr) {
              failed.push(row.id);
              console.error(`\n   ❌ update id=${row.id}: ${updErr.message}`);
            } else {
              ok++;
            }
          } catch (err) {
            failed.push(row.id);
            console.error(`\n   ❌ embed id=${row.id}: ${(err as Error).message}`);
          }
        }),
      );
      processed += batch.length;
      process.stdout.write(`   reindexado ${processed}/${count} (ok ${ok}, falhas ${failed.length})...\r`);
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }

    lastId = rows[rows.length - 1].id;
  }

  console.log(`\n\n🎉 Reindex concluído em ${fmtDuration(Date.now() - startedAt)}.`);
  console.log(`   ✅ ${ok} chunk(s) reindexado(s).`);
  if (failed.length > 0) {
    console.log(`   ⚠️  ${failed.length} falha(s) — ids: ${failed.join(', ')}`);
    console.log('   Rode novamente para reprocessar (é idempotente).');
  }
  console.log('');
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
