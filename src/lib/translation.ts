// src/lib/translation.ts
// Tradução server-side de queries do usuário para PT-BR antes do embedding RAG.
// Usa Gemini Flash (mesma SDK já em uso). Cache LRU simples em memória por
// (locale, query). Não traduz se já está em PT.

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Locale } from '@/i18n/locales';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('Variável GEMINI_API_KEY não configurada no .env.local');
}

const genAI = new GoogleGenerativeAI(apiKey);
const translationModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
});

const LOCALE_NAMES: Record<Exclude<Locale, 'pt'>, string> = {
  en: 'English',
  es: 'Spanish',
  zh: 'Simplified Chinese',
};

// Cache simples (Map preserva ordem de inserção → fácil LRU).
// Mantém até 200 traduções em memória do servidor; suficiente para queries repetidas.
const MAX_CACHE_SIZE = 200;
const cache = new Map<string, string>();

function cacheKey(locale: Locale, query: string): string {
  return `${locale}::${query}`;
}

/**
 * Traduz a query do usuário para PT-BR antes do embedding e da busca no RAG.
 * Se locale === 'pt', retorna o original sem tocar na API.
 *
 * Termos próprios (TecnoPUC, PUCRS, nomes de hubs/programas) são mantidos
 * em português para casar com a base de conhecimento.
 */
export async function translateToPortuguese(
  query: string,
  locale: Locale,
): Promise<string> {
  if (locale === 'pt') return query;

  const key = cacheKey(locale, query);
  const cached = cache.get(key);
  if (cached !== undefined) {
    // Renova posição no LRU
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }

  const sourceLanguage = LOCALE_NAMES[locale];

  const prompt = `Translate the following user question from ${sourceLanguage} to Brazilian Portuguese (pt-BR).

Rules:
- Keep proper nouns unchanged: TecnoPUC, PUCRS, Tecnopuc, hub names, program names.
- Translate naturally. Preserve question marks and meaning.
- Output ONLY the translated text. No quotes, no commentary, no explanation.

User question:
${query}`;

  try {
    const result = await translationModel.generateContent(prompt);
    const translated = result.response.text().trim();

    if (!translated) {
      console.warn('[translation] Resposta vazia do Gemini, usando original.');
      return query;
    }

    // Atualiza cache (com eviction LRU se necessário)
    if (cache.size >= MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) cache.delete(firstKey);
    }
    cache.set(key, translated);

    return translated;
  } catch (err) {
    console.error('[translation] Falha ao traduzir, usando original:', err);
    return query;
  }
}

/**
 * Nome legível do idioma para injetar no system prompt do LLM.
 * (Em inglês — mais previsível para o modelo seguir a instrução.)
 */
export function localeDisplayName(locale: Locale): string {
  if (locale === 'pt') return 'Brazilian Portuguese';
  return LOCALE_NAMES[locale];
}
