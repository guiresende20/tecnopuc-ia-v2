'use client';

import { BrandBlock } from './BrandBlock';
import { AssistantStatus } from './AssistantStatus';
import { UtilityActions } from './UtilityActions';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderBarProps {
  onClearConversation: () => void;
}

export function HeaderBar({ onClearConversation }: HeaderBarProps) {
  return (
    <header className="header-bar">
      <BrandBlock />
      <AssistantStatus />
      <div className="header-right">
        <LanguageSwitcher />
        <UtilityActions onClearConversation={onClearConversation} />
      </div>

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
        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        @media (max-width: 600px) {
          .header-bar {
            padding: 12px 16px;
          }
          .header-right {
            gap: 6px;
          }
        }
      `}</style>
    </header>
  );
}
