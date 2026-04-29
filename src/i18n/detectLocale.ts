import { DEFAULT_LOCALE, isLocale, type Locale } from './locales';

export const LOCALE_STORAGE_KEY = 'tecnopuc.locale';

/**
 * Detecta o locale a usar:
 *   1. localStorage (preferência explícita do usuário)
 *   2. navigator.language (idioma do browser)
 *   3. DEFAULT_LOCALE ('pt')
 *
 * Seguro para SSR: retorna DEFAULT_LOCALE se window não existir.
 */
export function detectLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // localStorage pode estar bloqueado (privacy mode); ignora
  }

  const nav = window.navigator?.language?.toLowerCase() ?? '';
  if (nav.startsWith('pt')) return 'pt';
  if (nav.startsWith('en')) return 'en';
  if (nav.startsWith('es')) return 'es';
  if (nav.startsWith('zh')) return 'zh';

  return DEFAULT_LOCALE;
}

export function persistLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignora — preferência simplesmente não persiste
  }
}
