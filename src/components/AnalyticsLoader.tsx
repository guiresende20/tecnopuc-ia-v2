'use client';

import { useEffect, useState } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { ANALYTICS_CONSENT_EVENT, readConsent, type ConsentValue } from './overlays/CookieBanner';

export function AnalyticsLoader() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const [consent, setConsent] = useState<ConsentValue | null>(null);

  useEffect(() => {
    setConsent(readConsent());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<ConsentValue>).detail;
      setConsent(detail);
    };
    window.addEventListener(ANALYTICS_CONSENT_EVENT, onChange);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, onChange);
  }, []);

  if (!gaId || consent !== 'granted') return null;
  return <GoogleAnalytics gaId={gaId} />;
}
