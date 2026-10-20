import styles from './CodeForms.module.css';

/**
 * Starts a translation from the pt-BR payload: code is mostly language-neutral, so the usual
 * way to fill another locale is to copy the pt-BR code and translate only the prose around it.
 */
export function CopyFromPtBrButton({ disabled, onCopy }: { disabled: boolean; onCopy: () => void }) {
  return (
    <button type="button" className={styles.addButton} disabled={disabled} onClick={onCopy}>
      Copiar do pt-BR
    </button>
  );
}
