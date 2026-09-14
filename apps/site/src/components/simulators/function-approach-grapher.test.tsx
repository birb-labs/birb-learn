import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { FunctionApproachGrapher } from './function-approach-grapher';

function renderGrapher(params: Parameters<typeof FunctionApproachGrapher>[0]['params']) {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
      <FunctionApproachGrapher params={params} />
    </NextIntlClientProvider>,
  );
}

describe('FunctionApproachGrapher', () => {
  it('renders a valid (non-NaN) SVG path for a constant function, without throwing', async () => {
    const { container } = renderGrapher({ expression: '3', approachPoint: 0, domain: [-1, 1] });

    // 200 sequential samples, each awaiting the (real, not mocked)
    // compute-engine evaluator -- generous timeout to avoid flaking on a
    // slower CI machine.
    await waitFor(
      () => {
        const path = container.querySelector('path');
        expect(path).not.toBeNull();
        expect(path!.getAttribute('d')).not.toContain('NaN');
      },
      { timeout: 10000 },
    );

    expect(container.querySelector('svg')?.outerHTML).not.toContain('NaN');
  }, 15000);

  it('renders an inline error instead of the graph when the domain is invalid (zero-width)', () => {
    renderGrapher({ expression: 'x', approachPoint: 2, domain: [2, 2] });

    expect(screen.getByText('O domínio configurado para este simulador é inválido.')).toBeInTheDocument();
  });

  it('renders an inline error instead of the graph when the domain bounds are reversed', () => {
    renderGrapher({ expression: 'x', approachPoint: 0, domain: [5, -5] });

    expect(screen.getByText('O domínio configurado para este simulador é inválido.')).toBeInTheDocument();
  });
});
