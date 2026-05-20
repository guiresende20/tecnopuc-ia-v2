// src/lib/supabase.ts
// Cliente Supabase para uso exclusivo no servidor (API Routes).
// Usa a service_role key — nunca deve ser importado em componentes client-side.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas no .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Tipos para os documentos indexados
export interface Document {
  id: number;
  content: string;
  metadata: {
    source?: string;      // ex: "empresas-residentes.md" (só no fluxo CLI)
    source_id?: number | string; // FK para knowledge_sources.id (presente nos 4 fluxos)
    chunkIndex: number;
    category?: string;    // ex: "empresa", "servico", "evento"
  };
  similarity?: number;    // cosine similarity (vector side)
  fts_rank?: number;      // ts_rank_cd (FTS side, presente no hybrid)
  rrf_score?: number;     // score combinado RRF (presente no hybrid)
}

export interface KnowledgeSource {
  id: number;
  title: string;
  content: string;
  type: string;
  created_at: string;
}

export interface ChatbotSetting {
  setting_key: string;
  setting_value: string;
}

export interface AppSettings {
  system_prompt: string;
  temperature: number;
  thinkingLevel: 'low' | 'high';
  similarityThreshold: number;
  matchCount: number;
  voice: string;
  maxTokens: number;
}

// Cache em memória do AppSettings (global, sem PII).
// TTL curto + invalidação explícita no PUT do admin garantem que mudanças
// propagam no máximo em SETTINGS_CACHE_TTL_MS para usuários do mesmo
// processo. Em ambiente serverless, instâncias diferentes têm caches
// independentes — a propagação cross-instância depende do TTL.
const SETTINGS_CACHE_TTL_MS = 60_000;
let cachedSettings: AppSettings | null = null;
let cachedSettingsExpiry = 0;
let inFlightFetch: Promise<AppSettings> | null = null;

const DEFAULT_SETTINGS: AppSettings = {
  system_prompt: 'Você é um assistente virtual experiente do TecnoPUC. Responda com base no contexto fornecido.',
  temperature: 0.5,
  thinkingLevel: 'low',
  similarityThreshold: 0.65,
  matchCount: 5,
  voice: 'Aoede',
  // 512 cobre 99% das respostas institucionais (100-400 tokens típico).
  // Cap menor = TTLB menor (modelo termina o stream antes).
  maxTokens: 512,
};

async function fetchSettingsFromDb(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('chatbot_settings')
    .select('setting_key, setting_value');

  if (error || !data) return DEFAULT_SETTINGS;

  const settings = data.reduce((acc: Record<string, string>, row) => {
    acc[row.setting_key] = row.setting_value;
    return acc;
  }, {});

  return {
    system_prompt: settings.system_prompt || DEFAULT_SETTINGS.system_prompt,
    temperature: settings.temperature ? parseFloat(settings.temperature) : DEFAULT_SETTINGS.temperature,
    thinkingLevel: (settings.thinkingLevel as 'low' | 'high') || DEFAULT_SETTINGS.thinkingLevel,
    similarityThreshold: settings.similarityThreshold ? (parseFloat(settings.similarityThreshold) / 100) : DEFAULT_SETTINGS.similarityThreshold,
    matchCount: settings.matchCount ? parseInt(settings.matchCount) : DEFAULT_SETTINGS.matchCount,
    voice: settings.voice || DEFAULT_SETTINGS.voice,
    maxTokens: settings.maxTokens ? parseInt(settings.maxTokens) : DEFAULT_SETTINGS.maxTokens,
  };
}

export async function getSettings(): Promise<AppSettings> {
  const now = Date.now();
  if (cachedSettings && now < cachedSettingsExpiry) {
    return cachedSettings;
  }
  // Single-flight: se já existe um fetch em andamento, todos esperam o mesmo.
  if (inFlightFetch) {
    return inFlightFetch;
  }
  inFlightFetch = fetchSettingsFromDb()
    .then((settings) => {
      cachedSettings = settings;
      cachedSettingsExpiry = Date.now() + SETTINGS_CACHE_TTL_MS;
      return settings;
    })
    .finally(() => {
      inFlightFetch = null;
    });
  return inFlightFetch;
}

export function invalidateSettingsCache(): void {
  cachedSettings = null;
  cachedSettingsExpiry = 0;
}

// Busca documentos similares à query via pgvector
export async function matchDocuments(
  queryEmbedding: number[],
  matchCount = 5,
  matchThreshold = 0.65
): Promise<Document[]> {
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    match_threshold: matchThreshold,
  });

  if (error) {
    console.error('[Supabase] Erro na busca de documentos:', error);
    throw new Error(`Erro na busca vetorial: ${error.message}`);
  }

  return (data as Document[]) ?? [];
}

// Hybrid search: combina pgvector (semântico) com FTS (literal) via Reciprocal
// Rank Fusion. Usado quando a RPC hybrid_match_documents existe no Postgres
// (ver hybrid-search-setup.sql). Resolve casos onde embedding falha em siglas
// e nomes próprios (IPaq, FabLab, Apple) que aparecem literalmente nos chunks.

// Pré-processa a query para o lado FTS, decidindo entre AND e OR conforme
// a forma da pergunta:
// 1. Se houver tokens com letra maiúscula (proper nouns como Apple/TecnoPUC,
//    siglas como IPaq, CamelCase como FabLab), ANDa SÓ esses. São os termos
//    distintivos — casar todos isola exatamente o chunk relevante.
// 2. Sem destaque, AND para queries de 1-2 tokens (precisão) e OR para 3+
//    tokens (recall em frases naturais onde palavras comuns não-stopword
//    quebrariam o AND default do websearch_to_tsquery).
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

export async function hybridMatchDocuments(
  queryEmbedding: number[],
  queryText: string,
  matchCount = 10,
): Promise<Document[]> {
  const { data, error } = await supabase.rpc('hybrid_match_documents', {
    query_embedding: queryEmbedding,
    query_text: buildFtsQuery(queryText),
    match_count: matchCount,
  });

  if (error) {
    console.error('[Supabase] Erro na busca híbrida:', error);
    throw new Error(`Erro na busca híbrida: ${error.message}`);
  }

  return (data as Document[]) ?? [];
}
