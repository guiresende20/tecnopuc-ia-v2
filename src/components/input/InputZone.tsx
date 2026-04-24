'use client';

import { TextInputDock } from './TextInputDock';
import { SuggestionChips } from './SuggestionChips';
import type { LiveChatStatus } from '@/lib/gemini-live';

interface InputZoneProps {
  onSend: (text: string) => void;
  onStop: () => void;
  disabled: boolean;
  showSuggestions: boolean;
  voiceStatus: LiveChatStatus;
  onVoiceToggle: () => void;
  onVoiceInterrupt: () => void;
}

export function InputZone({ onSend, onStop, disabled, showSuggestions, voiceStatus, onVoiceToggle, onVoiceInterrupt }: InputZoneProps) {
  return (
    <footer className="footer">
      {showSuggestions && (
        <SuggestionChips onSelect={onSend} disabled={disabled} />
      )}
      <TextInputDock
        onSend={onSend}
        onStop={onStop}
        disabled={disabled}
        voiceStatus={voiceStatus}
        onVoiceToggle={onVoiceToggle}
        onVoiceInterrupt={onVoiceInterrupt}
      />

      <style jsx>{`
        .footer {
          position: relative;
          z-index: 10;
          padding: 16px 32px 24px;
          background: rgba(8,8,14,0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(0,153,255,0.1);
          flex-shrink: 0;
          animation: footer-in 0.6s ease 0.2s both;
        }
        @media (max-width: 600px) {
          .footer {
            padding: 12px 16px 20px;
          }
        }
      `}</style>
    </footer>
  );
}
