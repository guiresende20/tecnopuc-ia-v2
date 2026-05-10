// scripts/eval-retrieval.ts
// Avalia o pipeline de retrieval contra evals/queries.json.
//
// Uso:
//   npx tsx scripts/eval-retrieval.ts                  # vector-only (baseline)
//   npx tsx scripts/eval-retrieval.ts --mode=hybrid    # quando a fase 1 estiver implementada
//   npx tsx scripts/eval-retrieval.ts --k=10           # tamanho do top-K buscado
//
// Métricas reportadas (por K em [1,3,5,10]):
//   - Hit@K   : ao menos 1 expected_source aparece nos K primeiros
//   - Recall@K: fração de expected_sources recuperados nos K primeiros
//   - MRR     : média de 1/rank do primeiro expected_source (0 se ausente)
//   - Latência p50/p95 (embedding + busca)
//
// Saída: tabela no console + snapshot JSON em evals/results/{timestamp}-{mode}.json

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ---------------- Args ----------------
const args = process.argv.slice(2).reduce<Record<string, string>>((acc, a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  acc[k] = v ?? 'true';
  return acc;
}, {});

const MODE = (args.mode ?? 'vector') as 'vector' | 'hybrid';
const FETCH_K = parseInt(args.k ?? '10', 10);
const QUERIES_FILE = args.queries ?? 'evals/queries.json';
const METRIC_KS = [1, 3, 5, 10] as const;

// ---------------- Env ----------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Variáveis de ambiente não configuradas. Verifique .env.local');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-2-preview' });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ---------------- Tipos ----------------
interface Query {
  id: string;
  category: string;
  locale: string;
  query: string;
  expected_sources: string[];
  notes?: string;
}

interface QueriesFile {
  version: string;
  description?: string;
  metrics_at_k?: number[];
  queries: Query[];
}

interface RetrievedDoc {
  id: number;
  content: string;
  metadata: {
    source?: string;
    title?: string;
    chunkIndex?: number;
    origem?: string;
    contribuicao_id?: string | number;
  };
  similarity?: number;
}

// Resolve um identificador estável de fonte mesmo quando o chunk veio de
// uma versão legada do ingest (sem o campo `source`). Necessário enquanto
// não houver uma reingestão completa.
function resolveSource(meta: RetrievedDoc['metadata'] | undefined): string {
  if (!meta) return 'unknown';
  if (meta.source) return meta.source;
  if (meta.title && meta.title.endsWith('.md')) return meta.title;
  if (meta.origem === 'comunidade' && meta.contribuicao_id != null) {
    return `comunidade:${meta.contribuicao_id}`;
  }
  return 'unknown';
}

interface PerQueryResult {
  id: string;
  category: string;
  locale: string;
  query: string;
  expected_sources: string[];
  retrieved_sources: string[];
  similarities: number[];
  metrics: Record<number, { hit: 0 | 1; recall: number; firstHitRank: number | null }>;
  latencyMs: number;
}

// ---------------- Retrieval ----------------
async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }], role: 'user' },
    outputDimensionality: 768,
  } as Parameters<typeof embeddingModel.embedContent>[0]);
  return result.embedding.values;
}

async function vectorSearch(embedding: number[], k: number): Promise<RetrievedDoc[]> {
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: k,
    match_threshold: 0, // bypass do threshold para ver ranking completo
  });
  if (error) throw new Error(`vectorSearch: ${error.message}`);
  return (data as RetrievedDoc[]) ?? [];
}

// Pré-processa a query igual ao lib/supabase.ts:buildFtsQuery — duplicado
// aqui porque o script é standalone (scripts/ não importam src/).
function buildFtsQuery(text: string): string {
  const tokens = text
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  if (tokens.length === 0) return '';
  const highlighted = tokens.filter((t) => t !== t.toLowerCase());
  if (highlighted.length > 0) return highlighted.join(' ');
  if (tokens.length <= 2) return tokens.join(' ');
  return tokens.join(' OR ');
}

async function hybridSearch(embedding: number[], queryText: string, k: number): Promise<RetrievedDoc[]> {
  const { data, error } = await supabase.rpc('hybrid_match_documents', {
    query_embedding: embedding,
    query_text: buildFtsQuery(queryText),
    match_count: k,
  });
  if (error) throw new Error(`hybridSearch: ${error.message} — confirme que hybrid-search-setup.sql foi aplicado`);
  return (data as RetrievedDoc[]) ?? [];
}

async function retrieve(query: string, k: number): Promise<{ docs: RetrievedDoc[]; latencyMs: number }> {
  const t0 = Date.now();
  const embedding = await generateEmbedding(query);
  const docs = MODE === 'hybrid' ? await hybridSearch(embedding, query, k) : await vectorSearch(embedding, k);
  return { docs, latencyMs: Date.now() - t0 };
}

// ---------------- Métricas ----------------
function computeMetrics(
  retrieved: string[],
  expected: string[],
  k: number,
): { hit: 0 | 1; recall: number; firstHitRank: number | null } {
  const topK = retrieved.slice(0, k);
  const expectedSet = new Set(expected);
  // Conta cada expected_source no máximo uma vez, mesmo que apareçam
  // múltiplos chunks da mesma fonte no top-K.
  const uniqueHits = new Set<string>();
  let firstHitRank: number | null = null;
  for (let i = 0; i < topK.length; i++) {
    const src = topK[i];
    if (expectedSet.has(src)) {
      uniqueHits.add(src);
      if (firstHitRank === null) firstHitRank = i + 1;
    }
  }
  return {
    hit: uniqueHits.size > 0 ? 1 : 0,
    recall: expected.length === 0 ? 0 : uniqueHits.size / expected.length,
    firstHitRank,
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function pad(s: string | number, n: number): string {
  const str = String(s);
  return str.length >= n ? str : str + ' '.repeat(n - str.length);
}

// ---------------- Main ----------------
async function main() {
  const queriesPath = path.resolve(process.cwd(), QUERIES_FILE);
  if (!fs.existsSync(queriesPath)) {
    console.error(`Arquivo de queries não encontrado: ${queriesPath}`);
    process.exit(1);
  }

  const file = JSON.parse(fs.readFileSync(queriesPath, 'utf-8')) as QueriesFile;
  console.log(`\n[eval] mode=${MODE}  fetch_k=${FETCH_K}  queries=${file.queries.length}\n`);

  const results: PerQueryResult[] = [];

  for (const q of file.queries) {
    process.stdout.write(`  [${q.id}] ${q.category.padEnd(18)} ${q.locale}  ...`);
    try {
      const { docs, latencyMs } = await retrieve(q.query, FETCH_K);
      const retrievedSources = docs.map((d) => resolveSource(d.metadata));
      const similarities = docs.map((d) => d.similarity ?? 0);
      const metrics: PerQueryResult['metrics'] = {};
      for (const k of METRIC_KS) metrics[k] = computeMetrics(retrievedSources, q.expected_sources, k);
      results.push({
        id: q.id,
        category: q.category,
        locale: q.locale,
        query: q.query,
        expected_sources: q.expected_sources,
        retrieved_sources: retrievedSources,
        similarities,
        metrics,
        latencyMs,
      });
      const hit5 = metrics[5].hit ? 'OK' : 'MISS';
      const rank = metrics[5].firstHitRank ?? '-';
      console.log(` ${hit5}  rank=${rank}  ${latencyMs}ms`);
    } catch (err) {
      console.log(` ERRO: ${(err as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  // ---------- Agregação ----------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('Agregado geral');
  console.log('────────────────────────────────────────────────────────────');
  console.log(pad('K', 6) + pad('Hit@K', 10) + pad('Recall@K', 12) + 'MRR');
  for (const k of METRIC_KS) {
    const hits = results.map((r) => r.metrics[k].hit);
    const recalls = results.map((r) => r.metrics[k].recall);
    const reciprocals = results.map((r) => {
      const rk = r.metrics[k].firstHitRank;
      return rk ? 1 / rk : 0;
    });
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    console.log(
      pad(k, 6) +
        pad(avg(hits).toFixed(3), 10) +
        pad(avg(recalls).toFixed(3), 12) +
        avg(reciprocals).toFixed(3),
    );
  }

  const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);
  console.log(`\nLatência (embedding+search):  p50=${percentile(latencies, 50)}ms  p95=${percentile(latencies, 95)}ms`);

  // ---------- Por categoria ----------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('Por categoria  (Hit@5)');
  console.log('────────────────────────────────────────────────────────────');
  const byCategory: Record<string, PerQueryResult[]> = {};
  for (const r of results) (byCategory[r.category] ??= []).push(r);
  for (const [cat, rs] of Object.entries(byCategory).sort()) {
    const avgHit5 = rs.reduce((a, r) => a + r.metrics[5].hit, 0) / rs.length;
    console.log(`  ${pad(cat, 22)} n=${pad(rs.length, 4)} hit@5=${avgHit5.toFixed(3)}`);
  }

  // ---------- Falhas (Hit@5 = 0) ----------
  const misses = results.filter((r) => r.metrics[5].hit === 0);
  if (misses.length > 0) {
    console.log('\n────────────────────────────────────────────────────────────');
    console.log(`Falhas (Hit@5 = 0)  — ${misses.length} de ${results.length}`);
    console.log('────────────────────────────────────────────────────────────');
    for (const m of misses) {
      console.log(`  [${m.id}] "${m.query}"`);
      console.log(`         esperado: ${m.expected_sources.join(', ')}`);
      console.log(`         retornado top-3: ${m.retrieved_sources.slice(0, 3).join(', ')}`);
    }
  }

  // ---------- Snapshot ----------
  const outDir = path.resolve(process.cwd(), 'evals/results');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(outDir, `${stamp}-${MODE}.json`);
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        mode: MODE,
        fetchK: FETCH_K,
        timestamp: new Date().toISOString(),
        queriesVersion: file.version,
        results,
      },
      null,
      2,
    ),
  );
  console.log(`\nSnapshot salvo em: ${path.relative(process.cwd(), outFile)}\n`);
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
