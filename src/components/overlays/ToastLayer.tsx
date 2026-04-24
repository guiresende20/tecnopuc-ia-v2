'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type Toast } from '@/store/appStore';

const TOAST_DURATION = 3500;

const STYLE: Record<Toast['type'], { border: string; bg: string; color: string; icon: string }> = {
  success: { border: 'rgba(74,222,128,0.35)',  bg: 'rgba(74,222,128,0.08)',  color: '#4ade80', icon: '✓' },
  error:   { border: 'rgba(248,113,113,0.35)', bg: 'rgba(248,113,113,0.08)', color: '#f87171', icon: '✕' },
  info:    { border: 'rgba(0,153,255,0.35)',   bg: 'rgba(0,153,255,0.08)',   color: '#0099ff', icon: 'i' },
  warning: { border: 'rgba(245,158,11,0.35)',  bg: 'rgba(245,158,11,0.08)',  color: '#f59e0b', icon: '!' },
};

function ToastItem({ id, type, message }: Toast) {
  const dismissToast = useAppStore((s) => s.dismissToast);
  const s = STYLE[type];

  useEffect(() => {
    const t = setTimeout(() => dismissToast(id), TOAST_DURATION);
    return () => clearTimeout(t);
  }, [id, dismissToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{    opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      onClick={() => dismissToast(id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderRadius: '10px',
        background: s.bg,
        border: `1px solid ${s.border}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: `0 4px 24px ${s.border}`,
        color: s.color,
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '13px',
        fontWeight: 500,
        maxWidth: '340px',
        cursor: 'pointer',
        userSelect: 'none',
        pointerEvents: 'auto',
        lineHeight: 1.4,
      }}
    >
      <span style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        border: `1.5px solid ${s.color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: 700,
        flexShrink: 0,
      }}>
        {s.icon}
      </span>
      {message}
    </motion.div>
  );
}

export function ToastLayer() {
  const toasts = useAppStore((s) => s.toasts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      bottom: '100px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignItems: 'flex-end',
      pointerEvents: 'none',
    }}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
