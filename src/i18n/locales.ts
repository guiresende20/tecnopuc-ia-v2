export type Locale = 'pt' | 'en' | 'es' | 'zh';

export const DEFAULT_LOCALE: Locale = 'pt';

export interface LocaleMeta {
  code: Locale;
  htmlLang: string;
  label: string;
  shortLabel: string;
}

export const LOCALES: Record<Locale, LocaleMeta> = {
  pt: { code: 'pt', htmlLang: 'pt-BR',  label: 'Português',  shortLabel: 'PT' },
  en: { code: 'en', htmlLang: 'en',     label: 'English',    shortLabel: 'EN' },
  es: { code: 'es', htmlLang: 'es',     label: 'Español',    shortLabel: 'ES' },
  zh: { code: 'zh', htmlLang: 'zh-CN',  label: '中文',        shortLabel: '中' },
};

export const LOCALE_LIST: LocaleMeta[] = [LOCALES.pt, LOCALES.en, LOCALES.es, LOCALES.zh];

export function isLocale(value: unknown): value is Locale {
  return value === 'pt' || value === 'en' || value === 'es' || value === 'zh';
}
