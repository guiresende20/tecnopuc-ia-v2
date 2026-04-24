'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/appStore';

const VOICES = ['Puck', 'Aoede', 'Charon', 'Kore', 'Fenrir'];

interface AudioSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AudioSettingsPanel({ isOpen, onClose }: AudioSettingsPanelProps) {
  const audio = useAppStore((s) => s.audio);
  const setMuted = useAppStore((s) => s.setMuted);

  // Por ora os ajustes são visuais — integração real vem na Fase 3
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          className="audio-panel"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          aria-label="Ajustes de áudio"
        >
          <div className="panel-header">
            <h2 className="panel-title">Ajustes de Voz</h2>
            <button className="panel-close" onClick={onClose} aria-label="Fechar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Mute toggle */}
          <div className="setting-row">
            <label className="setting-label">Fala do assistente</label>
            <button
              className={`toggle ${!audio.muted ? 'toggle--on' : ''}`}
              onClick={() => setMuted(!audio.muted)}
              role="switch"
              aria-checked={!audio.muted}
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          {/* Voz */}
          <div className="setting-group">
            <label className="setting-label">Voz</label>
            <div className="voice-grid">
              {VOICES.map((v) => (
                <button
                  key={v}
                  className={`voice-btn ${audio.voiceName === v ? 'voice-btn--active' : ''}`}
                  disabled
                  title="Disponível na Fase 3"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div className="setting-group">
            <label className="setting-label">Volume</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              defaultValue={audio.volume}
              className="range-input"
              disabled
            />
          </div>

          {/* Velocidade */}
          <div className="setting-group">
            <label className="setting-label">Velocidade</label>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              defaultValue={audio.playbackRate}
              className="range-input"
              disabled
            />
          </div>

          <p className="phase-note">Controles completos disponíveis na Fase 3.</p>

          <style jsx>{`
            .audio-panel {
              position: fixed;
              top: 56px;
              right: 0;
              bottom: 0;
              width: min(300px, 88vw);
              background: rgba(20, 10, 38, 0.96);
              border-left: 1px solid var(--surface-border);
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              z-index: 50;
              display: flex;
              flex-direction: column;
              gap: 20px;
              padding: 20px;
              overflow-y: auto;
            }
            .panel-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .panel-title {
              font-size: 0.95rem;
              font-weight: 700;
              color: var(--color-title-dark);
              font-family: 'Montserrat', sans-serif;
            }
            .panel-close {
              width: 32px;
              height: 32px;
              border-radius: 8px;
              border: 1px solid var(--surface-border);
              background: transparent;
              color: var(--color-gray);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: color 0.2s, background 0.2s;
            }
            .panel-close:hover {
              color: var(--color-title-dark);
              background: var(--surface-primary);
            }
            .setting-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .setting-group {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .setting-label {
              font-size: 0.78rem;
              color: var(--color-gray);
              font-family: 'Montserrat', sans-serif;
              font-weight: 500;
            }
            .toggle {
              width: 42px;
              height: 24px;
              border-radius: 12px;
              background: var(--surface-border);
              border: none;
              cursor: pointer;
              position: relative;
              transition: background 0.25s;
              padding: 0;
            }
            .toggle--on {
              background: var(--color-ocre);
            }
            .toggle-thumb {
              position: absolute;
              top: 3px;
              left: 3px;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #fff;
              transition: transform 0.25s;
            }
            .toggle--on .toggle-thumb {
              transform: translateX(18px);
            }
            .voice-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 6px;
            }
            .voice-btn {
              padding: 7px 4px;
              border-radius: 8px;
              border: 1px solid var(--surface-border);
              background: var(--surface-primary);
              color: var(--color-body-dark);
              font-family: 'Montserrat', sans-serif;
              font-size: 0.72rem;
              cursor: pointer;
              transition: border-color 0.2s, background 0.2s;
            }
            .voice-btn--active {
              border-color: var(--color-ocre);
              color: var(--color-ocre);
            }
            .voice-btn:disabled {
              opacity: 0.45;
              cursor: not-allowed;
            }
            .range-input {
              width: 100%;
              accent-color: var(--color-ocre);
              opacity: 0.4;
              cursor: not-allowed;
            }
            .phase-note {
              font-size: 0.65rem;
              color: var(--color-gray);
              font-family: 'Montserrat', sans-serif;
              text-align: center;
              opacity: 0.7;
              margin-top: auto;
            }
          `}</style>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
