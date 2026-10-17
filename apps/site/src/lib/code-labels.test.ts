import { describe, expect, it } from 'vitest';
import { createTranslator } from 'next-intl';
import enUS from '@/messages/en-US.json';
import es from '@/messages/es.json';
import ptBR from '@/messages/pt-BR.json';
import { buildRunPanelLabels, type Translate } from './code-labels';

const STATUSES = ['ok', 'compile_error', 'runtime_error', 'timeout', 'output_limit', 'unavailable'] as const;
const REASONS = ['read_only', 'rate_limited', 'offline', 'service_error', 'engine_load'] as const;

// next-intl's translator is typed by the message shape; `Translate` takes plain string keys.
function runTranslator(locale: string, messages: Record<string, unknown>): Translate {
  const t = createTranslator({ locale, messages, namespace: 'code.run' });
  return (key, values) => t(key as never, values as never);
}

describe('buildRunPanelLabels', () => {
  it('translates every run panel string, interpolating the dynamic ones', () => {
    const t = runTranslator('pt-BR', ptBR);
    const labels = buildRunPanelLabels(t);

    expect(labels.run).toBe('Executar');
    expect(labels.loadingEngine('Python')).toBe('Carregando Python...');
    expect(labels.caseProgress(2, 5)).toBe('Caso 2 de 5');
    expect(labels.retryIn(7)).toBe('Tente de novo em 7s');
    expect(labels.rowsShown(10, 50)).toBe('Mostrando 10 de 50 linhas');
  });

  it.each([
    ['pt-BR', ptBR],
    ['en-US', enUS],
    ['es', es],
  ])('has a message for every run status and unavailable reason in %s', (locale, messages) => {
    const t = runTranslator(locale, messages);
    const labels = buildRunPanelLabels(t);

    for (const status of STATUSES) expect(labels.status[status]).toBeTruthy();
    for (const reason of REASONS) expect(labels.unavailable[reason]).toBeTruthy();
    // A missing key makes next-intl return the key path instead of text.
    expect(JSON.stringify(labels)).not.toContain('code.run');
  });
});
