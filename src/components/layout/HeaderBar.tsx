'use client';

import { BrandBlock } from './BrandBlock';
import { AssistantStatus } from './AssistantStatus';
import { UtilityActions } from './UtilityActions';

interface HeaderBarProps {
  onClearConversation: () => void;
}

export function HeaderBar({ onClearConversation }: HeaderBarProps) {
  return (
    <header className="header-bar">
      <BrandBlock />
      <AssistantStatus />
      <UtilityActions onClearConversation={onClearConversation} />

      <style jsx>{`
        .header-bar {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 32px;
          border-bottom: 1px solid rgba(0,153,255,0.12);
          background: rgba(8,8,14,0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          flex-shrink: 0;
          animation: header-in 0.6s ease both;
        }
        @media (max-width: 600px) {
          .header-bar {
            padding: 12px 16px;
          }
        }
      `}</style>
    </header>
  );
}
