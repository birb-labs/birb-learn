'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@birb-learn/theme';
import { Link } from '@/i18n/navigation';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import { BLOCK_TYPE_META, type LessonStep } from '@/lib/lesson-steps';
import styles from './lesson-shell.module.css';

export interface OutlineLesson {
  slug: string;
  title: string;
  href: string;
}

export interface LessonLink {
  href: string;
  title: string;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Index of the last step whose top has scrolled past the reading line (0 before the first). */
function computeActiveStep(stepIds: string[], readingLine: number): number {
  let active = 0;
  stepIds.forEach((id, index) => {
    const element = document.getElementById(id);
    if (element && element.getBoundingClientRect().top <= readingLine) active = index;
  });
  const scrollBottom = window.scrollY + window.innerHeight;
  if (stepIds.length > 0 && scrollBottom >= document.documentElement.scrollHeight - 4) {
    return stepIds.length - 1;
  }
  return active;
}

function StepList({
  steps,
  activeIndex,
  onSelect,
}: {
  steps: LessonStep[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const t = useTranslations('content');

  return (
    <ol className={styles.stepList}>
      {steps.map((step, index) => {
        const state = index < activeIndex ? 'done' : index === activeIndex ? 'current' : 'todo';
        const meta = BLOCK_TYPE_META[step.type];
        return (
          <li key={step.id}>
            <a
              href={`#${step.id}`}
              className={styles.stepLink}
              data-state={state}
              data-tone={meta.tone}
              aria-current={state === 'current' ? 'step' : undefined}
              aria-label={t('lesson.goToBlock', { title: step.title })}
              onClick={(event) => {
                event.preventDefault();
                onSelect(index);
              }}
            >
              <span className={styles.stepIcon}>
                {state === 'done' ? <Icon name="check" size={14} aria-hidden /> : <Icon name={meta.icon} size={14} aria-hidden />}
              </span>
              <span className={styles.stepText}>
                <span className={styles.stepType}>{t(`blocks.${step.type}`)}</span>
                {step.title !== t(`blocks.${step.type}`) && <span className={styles.stepTitle}>{step.title}</span>}
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Interactive frame around a lesson: a scroll-driven reading bar, a sticky
 * step outline with the lesson list, and a floating dock (also driven by the
 * arrow keys) to step back and forth through the lesson and on to the
 * neighbouring lessons.
 */
export function LessonShell({
  steps,
  lessonSlug,
  lessonNumber,
  lessonTotal,
  outline,
  previousLesson,
  nextLesson,
  indexHref,
  header,
  footer,
  children,
}: {
  steps: LessonStep[];
  lessonSlug: string;
  lessonNumber: number;
  lessonTotal: number;
  outline: OutlineLesson[];
  previousLesson?: LessonLink;
  nextLesson?: LessonLink;
  indexHref: string;
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations('content');
  const { isComplete } = useReadingProgress();
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [readProgress, setReadProgress] = useState(0);
  const [stepsOpen, setStepsOpen] = useState(false);
  const stepIds = steps.map((step) => step.id);
  const stepIdsKey = stepIds.join('|');

  const goToStep = useCallback(
    (index: number) => {
      const target = document.getElementById(stepIds[index] ?? '');
      if (!target) return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      setStepsOpen(false);
    },
    // `stepIds` is derived from `stepIdsKey`; depending on the key keeps this stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stepIdsKey],
  );

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const content = contentRef.current;
      if (content) {
        const rect = content.getBoundingClientRect();
        const total = rect.height - window.innerHeight * 0.6;
        const scrolled = -rect.top + window.innerHeight * 0.4;
        setReadProgress(total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 1);
      }
      setActiveIndex(computeActiveStep(stepIds, window.innerHeight * 0.4));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdsKey]);

  const lastIndex = steps.length - 1;
  const atStart = activeIndex <= 0;
  const atEnd = activeIndex >= lastIndex;

  // At the lesson's edges the dock buttons hand over to the neighbouring lessons.
  const previousAction = atStart ? previousLesson : undefined;
  const nextAction = atEnd ? (nextLesson ?? { href: indexHref, title: t('lesson.backToIndex') }) : undefined;

  const goPrevious = useCallback(() => {
    if (activeIndex > 0) goToStep(activeIndex - 1);
  }, [activeIndex, goToStep]);
  const goNext = useCallback(() => {
    if (activeIndex < lastIndex) goToStep(activeIndex + 1);
  }, [activeIndex, lastIndex, goToStep]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (isEditableTarget(event.target)) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevious();
      } else if (event.key === 'Escape') {
        setStepsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrevious]);

  const percent = Math.round(readProgress * 100);
  const activeStep = steps[activeIndex];

  return (
    <div className={styles.shell}>
      <div
        className={styles.readingBar}
        role="progressbar"
        aria-label={t('lesson.readingProgress')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className={styles.readingFill} style={{ transform: `scaleX(${readProgress})` }} />
      </div>

      <div className={styles.layout}>
        <aside className={styles.rail}>
          <div className={styles.railInner}>
            <div className={styles.railSection}>
              <p className={styles.railHeading}>{t('lesson.lessonOf', { current: lessonNumber, total: lessonTotal })}</p>
              <Link href={indexHref} className={styles.backLink}>
                <Icon name="arrow-left" size={14} aria-hidden />
                {t('lesson.backToIndex')}
              </Link>
            </div>

            {steps.length > 1 && (
              <nav className={styles.railSection} aria-label={t('lesson.stepper')}>
                <p className={styles.railHeading}>{t('lesson.inThisLesson')}</p>
                <StepList steps={steps} activeIndex={activeIndex} onSelect={goToStep} />
              </nav>
            )}

            <details className={styles.railSection} open={outline.length <= 12}>
              <summary className={styles.outlineSummary}>
                <span>{t('lesson.courseOutline')}</span>
                <Icon name="chevron-down" size={14} aria-hidden />
              </summary>
              <ol className={styles.outline}>
                {outline.map((lesson) => (
                  <li key={lesson.slug}>
                    <Link
                      href={lesson.href}
                      className={styles.outlineLink}
                      aria-current={lesson.slug === lessonSlug ? 'page' : undefined}
                      data-done={isComplete(lesson.slug) || undefined}
                    >
                      <Icon
                        name={isComplete(lesson.slug) ? 'check-circle' : lesson.slug === lessonSlug ? 'play' : 'circle'}
                        size={14}
                        aria-hidden
                      />
                      <span>{lesson.title}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </details>

            <p className={styles.hint}>
              <Icon name="zap" size={12} aria-hidden />
              {t('lesson.keyboardHint')}
            </p>
          </div>
        </aside>

        <div className={styles.main}>
          {header}
          <div ref={contentRef} className={styles.content}>
            {children}
          </div>
          {footer}
        </div>
      </div>

      {steps.length > 0 && (
        <div className={styles.dockWrap}>
          {stepsOpen && (
            <div className={styles.sheet} role="dialog" aria-label={t('lesson.stepper')}>
              <StepList steps={steps} activeIndex={activeIndex} onSelect={goToStep} />
            </div>
          )}
          <div className={styles.dock}>
            {previousAction ? (
              <Link href={previousAction.href} className={styles.dockButton} aria-label={t('lesson.previousLesson')}>
                <Icon name="arrow-left" size={18} aria-hidden />
                <span className={styles.dockButtonText}>{t('lesson.previousLesson')}</span>
              </Link>
            ) : (
              <button
                type="button"
                className={styles.dockButton}
                onClick={goPrevious}
                disabled={atStart}
                aria-label={t('lesson.previousBlock')}
              >
                <Icon name="arrow-left" size={18} aria-hidden />
                <span className={styles.dockButtonText}>{t('lesson.previousBlock')}</span>
              </button>
            )}

            <button
              type="button"
              className={styles.dockStatus}
              onClick={() => setStepsOpen((open) => !open)}
              aria-expanded={stepsOpen}
              aria-label={t('lesson.stepper')}
            >
              <span className={styles.dockStep}>{t('lesson.blockOf', { current: activeIndex + 1, total: steps.length })}</span>
              <span className={styles.dockTitle}>{activeStep?.title}</span>
              <span className={styles.dots} aria-hidden>
                {steps.map((step, index) => (
                  <span
                    key={step.id}
                    className={styles.dot}
                    data-state={index < activeIndex ? 'done' : index === activeIndex ? 'current' : 'todo'}
                  />
                ))}
              </span>
            </button>

            {nextAction ? (
              <Link
                href={nextAction.href}
                className={`${styles.dockButton} ${styles.dockPrimary}`}
                aria-label={nextLesson ? t('lesson.nextLesson') : t('lesson.backToIndex')}
              >
                <span className={styles.dockButtonText}>{nextLesson ? t('lesson.nextLesson') : t('lesson.backToIndex')}</span>
                <Icon name={nextLesson ? 'arrow-right' : 'layout-grid'} size={18} aria-hidden />
              </Link>
            ) : (
              <button
                type="button"
                className={`${styles.dockButton} ${styles.dockPrimary}`}
                onClick={goNext}
                aria-label={t('lesson.nextBlock')}
              >
                <span className={styles.dockButtonText}>{t('lesson.nextBlock')}</span>
                <Icon name="arrow-right" size={18} aria-hidden />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
