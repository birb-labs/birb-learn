import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BirbLogo } from './birb-logo';

describe('BirbLogo', () => {
  it('is decorative (hidden from assistive tech) without a title', () => {
    const { container } = render(<BirbLogo />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
  });

  it('exposes an accessible name when given a title', () => {
    render(<BirbLogo title="Birb Learn" />);
    expect(screen.getByRole('img', { name: 'Birb Learn' })).toBeInTheDocument();
  });

  it('draws the brand tile only in the tile variant', () => {
    const tile = render(<BirbLogo variant="tile" />).container;
    const mark = render(<BirbLogo variant="mark" />).container;
    // tile: background + bird body + head = 3 paths; mark: bird body + head = 2.
    expect(tile.querySelectorAll('path')).toHaveLength(3);
    expect(mark.querySelectorAll('path')).toHaveLength(2);
  });

  it('gives every instance its own gradient id so several logos can share a page', () => {
    const { container } = render(
      <>
        <BirbLogo />
        <BirbLogo />
      </>,
    );
    const ids = [...container.querySelectorAll('linearGradient')].map((gradient) => gradient.id);
    expect(new Set(ids).size).toBe(2);
  });
});
