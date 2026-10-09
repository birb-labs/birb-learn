'use client';

import { Icon } from '@birb-learn/theme';
import { Link } from '@/i18n/navigation';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import styles from './lesson-complete.module.css';

/** Celebration card, shown once the reader has scrolled to the end of the lesson. */
export function LessonComplete({
  lessonSlug,
  labels,
}: {
  lessonSlug: string;
  labels: { title: string; text: string; simulado: string };
}) {
  const { isComplete } = useReadingProgress();

  if (!isComplete(lessonSlug)) return null;

  return (
    <aside className={styles.card} aria-live="polite">
      <span className={styles.badge} aria-hidden>
        <Icon name="party-popper" size={26} />
      </span>
      <div className={styles.text}>
        <h2 className={styles.title}>{labels.title}</h2>
        <p className={styles.description}>{labels.text}</p>
      </div>
      <Link href="/simulado" className={styles.action}>
        <Icon name="clipboard-list" size={16} aria-hidden />
        {labels.simulado}
      </Link>
    </aside>
  );
}
