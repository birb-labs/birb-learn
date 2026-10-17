'use client';

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@birb-learn/theme';
// Type-only and deep imports: the code-runner barrel would pull the workers and engines into this graph.
import {
  BROWSER_LANGUAGES,
  LANGUAGE_INFO,
  READ_ONLY_LANGUAGES,
  REMOTE_LANGUAGES,
} from '@birb-learn/code-runner/src/languages';
import type { Runner } from '@birb-learn/code-runner/src/protocol';
import type { Language } from '@birb-learn/content-schema/src/code-languages';
import { buildRunPanelLabels } from '@/lib/code-labels';
import {
  clearPreviousLabCode,
  isLanguage,
  loadLabCode,
  loadPreviousLabCode,
  readSavedLabCode,
  saveLabCode,
  savePreviousLabCode,
  takeIncoming,
} from '@/lib/lab-storage';
import { lazySiteRunner } from '@/lib/lazy-site-runner';
import styles from './lab-client.module.css';

// The editor entry brings CodeMirror; keep it out of the chunk that hydrates the rest of the page.
// Both components come from one import, so the entry is requested once.
let editorEntry: Promise<typeof import('@birb-learn/code-ui/editor')> | undefined;
const loadEditorEntry = () => (editorEntry ??= import('@birb-learn/code-ui/editor'));

const CodeEditor = lazy(() => loadEditorEntry().then((module) => ({ default: module.CodeEditor })));
const RunPanel = lazy(() => loadEditorEntry().then((module) => ({ default: module.RunPanel })));

const DEFAULT_LANGUAGE: Language = 'python';
const ONECOMPILER_MYSQL_URL = 'https://onecompiler.com/mysql';
/** How long an edit waits for the next one before it is written to storage. */
const SAVE_DEBOUNCE_MS = 500;
/** How long the "Copied!" confirmation stays visible. */
const COPY_FEEDBACK_MS = 2000;

type CopyState = 'idle' | 'copied' | 'failed';

export interface LabClientProps {
  /** Tests inject a fake; by default the shared site runner is found when a run is first asked for. */
  runner?: Runner;
}

function languageFromHash(): Language | null {
  const requested = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('lang');
  return isLanguage(requested) ? requested : null;
}

function rememberLanguageInHash(language: Language): void {
  try {
    window.history.replaceState(window.history.state, '', `#lang=${language}`);
  } catch {
    // The address is a nicety; some embedders block history changes.
  }
}

export function LabClient({ runner }: LabClientProps) {
  const t = useTranslations('lab');
  const tCode = useTranslations('code');
  const tRun = useTranslations('code.run');
  const runLabels = useMemo(() => buildRunPanelLabels(tRun), [tRun]);

  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  // Everything below depends on browser storage, so it is filled in after hydration.
  const [ready, setReady] = useState(false);
  const [codes, setCodes] = useState<Partial<Record<Language, string>>>({});
  const [stdins, setStdins] = useState<Partial<Record<Language, string>>>({});
  const [setups, setSetups] = useState<Partial<Record<Language, string>>>({});
  // The code a handed-over lesson snippet replaced, per language, until the student restores or loses it.
  const [previous, setPrevious] = useState<Partial<Record<Language, string>>>({});
  const [copyState, setCopyState] = useState<CopyState>('idle');

  // The replaced code that is not in storage yet: it is stashed just before the replacement's first save.
  const unstashedRef = useRef<Partial<Record<Language, string>>>({});
  const initialisedRef = useRef(false);
  const pendingSaveRef = useRef<{ language: Language; code: string } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    const pending = pendingSaveRef.current;
    pendingSaveRef.current = null;
    if (!pending) return;
    const replaced = unstashedRef.current[pending.language];
    if (replaced !== undefined) {
      savePreviousLabCode(pending.language, replaced);
      delete unstashedRef.current[pending.language];
    }
    saveLabCode(pending.language, pending.code);
  }, []);

  // The handed-over snippet is read once, so React's double-run of effects in development must not repeat it.
  useEffect(() => {
    if (initialisedRef.current) return;
    initialisedRef.current = true;
    const incoming = takeIncoming();
    const initial = incoming?.language ?? languageFromHash() ?? DEFAULT_LANGUAGE;
    setLanguage(initial);
    setCodes({ [initial]: incoming ? incoming.code : loadLabCode(initial) });
    const saved = incoming ? readSavedLabCode(initial) : null;
    if (incoming && saved !== null && saved !== incoming.code) {
      unstashedRef.current[initial] = saved;
      setPrevious({ [initial]: saved });
    } else {
      const stashed = loadPreviousLabCode(initial);
      if (stashed !== null) setPrevious({ [initial]: stashed });
    }
    if (incoming?.stdin !== undefined) setStdins({ [initial]: incoming.stdin });
    if (incoming?.sqlSetup !== undefined) setSetups({ [initial]: incoming.sqlSetup });
    setReady(true);
  }, []);

  // An edit made less than a debounce ago must survive closing the tab or leaving the page.
  useEffect(() => {
    window.addEventListener('pagehide', flushSave);
    return () => {
      window.removeEventListener('pagehide', flushSave);
      flushSave();
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, [flushSave]);

  // Editing `#lang=` on a loaded lab switches language like the picker does. The ref keeps one listener
  // that always runs the latest render's handler.
  const hashChangeRef = useRef<() => void>(() => {});
  hashChangeRef.current = () => {
    const requested = languageFromHash();
    if (ready && requested) switchTo(requested, false);
  };
  useEffect(() => {
    const onHashChange = () => hashChangeRef.current();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const info = LANGUAGE_INFO[language];
  const code = codes[language] ?? info.template;
  const showSetup = info.isSql && info.engine !== 'none';
  const languageName = info.label;

  function changeCode(value: string) {
    setCodes((current) => ({ ...current, [language]: value }));
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    pendingSaveRef.current = { language, code: value };
    saveTimerRef.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
  }

  function switchTo(next: Language, updateHash: boolean) {
    if (next === language) return;
    flushSave();
    if (codes[next] === undefined) {
      const stored = loadLabCode(next);
      setCodes((current) => ({ ...current, [next]: stored }));
    }
    if (previous[next] === undefined) {
      const stashed = loadPreviousLabCode(next);
      if (stashed !== null) setPrevious((current) => ({ ...current, [next]: stashed }));
    }
    setLanguage(next);
    setCopyState('idle');
    if (updateHash) rememberLanguageInHash(next);
  }

  function selectLanguage(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    if (isLanguage(next)) switchTo(next, true);
  }

  function restorePreviousCode() {
    const restored = previous[language];
    if (restored === undefined) return;
    // The restored code replaces whatever was waiting to be saved.
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    pendingSaveRef.current = null;
    delete unstashedRef.current[language];
    clearPreviousLabCode(language);
    setPrevious((current) => {
      const rest = { ...current };
      delete rest[language];
      return rest;
    });
    setCodes((current) => ({ ...current, [language]: restored }));
    saveLabCode(language, restored);
  }

  function resetToTemplate() {
    if (!window.confirm(t('resetConfirm', { language: languageName }))) return;
    // The template replaces whatever was waiting to be saved.
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    pendingSaveRef.current = null;
    setCodes((current) => ({ ...current, [language]: info.template }));
    saveLabCode(language, info.template);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
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

  const loading = <p className={styles.loading}>{t('loading')}</p>;

  return (
    <div className={styles.lab}>
      <div className={styles.toolbar}>
        <label className={styles.picker}>
          <span className={styles.pickerLabel}>{t('languageLabel')}</span>
          {/* Disabled until the start-up has chosen the language, so an early choice is not overwritten. */}
          <select className={styles.select} value={language} onChange={selectLanguage} disabled={!ready}>
            <LanguageGroup label={t('groups.browser')} languages={BROWSER_LANGUAGES} />
            <LanguageGroup label={t('groups.remote')} languages={REMOTE_LANGUAGES} />
            <LanguageGroup label={t('groups.readOnly')} languages={READ_ONLY_LANGUAGES} />
          </select>
        </label>
        <button type="button" className={styles.button} onClick={resetToTemplate} disabled={!ready}>
          <Icon name="rotate-ccw" size={16} aria-hidden />
          {t('reset')}
        </button>
        {previous[language] !== undefined && (
          <button type="button" className={styles.button} onClick={restorePreviousCode}>
            <Icon name="history" size={16} aria-hidden />
            {t('restorePrevious')}
          </button>
        )}
      </div>

      {ready ? (
        <Suspense fallback={loading}>
          <CodeEditor
            value={code}
            onChange={changeCode}
            language={language}
            ariaLabel={t('editorLabel', { language: languageName })}
            minLines={12}
          />
          {showSetup && (
            <div className={styles.setup}>
              <p className={styles.caption}>{t('setupLabel')}</p>
              <CodeEditor
                value={setups[language] ?? ''}
                onChange={(value) => setSetups((current) => ({ ...current, [language]: value }))}
                language={language}
                ariaLabel={t('setupLabel')}
                minLines={3}
              />
            </div>
          )}
          {info.engine === 'none' ? (
            <div className={styles.readOnly}>
              <p className={styles.note}>{t('mysqlNote')}</p>
              <div className={styles.actions}>
                <button type="button" className={`${styles.button} ${styles.primary}`} onClick={copyAndOpenOneCompiler}>
                  <Icon name="external-link" size={16} aria-hidden />
                  {tCode('oneCompiler')}
                </button>
                <p className={styles.copyStatus} role="status" data-state={copyState}>
                  {copyState === 'copied' ? tCode('copied') : copyState === 'failed' ? tCode('copyFailed') : ''}
                </p>
              </div>
            </div>
          ) : (
            <RunPanel
              runner={runner ?? lazySiteRunner}
              language={language}
              source={code}
              stdin={stdins[language] ?? ''}
              onStdinChange={(value) => setStdins((current) => ({ ...current, [language]: value }))}
              sqlSetup={showSetup ? (setups[language] ?? '') : undefined}
              showSqlSetup={false}
              showStdin={!info.isSql}
              labels={runLabels}
            />
          )}
        </Suspense>
      ) : (
        loading
      )}
    </div>
  );
}

function LanguageGroup({ label, languages }: { label: string; languages: readonly Language[] }) {
  return (
    <optgroup label={label}>
      {languages.map((id) => (
        <option key={id} value={id}>
          {LANGUAGE_INFO[id].label}
        </option>
      ))}
    </optgroup>
  );
}
