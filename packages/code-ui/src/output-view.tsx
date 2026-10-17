// Type-only deep import: the code-runner barrel would pull the workers and engines into this graph.
import type { RunResult } from '@birb-learn/code-runner/src/protocol';
import type { RunPanelLabels } from './labels';
import { SqlGrid } from './sql-grid';
import styles from './output-view.module.css';

export interface OutputViewProps {
  result: RunResult;
  labels: RunPanelLabels;
}

interface StreamProps {
  heading: string;
  text: string;
  tone?: 'error';
}

// Everything the program or the runner produced is untrusted: it is only ever
// a React text child, never markup.
function Stream({ heading, text, tone }: StreamProps) {
  return (
    <section className={styles.section}>
      <h4 className={styles.heading}>{heading}</h4>
      <pre className={`${styles.stream} ${tone === 'error' ? styles.error : ''}`}>{text}</pre>
    </section>
  );
}

export function OutputView({ result, labels }: OutputViewProps) {
  const hasCompileOutput = Boolean(result.compileOutput);
  const hasCaseOutput = result.cases.some((c) => c.stdout || c.stderr || (c.sql && c.sql.resultSets.length > 0));
  return (
    <div className={styles.output} role="group" aria-label={labels.output}>
      {hasCompileOutput && <Stream heading={labels.compileError} text={result.compileOutput ?? ''} tone="error" />}
      {result.cases.map((caseResult, index) => (
        <div key={index} className={styles.case}>
          {caseResult.stdout && <Stream heading={labels.stdout} text={caseResult.stdout} />}
          {caseResult.sql?.resultSets.map((resultSet, setIndex) => <SqlGrid key={setIndex} resultSet={resultSet} labels={labels} />)}
          {caseResult.stderr && <Stream heading={labels.stderr} text={caseResult.stderr} tone="error" />}
        </div>
      ))}
      {!hasCompileOutput && !hasCaseOutput && <p className={styles.empty}>{labels.noOutput}</p>}
    </div>
  );
}
