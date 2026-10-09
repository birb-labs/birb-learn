'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import styles from './reveal.module.css';

/**
 * Fades and lifts its children into view the first time they scroll on
 * screen. The hidden starting state is only applied after hydration, so
 * server-rendered content stays visible without JavaScript.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className,
}: {
  children: ReactNode;
  /** Stagger offset in milliseconds. */
  delay?: number;
  as?: 'div' | 'li' | 'section' | 'article';
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<'ssr' | 'hidden' | 'visible'>('ssr');

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || typeof IntersectionObserver === 'undefined') {
      setState('visible');
      return;
    }
    const rect = element.getBoundingClientRect();
    // Already on screen at load: skip the hidden state so there is no flicker.
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setState('visible');
      return;
    }
    setState('hidden');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setState('visible');
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const classes = [styles.reveal, state === 'hidden' ? styles.hidden : '', state === 'visible' ? styles.visible : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <Tag
      ref={ref as never}
      className={classes}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
