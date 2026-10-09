'use client';

import { useTranslations } from 'next-intl';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import { countCompleted, percentOf } from '@/lib/content-navigation';
import { ProgressBar } from './progress-bar';
import styles from './card-progress.module.css';

/** Reading progress for a group of lessons, read from localStorage after hydration. */
export function CardProgress({ slugs }: { slugs: string[] }) {
  const t = useTranslations('content.progress');
  const { isComplete } = useReadingProgress();
  const completed = countCompleted(slugs, isComplete);
  const total = slugs.length;

  if (total === 0) return null;

  return (
    <div className={styles.progress}>
      <ProgressBar
        value={completed}
        max={total}
        size="sm"
        tone={completed === total ? 'success' : 'accent'}
        label={t('label', { completed, total })}
      />
      <span className={styles.caption}>{t('percent', { percent: percentOf(completed, total) })}</span>
    </div>
  );
}
