'use client';

import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Icon } from '@birb-learn/theme';
import { CodeLines, type HighlightedLine } from '@birb-learn/code-ui';
// Type-only and deep imports: the code-runner barrel would pull the workers and engines into this graph.
import { LANGUAGE_INFO } from '@birb-learn/code-runner/src/languages';
import type { Runner } from '@birb-learn/code-runner/src/protocol';
import type { Language } from '@birb-learn/content-schema/src/code-languages';
import { buildRunPanelLabels } from '@/lib/code-labels';
import styles from './code-snippet-interactive.module.css';

// The editor entry brings CodeMirror; load it only once a student opens the runner.
const RunPanel = lazy(() => import('@birb-learn/code-ui/editor').then((module) => ({ default: module.RunPanel })));

const LANGUAGE_STORAGE_KEY = 'birb-learn:code-lang';
const LAB_INCOMING_STORAGE_KEY = 'birb-learn:lab:incoming';
const ONECOMPILER_MYSQL_URL = 'https://onecompiler.com/mysql';
/** How long the "Copied!" confirmation stays visible. */
const COPY_FEEDBACK_MS = 2000;

/** A line range with its note. */
export interface SnippetNote {
  /** Inclusive, 1-based. */
  start: number;
  end: number;
  /** The note's MDX, compiled by the server half; the client only places it. */
  content: ReactNode;
}

export interface SnippetVariant {
  language: Language;
  code: string;
  lines: HighlightedLine[];
  annotations: SnippetNote[];
  walkthrough: SnippetNote[];
  runnable: boolean;
  stdin?: string;
  sqlSetup?: string;
}

export interface CodeSnippetInteractiveProps {
  variants: SnippetVariant[];
  /** Tests inject a fake; by default the shared site runner is created when the runner is first opened. */
  runner?: Runner;
}

function readStoredLanguage(): string | null {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeLanguage(language: Language): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Remembering the tab is a convenience; storage may be blocked.
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

type CopyState = 'idle' | 'copied' | 'failed';

export function CodeSnippetInteractive({ variants, runner: injectedRunner }: CodeSnippetInteractiveProps) {
  const t = useTranslations('code');
  const tRun = useTranslations('code.run');
  const locale = useLocale();
  const router = useRouter();
  const baseId = useId();

  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [walkStep, setWalkStep] = useState<number | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const [runner, setRunner] = useState<Runner | null>(null);
  const [runnerFailed, setRunnerFailed] = useState(false);
  const [stdinByLanguage, setStdinByLanguage] = useState<Partial<Record<Language, string>>>({});
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const walkStartRef = useRef<HTMLButtonElement>(null);
  const narrationRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const runLabels = useMemo(() => buildRunPanelLabels(tRun), [tRun]);

  const variant = variants[activeIndex] ?? variants[0];
  const walking = walkStep !== null;
  const shownAnnotation = focused ?? hovered ?? pinned;

  // The stored tab is applied after hydration: the server always renders the first variant.
  useEffect(() => {
    const index = variants.findIndex((candidate) => candidate.language === readStoredLanguage());
    if (index > 0) setActiveIndex(index);
  }, [variants]);

  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);

  // Escape closes an open annotation wherever the focus is (it may be open by hover alone).
  const annotationOpen = shownAnnotation !== null;
  useEffect(() => {
    if (!annotationOpen) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setHovered(null);
      setFocused(null);
      setPinned(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [annotationOpen]);

  // Keyboard users keep their place: the narration takes focus on entering the walkthrough,
  // and the start button gets it back when the student leaves it (Escape or the exit button).
  // Other exits, such as switching tab, keep the focus where the student put it.
  const wasWalkingRef = useRef(false);
  const restoreFocusRef = useRef(false);
  useEffect(() => {
    if (walking) narrationRef.current?.focus();
    else if (wasWalkingRef.current && restoreFocusRef.current) walkStartRef.current?.focus();
    if (!walking) restoreFocusRef.current = false;
    wasWalkingRef.current = walking;
  }, [walking]);

  function startWalkthrough() {
    // A pinned or hovered note would otherwise come back, unclosable, once the walkthrough ends.
    setHovered(null);
    setFocused(null);
    setPinned(null);
    setWalkStep(0);
  }

  function exitWalkthrough() {
    restoreFocusRef.current = true;
    setWalkStep(null);
  }

  function resetTransientState() {
    setHovered(null);
    setFocused(null);
    setPinned(null);
    setWalkStep(null);
  }

  function selectTab(index: number) {
    if (index === activeIndex) return;
    setActiveIndex(index);
    resetTransientState();
    storeLanguage(variants[index].language);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const lastIndex = variants.length - 1;
    let next: number | null = null;
    if (event.key === 'ArrowRight') next = activeIndex === lastIndex ? 0 : activeIndex + 1;
    else if (event.key === 'ArrowLeft') next = activeIndex === 0 ? lastIndex : activeIndex - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = lastIndex;
    if (next === null) return;
    event.preventDefault();
    // The lesson stepper listens for arrow keys on the window.
    event.stopPropagation();
    selectTab(next);
    tabRefs.current[next]?.focus();
  }

  function onRootKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!walking || event.defaultPrevented || isEditableTarget(event.target)) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const stepCount = variant.walkthrough.length;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      event.stopPropagation();
      setWalkStep((step) => Math.min((step ?? 0) + 1, stepCount - 1));
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      event.stopPropagation();
      setWalkStep((step) => Math.max((step ?? 0) - 1, 0));
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      exitWalkthrough();
    }
  }

  function toggleAnnotationPin(index: number) {
    if (pinned === index) {
      // Unpinning closes the popover even while the marker still has the pointer or focus.
      setPinned(null);
      setHovered(null);
      setFocused(null);
    } else {
      setPinned(index);
    }
  }

  async function toggleRunner() {
    if (runOpen) {
      setRunOpen(false);
      return;
    }
    try {
      // Resolved here, never while rendering: the site runner is browser-only.
      const resolved = runner ?? injectedRunner ?? (await import('@/lib/site-runner')).getSiteRunner();
      setRunner(resolved);
      setRunnerFailed(false);
      setRunOpen(true);
    } catch {
      setRunnerFailed(true);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(variant.code);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopyState('idle'), COPY_FEEDBACK_MS);
  }

  function copyAndOpenOneCompiler() {
    // Both run inside the click, so the popup is not blocked.
    void copyCode();
    window.open(ONECOMPILER_MYSQL_URL, '_blank', 'noopener,noreferrer');
  }

  const stdin = stdinByLanguage[variant.language] ?? variant.stdin ?? '';

  function openInLab() {
    try {
      sessionStorage.setItem(
        LAB_INCOMING_STORAGE_KEY,
        JSON.stringify({ language: variant.language, code: variant.code, stdin, sqlSetup: variant.sqlSetup ?? '' }),
      );
    } catch {
      // The lab then opens with its own template; navigating is still worth it.
    }
    router.push(`/${locale}/lab/#lang=${variant.language}`);
  }

  const languageLabel = LANGUAGE_INFO[variant.language].label;
  const tabId = (index: number) => `${baseId}-tab-${index}`;
  const panelId = `${baseId}-panel`;
  const popoverId = `${baseId}-note`;
  const annotation = walking || shownAnnotation === null ? undefined : variant.annotations[shownAnnotation];
  const step = walkStep === null ? undefined : variant.walkthrough[walkStep];
  const isMysql = variant.language === 'mysql';

  function renderMarkers(lineNumber: number): ReactNode {
    // Empty while walking through: the gutter stays, so the code does not shift.
    if (walking) return null;
    return variant.annotations.map((note, index) =>
      note.start === lineNumber ? (
        <button
          key={index}
          type="button"
          className={styles.marker}
          aria-label={t('annotation', { number: index + 1 })}
          aria-describedby={shownAnnotation === index ? popoverId : undefined}
          aria-expanded={shownAnnotation === index}
          data-pinned={pinned === index ? '' : undefined}
          onMouseEnter={() => setHovered(index)}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setFocused(index)}
          onBlur={() => setFocused(null)}
          onClick={() => toggleAnnotationPin(index)}
        >
          {index + 1}
        </button>
      ) : null,
    );
  }

  const codeLines = (
    <CodeLines
      lines={variant.lines}
      lineNumbers
      ariaLabel={t('codeLabel', { language: languageLabel })}
      highlightedRange={step ?? annotation}
      dimOutside={walking}
      // Only snippets with notes get a gutter.
      lineAccessory={variant.annotations.length > 0 ? renderMarkers : undefined}
    />
  );

  return (
    <div className={styles.root} onKeyDown={onRootKeyDown}>
      {variants.length > 1 ? (
        <div role="tablist" aria-label={t('tabsLabel')} className={styles.tabs} onKeyDown={onTabKeyDown}>
          {variants.map((candidate, index) => (
            <button
              key={candidate.language}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              id={tabId(index)}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-controls={panelId}
              tabIndex={index === activeIndex ? 0 : -1}
              className={styles.tab}
              onClick={() => selectTab(index)}
            >
              {LANGUAGE_INFO[candidate.language].label}
            </button>
          ))}
        </div>
      ) : (
        <p className={styles.singleLanguage}>{languageLabel}</p>
      )}

      {variants.length > 1 ? (
        <div role="tabpanel" id={panelId} aria-labelledby={tabId(activeIndex)}>
          {codeLines}
        </div>
      ) : (
        codeLines
      )}

      {annotation && (
        <div id={popoverId} role="tooltip" className={styles.popover} data-pinned={pinned === shownAnnotation ? '' : undefined}>
          <span className={styles.popoverNumber} aria-hidden>
            {(shownAnnotation ?? 0) + 1}
          </span>
          <div className={styles.note}>{annotation.content}</div>
        </div>
      )}

      {walking && step && (
        <div className={styles.walkthrough}>
          <div
            ref={narrationRef}
            tabIndex={-1}
            role="region"
            aria-label={t('walkthroughNarration')}
            className={`${styles.note} ${styles.narration}`}
          >
            {step.content}
          </div>
          <div className={styles.stepControls}>
            {/* aria-disabled, not disabled: a disabled button drops the focus, and the arrow keys with it. */}
            <button
              type="button"
              className={styles.button}
              aria-disabled={walkStep === 0}
              onClick={() => setWalkStep((current) => Math.max((current ?? 0) - 1, 0))}
            >
              <Icon name="chevron-left" size={16} aria-hidden />
              {t('walkthroughPrevious')}
            </button>
            <p className={styles.stepCounter} aria-live="polite">
              {t('walkthroughStep', { current: (walkStep ?? 0) + 1, total: variant.walkthrough.length })}
            </p>
            <button
              type="button"
              className={styles.button}
              aria-disabled={walkStep === variant.walkthrough.length - 1}
              onClick={() => setWalkStep((current) => Math.min((current ?? 0) + 1, variant.walkthrough.length - 1))}
            >
              {t('walkthroughNext')}
              <Icon name="chevron-right" size={16} aria-hidden />
            </button>
            <button type="button" className={styles.button} onClick={exitWalkthrough}>
              <Icon name="x" size={16} aria-hidden />
              {t('walkthroughExit')}
            </button>
          </div>
        </div>
      )}

      <div className={styles.toolbar} role="group" aria-label={t('actions')}>
        {variant.walkthrough.length > 0 && !walking && (
          <button ref={walkStartRef} type="button" className={styles.button} onClick={startWalkthrough}>
            <Icon name="route" size={16} aria-hidden />
            {t('walkthroughStart')}
          </button>
        )}
        {variant.runnable && (
          <button type="button" className={`${styles.button} ${styles.primary}`} aria-expanded={runOpen} onClick={() => void toggleRunner()}>
            <Icon name="play" size={16} aria-hidden />
            {runOpen ? t('closeRunner') : t('openRunner')}
          </button>
        )}
        {isMysql && (
          <button type="button" className={`${styles.button} ${styles.primary}`} onClick={copyAndOpenOneCompiler}>
            <Icon name="external-link" size={16} aria-hidden />
            {t('oneCompiler')}
          </button>
        )}
        {!isMysql && (
          <button type="button" className={styles.button} onClick={openInLab}>
            <Icon name="flask" size={16} aria-hidden />
            {t('openInLab')}
          </button>
        )}
        <button type="button" className={styles.button} onClick={() => void copyCode()}>
          {t('copy')}
        </button>
        <p className={styles.copyStatus} role="status" data-state={copyState}>
          {copyState === 'copied' ? t('copied') : copyState === 'failed' ? t('copyFailed') : ''}
        </p>
      </div>

      {runnerFailed && (
        <p role="alert" className={styles.runnerError}>
          {runLabels.unavailable.engine_load}
        </p>
      )}

      {runOpen && runner && variant.runnable && (
        <div className={styles.runner}>
          <Suspense fallback={null}>
            <RunPanel
              key={variant.language}
              runner={runner}
              language={variant.language}
              source={variant.code}
              stdin={stdin}
              onStdinChange={(value) => setStdinByLanguage((current) => ({ ...current, [variant.language]: value }))}
              sqlSetup={variant.sqlSetup}
              showStdin={variant.stdin !== undefined}
              labels={runLabels}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
