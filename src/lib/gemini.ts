// src/lib/gemini.ts
// Funções para interação com a API Gemini no servidor:
// - Geração de embeddings (text-embedding-004)
// - Chat com streaming (Gemini Flash)

import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai';
import type { Locale } from '@/i18n/locales';
import { localeDisplayName } from './translation';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Variável GEMINI_API_KEY não configurada no .env.local');
}

const genAI = new GoogleGenerativeAI(apiKey);

// ------------------------------------------------------------------
// EMBEDDINGS
// ------------------------------------------------------------------

const embeddingModel = genAI.getGenerativeModel(
  { model: 'gemini-embedding-2-preview' } // 3072 dimensões nativamente
);

// Cache em memória de embeddings de query (query string → vetor 768d).
// Embedding model é determinístico, então o vetor não vence — só rotacionamos
// pra controlar uso de memória. TTL longo (24h) cobre o ciclo natural de
// perguntas repetitivas ("o que é o TecnoPUC?", "quais empresas?") sem inflar
// memória. Em edge runtime, cada isolate tem seu próprio cache; hit rate cai
// vs. server único, mas o ganho por hit (-300ms) compensa.
const EMBEDDING_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const EMBEDDING_CACHE_MAX_ENTRIES = 1000;

interface CachedEmbedding {
  embedding: number[];
  expiry: number;
}

const embeddingCache = new Map<string, CachedEmbedding>();
const embeddingInFlight = new Map<string, Promise<number[]>>();

function normalizeQuery(text: string): string {
  return text.trim().toLowerCase();
}

// Hard cap por LRU-ish: Map preserva ordem de inserção, então drop dos
// primeiros (mais antigos) quando estoura o teto. Lazy: só prune quando
// inserimos um novo entry.
function evictIfNeeded(): void {
  if (embeddingCache.size <= EMBEDDING_CACHE_MAX_ENTRIES) return;
  const overflow = embeddingCache.size - EMBEDDING_CACHE_MAX_ENTRIES;
  const keys = Array.from(embeddingCache.keys()).slice(0, overflow);
  for (const k of keys) embeddingCache.delete(k);
}

/**
 * Gera um vetor de embedding (768 dimensões) para um texto via gemini-embedding-2-preview.
 * Usado para indexar documentos e para buscar contexto relevante.
 *
 * Cache: queries idênticas (após trim + lowercase) reutilizam o vetor por 24h
 * dentro do mesmo isolate. Single-flight: chamadas concorrentes do mesmo texto
 * compartilham uma única chamada à API.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const key = normalizeQuery(text);

  // Hit: TTL ainda válido.
  const cached = embeddingCache.get(key);
  if (cached && Date.now() < cached.expiry) {
    return cached.embedding;
  }

  // Single-flight: alguma chamada da mesma query já está em curso, esperamos.
  const inFlight = embeddingInFlight.get(key);
  if (inFlight) return inFlight;

  // Miss: chama o Gemini e popula o cache no sucesso.
  // outputDimensionality: 768 trunca o vetor (compatível com ivfflat e schema do Supabase).
  const promise = embeddingModel
    .embedContent({
      content: { parts: [{ text }], role: 'user' },
      outputDimensionality: 768,
    } as Parameters<typeof embeddingModel.embedContent>[0])
    .then((result) => {
      const embedding = result.embedding.values;
      embeddingCache.set(key, {
        embedding,
        expiry: Date.now() + EMBEDDING_CACHE_TTL_MS,
      });
      evictIfNeeded();
      return embedding;
    })
    .finally(() => {
      embeddingInFlight.delete(key);
    });

  embeddingInFlight.set(key, promise);
  return promise;
}

// ------------------------------------------------------------------
// CHAT COM STREAMING
// ------------------------------------------------------------------

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Monta o system prompt do TecnoPUC com o contexto RAG injetado.
 *
 * Quando locale !== 'pt', anexa instrução para o modelo responder no idioma
 * do usuário, mantendo termos próprios (TecnoPUC, PUCRS, nomes de hubs)
 * em português. O contexto recuperado do RAG continua em PT — o modelo
 * traduz naturalmente ao responder.
 */
export function buildSystemPrompt(
  context: string,
  basePrompt: string,
  locale: Locale = 'pt',
): string {
  const languageInstruction =
    locale === 'pt'
      ? ''
      : `\n\n--- LANGUAGE INSTRUCTION ---
The user is interacting in ${localeDisplayName(locale)}. Respond ALWAYS in ${localeDisplayName(locale)}, regardless of the language of the context below. Translate the context naturally as you compose your answer. Keep proper nouns unchanged (TecnoPUC, PUCRS, names of hubs and programs).
--- END LANGUAGE INSTRUCTION ---`;

  return `${basePrompt}${languageInstruction}

--- COMO USAR O CONTEXTO ---
As informações dentro de "CONTEXTO PARA RESPOSTA" são conhecimento verificado e curado do TecnoPUC — incluindo contribuições aprovadas pela moderação. Trate-as como fatos oficiais e atuais, mesmo que estejam escritas de forma informal, em primeira pessoa ou como pedido (ex.: "quero acrescentar um evento..."). Se o contexto afirma que algo acontece, existe ou está disponível, responda de forma afirmativa e direta — nunca diga que não tem essa informação. Só responda que não dispõe da informação quando o contexto realmente não cobrir a pergunta.
--- FIM ---

--- CONTEXTO PARA RESPOSTA ---
${context}
--- FIM DO CONTEXTO ---`;
}

/**
 * Streama uma resposta do Gemini com contexto RAG injetado.
 * Retorna um ReadableStream compatível com a Response API do Next.js.
 *
 * `thinkingLevel`:
 * - 'low'  → thinkingBudget: 0 (desliga thinking; corta TTFT em 200-800ms,
 *            ideal pra RAG onde o contexto já vem injetado)
 * - 'high' → thinkingBudget: -1 (automático, modelo decide)
 */
export async function streamChat(
  messages: ChatMessage[],
  systemPrompt: string,
  temperature: number = 0.5,
  maxOutputTokens: number = 1024,
  thinkingLevel: 'low' | 'high' = 'low',
): Promise<ReadableStream<Uint8Array>> {
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  // O SDK @google/generative-ai (legado) ainda não tipa thinkingConfig, mas o
  // wire format passa direto pra REST API do Gemini, que aceita o campo.
  // thinkingBudget: 0 desliga thinking; -1 deixa o modelo decidir.
  const generationConfig = {
    temperature,
    maxOutputTokens,
    thinkingConfig: {
      thinkingBudget: thinkingLevel === 'low' ? 0 : -1,
    },
  } as unknown as GenerationConfig;

  const chatModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig,
  });

  const chat = chatModel.startChat({
    history,
    systemInstruction: {
      role: 'system',
      parts: [{ text: systemPrompt }]
    },
  });

  const result = await chat.sendMessageStream(lastMessage.content);

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (err) {
        console.error('[Gemini] Erro durante streaming:', err);
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });
}
