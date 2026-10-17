'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { CodeLines, parseCodeAnswer, type CodeTaskLabels } from '@birb-learn/code-ui';
// Deep import: the code-runner barrel would pull the workers and engines into this graph.
import { LANGUAGE_INFO } from '@birb-learn/code-runner/src/languages';
import { verdictOf, type GradedQuestionResult } from '@/lib/grade-simulado';
import type { ExportedCodeTask } from '@/lib/export-question';
import resultStyles from './simulado-results.module.css';
import styles from './simulado-code-review.module.css';

/**
 * The review of a `code` question on the results screen: the student's answer,
 * the outcome of every test, the correct answer and the highlighted solution.
 * Everything the student typed or the program printed is untrusted: it is only
 * ever rendered as a text child, never as HTML.
 */
export function SimuladoCodeReview({
  entry,
  task,
  labels,
}: {
  entry: GradedQuestionResult;
  task: ExportedCodeTask;
  labels: CodeTaskLabels;
}) {
  const t = useTranslations('simulado.results');
  const tTaking = useTranslations('simulado.taking');
  const testsHeadingId = useId();
  const answer = parseCodeAnswer(task.kind, entry.userAnswer);
  const grade = entry.code;
  const verdict = verdictOf(entry);
  const { payload } = task;

  let yourAnswer: React.ReactNode = <span>{tTaking('unanswered')}</span>;
  if (answer?.kind === 'write') {
    yourAnswer = <pre className={styles.text}>{answer.code}</pre>;
  } else if (answer?.kind === 'predict_output') {
    yourAnswer = <pre className={styles.text}>{answer.output}</pre>;
  } else if (answer?.kind === 'fill_blank') {
    yourAnswer = (
      <ul className={styles.items}>
        {payload.blanks.map((blank) => (
          <li key={blank.id}>{`${labels.blank(blank.id)}: ${answer.blanks[blank.id] ?? ''}`}</li>
        ))}
      </ul>
    );
  } else if (answer?.kind === 'find_bug') {
    yourAnswer = (
      <>
        <span>{answer.line > 0 ? t('chosenLine', { line: answer.line }) : t('noLineChosen')}</span>
        {payload.tests.length > 0 && <pre className={styles.text}>{answer.code}</pre>}
      </>
    );
  }

  let correctAnswer: React.ReactNode = null;
  if (task.kind === 'predict_output') {
    correctAnswer = <pre className={styles.text}>{payload.expectedOutput ?? ''}</pre>;
  } else if (task.kind === 'fill_blank') {
    correctAnswer = (
      <ul className={styles.items}>
        {payload.blanks.map((blank) => (
          <li key={blank.id}>{`${labels.blank(blank.id)}: ${blank.accepted.join(' / ')}`}</li>
        ))}
      </ul>
    );
  } else if (task.kind === 'find_bug' && payload.bugLines !== undefined) {
    correctAnswer = <span>{t('bugLines', { lines: payload.bugLines })}</span>;
  }

  return (
    <div className={styles.review}>
      {verdict === 'not_graded' && entry.notGraded && (
        <p className={styles.reason}>{labels.run.unavailable[entry.notGraded.reason]}</p>
      )}

      <div className={resultStyles.answers}>
        <strong>{t('yourAnswer')}:</strong> {yourAnswer}
      </div>

      {grade?.lineCorrect !== undefined && (
        <p className={styles.detail}>{grade.lineCorrect ? labels.lineCorrect : labels.lineIncorrect}</p>
      )}
      {grade?.blanksCorrect && (
        <ul className={styles.items}>
          {Object.entries(grade.blanksCorrect).map(([id, correct]) => (
            <li key={id} data-correct={correct ? '' : undefined}>
              {correct ? labels.blankCorrect(Number(id)) : labels.blankIncorrect(Number(id))}
            </li>
          ))}
        </ul>
      )}
      {grade?.compileOutput && (
        <section>
          <h4 className={styles.heading}>{labels.run.compileError}</h4>
          <pre className={`${styles.text} ${styles.error}`}>{grade.compileOutput}</pre>
        </section>
      )}
      {grade && grade.tests.length > 0 && (
        <section>
          <h4 id={testsHeadingId} className={styles.heading}>
            {labels.tests}
          </h4>
          <ul aria-labelledby={testsHeadingId} className={styles.tests}>
            {grade.tests.map((test, index) => (
              <li key={index} className={styles.test} data-passed={test.passed ? '' : undefined}>
                <p className={styles.testHeader}>
                  <span className={styles.testName}>{test.name ?? labels.testName(index + 1)}</span>
                  <span>{test.passed ? labels.testPassed : labels.testFailed}</span>
                  {!test.passed && test.status !== 'ok' && test.status !== 'compile_error' && (
                    <span>{labels.run.status[test.status]}</span>
                  )}
                </p>
                {!test.passed && test.status !== 'compile_error' && (
                  <div className={styles.comparison}>
                    <div>
                      <h5 className={styles.heading}>{labels.expected}</h5>
                      <pre className={styles.text}>{test.expected}</pre>
                    </div>
                    <div>
                      <h5 className={styles.heading}>{labels.actual}</h5>
                      <pre className={styles.text}>{test.actual === '' ? labels.run.noOutput : test.actual}</pre>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {verdict !== 'correct' && correctAnswer && (
        <div className={resultStyles.answers}>
          <strong>{t('correctAnswer')}:</strong> {correctAnswer}
        </div>
      )}

      {task.solutionTokens.length > 0 && (
        <section>
          <h4 className={styles.heading}>{labels.solution}</h4>
          <CodeLines lines={task.solutionTokens} lineNumbers ariaLabel={labels.codeRegion(LANGUAGE_INFO[task.language].label)} />
        </section>
      )}
    </div>
  );
}
