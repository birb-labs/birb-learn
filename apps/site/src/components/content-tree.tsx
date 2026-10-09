'use client';

import { useTranslations } from 'next-intl';
import type { ContentSubject } from '@birb-learn/content-schema';
import { Icon } from '@birb-learn/theme';
import { Link } from '@/i18n/navigation';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import {
  countCompleted,
  countTopicLessons,
  flattenSubjectLessons,
  lessonHref,
  lessonSlugsOfSection,
  lessonSlugsOfSubject,
  lessonSlugsOfTopic,
  percentOf,
  pickResumeLesson,
} from '@/lib/content-navigation';
import { ProgressBar } from './progress-bar';
import styles from './content-tree.module.css';

/** Overall progress banner plus the primary "start / continue" action for a subject. */
export function SubjectProgressSummary({
  disciplineSlug,
  subject,
}: {
  disciplineSlug: string;
  subject: ContentSubject;
}) {
  const t = useTranslations('content.progress');
  const { isComplete } = useReadingProgress();
  const slugs = lessonSlugsOfSubject(subject);
  const completed = countCompleted(slugs, isComplete);
  const total = slugs.length;
  const resume = pickResumeLesson(flattenSubjectLessons(subject), isComplete);
  const allDone = total > 0 && completed === total;
  const action = allDone ? t('review') : completed > 0 ? t('continue') : t('start');

  return (
    <div className={styles.summary}>
      <div className={styles.summaryText}>
        <p className={styles.summaryStat}>
          <strong>{percentOf(completed, total)}%</strong>
          <span>{t('label', { completed, total })}</span>
        </p>
        <ProgressBar
          value={completed}
          max={total}
          tone={allDone ? 'success' : 'accent'}
          label={t('label', { completed, total })}
        />
        {allDone && <p className={styles.allDone}>{t('allDone')}</p>}
      </div>
      {resume && (
        <Link href={lessonHref(disciplineSlug, subject.slug, resume.slug)} className={styles.primaryButton}>
          <Icon name={allDone ? 'rotate-ccw' : 'play'} size={16} aria-hidden />
          <span className={styles.primaryLabel}>
            {action}
            <small>{resume.title}</small>
          </span>
          <Icon name="arrow-right" size={16} aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function ContentTree({ disciplineSlug, subject }: { disciplineSlug: string; subject: ContentSubject }) {
  const t = useTranslations('content');
  const { isComplete } = useReadingProgress();
  const nextUp = pickResumeLesson(flattenSubjectLessons(subject), isComplete);
  const hasStarted = lessonSlugsOfSubject(subject).some(isComplete);
  // Lessons are numbered across the whole subject, not restarted per lesson group.
  const lessonNumbers = new Map(flattenSubjectLessons(subject).map((lesson, index) => [lesson.slug, index + 1]));

  return (
    <div className={styles.tree}>
      {subject.topics.map((topic, topicIndex) => {
        const topicSlugs = lessonSlugsOfTopic(topic);
        const topicCompleted = countCompleted(topicSlugs, isComplete);
        const topicTotal = countTopicLessons(topic);

        return (
          <section key={topic.slug} className={styles.topic} aria-labelledby={`topic-${topic.slug}`}>
            <header className={styles.topicHeader}>
              <span className={styles.topicNumber} aria-hidden>
                {topicIndex + 1}
              </span>
              <div className={styles.topicText}>
                <p className={styles.topicLabel}>{t('topicLabel')}</p>
                <h2 id={`topic-${topic.slug}`} className={styles.topicTitle}>
                  {topic.name}
                </h2>
              </div>
              <span className={styles.topicCount} data-complete={topicCompleted === topicTotal && topicTotal > 0 ? '' : undefined}>
                {t('lessonsCompleted', { completed: topicCompleted, total: topicTotal })}
              </span>
            </header>

            <div className={styles.sections}>
              {topic.sections.map((section) => {
                const sectionSlugs = lessonSlugsOfSection(section);
                const sectionCompleted = countCompleted(sectionSlugs, isComplete);

                return (
                  <details key={section.slug} className={styles.section} open>
                    <summary className={styles.sectionSummary}>
                      <Icon name="chevron-down" size={16} aria-hidden className={styles.sectionChevron} />
                      <span className={styles.sectionName}>{section.name}</span>
                      <span className={styles.sectionCount}>
                        {sectionCompleted}/{sectionSlugs.length}
                      </span>
                    </summary>
                    <ol className={styles.lessonList}>
                      {section.lessons.map((lesson) => {
                        const done = isComplete(lesson.slug);
                        const isNext = !done && hasStarted && nextUp?.slug === lesson.slug;
                        return (
                          <li key={lesson.slug}>
                            <Link
                              href={lessonHref(disciplineSlug, subject.slug, lesson.slug)}
                              className={styles.lessonLink}
                              data-done={done || undefined}
                              data-next={isNext || undefined}
                            >
                              <span className={styles.lessonStatus}>
                                <Icon name={done ? 'check-circle' : 'circle'} size={20} aria-hidden />
                              </span>
                              <span className={styles.lessonText}>
                                <span className={styles.lessonNumber}>{t('lessonNumber', { number: lessonNumbers.get(lesson.slug) ?? 0 })}</span>
                                <span className={styles.lessonTitle}>{lesson.title}</span>
                              </span>
                              {isNext && <span className={styles.nextBadge}>{t('nextUp')}</span>}
                              {done && <span className={styles.doneBadge}>{t('progress.done')}</span>}
                              <Icon name="chevron-right" size={16} aria-hidden className={styles.lessonArrow} />
                            </Link>
                          </li>
                        );
                      })}
                    </ol>
                  </details>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
