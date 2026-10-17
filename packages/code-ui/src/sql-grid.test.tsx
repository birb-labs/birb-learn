import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SqlGrid } from './sql-grid';
import { TEST_LABELS } from './test-labels';

describe('SqlGrid', () => {
  it('renders the column headers and the rows', () => {
    render(<SqlGrid resultSet={{ columns: ['id', 'name'], rows: [['1', 'Ada'], ['2', 'Alan']] }} labels={TEST_LABELS} />);
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['id', 'name']);
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('Alan')).toBeTruthy();
    expect(screen.queryByText(/Showing/)).toBeNull();
  });

  it('shows only the first 200 rows and says how many there are', () => {
    const rows = Array.from({ length: 10_000 }, (_, i) => [String(i)]);
    const { container } = render(<SqlGrid resultSet={{ columns: ['n'], rows }} labels={TEST_LABELS} />);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(200);
    expect(screen.getByText(TEST_LABELS.rowsShown(200, 10_000))).toBeTruthy();
  });

  it('renders null cells as a muted NULL', () => {
    const { container } = render(<SqlGrid resultSet={{ columns: ['v'], rows: [[null]] }} labels={TEST_LABELS} />);
    const cell = container.querySelector('tbody td');
    expect(cell?.textContent).toBe('NULL');
    expect(cell?.querySelector('[data-null]')).not.toBeNull();
  });

  it('renders cell content as text, never as markup', () => {
    const { container } = render(<SqlGrid resultSet={{ columns: ['<i>c</i>'], rows: [['<b>x</b>']] }} labels={TEST_LABELS} />);
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('i')).toBeNull();
    expect(screen.getByText('<b>x</b>')).toBeTruthy();
  });
});
