import { useAppStore } from '@/store/appStore';
import { pt, type Dictionary } from './dictionaries/pt';
import { en } from './dictionaries/en';
import { es } from './dictionaries/es';
import { zh } from './dictionaries/zh';
import type { Locale } from './locales';

export const dictionaries: Record<Locale, Dictionary> = { pt, en, es, zh };

export type { Dictionary } from './dictionaries/pt';
export type { Locale } from './locales';
export { LOCALES, LOCALE_LIST, DEFAULT_LOCALE, isLocale } from './locales';

/**
 * Hook React: lê o locale corrente do store e devolve o dicionário inteiro.
 * Uso: `const t = useT(); t.status.idle`
 */
export function useT(): Dictionary {
  const locale = useAppStore((s) => s.locale);
  return dictionaries[locale];
}

/**
 * Versão imperativa para uso fora de React (ex: serviços, callbacks isolados).
 */
export function t(locale: Locale): Dictionary {
  return dictionaries[locale];
}
