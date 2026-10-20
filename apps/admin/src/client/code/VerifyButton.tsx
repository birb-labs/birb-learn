import { useEffect, useRef, useState } from 'react';
import { verifyCodeSnippet, verifyCodeTask, type VerifyIssue, type VerifyReport } from '@birb-learn/code-runner/src/verify';
// Deep imports: the content-schema barrel also exports the Drizzle queries, which must stay out of the browser bundle.
import type { CodeKind, Language } from '@birb-learn/content-schema/src/code-languages';
import {
  CodeSnippetPayload,
  CodeTaskPayload,
  formatZodIssues,
  validateCodeSnippet,
  validateCodeTask,
  type CodeSnippetPayloadData,
  type CodeTaskPayloadData,
} from '@birb-learn/content-schema/src/code-payloads';
import styles from './VerifyButton.module.css';

export type VerifyButtonProps =
  | { kind: 'snippet'; payload: CodeSnippetPayloadData }
  | { kind: 'task'; taskKind: CodeKind; language: Language; payload: CodeTaskPayloadData };

type State =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'done'; report: VerifyReport }
  | { phase: 'failed'; message: string };

const IDLE: State = { phase: 'idle' };

const SEVERITY_LABELS: Record<VerifyIssue['severity'], string> = { error: 'Erro', warning: 'Aviso' };

/** Splits the "path: message" lines the validators produce; a line without a path keeps an empty one. */
function toIssue(line: string): VerifyIssue {
  const separator = line.indexOf(': ');
  if (separator === -1) return { path: '', message: line, severity: 'error' };
  return { path: line.slice(0, separator), message: line.slice(separator + 2), severity: 'error' };
}

function invalidReport(lines: string[]): VerifyReport {
  return { issues: lines.map(toIssue), notVerified: [] };
}

/**
 * Checks the payload against its schema and cross-field rules, then runs its code to confirm it
 * does what the payload claims. A payload that fails the checks is reported without running anything.
 */
async function verify(props: VerifyButtonProps, signal: AbortSignal): Promise<VerifyReport> {
  if (props.kind === 'snippet') {
    const parsed = CodeSnippetPayload.safeParse(props.payload);
    if (!parsed.success) return invalidReport(formatZodIssues(parsed.error.issues, props.payload));
    const errors = validateCodeSnippet(parsed.data);
    if (errors.length > 0) return invalidReport(errors);
    return verifyCodeSnippet(parsed.data, await loadRunner(), { signal });
  }

  const parsed = CodeTaskPayload.safeParse(props.payload);
  if (!parsed.success) return invalidReport(formatZodIssues(parsed.error.issues, props.payload));
  const errors = validateCodeTask(props.taskKind, props.language, parsed.data);
  if (errors.length > 0) return invalidReport(errors);
  return verifyCodeTask(props.taskKind, props.language, parsed.data, await loadRunner(), { signal });
}

// The runner and its engine plumbing are only needed once an author verifies something, so they load on demand.
async function loadRunner() {
  const { getAdminRunner } = await import('./admin-runner');
  return getAdminRunner();
}

function ReportView({ report }: { report: VerifyReport }) {
  const clean = report.issues.length === 0;
  return (
    <div className={styles.report}>
      {clean && (
        <p className={styles.ok}>
          {report.notVerified.length === 0 ? 'Tudo certo' : 'Nenhum erro encontrado, mas parte do código não foi verificada.'}
        </p>
      )}
      {!clean && (
        <ul className={styles.issues}>
          {report.issues.map((issue, index) => (
            <li key={index} className={issue.severity === 'error' ? styles.error : styles.warning}>
              <strong>{SEVERITY_LABELS[issue.severity]}</strong>
              {issue.path !== '' && <code className={styles.path}>{issue.path}</code>}
              {/* Messages can carry the program's stderr or compiler output over several lines. */}
              <span className={styles.message} style={{ whiteSpace: 'pre-wrap' }}>
                {issue.message}
              </span>
            </li>
          ))}
        </ul>
      )}
      {report.notVerified.length > 0 && (
        <div>
          <p className={styles.notVerifiedTitle}>Não verificado</p>
          <ul className={styles.issues}>
            {report.notVerified.map((path, index) => (
              <li key={index}>
                <code className={styles.path}>{path}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Runs the payload's code in the author's browser (Web Workers, plus Compiler Explorer for the
 * compiled languages) and lists what does not behave as the payload claims. Its result is dropped when
 * the payload changes, and a run in flight is aborted then and when the button unmounts.
 */
export function VerifyButton(props: VerifyButtonProps) {
  const [state, setState] = useState<State>(IDLE);
  const controllerRef = useRef<AbortController | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  const inputKey = JSON.stringify(props);

  // Whatever was verified is stale once the payload changes.
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
      setState(IDLE);
    };
  }, [inputKey]);

  async function handleVerify() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ phase: 'running' });
    try {
      const report = await verify(propsRef.current, controller.signal);
      if (!controller.signal.aborted) setState({ phase: 'done', report });
    } catch (error) {
      if (!controller.signal.aborted) {
        setState({ phase: 'failed', message: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  return (
    <div className={styles.verify}>
      <button type="button" className={styles.button} disabled={state.phase === 'running'} onClick={handleVerify}>
        {state.phase === 'running' ? 'Verificando…' : 'Verificar'}
      </button>
      <div role="status" aria-live="polite">
        {state.phase === 'done' && <ReportView report={state.report} />}
        {state.phase === 'failed' && <p className={styles.error}>Falha ao verificar: {state.message}</p>}
      </div>
    </div>
  );
}
