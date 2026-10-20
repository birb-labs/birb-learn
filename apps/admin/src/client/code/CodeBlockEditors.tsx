import { useRef, useState } from 'react';
// Deep imports: the content-schema barrel also exports the Drizzle queries, which must stay out of the browser bundle.
import type { CodeKind, Language } from '@birb-learn/content-schema/src/code-languages';
import type { CodeSnippetPayloadData, CodeTaskPayloadData } from '@birb-learn/content-schema/src/code-payloads';
import { MdxEditor } from '../components/MdxEditor';
import { CodeSnippetForm } from './CodeSnippetForm';
import { CodeTaskForm } from './CodeTaskForm';
import { CopyFromPtBrButton } from './CopyFromPtBrButton';
import { readStoredSnippet, readStoredTask, type StoredPayload } from './lenient';
import { adaptTaskPayload, languageForKind, placeholderSnippet, placeholderTask } from './task-payload';
import { useDebouncedSaver } from './use-debounced-saver';
import { checkSnippet, checkTask } from './validate';
import { VerifyButton } from './VerifyButton';
import styles from './CodeForms.module.css';

type Locale = 'pt-BR' | 'en-US' | 'es';
const LOCALES: Locale[] = ['pt-BR', 'en-US', 'es'];

type Payload = CodeSnippetPayloadData | CodeTaskPayloadData;

/** What the author is editing in one locale tab of a block. Never re-derived from the stored text once loaded. */
interface Draft {
  /** Code exercises only. */
  prompt: string;
  /** Code exercises only. */
  resolution: string;
  /** `null` while the locale has no code yet, or when the stored text could not be read (`raw`). */
  payload: Payload | null;
  /** Stored text that could not be read as a payload, kept so it is never lost. */
  raw: string | null;
}

const EMPTY_DRAFT: Draft = { prompt: '', resolution: '', payload: null, raw: null };

interface StoredTranslation {
  promptMdx?: string | null;
  resolutionMdx?: string | null;
  payloadJson?: string | null;
}

export interface CodeBlockEditorProps {
  type: 'code_snippet' | 'code_exercise';
  /** The kind and language the block had when it was loaded; the editor owns them from then on. */
  initialKind: CodeKind | null | undefined;
  initialLanguage: Language | null | undefined;
  /** The stored translations when the block was loaded; the editor owns the drafts from then on. */
  translations: Partial<Record<Locale, StoredTranslation>>;
  activeLocale: Locale;
  /** PATCHes the block. Resolves to the server's error message, or `null` when it saved. */
  save: (body: Record<string, unknown>) => Promise<string | null>;
}

// The kind and language a new code exercise starts with: the ones `placeholderTask` is valid for.
const DEFAULT_KIND: CodeKind = 'write';
const DEFAULT_LANGUAGE: Language = 'python';

function storedPayload(isExercise: boolean, text: string | null | undefined): StoredPayload<Payload> {
  return isExercise ? readStoredTask(text) : readStoredSnippet(text);
}

/**
 * The drafts a block starts with. pt-BR always has a payload to edit: the stored one (even when it does not
 * pass the schema, shown as it is) or, only when nothing is stored, a placeholder. The other locales have
 * a draft only once they have a stored translation.
 */
function initialDrafts(isExercise: boolean, translations: CodeBlockEditorProps['translations']): Partial<Record<Locale, Draft>> {
  const drafts: Partial<Record<Locale, Draft>> = {};
  for (const locale of LOCALES) {
    const translation = translations[locale];
    if (!translation && locale !== 'pt-BR') continue;
    const stored = storedPayload(isExercise, translation?.payloadJson);
    const placeholder = isExercise ? placeholderTask() : placeholderSnippet();
    drafts[locale] = {
      prompt: translation?.promptMdx ?? '',
      resolution: translation?.resolutionMdx ?? '',
      payload: stored.kind === 'typed' ? stored.payload : stored.kind === 'none' && locale === 'pt-BR' ? placeholder : null,
      raw: stored.kind === 'raw' ? stored.text : null,
    };
  }
  return drafts;
}

/** The "path: message" lines that say why the draft cannot be saved yet (empty when it can). */
function draftProblems(isExercise: boolean, kind: CodeKind, language: Language, draft: Draft): string[] {
  const problems: string[] = [];
  if (isExercise) {
    if (draft.prompt.trim() === '') problems.push('promptMdx: o enunciado não pode ficar em branco');
    if (draft.resolution.trim() === '') problems.push('resolutionMdx: a resolução não pode ficar em branco');
  }
  if (draft.raw !== null) {
    problems.push('payloadJson: o JSON salvo não pôde ser lido; corrija-o ou apague-o');
  } else if (draft.payload === null) {
    problems.push('payloadJson: este idioma ainda não tem código');
  } else {
    const checked = isExercise ? checkTask(kind, language, draft.payload) : checkSnippet(draft.payload);
    if (!checked.ok) problems.push(...checked.problems);
  }
  return problems;
}

function ProblemList({ problems }: { problems: string[] }) {
  return (
    <div className={styles.problems}>
      <p className={styles.problemsTitle}>O conteúdo ainda não é válido e não foi salvo:</p>
      <ul className={styles.problemList}>
        {problems.map((problem, index) => (
          <li key={index}>
            <span style={{ whiteSpace: 'pre-wrap' }}>{problem}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Editor of a `code_snippet` or `code_exercise` block. It holds a typed draft per locale tab, loaded once
 * from the stored block, and saves it debounced: a draft that is invalid for a moment (a blank with no
 * accepted answer, half a line range) stays exactly as typed, shows what is wrong and is simply not sent.
 */
export function CodeBlockEditor({ type, initialKind, initialLanguage, translations, activeLocale, save }: CodeBlockEditorProps) {
  const isExercise = type === 'code_exercise';
  const [drafts, setDrafts] = useState(() => initialDrafts(isExercise, translations));
  const [target, setTarget] = useState({ kind: initialKind ?? DEFAULT_KIND, language: initialLanguage ?? DEFAULT_LANGUAGE });
  const [saveError, setSaveError] = useState<string | null>(null);

  // The saver reads the latest drafts at send time, never a snapshot from a render.
  const draftsRef = useRef(drafts);
  const targetRef = useRef(target);
  // Edit counters per locale (and for the target), against the counter value last saved.
  const edits = useRef({ locales: { 'pt-BR': 0, 'en-US': 0, es: 0 } as Record<Locale, number>, target: 0 });
  const saved = useRef({ locales: { 'pt-BR': 0, 'en-US': 0, es: 0 } as Record<Locale, number>, target: 0 });

  const saver = useDebouncedSaver({ send, onResult: setSaveError });

  function send(): Promise<string | null> | null {
    const translationsToSend: Record<string, Record<string, string>> = {};
    const sentEdits = { locales: { ...edits.current.locales }, target: edits.current.target };
    for (const locale of LOCALES) {
      const draft = draftsRef.current[locale];
      if (!draft || edits.current.locales[locale] === saved.current.locales[locale]) continue;
      // An invalid draft is not sent; it stays dirty and is retried once the author makes it valid.
      if (draftProblems(isExercise, targetRef.current.kind, targetRef.current.language, draft).length > 0) continue;
      translationsToSend[locale] = isExercise
        ? { promptMdx: draft.prompt, resolutionMdx: draft.resolution, payloadJson: JSON.stringify(draft.payload) }
        : { payloadJson: JSON.stringify(draft.payload) };
    }
    const sentLocales = Object.keys(translationsToSend) as Locale[];
    const targetDirty = isExercise && edits.current.target !== saved.current.target;
    if (sentLocales.length === 0 && !targetDirty) return null;

    const body: Record<string, unknown> = {
      ...(isExercise ? { codeKind: targetRef.current.kind, codeLanguage: targetRef.current.language } : {}),
      ...(sentLocales.length > 0 ? { translations: translationsToSend } : {}),
    };
    return save(body).then((error) => {
      if (error === null) {
        for (const locale of sentLocales) saved.current.locales[locale] = sentEdits.locales[locale];
        if (targetDirty) saved.current.target = sentEdits.target;
      }
      return error;
    });
  }

  function commitDrafts(next: Partial<Record<Locale, Draft>>) {
    draftsRef.current = next;
    setDrafts(next);
  }

  function updateDraft(locale: Locale, change: (draft: Draft) => Draft) {
    commitDrafts({ ...draftsRef.current, [locale]: change(draftsRef.current[locale] ?? EMPTY_DRAFT) });
    edits.current.locales[locale] += 1;
    saver.schedule();
  }

  // The kind and the language are shared by every locale, and a change can invalidate a payload (a
  // predict_output task has no tests, SQL tests differ from stdout tests), so every locale's draft is
  // reshaped and the change is saved right away, together with those payloads.
  function retarget(kind: CodeKind, requestedLanguage: Language) {
    const language = languageForKind(kind, requestedLanguage);
    const next: Partial<Record<Locale, Draft>> = {};
    for (const locale of LOCALES) {
      const draft = draftsRef.current[locale];
      if (!draft) continue;
      next[locale] =
        draft.payload === null ? draft : { ...draft, payload: adaptTaskPayload(draft.payload as CodeTaskPayloadData, kind, language) };
      if (draft.payload !== null) edits.current.locales[locale] += 1;
    }
    edits.current.target += 1;
    targetRef.current = { kind, language };
    setTarget(targetRef.current);
    commitDrafts(next);
    saver.schedule();
    saver.flush();
  }

  function copyFromPtBr(locale: Locale) {
    const source = draftsRef.current['pt-BR'];
    if (!source?.payload) return;
    updateDraft(locale, (draft) => ({
      ...draft,
      payload: structuredClone(source.payload),
      raw: null,
      // The prose is only a starting text for the translation: what the translator already wrote stays.
      prompt: draft.prompt.trim() === '' ? source.prompt : draft.prompt,
      resolution: draft.resolution.trim() === '' ? source.resolution : draft.resolution,
    }));
  }

  const draft = drafts[activeLocale] ?? EMPTY_DRAFT;
  const ptBrDraft = drafts['pt-BR'];
  const canCopy = activeLocale !== 'pt-BR' && ptBrDraft?.payload != null;
  const problems = draftProblems(isExercise, target.kind, target.language, draft);
  // A locale with no code yet has its own notice; the problems are about code that exists.
  const showProblems = problems.length > 0 && (draft.payload !== null || draft.raw !== null);

  return (
    <div className={styles.section} onBlur={() => saver.flush()}>
      {isExercise && (
        <>
          <MdxEditor
            label="Enunciado"
            value={draft.prompt}
            onChange={(prompt) => updateDraft(activeLocale, (d) => ({ ...d, prompt }))}
          />
          {draft.prompt === '' && activeLocale !== 'pt-BR' && ptBrDraft?.prompt && (
            <p className={styles.reference}>pt-BR: {ptBrDraft.prompt}</p>
          )}
          <MdxEditor
            label="Resolução"
            value={draft.resolution}
            onChange={(resolution) => updateDraft(activeLocale, (d) => ({ ...d, resolution }))}
          />
          {draft.resolution === '' && activeLocale !== 'pt-BR' && ptBrDraft?.resolution && (
            <p className={styles.reference}>pt-BR: {ptBrDraft.resolution}</p>
          )}
        </>
      )}

      {draft.payload !== null ? (
        <>
          {activeLocale !== 'pt-BR' && <CopyFromPtBrButton disabled={!canCopy} onCopy={() => copyFromPtBr(activeLocale)} />}
          {isExercise ? (
            <CodeTaskForm
              kind={target.kind}
              language={target.language}
              value={draft.payload as CodeTaskPayloadData}
              onChange={(payload) => updateDraft(activeLocale, (d) => ({ ...d, payload }))}
              onKindChange={(kind) => retarget(kind, target.language)}
              onLanguageChange={(language) => retarget(target.kind, language)}
            />
          ) : (
            <CodeSnippetForm
              value={draft.payload as CodeSnippetPayloadData}
              onChange={(payload) => updateDraft(activeLocale, (d) => ({ ...d, payload }))}
            />
          )}
          {isExercise ? (
            <VerifyButton
              kind="task"
              taskKind={target.kind}
              language={target.language}
              payload={draft.payload as CodeTaskPayloadData}
            />
          ) : (
            <VerifyButton kind="snippet" payload={draft.payload as CodeSnippetPayloadData} />
          )}
        </>
      ) : draft.raw !== null ? (
        <div className={styles.field}>
          <p className={styles.muted}>O JSON salvo não pôde ser lido. Ele continua como está até você corrigi-lo aqui.</p>
          <textarea
            className={styles.textarea}
            aria-label="JSON salvo do código"
            value={draft.raw}
            onChange={(event) => {
              const stored = storedPayload(isExercise, event.target.value);
              updateDraft(activeLocale, (d) =>
                stored.kind === 'typed' ? { ...d, payload: stored.payload, raw: null } : { ...d, raw: event.target.value },
              );
            }}
          />
        </div>
      ) : (
        <div className={styles.section}>
          <p className={styles.muted}>Este idioma ainda não tem código.</p>
          <CopyFromPtBrButton disabled={!canCopy} onCopy={() => copyFromPtBr(activeLocale)} />
        </div>
      )}

      {showProblems && <ProblemList problems={problems} />}
      {saveError && <p className={styles.saveError}>{saveError}</p>}
    </div>
  );
}
