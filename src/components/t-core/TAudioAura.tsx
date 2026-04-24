'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';

interface TAudioAuraProps {
  audioLevel?: number; // 0–1
}

export function TAudioAura({ audioLevel = 0 }: TAudioAuraProps) {
  const tState = useAppStore((s) => s.tState);
  const isActive = tState === 'listening' || tState === 'speaking';

  if (!isActive) return null;

  const isListening = tState === 'listening';
  const color = isListening ? '#60a5fa' : '#c084fc';

  return (
    <div className="aura-wrap">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="aura-ring"
          animate={{
            scale: [1, 1.3 + audioLevel * 0.4 + i * 0.15, 1],
            opacity: [0.5 - i * 0.12, 0, 0.5 - i * 0.12],
          }}
          transition={{
            duration: 1.6,
            delay: i * 0.35,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          style={{ borderColor: color }}
        />
      ))}

      <style jsx>{`
        .aura-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .aura-ring {
          position: absolute;
          width: 325px;
          height: 325px;
          border-radius: 50%;
          border: 1.5px solid;
        }
      `}</style>
    </div>
  );
}
