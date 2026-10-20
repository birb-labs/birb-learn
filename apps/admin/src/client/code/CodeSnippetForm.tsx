import { CodeEditor } from '@birb-learn/code-ui/editor';
import { LANGUAGE_INFO } from '@birb-learn/code-runner/src/languages';
// Deep imports: the content-schema barrel also exports the Drizzle queries, which must stay out of the browser bundle.
import { isReadOnlyCodeLanguage, isSqlLanguage, LANGUAGES, type Language } from '@birb-learn/content-schema/src/code-languages';
import type { CodeSnippetPayloadData } from '@birb-learn/content-schema/src/code-payloads';
import { MdxEditor } from '../components/MdxEditor';
import { moveItem, removeAt, replaceAt } from './list-utils';
import { RowControls } from './RowControls';
import styles from './CodeForms.module.css';

type Variant = CodeSnippetPayloadData['variants'][number];
type LineNote = Variant['annotations'][number];
type OptionalTextKey = 'stdin' | 'sqlSetup' | 'expectedOutput';

/** Sets an optional text field, or drops it when the author empties it. */
function withOptionalText(variant: Variant, key: OptionalTextKey, text: string): Variant {
  const { [key]: _previous, ...rest } = variant;
  return text === '' ? rest : { ...rest, [key]: text };
}

function newVariant(language: Language): Variant {
  return { language, code: LANGUAGE_INFO[language].template, annotations: [], walkthrough: [], runnable: false };
}

/** Rows of `lines` + MDX (annotations and walkthrough steps) with add, remove and reorder. */
function LineNotesEditor({
  variantNumber,
  title,
  noteLabel,
  addLabel,
  notes,
  placeholder,
  onChange,
}: {
  variantNumber: number;
  title: string;
  /** Singular, lowercase name of one row: "anotação". */
  noteLabel: string;
  addLabel: string;
  notes: LineNote[];
  placeholder: string;
  onChange: (notes: LineNote[]) => void;
}) {
  return (
    <div className={styles.section}>
      <span className={styles.sectionTitle}>{title}</span>
      {notes.map((note, index) => (
        <div key={index} className={styles.row}>
          <div className={styles.rowBody}>
            <input
              className={`${styles.input} ${styles.linesInput}`}
              aria-label={`Variante ${variantNumber}: linhas da ${noteLabel} ${index + 1}`}
              placeholder="3 ou 3-5"
              value={note.lines}
              onChange={(event) => onChange(replaceAt(notes, index, { ...note, lines: event.target.value }))}
            />
            <MdxEditor
              label={`Variante ${variantNumber}: texto d${noteLabel === 'anotação' ? 'a' : 'o'} ${noteLabel} ${index + 1}`}
              value={note.mdx}
              onChange={(mdx) => onChange(replaceAt(notes, index, { ...note, mdx }))}
            />
          </div>
          <RowControls
            label={`${noteLabel} ${index + 1}`}
            index={index}
            count={notes.length}
            onMove={(direction) => onChange(moveItem(notes, index, direction))}
            onRemove={() => onChange(removeAt(notes, index))}
          />
        </div>
      ))}
      <button type="button" className={styles.addButton} onClick={() => onChange([...notes, { lines: '1', mdx: placeholder }])}>
        {addLabel}
      </button>
    </div>
  );
}

function VariantEditor({
  variant,
  number,
  count,
  usedByOthers,
  onChange,
  onMove,
  onRemove,
}: {
  variant: Variant;
  number: number;
  count: number;
  usedByOthers: Set<Language>;
  onChange: (variant: Variant) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const sql = isSqlLanguage(variant.language);
  const readOnly = isReadOnlyCodeLanguage(variant.language);

  function changeLanguage(language: Language) {
    // A read-only language can never be run, and the validator rejects `runnable` there.
    onChange({ ...variant, language, runnable: isReadOnlyCodeLanguage(language) ? false : variant.runnable });
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Variante {number}</span>
        <RowControls label={`variante ${number}`} index={number - 1} count={count} onMove={onMove} onRemove={onRemove} removeDisabled={count === 1} />
      </div>

      <div className={styles.field}>
        <label htmlFor={`variant-${number}-language`}>Linguagem</label>
        <select
          id={`variant-${number}-language`}
          aria-label={`Linguagem da variante ${number}`}
          className={styles.select}
          value={variant.language}
          onChange={(event) => changeLanguage(event.target.value as Language)}
        >
          {LANGUAGES.map((language) => (
            <option key={language} value={language} disabled={usedByOthers.has(language)}>
              {LANGUAGE_INFO[language].label}
            </option>
          ))}
        </select>
      </div>

      <CodeEditor
        ariaLabel={`Código da variante ${number}`}
        language={variant.language}
        value={variant.code}
        onChange={(code) => onChange({ ...variant, code })}
      />

      {!readOnly && (
        <label className={styles.inline}>
          <input
            type="checkbox"
            checked={variant.runnable}
            onChange={(event) => onChange({ ...variant, runnable: event.target.checked })}
          />
          Executável
        </label>
      )}

      {sql ? (
        <div className={styles.field}>
          <span>Preparação SQL (sqlSetup)</span>
          <CodeEditor
            ariaLabel={`Preparação SQL da variante ${number}`}
            language={variant.language}
            minLines={2}
            value={variant.sqlSetup ?? ''}
            onChange={(sqlSetup) => onChange(withOptionalText(variant, 'sqlSetup', sqlSetup))}
          />
        </div>
      ) : (
        <div className={styles.field}>
          <label htmlFor={`variant-${number}-stdin`}>Entrada (stdin)</label>
          <textarea
            id={`variant-${number}-stdin`}
            aria-label={`Entrada (stdin) da variante ${number}`}
            className={styles.textarea}
            value={variant.stdin ?? ''}
            onChange={(event) => onChange(withOptionalText(variant, 'stdin', event.target.value))}
          />
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor={`variant-${number}-expected`}>Saída esperada</label>
        <textarea
          id={`variant-${number}-expected`}
          aria-label={`Saída esperada da variante ${number}`}
          className={styles.textarea}
          value={variant.expectedOutput ?? ''}
          onChange={(event) => onChange(withOptionalText(variant, 'expectedOutput', event.target.value))}
        />
      </div>

      <LineNotesEditor
        variantNumber={number}
        title="Anotações"
        noteLabel="anotação"
        addLabel="Adicionar anotação"
        placeholder="Nova anotação."
        notes={variant.annotations}
        onChange={(annotations) => onChange({ ...variant, annotations })}
      />
      <LineNotesEditor
        variantNumber={number}
        title="Passo a passo"
        noteLabel="passo"
        addLabel="Adicionar passo"
        placeholder="Novo passo."
        notes={variant.walkthrough}
        onChange={(walkthrough) => onChange({ ...variant, walkthrough })}
      />
    </div>
  );
}

/** Edits the variants of a code snippet: one tab per language, each with its code, run settings and notes. */
export function CodeSnippetForm({
  value,
  onChange,
}: {
  value: CodeSnippetPayloadData;
  onChange: (value: CodeSnippetPayloadData) => void;
}) {
  const { variants } = value;

  function addVariant() {
    const used = new Set(variants.map((variant) => variant.language));
    const language = LANGUAGES.find((candidate) => !used.has(candidate));
    if (language) onChange({ variants: [...variants, newVariant(language)] });
  }

  const allLanguagesUsed = variants.length >= LANGUAGES.length;

  return (
    <div className={styles.form}>
      {variants.map((variant, index) => (
        <VariantEditor
          key={index}
          variant={variant}
          number={index + 1}
          count={variants.length}
          usedByOthers={new Set(variants.filter((_, i) => i !== index).map((other) => other.language))}
          onChange={(next) => onChange({ variants: replaceAt(variants, index, next) })}
          onMove={(direction) => onChange({ variants: moveItem(variants, index, direction) })}
          onRemove={() => onChange({ variants: removeAt(variants, index) })}
        />
      ))}
      <button type="button" className={styles.addButton} disabled={allLanguagesUsed} onClick={addVariant}>
        Adicionar variante
      </button>
    </div>
  );
}
