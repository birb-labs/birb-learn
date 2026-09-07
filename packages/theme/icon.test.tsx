import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Icon, type IconName } from './icon';

describe('Icon', () => {
  it('renders an svg for a known icon name', () => {
    const { container } = render(<Icon name="home" aria-label="home" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('throws a clear error for an unknown icon name', () => {
    expect(() => render(<Icon name={'not-a-real-icon' as IconName} />)).toThrow(
      'Unknown icon: "not-a-real-icon"',
    );
  });
});
