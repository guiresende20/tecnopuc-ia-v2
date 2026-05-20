import { useEffect, useRef, useState } from 'react';

export interface TypewriterOptions {
  charsPerTick?: number;
  tickMs?: number;
  catchUpRate?: number;
  catchUpThreshold?: number;
}

export function useTypewriter(target: string, options: TypewriterOptions = {}): string {
  const {
    charsPerTick = 2,
    tickMs = 18,
    catchUpRate = 8,
    catchUpThreshold = 120,
  } = options;

  const [displayed, setDisplayed] = useState('');
  const displayedRef = useRef('');
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);

  useEffect(() => {
    if (!target.startsWith(displayedRef.current)) {
      displayedRef.current = '';
      setDisplayed('');
    }
  }, [target]);

  useEffect(() => {
    if (displayedRef.current.length >= target.length) return;

    const tick = (now: number) => {
      if (lastTickRef.current === 0) lastTickRef.current = now;

      if (now - lastTickRef.current >= tickMs) {
        lastTickRef.current = now;
        const current = displayedRef.current;
        const remaining = target.length - current.length;
        const rate = remaining > catchUpThreshold ? catchUpRate : charsPerTick;
        const nextLen = Math.min(target.length, current.length + rate);
        const next = target.slice(0, nextLen);
        displayedRef.current = next;
        setDisplayed(next);
      }

      if (displayedRef.current.length < target.length) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTickRef.current = 0;
    };
  }, [target, charsPerTick, tickMs, catchUpRate, catchUpThreshold]);

  return displayed;
}
