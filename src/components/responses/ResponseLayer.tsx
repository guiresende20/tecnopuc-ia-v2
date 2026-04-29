'use client';

import { useRef, useEffect, useState } from 'react';
import { ResponseFocusCard } from './ResponseFocusCard';
import type { ResponseNode } from '@/types/app.types';
import { useT } from '@/i18n';

interface ResponseLayerProps {
  responses: ResponseNode[];
  userMessages: { id: string; content: string }[];
  isStreaming: boolean;
  streamingText: string;
  onClose: () => void;
}

function ThinkingDots() {
  return (
    <div className="thinking">
      <span /><span /><span />
      <style jsx>{`
        .thinking { display: flex; align-items: center; gap: 5px; padding: 4px 0; }
        .thinking span {
          display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #0099ff;
        }
        .thinking span:nth-child(1) { animation: thinking-dot 1.2s ease-in-out infinite 0s; }
        .thinking span:nth-child(2) { animation: thinking-dot 1.2s ease-in-out infinite 0.2s; }
        .thinking span:nth-child(3) { animation: thinking-dot 1.2s ease-in-out infinite 0.4s; }
      `}</style>
    </div>
  );
}

export function ResponseLayer({ responses, userMessages, isStreaming, streamingText, onClose }: ResponseLayerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const t = useT();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [responses, streamingText, isStreaming]);

  const turns = Math.max(userMessages.length, responses.length);

  const handleCopyAll = async () => {
    const lines: string[] = [];
    for (let i = 0; i < turns; i++) {
      if (userMessages[i]) lines.push(`${t.response.userPrefix}: ${userMessages[i].content}`);
      if (responses[i]?.body) lines.push(`${t.response.assistantPrefix}: ${responses[i].body}`);
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  return (
    <div className="response-card">
      {/* Header */}
      <div className="chat-header">
        <div className="response-label">
          <div className="response-label-dot" />
          {t.response.assistantBadge}
        </div>
        <div className="header-actions">
          {/* Copiar conversa */}
          <button className="action-btn" onClick={handleCopyAll} title={t.response.copyConversationTitle} disabled={isStreaming}>
            {copied ? (
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
          {/* Fechar */}
          <button className="action-btn close-btn" onClick={onClose} title={t.response.closeTitle}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {Array.from({ length: turns }).map((_, i) => (
          <div key={i} className="turn">
            {userMessages[i] && (
              <div className="chat-msg user">
                <div className="chat-bubble user-bubble">{userMessages[i].content}</div>
              </div>
            )}
            {responses[i] && (
              <div className="chat-msg assistant">
                <ResponseFocusCard node={responses[i]} />
              </div>
            )}
            {i === turns - 1 && isStreaming && !responses[i] && (
              <div className="chat-msg assistant">
                {streamingText ? (
                  <ResponseFocusCard
                    node={{ id: 'streaming', origin: 'text', type: 'primary' }}
                    isStreaming
                    streamingText={streamingText}
                  />
                ) : (
                  <div className="chat-bubble assistant-bubble"><ThinkingDots /></div>
                )}
              </div>
            )}
          </div>
        ))}
        {isStreaming && turns === 0 && (
          <div className="chat-msg assistant">
            <div className="chat-bubble assistant-bubble"><ThinkingDots /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <style jsx>{`
        .response-card {
          background: rgba(6,10,22,0.96);
          border: 1px solid rgba(0,153,255,0.45);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          max-height: 420px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 8px 40px rgba(0,0,0,0.6), 0 0 30px rgba(0,100,255,0.1);
          animation: card-appear 0.4s cubic-bezier(0.16,1,0.3,1) both;
          overflow: hidden;
        }
        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px 10px;
          border-bottom: 1px solid rgba(0,153,255,0.15);
          flex-shrink: 0;
        }
        .response-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0099ff;
          font-family: 'Space Grotesk', sans-serif;
        }
        .response-label-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0099ff;
          box-shadow: 0 0 6px #0099ff;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .action-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0,153,255,0.2);
          border-radius: 6px;
          background: transparent;
          color: rgba(200,220,255,0.45);
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn:hover:not(:disabled) {
          border-color: rgba(0,153,255,0.5);
          background: rgba(0,153,255,0.1);
          color: #0099ff;
        }
        .action-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .close-btn:hover:not(:disabled) {
          border-color: rgba(239,68,68,0.5);
          background: rgba(239,68,68,0.1);
          color: #ef4444;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 14px 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,153,255,0.2) transparent;
        }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: rgba(0,153,255,0.25); border-radius: 2px; }
        .turn { display: flex; flex-direction: column; gap: 8px; }
        .chat-msg { display: flex; flex-direction: column; }
        .chat-msg.user { align-items: flex-end; }
        .chat-msg.assistant { align-items: flex-start; }
        .chat-bubble {
          max-width: 85%;
          padding: 9px 14px;
          border-radius: 12px;
          font-size: 13.5px;
          line-height: 1.6;
          font-family: 'Space Grotesk', sans-serif;
        }
        .user-bubble {
          background: rgba(0,120,255,0.2);
          border: 1px solid rgba(0,153,255,0.3);
          color: rgba(200,230,255,0.95);
          border-bottom-right-radius: 4px;
        }
        .assistant-bubble {
          background: rgba(10,16,36,0.8);
          border: 1px solid rgba(0,153,255,0.15);
          color: rgba(220,235,255,0.9);
          border-bottom-left-radius: 4px;
        }
      `}</style>
    </div>
  );
}
