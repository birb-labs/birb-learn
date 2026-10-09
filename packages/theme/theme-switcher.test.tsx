import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from './theme-provider';
import { ThemeSwitcher } from './theme-switcher';

const labels = {
  themeLabel: 'Tema',
  appearanceLabel: 'Aparência',
  themeNames: { default: 'Padrão', solarized: 'Solarized', monokai: 'Monokai', mocha: 'Mocha' },
  modeNames: { light: 'Claro', dark: 'Escuro', system: 'Sistema' },
};

function renderSwitcher() {
  return render(
    <ThemeProvider>
      <ThemeSwitcher labels={labels} />
    </ThemeProvider>,
  );
}

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps the options hidden until the trigger is pressed', async () => {
    const user = userEvent.setup();
    renderSwitcher();

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tema' }));
    expect(screen.getAllByRole('radio')).toHaveLength(7); // 4 themes + 3 modes
  });

  it('defaults to the default theme in system mode', async () => {
    const user = userEvent.setup();
    renderSwitcher();
    await user.click(screen.getByRole('button', { name: 'Tema' }));

    expect(screen.getByRole('radio', { name: /Padrão/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Sistema/ })).toBeChecked();
  });

  it('applies and persists the chosen theme and mode', async () => {
    const user = userEvent.setup();
    renderSwitcher();
    await user.click(screen.getByRole('button', { name: 'Tema' }));

    await user.click(screen.getByRole('radio', { name: /Monokai/ }));
    await user.click(screen.getByRole('radio', { name: /Escuro/ }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('monokai');
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark');
    expect(window.localStorage.getItem('birb-learn-theme')).toBe('monokai');
    expect(window.localStorage.getItem('birb-learn-mode')).toBe('dark');
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    renderSwitcher();
    await user.click(screen.getByRole('button', { name: 'Tema' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});
