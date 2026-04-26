'use client';

import { useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { T_VISUAL_CONFIG } from './TStateMachine';
import { TAudioAura } from './TAudioAura';

interface TCore3DProps {
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onHoldStart?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Maps TStateMachine rotationSpeed multiplier → CSS animation duration (seconds)
function rotationDuration(speed: number): number {
  if (speed <= 0) return 9999;
  return Math.round(10 / speed);
}

// ─── Metallic SVG T ───────────────────────────────────────────────────────────

const SVG_GRAD_BLUE = {
  grad1: ['#a8d4ff', '#ffffff', '#4aa8ff', '#cce8ff', '#0077dd', '#88ccff'],
  grad2: ['#66bbff', '#ffffff', '#2299ff'],
};

interface MetallicTProps {
  rotateDuration: number;
  paused: boolean;
  glowColor: string;
  glowIntensity: number;
  scale: number;
}

function MetallicT({ rotateDuration, paused, glowColor, glowIntensity, scale }: MetallicTProps) {
  const drop1 = hexToRgba(glowColor, 0.9  * glowIntensity);
  const drop2 = hexToRgba(glowColor, 0.5  * glowIntensity);
  const drop3 = hexToRgba(glowColor, 0.28 * glowIntensity);

  return (
    <div
      className="t-letter-wrap"
      style={{
        transform: `scale(${scale})`,
        transition: 'transform 0.4s ease',
        animationDuration: `${rotateDuration}s, 6s`,
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
            <stop offset="0%"   stopColor={SVG_GRAD_BLUE.grad2[0]} />
            <stop offset="50%"  stopColor={SVG_GRAD_BLUE.grad2[1]} />
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
        {/* Top bar */}
        <rect x="0" y="0" width="178" height="35.6" rx="3"
          fill="url(#tGrad1)" filter="url(#tGlow)" />
        {/* Stem */}
        <rect x="74.8" y="35.6" width="49.8" height="162.4" rx="3"
          fill="url(#tGrad2)" filter="url(#tGlow)" />
        {/* Highlight bar */}
        <rect x="4" y="3" width="170" height="8.9" rx="2"
          fill="rgba(255,255,255,0.35)" />
        {/* Highlight stem */}
        <rect x="78.8" y="39.6" width="14.9" height="154.4" rx="2"
          fill="rgba(255,255,255,0.2)" />
      </svg>

      <style jsx>{`
        .t-letter-wrap {
          width: 100%;
          height: 100%;
          animation: rotateT linear infinite, float ease-in-out infinite;
          transform-style: preserve-3d;
        }
        .t-svg { display: block; }
      `}</style>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function TCore3D({ onHoverStart, onHoverEnd, onHoldStart }: TCore3DProps) {
  const viewportMode = useAppStore((s) => s.viewportMode);
  const tState = useAppStore((s) => s.tState);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = T_VISUAL_CONFIG[tState];
  const glow = config.glowColor;
  const ringBorder  = hexToRgba(glow, 0.4);
  const ringGlow    = hexToRgba(glow, 0.2);
  const ringInset   = hexToRgba(glow, 0.1);
  const orbitBorder = hexToRgba(glow, 0.6);
  const orbitGlow   = hexToRgba(glow, 0.3);
  const innerBg     = hexToRgba(glow, 0.2);

  const rotateDur = rotationDuration(config.rotationSpeed);
  const paused = config.rotationSpeed <= 0;

  const cancelHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  return (
    <div
      className="tcore-root"
      onMouseEnter={viewportMode === 'desktop' ? onHoverStart : undefined}
      onMouseLeave={viewportMode === 'desktop' ? onHoverEnd : undefined}
      onTouchStart={() => {
        if (viewportMode !== 'mobile') return;
        holdTimer.current = setTimeout(() => onHoldStart?.(), 500);
      }}
      onTouchEnd={cancelHold}
      onTouchCancel={cancelHold}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Outer static ring */}
      <div
        className="t-ring-outer"
        style={{
          borderColor: ringBorder,
          boxShadow: `0 0 18px ${ringGlow}, inset 0 0 18px ${ringInset}`,
          transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
        }}
      />
      {/* Orbital spinning ring */}
      <div
        className="t-ring-orbit"
        style={{
          borderColor: orbitBorder,
          boxShadow: `0 0 12px ${orbitGlow}`,
          transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
        }}
      />
      {/* Inner glow */}
      <div
        className="t-glow-inner"
        style={{
          background: `radial-gradient(circle, ${innerBg} 0%, transparent 70%)`,
          transition: 'background 0.5s ease',
        }}
      />

      {/* Audio aura: pulses to mic/speaker amplitude during listening and speaking */}
      <TAudioAura />

      {/* SVG T */}
      <div className="t-svg-container">
        <MetallicT
          rotateDuration={rotateDur}
          paused={paused}
          glowColor={glow}
          glowIntensity={config.glowIntensity}
          scale={config.scale}
        />
      </div>

      <style jsx>{`
        .tcore-root {
          --t: min(500px, calc(100vw - 40px));
          position: relative;
          width: var(--t);
          height: var(--t);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          flex-shrink: 0;
        }
        .t-svg-container {
          position: relative;
          width: calc(var(--t) * 0.40);
          height: calc(var(--t) * 0.44);
          z-index: 2;
          flex-shrink: 0;
        }
        .t-glow-inner {
          position: absolute;
          width: calc(var(--t) * 0.46);
          height: calc(var(--t) * 0.46);
          border-radius: 50%;
          animation: glow-pulse 4s ease-in-out infinite;
          pointer-events: none;
        }
        .t-ring-outer {
          position: absolute;
          width: calc(var(--t) * 0.64);
          height: calc(var(--t) * 0.64);
          border-radius: 50%;
          border: 1.5px solid;
          animation: glow-pulse 4s ease-in-out infinite 0.5s;
          pointer-events: none;
          transition: border-color 0.5s ease, box-shadow 0.5s ease;
        }
        .t-ring-orbit {
          position: absolute;
          width: calc(var(--t) * 0.64);
          height: calc(var(--t) * 0.64);
          border-radius: 50%;
          border: 1.5px solid;
          pointer-events: none;
          animation: spinRingY 14s linear infinite;
          transform-style: preserve-3d;
          transition: border-color 0.5s ease, box-shadow 0.5s ease;
        }
      `}</style>
    </div>
  );
}
