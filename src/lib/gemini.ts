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

/**
 * Gera um vetor de embedding (768 dimensões) para um texto via gemini-embedding-2-preview.
 * Usado para indexar documentos e para buscar contexto relevante.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // outputDimensionality: 768 trunca o vetor para 768 dims (compatível com ivfflat e o schema do Supabase)
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }], role: 'user' },
    outputDimensionality: 768,
  } as Parameters<typeof embeddingModel.embedContent>[0]);
  return result.embedding.values;
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
