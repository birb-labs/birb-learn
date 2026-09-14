import type { ComputeEngine } from '@cortex-js/compute-engine';

// Same lazy-import-and-cache pattern as apps/site/src/lib/math-equivalence.ts
// (compute-engine is ~1.1MB minified) -- reused here rather than duplicated,
// but kept as a separate module-scope cache since this file has a different
// call shape (repeated evaluation of ONE parsed expression at many x values,
// vs. one-shot equivalence checks of two expressions).
let enginePromise: Promise<ComputeEngine> | null = null;

function getSharedEngine(): Promise<ComputeEngine> {
  if (!enginePromise) {
    enginePromise = import('@cortex-js/compute-engine')
      .then(({ ComputeEngine: ComputeEngineClass }) => new ComputeEngineClass())
      .catch((error) => {
        // Don't cache a rejected promise forever -- a transient failure
        // shouldn't permanently break every later evaluation in the session.
        enginePromise = null;
        throw error;
      });
  }
  return enginePromise;
}

/**
 * Evaluates a LaTeX expression at a single numeric value of `variable`.
 * Returns `null` (never throws) for a malformed expression, a division by
 * zero, or any other evaluation failure -- callers plotting a function must
 * treat `null` as "this point doesn't exist" (a gap in the curve, e.g. at a
 * removable discontinuity), not as an error to surface.
 */
export async function evaluateFunctionAt(expressionLatex: string, variable: string, x: number): Promise<number | null> {
  let engine: ComputeEngine;
  try {
    engine = await getSharedEngine();
  } catch {
    return null;
  }

  try {
    const parsed = engine.parse(expressionLatex);
    // An expression containing `["Error", ...]` nodes (an unknown LaTeX
    // command, unbalanced braces, ...) is reported by `isValid`, NOT by a
    // thrown error -- `.N()` on it just yields `re === NaN`, so the
    // explicit check keeps the "unparseable" case distinguishable in
    // intent even though both paths end at `null`.
    if (!parsed.isValid) return null;
    const substituted = parsed.subs({ [variable]: x });
    // `.N()` returns NaN (not Infinity) for a division by zero in this
    // engine; the `isFinite` guard additionally covers overflow to +/-Inf
    // from a very large intermediate value, which is equally unplottable.
    const value = substituted.N().re;
    if (Number.isNaN(value) || !Number.isFinite(value)) return null;
    return value;
  } catch {
    return null;
  }
}
