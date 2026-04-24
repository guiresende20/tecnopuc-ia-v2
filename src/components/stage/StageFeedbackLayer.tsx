'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import type { TState } from '@/types/app.types';

// ─── Config ──────────────────────────────────────────────────────────────────

interface RingConfig {
  color: string; // "r,g,b"
  count: number;
  duration: number;
  stagger: number;
  maxScale: number;
}

const RING_CFG: Partial<Record<TState, RingConfig>> = {
  hover:       { color: '0,180,255',  count: 1, duration: 1.5,  stagger: 0,    maxScale: 3.5 },
  listening:   { color: '0,220,255',  count: 3, duration: 1.2,  stagger: 0.35, maxScale: 4.2 },
  processing:  { color: '120,60,255', count: 2, duration: 0.75, stagger: 0.3,  maxScale: 3.2 },
  responding:  { color: '0,255,180',  count: 3, duration: 0.9,  stagger: 0.25, maxScale: 4.2 },
  speaking:    { color: '0,200,255',  count: 2, duration: 1.0,  stagger: 0.4,  maxScale: 3.5 },
  stable:      { color: '0,160,220',  count: 1, duration: 2.2,  stagger: 0,    maxScale: 2.8 },
  uncertainty: { color: '255,180,40', count: 2, duration: 1.2,  stagger: 0.4,  maxScale: 3.5 },
  error:       { color: '255,60,60',  count: 2, duration: 0.5,  stagger: 0.2,  maxScale: 3.2 },
};

type ParticleMode = 'rise' | 'converge' | 'burst' | 'wave';

const PARTICLE_MODES: Partial<Record<TState, ParticleMode>> = {
  listening:  'rise',
  processing: 'converge',
  responding: 'burst',
  speaking:   'wave',
};

// ─── Pulse Rings ─────────────────────────────────────────────────────────────

function PulseRings({ cfg, stateKey }: { cfg: RingConfig; stateKey: TState }) {
  return (
    <>
      {Array.from({ length: cfg.count }).map((_, i) => (
        <motion.span
          key={`${stateKey}-${i}`}
          style={{
            position: 'absolute',
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: `1.5px solid rgba(${cfg.color}, 0.7)`,
            top: '50%',
            left: '50%',
            marginLeft: -50,
            marginTop: -50,
            pointerEvents: 'none',
          }}
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: cfg.maxScale, opacity: 0 }}
          transition={{
            duration: cfg.duration,
            delay: i * cfg.stagger,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </>
  );
}

// ─── Error Flash ─────────────────────────────────────────────────────────────

function ErrorFlash() {
  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(255,40,40,0.3) 0%, transparent 65%)',
        pointerEvents: 'none',
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 0.6, 1, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, times: [0, 0.25, 0.6, 1] }}
    />
  );
}

// ─── Particle Canvas ─────────────────────────────────────────────────────────

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  r: number;
  color: string; // "r,g,b"
}

function ParticleCanvas({ mode }: { mode: ParticleMode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 500, H = 500;
    const cx = W / 2, cy = H / 2;
    let particles: Particle[] = [];
    let animId = 0;
    let frameCount = 0;

    function spawn(): Particle {
      const m = modeRef.current;

      if (m === 'rise') {
        const angle = Math.random() * Math.PI * 2;
        const dist = 80 + Math.random() * 110;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + (50 + Math.abs(Math.sin(angle)) * 90);
        return {
          x, y,
          vx: (cx - x) * 0.004 + (Math.random() - 0.5) * 0.4,
          vy: -0.9 - Math.random() * 0.8,
          life: 0, maxLife: 80 + Math.random() * 40,
          r: 1.2 + Math.random() * 1.5,
          color: `0,${190 + Math.floor(Math.random() * 65)},255`,
        };
      }

      if (m === 'converge') {
        const angle = Math.random() * Math.PI * 2;
        const dist = 185 + Math.random() * 65;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        const dir = Math.atan2(cy - y, cx - x);
        const speed = 1.6 + Math.random() * 1.2;
        return {
          x, y,
          vx: Math.cos(dir) * speed + Math.cos(angle + Math.PI / 2) * 0.5,
          vy: Math.sin(dir) * speed + Math.sin(angle + Math.PI / 2) * 0.5,
          life: 0, maxLife: 55 + Math.random() * 25,
          r: 1 + Math.random() * 1.5,
          color: `${100 + Math.floor(Math.random() * 80)},${40 + Math.floor(Math.random() * 40)},255`,
        };
      }

      if (m === 'burst') {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.5 + Math.random() * 3.5;
        return {
          x: cx + (Math.random() - 0.5) * 10,
          y: cy + (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0, maxLife: 45 + Math.random() * 25,
          r: 1 + Math.random() * 2,
          color: `0,${210 + Math.floor(Math.random() * 45)},${150 + Math.floor(Math.random() * 100)}`,
        };
      }

      // wave
      const angle = Math.random() * Math.PI * 2;
      return {
        x: cx + Math.cos(angle) * 75,
        y: cy + Math.sin(angle) * 75,
        vx: Math.cos(angle) * 0.6,
        vy: Math.sin(angle) * 0.6,
        life: 0, maxLife: 55 + Math.random() * 35,
        r: 1 + Math.random() * 1.2,
        color: `0,200,255`,
      };
    }

    function loop() {
      animId = requestAnimationFrame(loop);
      frameCount++;
      ctx.clearRect(0, 0, W, H);

      const m = modeRef.current;

      if (m && particles.length < 80) {
        const isBurst = m === 'burst';
        const rate = isBurst ? (frameCount % 2 === 0 ? 5 : 0) : 2;
        for (let i = 0; i < rate; i++) particles.push(spawn());
      }

      particles = particles.filter(p => p.life < p.maxLife);

      for (const p of particles) {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;

        const t = p.life / p.maxLife;
        const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;

        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${p.color},0.9)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${Math.max(0, alpha).toFixed(2)})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    loop();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={500}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        opacity: mode ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StageFeedbackLayer() {
  const tState = useAppStore((s) => s.tState);
  const ringCfg = RING_CFG[tState];
  const particleMode = PARTICLE_MODES[tState] ?? null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 5,
      }}
    >
      {/* Particle canvas — always mounted, mode switches via ref */}
      <ParticleCanvas mode={particleMode} />

      {/* Pulse rings — key resets animation on every state change */}
      <AnimatePresence>
        {ringCfg && (
          <motion.div
            key={`rings-${tState}`}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PulseRings cfg={ringCfg} stateKey={tState} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error flash */}
      <AnimatePresence>
        {tState === 'error' && <ErrorFlash key="error-flash" />}
      </AnimatePresence>
    </div>
  );
}
