import { getTranslations } from 'next-intl/server';
import { Icon } from '@birb-learn/theme';
import { Link } from '@/i18n/navigation';
import { LessonComplete } from './lesson-complete';
import { ReadingProgressTracker } from './reading-progress-tracker';
import type { LessonLink } from './lesson-shell';
import styles from './lesson-footer.module.css';

export async function LessonFooter({
  lessonSlug,
  previousLesson,
  nextLesson,
}: {
  lessonSlug: string;
  previousLesson?: LessonLink;
  nextLesson?: LessonLink;
}) {
  const t = await getTranslations('content.lesson');

  return (
    <footer className={styles.footer}>
      <ReadingProgressTracker lessonSlug={lessonSlug} />
      <LessonComplete
        lessonSlug={lessonSlug}
        labels={{ title: t('completeTitle'), text: t('completeText'), simulado: t('takeSimulado') }}
      />
      <nav className={styles.pager} aria-label={t('courseOutline')}>
        {previousLesson ? (
          <Link href={previousLesson.href} className={styles.card} data-direction="previous">
            <Icon name="arrow-left" size={20} aria-hidden className={styles.arrow} />
            <span className={styles.cardText}>
              <span className={styles.cardLabel}>{t('previousLesson')}</span>
              <span className={styles.cardTitle}>{previousLesson.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {nextLesson ? (
          <Link href={nextLesson.href} className={styles.card} data-direction="next">
            <span className={styles.cardText}>
              <span className={styles.cardLabel}>{t('nextLesson')}</span>
              <span className={styles.cardTitle}>{nextLesson.title}</span>
            </span>
            <Icon name="arrow-right" size={20} aria-hidden className={styles.arrow} />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </footer>
  );
}
