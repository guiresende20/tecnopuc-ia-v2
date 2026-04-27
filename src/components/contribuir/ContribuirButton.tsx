'use client';

// Botão fixo no canto inferior direito que abre o ContribuirLayer.
// Visual alinhado com a paleta do projeto (#0099ff, glass effect, Space Grotesk).

interface Props {
  onClick: () => void;
}

export function ContribuirButton({ onClick }: Props) {
  return (
    <button className="contribuir-btn" onClick={onClick} type="button" aria-label="Contribuir com a base">
      <svg
        className="contribuir-btn-icon"
        width="13"
        height="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
      <span>Contribuir</span>

      <style jsx>{`
        .contribuir-btn {
          position: fixed;
          bottom: 92px;
          right: 16px;
          z-index: 20;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(6, 10, 22, 0.85);
          border: 1px solid rgba(0, 153, 255, 0.3);
          color: rgba(200, 220, 255, 0.7);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          cursor: pointer;
          transition: color 0.2s, background 0.2s, border-color 0.2s, box-shadow 0.2s;
        }
        .contribuir-btn:hover {
          color: #0099ff;
          border-color: rgba(0, 153, 255, 0.6);
          background: rgba(0, 153, 255, 0.1);
          box-shadow: 0 0 16px rgba(0, 153, 255, 0.2);
        }
        .contribuir-btn-icon {
          flex-shrink: 0;
        }
        @media (max-width: 600px) {
          .contribuir-btn {
            bottom: 78px;
            right: 8px;
            font-size: 10px;
            padding: 7px 12px;
            letter-spacing: 0.08em;
          }
        }
      `}</style>
    </button>
  );
}
