'use client';

import type { TState } from '@/types/app.types';
import { T_VISUAL_CONFIG } from './TStateMachine';

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function rotationDuration(speed: number): number {
  if (speed <= 0) return 9999;
  return Math.round(10 / speed);
}

const SVG_GRAD_BLUE = {
  grad1: ['#a8d4ff', '#ffffff', '#4aa8ff', '#cce8ff', '#0077dd', '#88ccff'],
  grad2: ['#66bbff', '#ffffff', '#2299ff'],
};

interface TCoreFallbackProps {
  state: TState;
}

export function TCoreFallback({ state }: TCoreFallbackProps) {
  const config = T_VISUAL_CONFIG[state];
  const glow = config.glowColor;
  const drop1 = hexToRgba(glow, 0.9 * config.glowIntensity);
  const drop2 = hexToRgba(glow, 0.5 * config.glowIntensity);
  const drop3 = hexToRgba(glow, 0.28 * config.glowIntensity);
  const rotateDur = rotationDuration(config.rotationSpeed);
  const paused = config.rotationSpeed <= 0;

  return (
    <div
      className="t-letter-wrap"
      style={{
        transform: `scale(${config.scale})`,
        transition: 'transform 0.4s ease',
        animationDuration: `${rotateDur}s, 6s`,
        animationPlayState: paused ? 'paused' : 'running',
      }}
    >
      <svg
        className="t-svg"
        width="100%"
        height="100%"
        viewBox="0 0 178 198"
        preserveAspectRatio="xMidYMid meet"
        style={{
          filter: `
            drop-shadow(0 0 18px ${drop1})
            drop-shadow(0 0 38px ${drop2})
            drop-shadow(0 0 70px ${drop3})
          `,
          transition: 'filter 0.5s ease',
        }}
      >
        <defs>
          <linearGradient id="tGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            {SVG_GRAD_BLUE.grad1.map((c, i) => (
              <stop key={i} offset={`${i * 20}%`} stopColor={c} />
            ))}
          </linearGradient>
          <linearGradient id="tGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={SVG_GRAD_BLUE.grad2[0]} />
            <stop offset="50%" stopColor={SVG_GRAD_BLUE.grad2[1]} />
            <stop offset="100%" stopColor={SVG_GRAD_BLUE.grad2[2]} />
          </linearGradient>
          <filter id="tGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="0" y="0" width="178" height="35.6" rx="3" fill="url(#tGrad1)" filter="url(#tGlow)" />
        <rect x="74.8" y="35.6" width="49.8" height="162.4" rx="3" fill="url(#tGrad2)" filter="url(#tGlow)" />
        <rect x="4" y="3" width="170" height="8.9" rx="2" fill="rgba(255,255,255,0.35)" />
        <rect x="78.8" y="39.6" width="14.9" height="154.4" rx="2" fill="rgba(255,255,255,0.2)" />
      </svg>

      <style jsx>{`
        .t-letter-wrap {
          width: 100%;
          height: 100%;
          animation: rotateT linear infinite, float ease-in-out infinite;
          transform-style: preserve-3d;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .t-svg {
          display: block;
          width: 40%;
          height: 44%;
        }
      `}</style>
    </div>
  );
}
