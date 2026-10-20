import styles from './CodeForms.module.css';

/**
 * Move up, move down and remove buttons of one row of a list. `label` names the row
 * ("anotação 2"), so each button has a unique accessible name.
 */
export function RowControls({
  label,
  index,
  count,
  onMove,
  onRemove,
  removeDisabled = false,
}: {
  label: string;
  index: number;
  count: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  removeDisabled?: boolean;
}) {
  return (
    <span className={styles.rowControls}>
      <button type="button" aria-label={`Subir ${label}`} disabled={index === 0} onClick={() => onMove(-1)}>
        ↑
      </button>
      <button type="button" aria-label={`Descer ${label}`} disabled={index === count - 1} onClick={() => onMove(1)}>
        ↓
      </button>
      <button type="button" aria-label={`Remover ${label}`} disabled={removeDisabled} onClick={onRemove}>
        Remover
      </button>
    </span>
  );
}
