import { describe, expect, it } from 'vitest';
import { evaluateFunctionAt } from './evaluate-function';

describe('evaluateFunctionAt', () => {
  it('evaluates a simple polynomial', async () => {
    expect(await evaluateFunctionAt('x^2', 'x', 3)).toBeCloseTo(9, 6);
  });

  it('evaluates a rational function away from its discontinuity', async () => {
    expect(await evaluateFunctionAt('\\frac{x^2-1}{x-1}', 'x', 2)).toBeCloseTo(3, 6);
  });

  it('returns null at a removable discontinuity (division by zero)', async () => {
    expect(await evaluateFunctionAt('\\frac{x^2-1}{x-1}', 'x', 1)).toBeNull();
  });

  it('returns null for an unparseable expression', async () => {
    expect(await evaluateFunctionAt('\\notarealcommand{x}', 'x', 1)).toBeNull();
  });
});
