'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { useT } from '@/i18n';
import { LOCALE_LIST, LOCALES, type Locale } from '@/i18n/locales';

export function LanguageSwitcher() {
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const t = useT();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleSelect = (next: Locale) => {
    setLocale(next);
    setOpen(false);
  };

  return (
    <div className="lang-switcher" ref={containerRef}>
      <button
        className="lang-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.languageSwitcher.label}
        title={t.languageSwitcher.label}
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
        </svg>
        <span className="lang-current">{LOCALES[locale].shortLabel}</span>
        <svg
          className={`lang-caret ${open ? 'open' : ''}`}
          width="9"
          height="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul className="lang-menu" role="listbox" aria-label={t.languageSwitcher.label}>
          {LOCALE_LIST.map((meta) => {
            const active = meta.code === locale;
            return (
              <li key={meta.code}>
                <button
                  className={`lang-option ${active ? 'active' : ''}`}
                  onClick={() => handleSelect(meta.code)}
                  role="option"
                  aria-selected={active}
                  lang={meta.htmlLang}
                >
                  <span className="lang-option-short">{meta.shortLabel}</span>
                  <span className="lang-option-label">{meta.label}</span>
                  {active && (
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <style jsx>{`
        .lang-switcher {
          position: relative;
          display: inline-flex;
        }
        .lang-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 36px;
          padding: 0 10px 0 12px;
          border: 1px solid rgba(0, 153, 255, 0.2);
          border-radius: 8px;
          background: rgba(0, 153, 255, 0.06);
          color: rgba(200, 220, 255, 0.65);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .lang-btn:hover {
          border-color: rgba(0, 153, 255, 0.5);
          background: rgba(0, 153, 255, 0.12);
          color: #0099ff;
          box-shadow: 0 0 12px rgba(0, 153, 255, 0.2);
        }
        .lang-current {
          min-width: 18px;
          text-align: center;
        }
        .lang-caret {
          opacity: 0.6;
          transition: transform 0.2s ease;
        }
        .lang-caret.open {
          transform: rotate(180deg);
        }
        .lang-menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          min-width: 168px;
          margin: 0;
          padding: 6px;
          list-style: none;
          background: rgba(8, 12, 24, 0.95);
          border: 1px solid rgba(0, 153, 255, 0.3);
          border-radius: 10px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 24px rgba(0, 100, 255, 0.1);
          z-index: 50;
          animation: lang-menu-in 0.18s ease both;
        }
        .lang-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border: none;
          background: transparent;
          color: rgba(200, 220, 255, 0.7);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13px;
          font-weight: 500;
          text-align: left;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .lang-option:hover {
          background: rgba(0, 153, 255, 0.12);
          color: #e8f4ff;
        }
        .lang-option.active {
          background: rgba(0, 153, 255, 0.15);
          color: #0099ff;
        }
        .lang-option-short {
          flex-shrink: 0;
          width: 26px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: inherit;
          opacity: 0.85;
        }
        .lang-option-label {
          flex: 1;
        }
        @keyframes lang-menu-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 600px) {
          .lang-btn {
            padding: 0 8px;
            font-size: 11.5px;
          }
          .lang-menu {
            min-width: 152px;
          }
        }
      `}</style>
    </div>
  );
}
