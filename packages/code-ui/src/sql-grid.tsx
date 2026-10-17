// Type-only deep import: the code-runner barrel would pull the workers and engines into this graph.
import type { SqlResultSet } from '@birb-learn/code-runner/src/protocol';
import type { RunPanelLabels } from './labels';
import styles from './sql-grid.module.css';

/** Result sets can be huge; only this many rows are ever put in the DOM. */
export const SQL_GRID_MAX_ROWS = 200;

export interface SqlGridProps {
  resultSet: SqlResultSet;
  labels: Pick<RunPanelLabels, 'output' | 'rowsShown'>;
}

// Cells are rendered as React text children, so a value like `<b>x</b>` stays literal.
export function SqlGrid({ resultSet, labels }: SqlGridProps) {
  const { columns, rows } = resultSet;
  const shown = rows.slice(0, SQL_GRID_MAX_ROWS);
  return (
    <div className={styles.wrapper}>
      {/* Scrollable, so it must be reachable by keyboard. */}
      <div className={styles.scroll} role="region" aria-label={labels.output} tabIndex={0}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>
                    {cell === null ? (
                      <span className={styles.null} data-null="">
                        NULL
                      </span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > SQL_GRID_MAX_ROWS && <p className={styles.truncated}>{labels.rowsShown(SQL_GRID_MAX_ROWS, rows.length)}</p>}
    </div>
  );
}
