'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';

const MOBILE_BREAKPOINT = 768;

export function useViewportMode() {
  const setViewportMode = useAppStore((s) => s.setViewportMode);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setViewportMode(e.matches ? 'mobile' : 'desktop');
    };

    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [setViewportMode]);
}
