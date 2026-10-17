import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from '@birb-learn/theme';
import enUS from '@/messages/en-US.json';
import es from '@/messages/es.json';
import ptBR from '@/messages/pt-BR.json';
import { Header } from './header';

// next-intl's `useRouter`/`usePathname` wrap `next/navigation`'s, which throw or
// return null outside of an actual Next.js app router tree. Scope the mocks to
// this test file rather than mocking `next/navigation` globally.
let currentPathname = '/pt-BR/content/matematica/';

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');
  return {
    ...actual,
    usePathname: () => currentPathname,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    }),
  };
});

beforeEach(() => {
  currentPathname = '/pt-BR/content/matematica/';
});

function renderHeader(locale = 'pt-BR', messages: typeof ptBR = ptBR) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    </NextIntlClientProvider>,
  );
}

describe('Header', () => {
  it('renders the brand and localized nav links', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Birb Learn' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: ptBR.nav.home })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: ptBR.nav.content })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: ptBR.nav.lab })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: ptBR.nav.simulado })).toBeInTheDocument();
  });

  it.each([
    ['pt-BR', ptBR, 'Laboratório'],
    ['en-US', enUS, 'Lab'],
    ['es', es, 'Laboratorio'],
  ])('links to the lab, between content and the practice test, in %s', (locale, messages, label) => {
    renderHeader(locale, messages);

    const links = within(screen.getByRole('navigation', { name: messages.nav.primaryLabel })).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      messages.nav.home,
      messages.nav.content,
      label,
      messages.nav.simulado,
    ]);
    expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', `/${locale}/lab`);
  });

  it('marks the section containing the current page as active', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: ptBR.nav.content })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: ptBR.nav.home })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: ptBR.nav.simulado })).not.toHaveAttribute('aria-current');
  });

  it('marks the lab as the current page on /lab', () => {
    currentPathname = '/pt-BR/lab/';
    renderHeader();

    expect(screen.getByRole('link', { name: ptBR.nav.lab })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: ptBR.nav.content })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: ptBR.nav.simulado })).not.toHaveAttribute('aria-current');
  });

  it('opens a drawer with the nav links from the mobile menu button', async () => {
    const user = userEvent.setup();
    renderHeader();

    expect(screen.getAllByRole('link', { name: ptBR.nav.content })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: ptBR.nav.openMenu }));

    expect(screen.getAllByRole('link', { name: ptBR.nav.content })).toHaveLength(2);
    expect(screen.getByRole('button', { name: ptBR.nav.closeMenu })).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    expect(screen.getAllByRole('link', { name: ptBR.nav.content })).toHaveLength(1);
  });

  it('exposes the theme and language controls', async () => {
    const user = userEvent.setup();
    renderHeader();

    const [languageSelect] = screen.getAllByRole('combobox', { name: ptBR.language.switcherLabel });
    expect(languageSelect).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: ptBR.theme.themeLabel }));
    const themeGroup = screen.getByRole('radiogroup', { name: ptBR.theme.themeLabel });
    expect(within(themeGroup).getAllByRole('radio')).toHaveLength(4);
    expect(screen.getByRole('radiogroup', { name: ptBR.theme.appearanceLabel })).toBeInTheDocument();
  });
});
