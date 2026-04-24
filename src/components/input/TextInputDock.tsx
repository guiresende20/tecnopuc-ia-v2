'use client';

import { useRef, useCallback, KeyboardEvent } from 'react';
import { useAppStore } from '@/store/appStore';
import type { LiveChatStatus } from '@/lib/gemini-live';

interface TextInputDockProps {
  onSend: (text: string) => void;
  onStop: () => void;
  disabled: boolean;
  voiceStatus: LiveChatStatus;
  onVoiceToggle: () => void;
  onVoiceInterrupt: () => void;
}

const VOICE_LABEL: Partial<Record<LiveChatStatus, string>> = {
  connecting: 'Conectando...',
  connected:  'Conectado',
  listening:  'Ouvindo...',
  speaking:   'Falando...',
  error:      'Erro de voz',
};

export function TextInputDock({ onSend, onStop, disabled, voiceStatus, onVoiceToggle, onVoiceInterrupt }: TextInputDockProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const value = useAppStore((s) => s.input.value);
  const submitting = useAppStore((s) => s.input.submitting);
  const setInputValue = useAppStore((s) => s.setInputValue);
  const setTState = useAppStore((s) => s.setTState);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInputValue('');
  }, [value, disabled, onSend, setInputValue]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFocus = () => setTState('hover');

  const isStopMode = disabled && submitting;
  const canSend = value.trim().length > 0 && !disabled;

  const voiceActive = voiceStatus !== 'disconnected' && voiceStatus !== 'error';
  const voiceConnecting = voiceStatus === 'connecting';
  const voiceLabel = VOICE_LABEL[voiceStatus];

  return (
    <div className="input-row">
      <div className="input-field-wrap">
        <input
          ref={inputRef}
          className="input-field"
          placeholder={voiceActive ? 'Modo voz ativo — fale ao microfone...' : 'Pergunte sobre o TecnoPUC...'}
          value={value}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          disabled={disabled || voiceActive}
          aria-label="Campo de mensagem"
        />

        {/* Mic button — inside the input field */}
        <button
          className={`input-mic-btn ${voiceActive ? 'voice-active' : ''} ${voiceStatus === 'listening' ? 'listening' : ''} ${voiceStatus === 'speaking' ? 'speaking' : ''}`}
          onClick={onVoiceToggle}
          disabled={voiceConnecting}
          title={voiceActive ? 'Encerrar conversa por voz' : 'Iniciar conversa por voz'}
          aria-label={voiceActive ? 'Encerrar voz' : 'Ativar voz'}
        >
          {voiceActive ? (
            /* Stop icon when active */
            <svg width="20" height="20" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="10" height="10" rx="2" />
            </svg>
          ) : (
            /* Mic icon when idle */
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="9" y="2" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8" />
            </svg>
          )}
        </button>
      </div>

      {/* Voice status pill — shown when voice is active */}
      {voiceLabel && voiceStatus !== 'speaking' && (
        <div className={`voice-pill ${voiceStatus}`}>
          <span className="voice-dot" />
          {voiceLabel}
        </div>
      )}

      {/* Interrupt speech button — shown while the AI is speaking */}
      {voiceStatus === 'speaking' && (
        <button
          onClick={onVoiceInterrupt}
          className="interrupt-btn"
          aria-label="Interromper fala do assistente"
          title="Interromper fala"
        >
          <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <rect x="1" y="1" width="10" height="10" rx="2" />
          </svg>
          <span>Interromper</span>
        </button>
      )}

      {/* Send / Stop button */}
      {!voiceActive && (
        isStopMode ? (
          <button onClick={onStop} className="send-btn send-btn--stop" aria-label="Parar geração" title="Interromper">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="10" height="10" rx="2" />
            </svg>
          </button>
        ) : (
          <button onClick={handleSend} disabled={!canSend} className="send-btn" aria-label="Enviar mensagem">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        )
      )}

      <style jsx>{`
        .input-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .input-field-wrap {
          flex: 1;
          position: relative;
        }
        .input-field {
          width: 100%;
          padding: 13px 56px 13px 20px;
          border: 1px solid rgba(0,153,255,0.25);
          border-radius: 14px;
          background: rgba(10,15,30,0.8);
          color: #e8f4ff;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14.5px;
          font-weight: 400;
          outline: none;
          transition: all 0.25s;
          backdrop-filter: blur(10px);
        }
        .input-field::placeholder { color: rgba(200,220,255,0.45); }
        .input-field:focus {
          border-color: rgba(0,153,255,0.6);
          background: rgba(10,18,36,0.9);
          box-shadow: 0 0 0 3px rgba(0,153,255,0.1), 0 0 24px rgba(0,153,255,0.12);
        }
        .input-field:disabled { opacity: 0.6; cursor: not-allowed; }

        /* --- Mic button --- */
        .input-mic-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(200,220,255,0.45);
          cursor: pointer;
          transition: color 0.2s, transform 0.2s;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .input-mic-btn:hover:not(:disabled) { color: #0099ff; }
        .input-mic-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Active states */
        .input-mic-btn.voice-active {
          color: #ef4444;
          background: rgba(239,68,68,0.12);
        }
        .input-mic-btn.voice-active:hover:not(:disabled) {
          color: #ff6b6b;
          background: rgba(239,68,68,0.22);
        }
        .input-mic-btn.listening {
          color: #00e5ff;
          background: rgba(0,229,255,0.1);
          animation: mic-pulse 1.4s ease-in-out infinite;
        }
        .input-mic-btn.speaking {
          color: #a855f7;
          background: rgba(168,85,247,0.1);
        }

        @keyframes mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,229,255,0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(0,229,255,0); }
        }

        /* --- Voice status pill --- */
        .voice-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: 0.06em;
          white-space: nowrap;
          border: 1px solid;
          transition: all 0.3s;
        }
        .voice-pill.connecting {
          color: rgba(200,220,255,0.6);
          border-color: rgba(200,220,255,0.2);
          background: rgba(10,15,30,0.6);
        }
        .voice-pill.connected,
        .voice-pill.listening {
          color: #00e5ff;
          border-color: rgba(0,229,255,0.3);
          background: rgba(0,229,255,0.08);
        }
        .voice-pill.speaking {
          color: #a855f7;
          border-color: rgba(168,85,247,0.3);
          background: rgba(168,85,247,0.08);
        }
        .voice-pill.error {
          color: #ef4444;
          border-color: rgba(239,68,68,0.3);
          background: rgba(239,68,68,0.08);
        }

        .voice-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }
        .voice-pill.listening .voice-dot,
        .voice-pill.speaking .voice-dot {
          animation: dot-blink 1s ease-in-out infinite;
        }
        @keyframes dot-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }

        /* --- Interrupt button --- */
        .interrupt-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          white-space: nowrap;
          color: #a855f7;
          border: 1px solid rgba(168,85,247,0.45);
          background: rgba(168,85,247,0.1);
          cursor: pointer;
          transition: all 0.2s;
          animation: interrupt-pulse 1.6s ease-in-out infinite;
        }
        .interrupt-btn:hover {
          color: #fff;
          background: rgba(168,85,247,0.35);
          border-color: rgba(168,85,247,0.8);
          box-shadow: 0 0 18px rgba(168,85,247,0.35);
        }
        @keyframes interrupt-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(168,85,247,0.35); }
          50%       { box-shadow: 0 0 0 6px rgba(168,85,247,0); }
        }

        /* --- Send button --- */
        .send-btn {
          width: 48px;
          height: 48px;
          border: 1px solid rgba(0,153,255,0.4);
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(0,100,220,0.3), rgba(0,60,180,0.2));
          color: #0099ff;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .send-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(0,153,255,0.4), rgba(0,100,255,0.3));
          box-shadow: 0 0 20px rgba(0,153,255,0.4);
          border-color: #0099ff;
          transform: scale(1.05);
        }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .send-btn--stop {
          background: rgba(239,68,68,0.3);
          border-color: rgba(239,68,68,0.5);
          color: #ef4444;
        }
        .send-btn--stop:hover { background: rgba(239,68,68,0.4); }
      `}</style>
    </div>
  );
}
