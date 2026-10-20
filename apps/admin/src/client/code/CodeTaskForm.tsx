import { CodeEditor } from '@birb-learn/code-ui/editor';
import { LANGUAGE_INFO } from '@birb-learn/code-runner/src/languages';
// Deep imports: the content-schema barrel also exports the Drizzle queries, which must stay out of the browser bundle.
import {
  CODE_KINDS,
  isReadOnlyCodeLanguage,
  isSqlLanguage,
  LANGUAGES,
  type CodeKind,
  type Language,
} from '@birb-learn/content-schema/src/code-languages';
import type { CodeTaskPayloadData } from '@birb-learn/content-schema/src/code-payloads';
import { MdxEditor } from '../components/MdxEditor';
import { moveItem, removeAt, replaceAt } from './list-utils';
import { RowControls } from './RowControls';
import { placeholderTest, syncBlanks, type CodeTaskTests } from './task-payload';
import styles from './CodeForms.module.css';

const KIND_LABELS: Record<CodeKind, string> = {
  write: 'Escrever código',
  predict_output: 'Prever a saída',
  fill_blank: 'Completar lacunas',
  find_bug: 'Encontrar o erro',
};

const STARTER_LABELS: Record<CodeKind, string> = {
  write: 'Código inicial',
  predict_output: 'Código a analisar',
  fill_blank: 'Código com lacunas',
  find_bug: 'Código com erro',
};

type Test = CodeTaskTests[number];
type IoTest = Extract<Test, { expectedStdout: string }>;
type SqlTest = Extract<Test, { expectedRows: unknown }>;

function isSqlTest(test: Test): test is SqlTest {
  return 'expectedRows' in test;
}

function withName<T extends { name?: string }>(test: T, name: string): T {
  const { name: _previous, ...rest } = test;
  return (name === '' ? rest : { ...rest, name }) as T;
}

function IoTestEditor({ test, number, onChange }: { test: IoTest; number: number; onChange: (test: IoTest) => void }) {
  return (
    <div className={styles.rowBody}>
      <input
        className={styles.input}
        aria-label={`Nome do teste ${number}`}
        placeholder="Nome (opcional)"
        value={test.name ?? ''}
        onChange={(event) => onChange(withName(test, event.target.value))}
      />
      <textarea
        className={styles.textarea}
        aria-label={`Entrada do teste ${number}`}
        placeholder="Entrada (stdin)"
        value={test.stdin}
        onChange={(event) => onChange({ ...test, stdin: event.target.value })}
      />
      <textarea
        className={styles.textarea}
        aria-label={`Saída esperada do teste ${number}`}
        placeholder="Saída esperada (stdout)"
        value={test.expectedStdout}
        onChange={(event) => onChange({ ...test, expectedStdout: event.target.value })}
      />
    </div>
  );
}

function SqlTestEditor({
  test,
  number,
  language,
  onChange,
}: {
  test: SqlTest;
  number: number;
  language: Language;
  onChange: (test: SqlTest) => void;
}) {
  const { columns, rows } = test.expectedRows;

  function setRows(next: { columns?: string[]; rows?: (string | null)[][] }) {
    onChange({ ...test, expectedRows: { columns: next.columns ?? columns, rows: next.rows ?? rows } });
  }

  return (
    <div className={styles.rowBody}>
      <input
        className={styles.input}
        aria-label={`Nome do teste ${number}`}
        placeholder="Nome (opcional)"
        value={test.name ?? ''}
        onChange={(event) => onChange(withName(test, event.target.value))}
      />
      <CodeEditor
        ariaLabel={`Preparação SQL do teste ${number}`}
        language={language}
        minLines={2}
        value={test.sqlSetup}
        onChange={(sqlSetup) => onChange({ ...test, sqlSetup })}
      />
      <label className={styles.inline}>
        <input
          type="checkbox"
          aria-label={`Ordem importa no teste ${number}`}
          checked={test.orderMatters}
          onChange={(event) => onChange({ ...test, orderMatters: event.target.checked })}
        />
        A ordem das linhas importa
      </label>

      <table className={styles.grid}>
        <thead>
          <tr>
            {columns.map((column, columnIndex) => (
              <th key={columnIndex}>
                <div className={styles.cell}>
                  <input
                    className={`${styles.input} ${styles.cellInput}`}
                    aria-label={`Coluna ${columnIndex + 1} do teste ${number}`}
                    value={column}
                    onChange={(event) => setRows({ columns: replaceAt(columns, columnIndex, event.target.value) })}
                  />
                  <button
                    type="button"
                    aria-label={`Remover coluna ${columnIndex + 1} do teste ${number}`}
                    disabled={columns.length === 1}
                    onClick={() =>
                      setRows({ columns: removeAt(columns, columnIndex), rows: rows.map((row) => removeAt(row, columnIndex)) })
                    }
                  >
                    ×
                  </button>
                </div>
              </th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((_, columnIndex) => {
                // `null` is an SQL NULL cell; a row shorter than the header is padded with empty strings.
                const cell = row[columnIndex] === undefined ? '' : row[columnIndex];
                const position = `Teste ${number}, linha ${rowIndex + 1}, coluna ${columnIndex + 1}`;
                const setCell = (value: string | null) =>
                  setRows({ rows: replaceAt(rows, rowIndex, replaceAt(row, columnIndex, value)) });
                return (
                  <td key={columnIndex}>
                    <div className={styles.cell}>
                      <input
                        className={`${styles.input} ${styles.cellInput}`}
                        aria-label={position}
                        disabled={cell === null}
                        value={cell ?? ''}
                        onChange={(event) => setCell(event.target.value)}
                      />
                      <label className={styles.inline}>
                        <input
                          type="checkbox"
                          aria-label={`${position} é NULL`}
                          checked={cell === null}
                          onChange={(event) => setCell(event.target.checked ? null : '')}
                        />
                        NULL
                      </label>
                    </div>
                  </td>
                );
              })}
              <td>
                <button
                  type="button"
                  aria-label={`Remover linha ${rowIndex + 1} do teste ${number}`}
                  onClick={() => setRows({ rows: removeAt(rows, rowIndex) })}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <span className={styles.inline}>
        <button
          type="button"
          className={styles.addButton}
          aria-label={`Adicionar coluna ao teste ${number}`}
          onClick={() => setRows({ columns: [...columns, ''], rows: rows.map((row) => [...row, '']) })}
        >
          Adicionar coluna
        </button>
        <button
          type="button"
          className={styles.addButton}
          aria-label={`Adicionar linha ao teste ${number}`}
          onClick={() => setRows({ rows: [...rows, columns.map(() => '')] })}
        >
          Adicionar linha
        </button>
      </span>
    </div>
  );
}

function BlanksEditor({
  blanks,
  onChange,
}: {
  blanks: CodeTaskPayloadData['blanks'];
  onChange: (blanks: CodeTaskPayloadData['blanks']) => void;
}) {
  return (
    <div className={styles.section}>
      <span className={styles.sectionTitle}>Lacunas</span>
      {blanks.length === 0 && <p className={styles.muted}>Escreva ___1___, ___2___... no código para criar lacunas.</p>}
      {blanks.map((blank, blankIndex) => (
        <div key={blank.id} className={styles.card}>
          <span className={styles.cardTitle}>Lacuna {blank.id}</span>
          {blank.accepted.map((answer, answerIndex) => (
            <div key={answerIndex} className={styles.row}>
              <input
                className={`${styles.input} ${styles.rowBody}`}
                aria-label={`Respostas aceitas da lacuna ${blank.id} (${answerIndex + 1})`}
                value={answer}
                onChange={(event) =>
                  onChange(replaceAt(blanks, blankIndex, { ...blank, accepted: replaceAt(blank.accepted, answerIndex, event.target.value) }))
                }
              />
              <button
                type="button"
                aria-label={`Remover resposta aceita ${answerIndex + 1} da lacuna ${blank.id}`}
                disabled={blank.accepted.length === 1}
                onClick={() => onChange(replaceAt(blanks, blankIndex, { ...blank, accepted: removeAt(blank.accepted, answerIndex) }))}
              >
                Remover
              </button>
            </div>
          ))}
          <button
            type="button"
            className={styles.addButton}
            aria-label={`Adicionar resposta aceita da lacuna ${blank.id}`}
            onClick={() => onChange(replaceAt(blanks, blankIndex, { ...blank, accepted: [...blank.accepted, ''] }))}
          >
            Adicionar resposta aceita
          </button>
        </div>
      ))}
    </div>
  );
}

/** Drops the harness when both halves are empty, since the payload only carries a harness that has content. */
function withHarness(payload: CodeTaskPayloadData, prefix: string, suffix: string): CodeTaskPayloadData {
  const { harness: _previous, ...rest } = payload;
  return prefix === '' && suffix === '' ? rest : { ...rest, harness: { prefix, suffix } };
}

/**
 * Edits the payload of a code task (spec §8.1). Only the fields the `kind` uses are shown.
 * The kind and the language are owned by the caller, which reshapes the payloads when they change
 * (see `adaptTaskPayload`).
 */
export function CodeTaskForm({
  kind,
  language,
  value,
  onChange,
  onKindChange,
  onLanguageChange,
}: {
  kind: CodeKind;
  language: Language;
  value: CodeTaskPayloadData;
  onChange: (value: CodeTaskPayloadData) => void;
  onKindChange: (kind: CodeKind) => void;
  onLanguageChange: (language: Language) => void;
}) {
  const sql = isSqlLanguage(language);
  // A predict_output task only shows code: no solution, harness or tests.
  const gradedByTests = kind !== 'predict_output';

  function changeStarter(starterCode: string) {
    onChange({ ...value, starterCode, ...(kind === 'fill_blank' ? { blanks: syncBlanks(starterCode, value.blanks) } : {}) });
  }

  function changeTest(index: number, test: Test) {
    onChange({ ...value, tests: replaceAt(value.tests, index, test) });
  }

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="code-task-kind">Tipo de tarefa</label>
        <select
          id="code-task-kind"
          className={styles.select}
          value={kind}
          onChange={(event) => onKindChange(event.target.value as CodeKind)}
        >
          {CODE_KINDS.map((codeKind) => (
            <option key={codeKind} value={codeKind}>
              {KIND_LABELS[codeKind]}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="code-task-language">Linguagem</label>
        <select
          id="code-task-language"
          className={styles.select}
          value={language}
          onChange={(event) => onLanguageChange(event.target.value as Language)}
        >
          {LANGUAGES.map((candidate) => (
            <option key={candidate} value={candidate} disabled={gradedByTests && isReadOnlyCodeLanguage(candidate)}>
              {LANGUAGE_INFO[candidate].label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <span className={styles.sectionTitle}>{STARTER_LABELS[kind]}</span>
        <CodeEditor ariaLabel={STARTER_LABELS[kind]} language={language} value={value.starterCode} onChange={changeStarter} />
      </div>

      {kind === 'predict_output' && (
        <div className={styles.field}>
          <label htmlFor="code-task-expected-output">Saída esperada</label>
          <textarea
            id="code-task-expected-output"
            className={styles.textarea}
            value={value.expectedOutput ?? ''}
            onChange={(event) => onChange({ ...value, expectedOutput: event.target.value })}
          />
        </div>
      )}

      {kind === 'fill_blank' && <BlanksEditor blanks={value.blanks} onChange={(blanks) => onChange({ ...value, blanks })} />}

      {kind === 'find_bug' && (
        <div className={styles.field}>
          <label htmlFor="code-task-bug-lines">Linhas com erro</label>
          <input
            id="code-task-bug-lines"
            className={`${styles.input} ${styles.linesInput}`}
            placeholder="3 ou 3-5"
            value={value.bugLines ?? ''}
            onChange={(event) => {
              const { bugLines: _previous, ...rest } = value;
              onChange(event.target.value === '' ? rest : { ...rest, bugLines: event.target.value });
            }}
          />
        </div>
      )}

      {gradedByTests && (
        <div className={styles.field}>
          <span className={styles.sectionTitle}>Solução</span>
          <CodeEditor
            ariaLabel="Solução"
            language={language}
            value={value.solution ?? ''}
            onChange={(solution) => onChange({ ...value, solution })}
          />
        </div>
      )}

      {gradedByTests && (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Harness (opcional)</span>
          <CodeEditor
            ariaLabel="Prefixo do harness"
            language={language}
            minLines={2}
            value={value.harness?.prefix ?? ''}
            onChange={(prefix) => onChange(withHarness(value, prefix, value.harness?.suffix ?? ''))}
          />
          <CodeEditor
            ariaLabel="Sufixo do harness"
            language={language}
            minLines={2}
            value={value.harness?.suffix ?? ''}
            onChange={(suffix) => onChange(withHarness(value, value.harness?.prefix ?? '', suffix))}
          />
        </div>
      )}

      {gradedByTests && (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Testes</span>
          {value.tests.map((test, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.row}>
                {isSqlTest(test) ? (
                  <SqlTestEditor test={test} number={index + 1} language={language} onChange={(next) => changeTest(index, next)} />
                ) : (
                  <IoTestEditor test={test} number={index + 1} onChange={(next) => changeTest(index, next)} />
                )}
                <RowControls
                  label={`teste ${index + 1}`}
                  index={index}
                  count={value.tests.length}
                  onMove={(direction) => onChange({ ...value, tests: moveItem(value.tests, index, direction) })}
                  onRemove={() => onChange({ ...value, tests: removeAt(value.tests, index) })}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            className={styles.addButton}
            onClick={() => onChange({ ...value, tests: [...value.tests, placeholderTest(language)] })}
          >
            Adicionar teste
          </button>
          {sql && <p className={styles.muted}>Testes de SQL comparam o conjunto de linhas devolvido pela consulta.</p>}
        </div>
      )}

      <div className={styles.section}>
        <span className={styles.sectionTitle}>Dicas</span>
        {value.hints.map((hint, index) => (
          <div key={index} className={styles.row}>
            <div className={styles.rowBody}>
              <MdxEditor
                label={`Dica ${index + 1}`}
                value={hint}
                onChange={(next) => onChange({ ...value, hints: replaceAt(value.hints, index, next) })}
              />
            </div>
            <RowControls
              label={`dica ${index + 1}`}
              index={index}
              count={value.hints.length}
              onMove={(direction) => onChange({ ...value, hints: moveItem(value.hints, index, direction) })}
              onRemove={() => onChange({ ...value, hints: removeAt(value.hints, index) })}
            />
          </div>
        ))}
        <button type="button" className={styles.addButton} onClick={() => onChange({ ...value, hints: [...value.hints, 'Nova dica.'] })}>
          Adicionar dica
        </button>
      </div>
    </div>
  );
}
