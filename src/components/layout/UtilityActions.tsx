'use client';

import { useAppStore } from '@/store/appStore';
import { useT } from '@/i18n';

interface UtilityActionsProps {
  onClearConversation: () => void;
}

export function UtilityActions({ onClearConversation }: UtilityActionsProps) {
  const muted = useAppStore((s) => s.audio.muted);
  const setMuted = useAppStore((s) => s.setMuted);
  const t = useT();

  return (
    <div className="utility-actions">
      {/* Limpar conversa */}
      <button className="icon-btn" onClick={onClearConversation} title={t.header.clearConversation}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
      </button>

      {/* Mute/Unmute */}
      <button className="icon-btn" onClick={() => setMuted(!muted)} title={muted ? t.header.enableVoice : t.header.muteVoice}>
        {muted ? (
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
          </svg>
        ) : (
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>

      <style jsx>{`
        .utility-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .icon-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0,153,255,0.2);
          border-radius: 8px;
          background: rgba(0,153,255,0.06);
          color: rgba(200,220,255,0.45);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 15px;
        }
        .icon-btn:hover {
          border-color: rgba(0,153,255,0.5);
          background: rgba(0,153,255,0.12);
          color: #0099ff;
          box-shadow: 0 0 12px rgba(0,153,255,0.2);
        }
      `}</style>
    </div>
  );
}
