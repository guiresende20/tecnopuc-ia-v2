'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useT } from '@/i18n';

/* ─── Estilos inline ─── */
const S = {
  backdrop: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(10, 4, 22, 0.38)',
    backdropFilter: 'blur(3px)',
    WebkitBackdropFilter: 'blur(3px)',
    zIndex: 60,
    cursor: 'pointer',
  },
  modal: {
    position: 'fixed' as const,
    top: 64,
    left: 24,
    right: 24,
    bottom: 140,
    zIndex: 70,
    background: 'rgba(16, 8, 38, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    boxShadow: '0 8px 48px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(234,152,47,0.07)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
    padding: '28px 32px 24px',
    overflowY: 'auto' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#FFFCFB',
    fontFamily: "'Montserrat', sans-serif",
    letterSpacing: '0.05em',
    margin: 0,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: '#6C6E71',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'color 0.2s, background 0.2s',
  },
  description: {
    fontSize: '0.84rem',
    color: '#E3E3E4',
    lineHeight: 1.65,
    fontFamily: "'Montserrat', sans-serif",
    paddingBottom: 12,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
    margin: 0,
  },
  itemsGrid: {
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
    alignContent: 'start',
    padding: 0,
    margin: 0,
    flex: 1,
    minHeight: 0,
  },
  item: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    cursor: 'default',
  },
  itemName: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#EA982F',
    fontFamily: "'Montserrat', sans-serif",
    margin: 0,
  },
  itemDetail: {
    fontSize: '0.73rem',
    color: '#E3E3E4',
    lineHeight: 1.5,
    fontFamily: "'Montserrat', sans-serif",
    margin: 0,
  },
  cta: {
    alignSelf: 'flex-start',
    background: '#EA982F',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '10px 22px',
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 600,
    fontSize: '0.82rem',
    cursor: 'pointer',
    flexShrink: 0,
  },
};

/* ─── Componente ─── */
interface HubPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HubPanel({ isOpen, onClose }: HubPanelProps) {
  const selectedHub = useAppStore((s) => s.selectedHub);
  const t = useT();
  const content = selectedHub ? t.hub[selectedHub] : null;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && content && (
        <motion.div
          key="hub-backdrop"
          style={S.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {isOpen && content && (
        <motion.div
          key="hub-modal"
          style={S.modal}
          role="dialog"
          aria-modal="true"
          aria-label={content.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {/* Header */}
          <div style={S.header}>
            <h2 style={S.title}>{content.title}</h2>
            <button style={S.closeBtn} onClick={onClose} aria-label={t.response.closeTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Descrição */}
          <p style={S.description}>{content.description}</p>

          {/* Itens */}
          <ul style={S.itemsGrid}>
            {content.items.map((item, i) => (
              <motion.li
                key={item.name}
                style={S.item}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.05 }}
              >
                <span style={S.itemName}>{item.name}</span>
                <span style={S.itemDetail}>{item.detail}</span>
              </motion.li>
            ))}
          </ul>

          {content.cta && (
            <button style={S.cta}>{content.cta}</button>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
