'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { RADIAL_ITEMS } from './radialMenu.config';
import type { RadialItem } from '@/types/app.types';

// Distance from T center to button edges
const H_GAP = 145; // px – left/right inner edge
const V_RADIUS = 210; // px – top/bottom

function getItemStyle(angle: number): React.CSSProperties {
  if (angle === 0) {
    return {
      position: 'absolute',
      left: `calc(50% + ${H_GAP}px)`,
      top: '50%',
      transform: 'translate(0, -50%)',
    };
  } else if (angle === 180) {
    return {
      position: 'absolute',
      left: `calc(50% - ${H_GAP}px)`,
      top: '50%',
      transform: 'translate(-100%, -50%)',
    };
  } else if (angle === -90) {
    return {
      position: 'absolute',
      left: '50%',
      top: `calc(50% - ${V_RADIUS}px)`,
      transform: 'translate(-50%, -100%)',
    };
  } else {
    return {
      position: 'absolute',
      left: '50%',
      top: `calc(50% + ${V_RADIUS}px)`,
      transform: 'translate(-50%, 0)',
    };
  }
}

const ANGLES = [-90, 0, 90, 180]; // top, right, bottom, left

export function TRadialMenu() {
  const radialOpen = useAppStore((s) => s.radialOpen);
  const setRadialOpen = useAppStore((s) => s.setRadialOpen);
  const setSelectedHub = useAppStore((s) => s.setSelectedHub);
  const togglePanel = useAppStore((s) => s.togglePanel);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!radialOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setRadialOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [radialOpen, setRadialOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRadialOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setRadialOpen]);

  const handleSelect = (item: RadialItem) => {
    setSelectedHub(item.id);
    togglePanel('hub');
    setRadialOpen(false);
  };

  return (
    <div
      ref={containerRef}
      aria-label="Menu de navegação"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: radialOpen ? 'all' : 'none',
        zIndex: 6,
      }}
    >
      {RADIAL_ITEMS.map((item, i) => (
        <div
          key={item.id}
          style={{
            ...getItemStyle(ANGLES[i]),
            opacity: radialOpen ? 1 : 0,
            transition: 'opacity 0.25s ease',
            pointerEvents: radialOpen ? 'all' : 'none',
          }}
        >
          <div style={{ animation: radialOpen ? `orbit-appear 0.3s ease ${i * 0.06}s both` : 'none' }}>
            <button
              className="orbit-btn"
              onClick={() => handleSelect(item)}
            >
              <span className="orbit-dot" />
              {item.label}
            </button>
          </div>
        </div>
      ))}

      <style jsx>{`
        .orbit-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border: 1px solid rgba(0,229,255,0.4);
          border-radius: 24px;
          background: rgba(8,12,24,0.85);
          backdrop-filter: blur(16px);
          color: #00e5ff;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.06em;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          box-shadow: 0 0 16px rgba(0,229,255,0.15), inset 0 0 12px rgba(0,229,255,0.05);
        }
        .orbit-btn:hover {
          background: rgba(0,200,255,0.12);
          border-color: #00e5ff;
          box-shadow: 0 0 24px rgba(0,229,255,0.35), inset 0 0 16px rgba(0,229,255,0.1);
          transform: scale(1.05);
        }
        .orbit-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #00e5ff;
          box-shadow: 0 0 6px #00e5ff;
          flex-shrink: 0;
          display: inline-block;
        }
      `}</style>
    </div>
  );
}
