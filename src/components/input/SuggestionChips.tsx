'use client';

const SUGGESTIONS = [
  'O que é o TecnoPUC?',
  'Quais são os hubs?',
  'Como participar?',
];

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
  disabled: boolean;
}

export function SuggestionChips({ onSelect, disabled }: SuggestionChipsProps) {
  return (
    <div className="chips-row">
      {SUGGESTIONS.map((s, i) => (
        <button
          key={s}
          className="chip"
          onClick={() => onSelect(s)}
          disabled={disabled}
          style={{ animationDelay: `${0.3 + i * 0.1}s` }}
        >
          {s}
        </button>
      ))}

      <style jsx>{`
        .chips-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .chip {
          padding: 6px 14px;
          border: 1px solid rgba(0,153,255,0.25);
          border-radius: 20px;
          background: rgba(0,153,255,0.06);
          color: rgba(180,210,255,0.8);
          font-size: 12.5px;
          font-weight: 400;
          font-family: 'Space Grotesk', sans-serif;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          animation: chip-fade-in 0.5s ease both;
        }
        .chip:hover:not(:disabled) {
          border-color: rgba(0,153,255,0.6);
          background: rgba(0,153,255,0.12);
          color: #e8f4ff;
          box-shadow: 0 0 14px rgba(0,153,255,0.2);
        }
        .chip:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
