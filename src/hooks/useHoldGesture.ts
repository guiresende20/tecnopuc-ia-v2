'use client';

import { useRef, useCallback } from 'react';

const HOLD_DURATION = 500; // ms

export function useHoldGesture(onHold: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    timerRef.current = setTimeout(onHold, HOLD_DURATION);
  }, [onHold]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}
