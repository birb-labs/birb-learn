import { describe, expect, it } from 'vitest';
import { createTranslator } from 'next-intl';
import enUS from '@/messages/en-US.json';
import es from '@/messages/es.json';
import ptBR from '@/messages/pt-BR.json';
import { buildCodeTaskLabels, buildRunPanelLabels, type Translate } from './code-labels';

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
    expect(labels.loadingEngine('Python')).toBe('Carregando Python…');
    expect(labels.caseProgress(2, 5)).toBe('Caso 2 de 5');
    expect(labels.retryIn(7)).toBe('Tente de novo em 7 s');
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

function codeTranslator(locale: string, messages: Record<string, unknown>): Translate {
  const t = createTranslator({ locale, messages, namespace: 'code' });
  return (key, values) => t(key as never, values as never);
}

describe('buildCodeTaskLabels', () => {
  it('translates the task strings and interpolates the dynamic ones', () => {
    const labels = buildCodeTaskLabels(codeTranslator('pt-BR', ptBR));

    expect(labels.check).toBe('Verificar');
    expect(labels.blank(2)).toBe('Lacuna 2');
    expect(labels.line(3, 'total = total + i')).toBe('Linha 3: total = total + i');
    expect(labels.emptyLine(2)).toBe('Linha 2');
    expect(labels.showHint(1, 2)).toBe('Mostrar dica 1 de 2');
    expect(labels.testProgress(2, 5)).toBe('2 de 5 testes');
    expect(labels.codeRegion('Python')).toBe('Código em Python');
    // The run panel's labels are nested, built from the same translator.
    expect(labels.run.run).toBe('Executar');
    expect(labels.run.caseProgress(2, 5)).toBe('Caso 2 de 5');
  });

  it.each([
    ['pt-BR', ptBR],
    ['en-US', enUS],
    ['es', es],
  ])('has every task string in %s', (locale, messages) => {
    const labels = buildCodeTaskLabels(codeTranslator(locale, messages));
    const resolved = JSON.stringify([
      labels,
      labels.codeRegion('X'),
      labels.blank(1),
      labels.line(1, 'x'),
      labels.emptyLine(1),
      labels.testName(1),
      labels.blankCorrect(1),
      labels.blankIncorrect(1),
      labels.hintTitle(1),
      labels.showHint(1, 2),
    ]);

    // A missing key makes next-intl return the key path instead of text.
    expect(resolved).not.toMatch(/code\.|task\./);
    expect(labels.verdict.correct).toBeTruthy();
    expect(labels.verdict.incorrect).toBeTruthy();
    expect(labels.verdict.not_graded).toBeTruthy();
    expect(labels.blank(3)).toContain('3');
    expect(labels.line(7, 'foo()')).toContain('7');
    expect(labels.line(7, 'foo()')).toContain('foo()');
  });
});
