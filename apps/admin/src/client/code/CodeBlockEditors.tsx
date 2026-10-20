// Deep imports: the content-schema barrel also exports the Drizzle queries, which must stay out of the browser bundle.
import type { CodeKind, Language } from '@birb-learn/content-schema/src/code-languages';
import type { CodeSnippetPayloadData, CodeTaskPayloadData } from '@birb-learn/content-schema/src/code-payloads';
import { CodeSnippetForm } from './CodeSnippetForm';
import { CodeTaskForm } from './CodeTaskForm';
import { CopyFromPtBrButton } from './CopyFromPtBrButton';
import { parseSnippetPayload, parseTaskPayload, placeholderSnippet, placeholderTask } from './task-payload';
import { VerifyButton } from './VerifyButton';
import styles from './CodeForms.module.css';

type Locale = 'pt-BR' | 'en-US' | 'es';

/**
 * The payload to edit in `locale`. pt-BR falls back to a placeholder so the block can always be edited;
 * the other locales have none until the author copies the pt-BR one (or it was never translated).
 */
function payloadForLocale<T>(locale: Locale, parsed: T | null, placeholder: () => T): T | null {
  if (parsed !== null) return parsed;
  return locale === 'pt-BR' ? placeholder() : null;
}

function MissingPayload({ ptBrPayloadJson, onCopy }: { ptBrPayloadJson: string | null | undefined; onCopy: () => void }) {
  return (
    <div className={styles.section}>
      <p className={styles.muted}>Este idioma ainda não tem código.</p>
      <CopyFromPtBrButton disabled={!ptBrPayloadJson} onCopy={onCopy} />
    </div>
  );
}

/** Editor and Verify button of a `code_snippet` block, for one locale tab. */
export function CodeSnippetBlockEditor({
  locale,
  payloadJson,
  ptBrPayloadJson,
  onChange,
}: {
  locale: Locale;
  payloadJson: string | null | undefined;
  ptBrPayloadJson: string | null | undefined;
  /** Receives the new payload as the JSON text the API stores. */
  onChange: (payloadJson: string) => void;
}) {
  const payload = payloadForLocale<CodeSnippetPayloadData>(locale, parseSnippetPayload(payloadJson), placeholderSnippet);
  const copy = () => {
    if (ptBrPayloadJson) onChange(ptBrPayloadJson);
  };

  if (payload === null) return <MissingPayload ptBrPayloadJson={ptBrPayloadJson} onCopy={copy} />;
  return (
    <div className={styles.section}>
      {locale !== 'pt-BR' && <CopyFromPtBrButton disabled={!ptBrPayloadJson} onCopy={copy} />}
      <CodeSnippetForm value={payload} onChange={(next) => onChange(JSON.stringify(next))} />
      <VerifyButton kind="snippet" payload={payload} />
    </div>
  );
}

/** Editor and Verify button of the task part of a `code_exercise` block, for one locale tab. */
export function CodeExerciseBlockEditor({
  locale,
  kind,
  language,
  payloadJson,
  ptBrPayloadJson,
  onChange,
  onKindChange,
  onLanguageChange,
}: {
  locale: Locale;
  kind: CodeKind;
  language: Language;
  payloadJson: string | null | undefined;
  ptBrPayloadJson: string | null | undefined;
  onChange: (payloadJson: string) => void;
  onKindChange: (kind: CodeKind) => void;
  onLanguageChange: (language: Language) => void;
}) {
  const payload = payloadForLocale<CodeTaskPayloadData>(locale, parseTaskPayload(payloadJson), placeholderTask);
  const copy = () => {
    if (ptBrPayloadJson) onChange(ptBrPayloadJson);
  };

  if (payload === null) return <MissingPayload ptBrPayloadJson={ptBrPayloadJson} onCopy={copy} />;
  return (
    <div className={styles.section}>
      {locale !== 'pt-BR' && <CopyFromPtBrButton disabled={!ptBrPayloadJson} onCopy={copy} />}
      <CodeTaskForm
        kind={kind}
        language={language}
        value={payload}
        onChange={(next) => onChange(JSON.stringify(next))}
        onKindChange={onKindChange}
        onLanguageChange={onLanguageChange}
      />
      <VerifyButton kind="task" taskKind={kind} language={language} payload={payload} />
    </div>
  );
}
