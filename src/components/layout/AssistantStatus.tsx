'use client';

import { useAppStore } from '@/store/appStore';
import { useT } from '@/i18n';

export function AssistantStatus() {
  const tState = useAppStore((s) => s.tState);
  const t = useT();
  const label = t.status[tState];

  return (
    <div className="status-badge">
      <div className="status-dot" />
      <span className="status-label">{label}</span>

      <style jsx>{`
        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border: 1px solid rgba(0,229,255,0.2);
          border-radius: 20px;
          background: rgba(0,229,255,0.05);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.05em;
        }
        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00e5ff;
          animation: dot-pulse 2.5s ease-in-out infinite;
          flex-shrink: 0;
        }
        .status-label {
          color: #00e5ff;
          font-family: 'Space Grotesk', sans-serif;
        }
      `}</style>
    </div>
  );
}
