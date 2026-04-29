'use client';

import { useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ResponseNode } from '@/types/app.types';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useT } from '@/i18n';

const markdownComponents: Components = {
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

interface ResponseFocusCardProps {
  node: ResponseNode;
  isStreaming?: boolean;
  streamingText?: string;
}

export function ResponseFocusCard({ node, isStreaming, streamingText }: ResponseFocusCardProps) {
  const [copied, setCopied] = useState(false);
  const t = useT();

  const target = isStreaming ? streamingText ?? '' : node.body ?? '';
  const displayed = useTypewriter(target);
  const isRevealing = displayed.length < target.length;
  const showCursor = isStreaming || isRevealing;
  const showActions = !isStreaming && !isRevealing;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(node.body ?? target);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent fallback */ }
  };

  return (
    <div className="focus-card">
      <div className="focus-card-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{displayed}</ReactMarkdown>
        {showCursor && <span className="cursor-blink" aria-hidden="true" />}
      </div>

      {showActions && (
        <div className="focus-card-actions">
          <button onClick={handleCopy} className="action-btn" title={t.response.copyAnswerTitle}>
            {copied ? (
              <>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t.response.copied}
              </>
            ) : (
              <>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {t.response.copy}
              </>
            )}
          </button>
        </div>
      )}

      <style jsx>{`
        .focus-card {
          width: 100%;
        }
        .focus-card-body {
          font-size: 13.5px;
          line-height: 1.7;
          color: rgba(220,235,255,0.9);
          font-family: 'Space Grotesk', sans-serif;
        }
        .focus-card-body :global(p) { margin-bottom: 0.5em; }
        .focus-card-body :global(strong) { color: #e8f4ff; }
        .focus-card-body :global(ul), .focus-card-body :global(ol) { padding-left: 1.2rem; margin: 0.4rem 0; }
        .focus-card-body :global(li) { margin: 0.2rem 0; }
        .focus-card-body :global(code) {
          background: rgba(0,153,255,0.12);
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 0.85em;
        }
        .focus-card-body :global(a) {
          color: #0099ff;
          text-decoration: underline;
          text-decoration-color: rgba(0,153,255,0.4);
          text-underline-offset: 2px;
          transition: color 0.2s, text-decoration-color 0.2s;
        }
        .focus-card-body :global(a:hover) {
          color: #33bbff;
          text-decoration-color: rgba(51,187,255,0.7);
        }
        .cursor-blink {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: #00e5ff;
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: blink 1s step-end infinite;
        }
        .focus-card-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
        }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
          color: rgba(200,220,255,0.4);
          font-size: 11px;
          font-family: 'Space Grotesk', sans-serif;
          transition: color 0.2s;
        }
        .action-btn:hover { color: rgba(200,220,255,0.8); }
      `}</style>
    </div>
  );
}
