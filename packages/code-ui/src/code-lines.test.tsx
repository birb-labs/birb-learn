import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CodeLines } from './code-lines';
import type { HighlightedLine, HighlightedToken } from './highlight';

const LINES: HighlightedLine[] = [
  [{ text: 'const', color: 'var(--code-token-keyword)' }, { text: ' x = 1;' }],
  [{ text: '// note', color: 'var(--code-token-comment)', fontStyle: 'italic' }],
  [],
  [{ text: 'x++;' }],
];

function lineElements(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[data-line]')];
}

describe('CodeLines', () => {
  it('renders a pre > code with one element per line numbered from 1', () => {
    const { container } = render(<CodeLines lines={LINES} />);
    expect(container.querySelector('pre > code')).not.toBeNull();
    expect(lineElements(container).map((el) => el.dataset.line)).toEqual(['1', '2', '3', '4']);
  });

  it('renders line numbers only when asked', () => {
    const { container, rerender } = render(<CodeLines lines={LINES} />);
    expect(container.querySelector('[data-line-number]')).toBeNull();
    rerender(<CodeLines lines={LINES} lineNumbers />);
    expect(container.querySelectorAll('[data-line-number]')).toHaveLength(4);
  });

  it('applies the token colour and font style to each token', () => {
    render(<CodeLines lines={LINES} />);
    expect(screen.getByText('const').style.color).toBe('var(--code-token-keyword)');
    expect(screen.getByText('// note').style.fontStyle).toBe('italic');
  });

  it('marks lines outside the highlighted range as dimmed when dimOutside is set', () => {
    const { container } = render(<CodeLines lines={LINES} highlightedRange={{ start: 2, end: 3 }} dimOutside />);
    const lines = lineElements(container);
    expect(lines.map((el) => el.hasAttribute('data-dimmed'))).toEqual([true, false, false, true]);
    expect(lines.map((el) => el.hasAttribute('data-highlighted'))).toEqual([false, true, true, false]);
  });

  it('does not dim anything without dimOutside', () => {
    const { container } = render(<CodeLines lines={LINES} highlightedRange={{ start: 2, end: 3 }} />);
    expect(lineElements(container).some((el) => el.hasAttribute('data-dimmed'))).toBe(false);
  });

  it('turns lines into buttons that report the 1-based line and reflect the selection', () => {
    const onLineClick = vi.fn();
    const { container } = render(<CodeLines lines={LINES} onLineClick={onLineClick} selectedLine={2} />);
    const buttons = [...container.querySelectorAll('button[data-line]')];
    expect(buttons).toHaveLength(4);
    expect(buttons.map((el) => el.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false', 'false']);
    fireEvent.click(buttons[2]);
    expect(onLineClick).toHaveBeenCalledWith(3);
  });

  it('names every line button with lineLabel, blank lines included', () => {
    render(<CodeLines lines={LINES} onLineClick={() => {}} lineLabel={(n) => `Line ${n}`} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((el) => el.getAttribute('aria-label'))).toEqual(['Line 1', 'Line 2', 'Line 3', 'Line 4']);
    // Line 3 is blank: without a label it would have no accessible name.
    expect(screen.getByRole('button', { name: 'Line 3' })).toBeTruthy();
  });

  it('ignores lineLabel when lines are not clickable', () => {
    const { container } = render(<CodeLines lines={LINES} lineLabel={(n) => `Line ${n}`} />);
    expect(container.querySelector('[aria-label]')).toBeNull();
  });

  it('does not render buttons without onLineClick', () => {
    const { container } = render(<CodeLines lines={LINES} selectedLine={2} />);
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('[aria-pressed]')).toBeNull();
  });

  it('renders token text as text, never as HTML', () => {
    const { container } = render(<CodeLines lines={[[{ text: '<b>x</b>' }]]} />);
    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toBe('<b>x</b>');
  });

  it('lets renderToken replace tokens', () => {
    const renderToken = vi.fn((token: HighlightedToken, lineIndex: number, tokenIndex: number) => (
      <mark key={`${lineIndex}-${tokenIndex}`}>{token.text.toUpperCase()}</mark>
    ));
    const { container } = render(<CodeLines lines={LINES} renderToken={renderToken} />);
    expect(container.querySelectorAll('mark')).toHaveLength(4);
    expect(renderToken).toHaveBeenCalledWith(LINES[0][1], 0, 1);
    expect(screen.getByText('CONST')).toBeTruthy();
  });

  it('never writes a hex colour into an inline style', () => {
    const { container } = render(
      <CodeLines
        lines={LINES}
        lineNumbers
        highlightedRange={{ start: 1, end: 2 }}
        dimOutside
        onLineClick={() => {}}
        selectedLine={1}
      />,
    );
    for (const el of container.querySelectorAll<HTMLElement>('[style]')) {
      expect(el.getAttribute('style')).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
  });
});
