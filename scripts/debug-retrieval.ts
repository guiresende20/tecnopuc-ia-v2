// scripts/debug-retrieval.ts
// Reproduz a recuperação do /api/chat para uma pergunta, contra o banco de prod.
// Mostra o que volta de cada lado (vetorial puro e híbrido) com scores, e quais
// chunks sobreviveriam ao filtro de threshold. Diagnóstico — não escreve nada.
//
// Uso:  npx tsx scripts/debug-retrieval.ts "vai ter copa no t?"

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌  .env.local incompleto.');
  process.exit(1);
}

const query = process.argv.slice(2).join(' ').trim() || 'vai ter copa no t?';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-2-preview' });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Cópia 1:1 do buildFtsQuery em src/lib/supabase.ts para reproduzir fielmente.
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

async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }], role: 'user' },
    outputDimensionality: 768,
  } as Parameters<typeof embeddingModel.embedContent>[0]);
  return result.embedding.values;
}

function preview(s: string, n = 90): string {
  return s.replace(/\s+/g, ' ').slice(0, n);
}

async function main() {
  console.log(`\n❓ Pergunta: "${query}"`);
  const ftsText = buildFtsQuery(query);
  console.log(`🔤 buildFtsQuery → "${ftsText}"`);

  // Threshold/matchCount reais (chatbot_settings).
  const { data: settingsRows } = await supabase
    .from('chatbot_settings')
    .select('setting_key, setting_value');
  const settings = (settingsRows ?? []).reduce((a: Record<string, string>, r) => {
    a[r.setting_key] = r.setting_value;
    return a;
  }, {});
  const threshold = settings.similarityThreshold ? parseFloat(settings.similarityThreshold) / 100 : 0.65;
  const matchCount = settings.matchCount ? parseInt(settings.matchCount) : 5;
  console.log(`⚙️  similarityThreshold=${threshold}  matchCount=${matchCount}\n`);

  const embedding = await generateEmbedding(query);

  // --- Lado vetorial puro (match_documents) ---
  const { data: vec, error: vErr } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: matchCount,
    match_threshold: 0, // sem corte, pra ver as similaridades reais
  });
  console.log('── VETORIAL PURO (match_documents, sem corte) ──');
  if (vErr) console.log(`   erro: ${vErr.message}`);
  else
    for (const d of vec ?? [])
      console.log(`   id=${d.id}  sim=${(d.similarity ?? 0).toFixed(3)}  ${preview(d.content)}`);

  // --- Lado híbrido (hybrid_match_documents) ---
  const { data: hyb, error: hErr } = await supabase.rpc('hybrid_match_documents', {
    query_embedding: embedding,
    query_text: ftsText,
    match_count: matchCount,
  });
  console.log('\n── HÍBRIDO (hybrid_match_documents) ──');
  if (hErr) {
    console.log(`   erro: ${hErr.message}  (RPC existe no banco?)`);
  } else {
    for (const d of hyb ?? []) {
      const sim = d.similarity != null ? d.similarity.toFixed(3) : '—';
      const fts = d.fts_rank != null ? d.fts_rank.toFixed(3) : '—';
      console.log(`   id=${d.id}  sim=${sim}  fts=${fts}  rrf=${(d.rrf_score ?? 0).toFixed(4)}  ${preview(d.content)}`);
    }
    // Filtro idêntico ao route.ts
    const survivors = (hyb ?? []).filter(
      (d: { fts_rank?: number; similarity?: number }) =>
        d.fts_rank != null || (d.similarity ?? 0) >= threshold,
    );
    console.log(`\n✅ Sobrevivem ao filtro do route.ts: ${survivors.length} chunk(s) → ids [${survivors.map((d: { id: number }) => d.id).join(', ')}]`);
    if (survivors.length === 0)
      console.log('   → contexto vazio = a IA responde "não temos informações".');
  }
  console.log('');
}

main().catch((e) => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
