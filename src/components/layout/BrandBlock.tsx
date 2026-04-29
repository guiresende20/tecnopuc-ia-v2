'use client';

import { useT } from '@/i18n';

export function BrandBlock() {
  const t = useT();
  return (
    <div className="brand-block">
      <div className="logo-mark">T</div>
      <div className="brand-text">
        <div className="brand-name">TecnoPUC</div>
        <div className="brand-sub">{t.header.brandSub}</div>
      </div>

      <style jsx>{`
        .brand-block {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-mark {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #0099ff;
          border-radius: 6px;
          font-weight: 700;
          font-size: 16px;
          color: #0099ff;
          box-shadow: 0 0 12px rgba(0,153,255,0.3), inset 0 0 8px rgba(0,153,255,0.1);
          font-family: 'Space Grotesk', sans-serif;
        }
        .brand-text {
          display: flex;
          flex-direction: column;
        }
        .brand-name {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #e8f4ff;
          font-family: 'Space Grotesk', sans-serif;
          line-height: 1;
        }
        .brand-sub {
          font-size: 11px;
          color: rgba(200,220,255,0.45);
          font-weight: 400;
          letter-spacing: 0.15em;
          margin-top: 2px;
          font-family: 'Space Grotesk', sans-serif;
          line-height: 1;
        }
      `}</style>
    </div>
  );
}
