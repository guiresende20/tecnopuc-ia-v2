'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAppStore } from '@/store/appStore';

export function TAudioAura() {
  const tState = useAppStore((s) => s.tState);

  // audioLevel via subscribe direto: evita rerender a 60Hz e o spring
  // adiciona uma 2ª camada de suavização sobre o sinal já filtrado.
  const levelMV = useMotionValue(0);
  const smoothLevel = useSpring(levelMV, { stiffness: 45, damping: 22, mass: 1.2 });

  useEffect(() => {
    levelMV.set(useAppStore.getState().audioLevel);
    const unsub = useAppStore.subscribe((state) => {
      levelMV.set(state.audioLevel);
    });
    return unsub;
  }, [levelMV]);

  // Anéis SEMPRE visíveis em escalas-base diferentes; o nível só modula
  // ligeiramente o tamanho. Sem keyframe loop = sem aparecer/desaparecer.
  const innerScale = useTransform(smoothLevel, (v) => 1 + v * 0.14);
  const midScale = useTransform(smoothLevel, (v) => 1.12 + v * 0.12);
  const outerScale = useTransform(smoothLevel, (v) => 1.24 + v * 0.1);

  const isActive = tState === 'listening' || tState === 'speaking';
  if (!isActive) return null;

  const isListening = tState === 'listening';
  const color = isListening ? '#60a5fa' : '#c084fc';

  return (
    <div className="aura-wrap">
      <motion.div
        className="aura-ring inner"
        style={{ scale: innerScale, borderColor: color }}
      />
      <motion.div
        className="aura-ring mid"
        style={{ scale: midScale, borderColor: color }}
      />
      <motion.div
        className="aura-ring outer"
        style={{ scale: outerScale, borderColor: color }}
      />

      <style jsx>{`
        .aura-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 1;
        }
        .aura-ring {
          position: absolute;
          inset: 0;
          margin: auto;
          width: calc(var(--t, 500px) * 0.792);
          height: calc(var(--t, 500px) * 0.792);
          border-radius: 50%;
          border: 1.5px solid;
        }
        .inner {
          opacity: 0.55;
        }
        .mid {
          opacity: 0.32;
        }
        .outer {
          opacity: 0.18;
        }
      `}</style>
    </div>
  );
}
