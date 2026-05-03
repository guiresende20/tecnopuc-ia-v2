'use client';

import { Component, Suspense, useRef, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { useAppStore } from '@/store/appStore';
import { T_VISUAL_CONFIG } from './TStateMachine';
import { TAudioAura } from './TAudioAura';
import { TCoreFallback, hexToRgba } from './TCoreFallback';
import { TMesh } from './TMesh';
import type { TState } from '@/types/app.types';

interface TCore3DProps {
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onHoldStart?: () => void;
}

class GlbErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error('[TCore3D] Falha ao carregar GLB, usando fallback SVG:', error);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function FallbackOverlay({ state }: { state: TState }) {
  return (
    <div className="t-svg-container">
      <TCoreFallback state={state} />
      <style jsx>{`
        .t-svg-container {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
      `}</style>
    </div>
  );
}

export function TCore3D({ onHoverStart, onHoverEnd, onHoldStart }: TCore3DProps) {
  const viewportMode = useAppStore((s) => s.viewportMode);
  const tState = useAppStore((s) => s.tState);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = T_VISUAL_CONFIG[tState];
  const glow = config.glowColor;
  const ringBorder = hexToRgba(glow, 0.4);
  const ringGlow = hexToRgba(glow, 0.2);
  const ringInset = hexToRgba(glow, 0.1);
  const orbitBorder = hexToRgba(glow, 0.6);
  const orbitGlow = hexToRgba(glow, 0.3);
  const innerBg = hexToRgba(glow, 0.2);

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
      <div
        className="t-ring-outer"
        style={{
          borderColor: ringBorder,
          boxShadow: `0 0 18px ${ringGlow}, inset 0 0 18px ${ringInset}`,
          transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
        }}
      />
      <div
        className="t-ring-orbit"
        style={{
          borderColor: orbitBorder,
          boxShadow: `0 0 12px ${orbitGlow}`,
          transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
        }}
      />
      <div
        className="t-glow-inner"
        style={{
          background: `radial-gradient(circle, ${innerBg} 0%, transparent 70%)`,
          transition: 'background 0.5s ease',
        }}
      />

      <TAudioAura />

      <div
        className="t-3d-container"
        style={{
          filter: `drop-shadow(0 0 24px ${hexToRgba(glow, 0.55 * config.glowIntensity)})`,
          transition: 'filter 0.5s ease',
        }}
      >
        <GlbErrorBoundary fallback={<FallbackOverlay state={tState} />}>
          <Suspense fallback={<FallbackOverlay state={tState} />}>
            <Canvas
              camera={{ position: [0, 0, 2.5], fov: 35 }}
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
              style={{ background: 'transparent' }}
            >
              <ambientLight intensity={0.7} />
              <directionalLight position={[3, 4, 5]} intensity={1.4} />
              <directionalLight position={[-3, -2, 2]} intensity={0.5} color="#88ccff" />
              <pointLight position={[0, 0, 3]} intensity={0.6} color={glow} />
              <TMesh state={tState} />
            </Canvas>
          </Suspense>
        </GlbErrorBoundary>
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
        .t-3d-container {
          position: relative;
          width: 100%;
          height: 100%;
          z-index: 2;
        }
        .t-glow-inner {
          position: absolute;
          inset: 0;
          margin: auto;
          width: calc(var(--t) * 0.552);
          height: calc(var(--t) * 0.552);
          border-radius: 50%;
          animation: glow-pulse 4s ease-in-out infinite;
          pointer-events: none;
        }
        .t-ring-outer {
          position: absolute;
          inset: 0;
          margin: auto;
          width: calc(var(--t) * 0.768);
          height: calc(var(--t) * 0.768);
          border-radius: 50%;
          border: 1.5px solid;
          animation: glow-pulse 4s ease-in-out infinite 0.5s;
          pointer-events: none;
          transition: border-color 0.5s ease, box-shadow 0.5s ease;
        }
        .t-ring-orbit {
          position: absolute;
          inset: 0;
          margin: auto;
          width: calc(var(--t) * 0.768);
          height: calc(var(--t) * 0.768);
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
