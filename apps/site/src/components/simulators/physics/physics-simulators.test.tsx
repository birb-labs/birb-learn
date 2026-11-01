import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import enUS from '@/messages/en-US.json';
import es from '@/messages/es.json';
import { SIMULATORS } from '../registry';
import { KineticEnergyExplorer } from './kinetic-energy-explorer';
import { WorkEnergyBlock } from './work-energy-block';
import { SpringEnergy } from './spring-energy';
import { UniversalGravitation } from './universal-gravitation';
import { SurfaceGravity } from './surface-gravity';
import { formatPhysicsNumber } from './physics-controls';

const PHYSICS_KEYS = [
  'kinetic-energy-explorer',
  'work-energy-block',
  'energy-track',
  'spring-energy',
  'kepler-orbit',
  'universal-gravitation',
  'surface-gravity',
] as const;

function withIntl(node: React.ReactNode, locale = 'pt-BR', messages: object = ptBR) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {node}
    </NextIntlClientProvider>,
  );
}

describe('physics simulators', () => {
  for (const [locale, messages] of [
    ['pt-BR', ptBR],
    ['en-US', enUS],
    ['es', es],
  ] as const) {
    it.each(PHYSICS_KEYS)(`renders %s in ${locale} with default params and no NaN`, (key) => {
      const Simulator = SIMULATORS[key];
      const { container } = withIntl(<Simulator params={{} as never} />, locale, messages);
      expect(container.innerHTML).not.toContain('NaN');
      expect(container.innerHTML).not.toContain('simulators.physics');
      expect(container.querySelector('svg')).not.toBeNull();
    });
  }

  it('ignores malformed params instead of crashing', () => {
    for (const key of PHYSICS_KEYS) {
      const Simulator = SIMULATORS[key];
      const { container, unmount } = withIntl(<Simulator params={{ mass: 'x', height: null, preset: 'nope', body: 42 } as never} />);
      expect(container.innerHTML).not.toContain('NaN');
      unmount();
    }
  });

  it('shows Ec = ½·m·v² for the configured values', () => {
    withIntl(<KineticEnergyExplorer params={{ mass: 2, speed: 10 }} />);
    expect(screen.getByText('100 J')).toBeInTheDocument();
    expect(screen.getByText('400 J')).toBeInTheDocument();
  });

  it('applies the work–energy theorem', () => {
    withIntl(<WorkEnergyBlock params={{ mass: 2, initialSpeed: 0, force: 20, mu: 0.5, distance: 4 }} />);
    expect(screen.getAllByText('40 J').length).toBeGreaterThan(0);
  });

  it('computes elastic energy k·x²/2', () => {
    withIntl(<SpringEnergy params={{ k: 200, x: 0.1 }} />);
    expect(screen.getByText('1 J')).toBeInTheDocument();
  });

  it('quarters the force when the distance doubles', () => {
    withIntl(<UniversalGravitation params={{ preset: 'earthMoon' }} />);
    const distanceSlider = screen.getByRole('slider', { name: /Multiplicar d por/ });
    fireEvent.change(distanceSlider, { target: { value: '2' } });
    expect(screen.getByText('0,25×')).toBeInTheDocument();
  });

  it('gives Earth’s and the Moon’s surface gravity', () => {
    withIntl(<SurfaceGravity params={{ body: 'moon' }} />);
    expect(screen.getAllByText('1,62 m/s²').length).toBeGreaterThan(0);
  });
});

describe('formatPhysicsNumber', () => {
  it('uses scientific notation for very large and very small values', () => {
    expect(formatPhysicsNumber(1.98e20, 'pt-BR')).toBe('1,98 × 10²⁰');
    expect(formatPhysicsNumber(2.8e-7, 'en-US')).toBe('2.8 × 10⁻⁷');
    expect(formatPhysicsNumber(9.8, 'pt-BR')).toBe('9,8');
  });
});
