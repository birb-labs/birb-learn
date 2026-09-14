import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { SimulatorBlock } from './simulator-block';

describe('SimulatorBlock', () => {
  it('renders the unknown-simulator error message for an unregistered simulatorKey', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimulatorBlock simulatorKey="not-a-real-simulator" params={null} caption={null} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Simulador desconhecido: "not-a-real-simulator".')).toBeInTheDocument();
  });

  it('renders the invalid-params error message when a valid simulatorKey has malformed JSON params', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimulatorBlock simulatorKey="function-approach-grapher" params="{not valid json" caption={null} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Parâmetros do simulador "function-approach-grapher" são um JSON inválido.')).toBeInTheDocument();
  });
});
