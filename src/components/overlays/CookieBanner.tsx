'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'analytics_consent';
const CONSENT_EVENT = 'analytics-consent-changed';

export type ConsentValue = 'granted' | 'denied';

export function readConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'granted' || v === 'denied' ? v : null;
}

function writeConsent(v: ConsentValue) {
  window.localStorage.setItem(STORAGE_KEY, v);
  window.dispatchEvent(new CustomEvent<ConsentValue>(CONSENT_EVENT, { detail: v }));
}

export function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    setVisible(readConsent() === null);
  }, []);

  if (!mounted) return null;

  function decide(v: ConsentValue) {
    writeConsent(v);
    setVisible(false);
  }

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          role="dialog"
          aria-live="polite"
          aria-label="Aviso de cookies"
          style={{
            position: 'fixed',
            left: '24px',
            right: '24px',
            bottom: '24px',
            zIndex: 9998,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              maxWidth: '640px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              padding: '18px 22px',
              borderRadius: '14px',
              background: 'rgba(8, 12, 24, 0.78)',
              border: '1px solid rgba(0, 153, 255, 0.28)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.04) inset',
              color: '#e2e8f0',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <strong style={{ fontSize: '14px', color: '#0099ff', letterSpacing: '0.02em' }}>
                Cookies analíticos
              </strong>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.55, color: '#cbd5e1' }}>
                Usamos Google Analytics para entender como o assistente é utilizado e melhorar a experiência.
                Ao recusar, o assistente continua funcionando normalmente — apenas deixaremos de coletar dados anônimos de uso.
                Sua escolha fica salva neste navegador.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => decide('denied')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid rgba(203, 213, 225, 0.25)',
                  color: '#cbd5e1',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.18s ease, border-color 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(203, 213, 225, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(203, 213, 225, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(203, 213, 225, 0.25)';
                }}
              >
                Recusar
              </button>
              <button
                type="button"
                onClick={() => decide('granted')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: 'rgba(0, 153, 255, 0.18)',
                  border: '1px solid rgba(0, 153, 255, 0.55)',
                  color: '#0099ff',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.18s ease, box-shadow 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 153, 255, 0.28)';
                  e.currentTarget.style.boxShadow = '0 0 16px rgba(0, 153, 255, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 153, 255, 0.18)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Aceitar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export const ANALYTICS_CONSENT_EVENT = CONSENT_EVENT;
