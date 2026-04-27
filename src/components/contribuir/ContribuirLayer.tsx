'use client';

// Layer modal que hospeda o ContribuirForm.
// Visual replica o ResponseLayer (mesma card, header, paleta blue/dark).
// Fecha com Escape, click no backdrop, ou no botão X.

import { useEffect } from 'react';
import { ContribuirForm } from './ContribuirForm';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ContribuirLayer({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Trava o scroll do body quando aberto
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="contrib-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Contribuir com a base"
    >
      <div className="contrib-card" onClick={(e) => e.stopPropagation()}>
        <div className="contrib-header">
          <div className="contrib-label">
            <div className="contrib-label-dot" />
            Contribuir com a base
          </div>
          <button className="contrib-action-btn close-btn" onClick={onClose} title="Fechar (Esc)">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="contrib-body">
          <p className="contrib-intro">
            Compartilhe um conhecimento sobre o TecnoPUC. Toda contribuição passa
            por validação de e-mail e revisão de um administrador antes de entrar
            na base de conhecimento.
          </p>
          <ContribuirForm />
        </div>
      </div>

      <style jsx>{`
        .contrib-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(2, 6, 14, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: contrib-backdrop-in 0.2s ease both;
        }
        .contrib-card {
          width: min(680px, 100%);
          max-height: min(720px, 90vh);
          background: rgba(6, 10, 22, 0.96);
          border: 1px solid rgba(0, 153, 255, 0.45);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 100, 255, 0.1);
          animation: contrib-card-appear 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
          overflow: hidden;
        }
        .contrib-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px 10px;
          border-bottom: 1px solid rgba(0, 153, 255, 0.15);
          flex-shrink: 0;
        }
        .contrib-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0099ff;
        }
        .contrib-label-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0099ff;
          box-shadow: 0 0 6px #0099ff;
        }
        .contrib-action-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0, 153, 255, 0.2);
          border-radius: 6px;
          background: transparent;
          color: rgba(200, 220, 255, 0.45);
          cursor: pointer;
          transition: all 0.2s;
        }
        .contrib-action-btn.close-btn:hover {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        .contrib-body {
          padding: 18px 20px 22px;
          overflow-y: auto;
          flex: 1;
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 153, 255, 0.25) transparent;
        }
        .contrib-body::-webkit-scrollbar {
          width: 4px;
        }
        .contrib-body::-webkit-scrollbar-track {
          background: transparent;
        }
        .contrib-body::-webkit-scrollbar-thumb {
          background: rgba(0, 153, 255, 0.25);
          border-radius: 2px;
        }
        .contrib-intro {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13px;
          line-height: 1.6;
          color: rgba(200, 220, 255, 0.65);
          margin: 0 0 18px;
        }
        @keyframes contrib-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes contrib-card-appear {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 600px) {
          .contrib-backdrop {
            padding: 12px;
          }
          .contrib-card {
            max-height: 95vh;
          }
          .contrib-body {
            padding: 14px 16px 18px;
          }
        }
      `}</style>
    </div>
  );
}
