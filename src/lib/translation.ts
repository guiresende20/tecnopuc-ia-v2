// src/lib/translation.ts
// Helpers ligados a locale. A tradução prévia da query para PT-BR foi
// removida — o modelo gemini-embedding-2-preview é multilíngue e lida
// diretamente com queries em qualquer idioma suportado, eliminando o
// round-trip ao Gemini Flash apenas para traduzir.

import type { Locale } from '@/i18n/locales';

const LOCALE_NAMES: Record<Exclude<Locale, 'pt'>, string> = {
  en: 'English',
  es: 'Spanish',
  zh: 'Simplified Chinese',
};

/**
 * Nome legível do idioma para injetar no system prompt do LLM.
 * (Em inglês — mais previsível para o modelo seguir a instrução.)
 */
export function localeDisplayName(locale: Locale): string {
  if (locale === 'pt') return 'Brazilian Portuguese';
  return LOCALE_NAMES[locale];
}
