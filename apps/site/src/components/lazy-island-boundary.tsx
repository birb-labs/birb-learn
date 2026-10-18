'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import styles from './lazy-island-boundary.module.css';

interface FailureBoundaryProps {
  /** What to show instead of the children once one of them throws. */
  fallback: (retry: () => void) => ReactNode;
  onRetry: () => void;
  children: ReactNode;
}

/** A plain error boundary: a failed lazy import throws while rendering, and without this it replaces the whole page. */
class FailureBoundary extends Component<FailureBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // React already reports the error to the console; nothing else to do with it.
  }

  private retry = () => {
    this.props.onRetry();
    this.setState({ failed: false });
  };

  render() {
    return this.state.failed ? this.props.fallback(this.retry) : this.props.children;
  }
}

export interface LazyIslandBoundaryProps {
  /** Forgets the failed load (a `createRetryableLazy` component's `reset`); called before the children are mounted again. */
  onRetry: () => void;
  /** Kept on screen above the message, e.g. the exercise prompt, which does not need the island. */
  context?: ReactNode;
  children: ReactNode;
}

/**
 * Wraps a lazily loaded island. If its chunk cannot be fetched (offline, or a
 * tab left open across a deploy) only the island is replaced by a message and a
 * Retry button; the rest of the page, and any answers held above it, stay.
 */
export function LazyIslandBoundary({ onRetry, context, children }: LazyIslandBoundaryProps) {
  const t = useTranslations('code.run');
  return (
    <FailureBoundary
      onRetry={onRetry}
      fallback={(retry) => (
        <div className={styles.failure}>
          {context}
          <p role="alert" className={styles.message}>
            {t('unavailable.engine_load')}
          </p>
          <button type="button" className={styles.button} onClick={retry}>
            {t('retry')}
          </button>
        </div>
      )}
    >
      {children}
    </FailureBoundary>
  );
}
