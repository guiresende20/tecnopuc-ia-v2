'use client';

import { motion } from 'framer-motion';
import type { RadialItem } from '@/types/app.types';

interface TRadialMenuItemProps {
  item: RadialItem;
  angle: number;   // graus
  radius: number;  // px
  index: number;
  onSelect: (item: RadialItem) => void;
}

export function TRadialMenuItem({ item, angle, radius, index, onSelect }: TRadialMenuItemProps) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;

  /*
   * O container pai (TRadialMenu) tem tamanho zero no centro do T.
   * motion.div parte de (0,0) e anima até (x, y).
   * O button usa translate(-50%, -50%) para ficar centrado no ponto de chegada.
   * Assim: centro_do_botão = centro_do_T + (x, y)  ✓
   */
  return (
    <motion.div
      style={{ position: 'absolute', top: 0, left: 0 }}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
      animate={{ x, y, opacity: 1, scale: 1 }}
      exit={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
      transition={{
        type: 'spring',
        stiffness: 320,
        damping: 26,
        delay: index * 0.04,
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
    >
      <button
        onClick={() => onSelect(item)}
        title={item.description}
        style={{
          position: 'absolute',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(20, 10, 38, 0.92)',
          border: '1.5px solid var(--color-ocre)',
          borderRadius: '24px',
          padding: '9px 20px',
          color: 'var(--color-ocre)',
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 600,
          fontSize: '0.78rem',
          letterSpacing: '0.06em',
          cursor: 'pointer',
          whiteSpace: 'pre-line',
          textAlign: 'center',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 14px rgba(234,152,47,0.18)',
          transition: 'background 0.2s, box-shadow 0.2s, border-color 0.2s',
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget;
          btn.style.background = 'rgba(234,152,47,0.14)';
          btn.style.borderColor = 'var(--color-ocre-light)';
          btn.style.boxShadow = '0 4px 24px rgba(0,0,0,0.5), 0 0 24px rgba(234,152,47,0.35)';
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget;
          btn.style.background = 'rgba(20,10,38,0.92)';
          btn.style.borderColor = 'var(--color-ocre)';
          btn.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5), 0 0 14px rgba(234,152,47,0.18)';
        }}
      >
        {item.label}
      </button>
    </motion.div>
  );
}
