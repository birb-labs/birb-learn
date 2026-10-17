'use client';

import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from 'react';
// Deep imports: the code-runner barrel would pull the workers and engines into this graph.
import { composeSource, gradeCodeTask, type CodeAnswer, type CodeGradeResult } from '@birb-learn/code-runner/src/grading';
import { LANGUAGE_INFO } from '@birb-learn/code-runner/src/languages';
import type { Runner, UnavailableReason } from '@birb-learn/code-runner/src/protocol';
import type { CodeKind, Language } from '@birb-learn/content-schema/src/code-languages';
import type { CodeTaskPayloadData } from '@birb-learn/content-schema/src/code-payloads';
import { CodeEditor } from './code-editor';
import { CodeLines } from './code-lines';
import type { HighlightedLine, HighlightedToken } from './highlight';
import type { CodeTaskLabels } from './labels';
import { RunPanel } from './run-panel';
import styles from './code-task-view.module.css';

export interface CodeTaskViewProps {
  /** `practice` can check, hint and reveal the solution; `exam` only reports the answer. */
  mode: 'practice' | 'exam';
  kind: CodeKind;
  language: Language;
  /** `payload.starterCode`, highlighted. */
  starterTokens: HighlightedLine[];
  payload: CodeTaskPayloadData;
  /** The prompt, rendered by the caller (it is rich MDX or HTML that this package knows nothing about). */
  prompt: ReactNode;
  /** The explanation shown with the solution (practice mode). */
  resolution?: ReactNode;
  /** The hints, revealed one at a time (practice mode). */
  hints?: ReactNode[];
  /** `payload.solution`, highlighted (practice mode). */
  solutionTokens?: HighlightedLine[];
  /** The stored answer. Without it the view starts from the starter code. */
  answer?: CodeAnswer;
  onAnswerChange?: (answer: CodeAnswer) => void;
  runner: Runner;
  labels: CodeTaskLabels;
}

interface CheckOutcome {
  result: CodeGradeResult;
  /** Why the tests could not run; meaningful for `not_graded`. */
  reason: UnavailableReason;
}

const BLANK_MARKER_PATTERN = /___(\d+)___/g;
const BLANK_SPLIT_PATTERN = /(___\d+___)/;
const BLANK_EXACT_PATTERN = /^___(\d+)___$/;

function defaultAnswer(kind: CodeKind, payload: CodeTaskPayloadData): CodeAnswer {
  switch (kind) {
    case 'write':
      return { kind, code: payload.starterCode };
    case 'predict_output':
      return { kind, output: '' };
    case 'fill_blank':
      return { kind, blanks: {} };
    case 'find_bug':
      // Line 0 is "none chosen yet".
      return { kind, line: 0, code: payload.starterCode };
  }
}

/** Joins the tokens that a `___n___` marker was split across, so the marker is one token. */
function mergeBlankTokens(line: HighlightedLine): HighlightedLine {
  const text = line.map((token) => token.text).join('');
  const markers = [...text.matchAll(BLANK_MARKER_PATTERN)].map((match) => ({ start: match.index, end: match.index + match[0].length }));
  if (markers.length === 0) return line;
  const merged: HighlightedToken[] = [];
  let offset = 0;
  for (const token of line) {
    const insideMarker = markers.some((marker) => marker.start < offset && offset < marker.end);
    if (insideMarker && merged.length > 0) merged[merged.length - 1] = { ...merged[merged.length - 1], text: merged[merged.length - 1].text + token.text };
    else merged.push(token);
    offset += token.text.length;
  }
  return merged;
}

function lineText(line: HighlightedLine): string {
  return line
    .map((token) => token.text)
    .join('')
    .trim();
}

export function CodeTaskView({
  mode,
  kind,
  language,
  starterTokens,
  payload,
  prompt,
  resolution,
  hints = [],
  solutionTokens,
  answer: answerProp,
  onAnswerChange,
  runner,
  labels,
}: CodeTaskViewProps) {
  const practice = mode === 'practice';
  const idBase = useId();
  const languageLabel = LANGUAGE_INFO[language].label;

  // The view keeps its own copy of the answer, so it works without a parent that stores it;
  // a new answer from the parent replaces the copy.
  const [answer, setAnswer] = useState<CodeAnswer>(() => (answerProp?.kind === kind ? answerProp : defaultAnswer(kind, payload)));
  const [seenAnswerProp, setSeenAnswerProp] = useState(answerProp);
  if (answerProp !== seenAnswerProp) {
    setSeenAnswerProp(answerProp);
    if (answerProp?.kind === kind) setAnswer(answerProp);
  }

  const [checking, setChecking] = useState(false);
  const [outcome, setOutcome] = useState<CheckOutcome | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [solutionOpen, setSolutionOpen] = useState(false);
  // The in-flight check's controller; cleared as soon as that check is cancelled or settled.
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    },
    [],
  );

  function changeAnswer(next: CodeAnswer) {
    // A result belongs to the answer it graded.
    controllerRef.current?.abort();
    controllerRef.current = null;
    setChecking(false);
    setOutcome(null);
    setAnswer(next);
    onAnswerChange?.(next);
  }

  async function check() {
    if (controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setChecking(true);
    setOutcome(null);

    // The grader reports only that the tests could not run; the reason is read off the runner's own results.
    let reason: UnavailableReason | undefined;
    const observingRunner: Runner = {
      async runCode(request, options) {
        const run = await runner.runCode(request, options);
        if (run.status === 'unavailable') reason ??= run.reason;
        return run;
      },
    };

    let next: CheckOutcome;
    try {
      const result = await gradeCodeTask(kind, language, payload, answer, observingRunner, { signal: controller.signal });
      next = { result, reason: reason ?? 'service_error' };
    } catch {
      // The runner contract is to resolve; a rejection is a bug on its side, shown as a failed service.
      next = { result: { verdict: 'not_graded', tests: [] }, reason: 'service_error' };
    }

    // A cancelled or unmounted check no longer owns the view.
    if (controllerRef.current !== controller || controller.signal.aborted) return;
    controllerRef.current = null;
    setChecking(false);
    setOutcome(next);
  }

  const lines = kind === 'fill_blank' ? starterTokens.map(mergeBlankTokens) : starterTokens;
  const codeRegionLabel = labels.codeRegion(languageLabel);
  const sqlSetup = payload.tests.map((test) => ('expectedRows' in test ? test.sqlSetup : undefined)).find((setup) => setup !== undefined);

  function renderBlankToken(token: HighlightedToken, _lineIndex: number, tokenIndex: number): ReactNode {
    const style = { color: token.color, fontStyle: token.fontStyle === 'italic' ? ('italic' as const) : undefined, fontWeight: token.fontStyle === 'bold' ? ('bold' as const) : undefined };
    return (
      <Fragment key={tokenIndex}>
        {token.text.split(BLANK_SPLIT_PATTERN).map((part, partIndex) => {
          const id = BLANK_EXACT_PATTERN.exec(part)?.[1];
          if (id === undefined) {
            return part === '' ? null : (
              <span key={partIndex} style={style}>
                {part}
              </span>
            );
          }
          const blankId = Number(id);
          const value = answer.kind === 'fill_blank' ? (answer.blanks[blankId] ?? '') : '';
          const wrong = outcome?.result.blanksCorrect?.[blankId] === false;
          return (
            <input
              key={partIndex}
              type="text"
              className={styles.blank}
              style={{ width: `${Math.max(value.length, 3) + 1}ch` }}
              value={value}
              aria-label={labels.blank(blankId)}
              aria-invalid={wrong ? true : undefined}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              onChange={(event) => answer.kind === 'fill_blank' && changeAnswer({ kind: 'fill_blank', blanks: { ...answer.blanks, [blankId]: event.target.value } })}
            />
          );
        })}
      </Fragment>
    );
  }

  const editorSource = (code: string) => composeSource(code, payload.harness);

  let body: ReactNode = null;
  if (answer.kind === 'write') {
    body = (
      <>
        <CodeEditor value={answer.code} onChange={(code) => changeAnswer({ kind: 'write', code })} language={language} ariaLabel={labels.writeEditor} />
        <RunPanel runner={runner} language={language} source={editorSource(answer.code)} sqlSetup={sqlSetup} showStdin labels={labels.run} />
      </>
    );
  } else if (answer.kind === 'predict_output') {
    body = (
      <>
        <CodeLines lines={lines} lineNumbers ariaLabel={codeRegionLabel} />
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{labels.predictAnswer}</span>
          <textarea
            className={styles.textarea}
            rows={3}
            spellCheck={false}
            value={answer.output}
            onChange={(event) => changeAnswer({ kind: 'predict_output', output: event.target.value })}
          />
        </label>
      </>
    );
  } else if (answer.kind === 'fill_blank') {
    body = <CodeLines lines={lines} lineNumbers ariaLabel={codeRegionLabel} renderToken={renderBlankToken} />;
  } else {
    const buggy = answer;
    body = (
      <>
        <p className={styles.instruction}>{labels.chooseBugLine}</p>
        <CodeLines
          lines={lines}
          lineNumbers
          ariaLabel={codeRegionLabel}
          selectedLine={buggy.line > 0 ? buggy.line : undefined}
          onLineClick={(line) => changeAnswer({ ...buggy, line })}
          lineLabel={(line) => labels.line(line, lineText(lines[line - 1] ?? []))}
        />
        {payload.tests.length > 0 && (
          <>
            <p className={styles.instruction}>{labels.fixTheCode}</p>
            <CodeEditor value={buggy.code} onChange={(code) => changeAnswer({ ...buggy, code })} language={language} ariaLabel={labels.fixEditor} />
            <RunPanel runner={runner} language={language} source={editorSource(buggy.code)} sqlSetup={sqlSetup} showStdin labels={labels.run} />
          </>
        )}
      </>
    );
  }

  const hasSolution = solutionTokens !== undefined || resolution !== undefined;
  const solutionId = `${idBase}-solution`;
  const testsHeadingId = `${idBase}-tests`;
  const result = outcome?.result;

  return (
    <div className={styles.root}>
      <div className={styles.prompt}>{prompt}</div>
      {body}

      {practice && (
        <div className={styles.toolbar}>
          <button type="button" className={`${styles.button} ${styles.primary}`} disabled={checking} onClick={() => void check()}>
            {checking ? labels.checking : labels.check}
          </button>
        </div>
      )}

      {/* Always rendered, so a screen reader hears the verdict being added to a live region. */}
      <div role="status" className={styles.verdictRegion}>
        {result && (
          <div className={styles.result} data-verdict={result.verdict}>
            <p className={styles.verdict}>{labels.verdict[result.verdict]}</p>
            {result.verdict === 'not_graded' && <p className={styles.reason}>{labels.run.unavailable[outcome.reason]}</p>}
            {result.lineCorrect !== undefined && <p className={styles.detail}>{result.lineCorrect ? labels.lineCorrect : labels.lineIncorrect}</p>}
            {result.blanksCorrect && (
              <ul className={styles.blankResults}>
                {Object.entries(result.blanksCorrect).map(([id, correct]) => (
                  <li key={id} data-correct={correct ? '' : undefined}>
                    {correct ? labels.blankCorrect(Number(id)) : labels.blankIncorrect(Number(id))}
                  </li>
                ))}
              </ul>
            )}
            {result.compileOutput && (
              <section>
                <h4 className={styles.heading}>{labels.run.compileError}</h4>
                {/* Everything the program or the runner produced is untrusted: only ever a text child. */}
                <pre className={`${styles.stream} ${styles.error}`} tabIndex={0}>
                  {result.compileOutput}
                </pre>
              </section>
            )}
            {result.tests.length > 0 && (
              <section>
                <h4 id={testsHeadingId} className={styles.heading}>
                  {labels.tests}
                </h4>
                <ul aria-labelledby={testsHeadingId} className={styles.tests}>
                  {result.tests.map((test, index) => (
                    <li key={index} className={styles.test} data-passed={test.passed ? '' : undefined}>
                      <p className={styles.testHeader}>
                        <span className={styles.testName}>{test.name ?? labels.testName(index + 1)}</span>
                        <span className={styles.testState}>{test.passed ? labels.testPassed : labels.testFailed}</span>
                        {!test.passed && test.status !== 'ok' && test.status !== 'compile_error' && (
                          <span className={styles.testStatus}>{labels.run.status[test.status]}</span>
                        )}
                      </p>
                      {!test.passed && test.status !== 'compile_error' && (
                        <div className={styles.comparison}>
                          <div>
                            <h5 className={styles.heading}>{labels.expected}</h5>
                            <pre className={styles.stream} tabIndex={0}>
                              {test.expected}
                            </pre>
                          </div>
                          <div>
                            <h5 className={styles.heading}>{labels.actual}</h5>
                            <pre className={styles.stream} tabIndex={0}>
                              {test.actual === '' ? labels.run.noOutput : test.actual}
                            </pre>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>

      {practice && hints.length > 0 && (
        <section className={styles.hints}>
          {hints.slice(0, hintsShown).map((hint, index) => (
            <div key={index} className={styles.hint}>
              <p className={styles.hintTitle}>{labels.hintTitle(index + 1)}</p>
              {hint}
            </div>
          ))}
          {hintsShown < hints.length && (
            <div className={styles.toolbar}>
              <button type="button" className={styles.button} onClick={() => setHintsShown((shown) => shown + 1)}>
                {labels.showHint(hintsShown + 1, hints.length)}
              </button>
            </div>
          )}
        </section>
      )}

      {practice && hasSolution && (
        <section className={styles.solution}>
          <div className={styles.toolbar}>
            <button type="button" className={styles.button} aria-expanded={solutionOpen} aria-controls={solutionId} onClick={() => setSolutionOpen((open) => !open)}>
              {solutionOpen ? labels.hideSolution : labels.showSolution}
            </button>
          </div>
          <div id={solutionId} hidden={!solutionOpen} className={styles.solutionBody}>
            {solutionOpen && solutionTokens && (
              <>
                <h4 className={styles.heading}>{labels.solution}</h4>
                <CodeLines lines={solutionTokens} lineNumbers ariaLabel={codeRegionLabel} />
              </>
            )}
            {solutionOpen && resolution !== undefined && (
              <>
                <h4 className={styles.heading}>{labels.explanation}</h4>
                <div className={styles.prompt}>{resolution}</div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
