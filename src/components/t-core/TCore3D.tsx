'use client';

import { useRef } from 'react';
import { useAppStore } from '@/store/appStore';

interface TCore3DProps {
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onHoldStart?: () => void;
  audioLevel?: number;
}

type Palette = 'blue' | 'purple';

const PALETTES = {
  blue: {
    grad1: ['#a8d4ff', '#ffffff', '#4aa8ff', '#cce8ff', '#0077dd', '#88ccff'],
    grad2: ['#66bbff', '#ffffff', '#2299ff'],
    glow:    'rgba(0,153,255,',
    glowAlt: 'rgba(0,200,255,',
    ring:    'rgba(0,200,255,',
    orbit:   'rgba(0,229,255,',
    drop1:   'rgba(0,153,255,0.9)',
    drop2:   'rgba(0,153,255,0.5)',
    drop3:   'rgba(0,200,255,0.3)',
  },
  purple: {
    grad1: ['#e9d5ff', '#ffffff', '#c084fc', '#f3e8ff', '#7c3aed', '#d8b4fe'],
    grad2: ['#c084fc', '#ffffff', '#a855f7'],
    glow:    'rgba(168,85,247,',
    glowAlt: 'rgba(196,132,252,',
    ring:    'rgba(192,132,252,',
    orbit:   'rgba(216,180,254,',
    drop1:   'rgba(168,85,247,0.9)',
    drop2:   'rgba(168,85,247,0.5)',
    drop3:   'rgba(196,132,252,0.3)',
  },
} as const;

function MetallicT({
  size = 198,
  rotationSpeed = 14,
  palette = 'blue',
}: {
  size?: number;
  rotationSpeed?: number;
  palette?: Palette;
}) {
  const p = PALETTES[palette];
  const w = size * 0.9;
  const h = size;
  const barH = h * 0.18;
  const barW = w;
  const stemW = w * 0.28;
  const stemH = h - barH;
  const stemX = (w - stemW) / 2;

  // Unique gradient IDs per palette to avoid SVG caching issues
  const g1 = `metalGrad-${palette}`;
  const g2 = `metalGrad2-${palette}`;
  const gf = `glow-${palette}`;

  return (
    <div
      className="t-letter-container"
      style={{ animationDuration: `${rotationSpeed}s, 6s` }}
    >
      <svg
        className="t-svg"
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{
          filter: `
            drop-shadow(0 0 20px ${p.drop1})
            drop-shadow(0 0 40px ${p.drop2})
            drop-shadow(0 0 80px ${p.drop3})
          `,
          transition: 'filter 0.6s ease',
        }}
      >
        <defs>
          <linearGradient id={g1} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={p.grad1[0]} />
            <stop offset="20%"  stopColor={p.grad1[1]} />
            <stop offset="40%"  stopColor={p.grad1[2]} />
            <stop offset="60%"  stopColor={p.grad1[3]} />
            <stop offset="80%"  stopColor={p.grad1[4]} />
            <stop offset="100%" stopColor={p.grad1[5]} />
          </linearGradient>
          <linearGradient id={g2} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={p.grad2[0]} />
            <stop offset="50%"  stopColor={p.grad2[1]} />
            <stop offset="100%" stopColor={p.grad2[2]} />
          </linearGradient>
          <filter id={gf}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Top bar */}
        <rect x="0" y="0" width={barW} height={barH} rx="3"
          fill={`url(#${g1})`} filter={`url(#${gf})`} />
        {/* Stem */}
        <rect x={stemX} y={barH} width={stemW} height={stemH} rx="3"
          fill={`url(#${g2})`} filter={`url(#${gf})`} />
        {/* Highlight on bar */}
        <rect x="4" y="3" width={barW - 8} height={barH * 0.25} rx="2"
          fill="rgba(255,255,255,0.35)" />
        {/* Highlight on stem */}
        <rect x={stemX + 3} y={barH + 4} width={stemW * 0.3} height={stemH - 8} rx="2"
          fill="rgba(255,255,255,0.2)" />
      </svg>

      <style jsx>{`
        .t-letter-container {
          animation: rotateT linear infinite, float ease-in-out infinite;
          transform-style: preserve-3d;
          position: relative;
          z-index: 2;
        }
        .t-svg { display: block; }
      `}</style>
    </div>
  );
}

export function TCore3D({
  onHoverStart,
  onHoverEnd,
  onHoldStart,
}: TCore3DProps) {
  const viewportMode = useAppStore((s) => s.viewportMode);
  const tState = useAppStore((s) => s.tState);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSpeaking = tState === 'speaking';
  const palette: Palette = isSpeaking ? 'purple' : 'blue';
  const p = PALETTES[palette];

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
        className="t-glow-ring-outer"
        style={{
          borderColor: `${p.ring}0.35)`,
          boxShadow: `0 0 18px ${p.ring}0.2), inset 0 0 18px ${p.ring}0.1)`,
          transition: 'border-color 0.6s ease, box-shadow 0.6s ease',
        }}
      />
      {/* Orbital spinning ring */}
      <div
        className="t-orbit-ring"
        style={{
          borderColor: `${p.orbit}0.55)`,
          boxShadow: `0 0 12px ${p.orbit}0.3)`,
          transition: 'border-color 0.6s ease, box-shadow 0.6s ease',
        }}
      />
      {/* Inner glow */}
      <div
        className="t-glow-ring"
        style={{
          background: `radial-gradient(circle, ${p.glow}0.25) 0%, transparent 70%)`,
          transition: 'background 0.6s ease',
        }}
      />
      {/* The T */}
      <MetallicT size={198} rotationSpeed={isSpeaking ? 6 : 14} palette={palette} />

      <style jsx>{`
        .tcore-root {
          position: relative;
          width: 500px;
          height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          flex-shrink: 0;
        }
        .t-glow-ring {
          position: absolute;
          width: 230px;
          height: 230px;
          border-radius: 50%;
          animation: glow-pulse 4s ease-in-out infinite;
          pointer-events: none;
        }
        .t-glow-ring-outer {
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          border: 1.5px solid;
          animation: glow-pulse 4s ease-in-out infinite 0.5s;
          pointer-events: none;
        }
        .t-orbit-ring {
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          border: 1.5px solid;
          pointer-events: none;
          animation: spinRingY 6s linear infinite;
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
}
