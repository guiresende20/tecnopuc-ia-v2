'use client';

import { useAppStore } from '@/store/appStore';
import type { TState } from '@/types/app.types';

const STATE_LABELS: Record<TState, string> = {
  idle:        'Assistente pronto',
  hover:       'Assistente pronto',
  listening:   'Ouvindo...',
  processing:  'Processando...',
  responding:  'Respondendo...',
  speaking:    'Falando...',
  stable:      'Assistente pronto',
  uncertainty: 'Aguardando...',
  error:       'Erro',
};

export function AssistantStatus() {
  const tState = useAppStore((s) => s.tState);
  const label = STATE_LABELS[tState];

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
