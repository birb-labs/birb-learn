import type { Runner } from '@birb-learn/code-runner/src/protocol';

/**
 * A runner that finds the shared site runner only when a run is asked for. The
 * site runner is browser-only and heavy, so it must never be created while
 * rendering; this lets a component take a plain `Runner` all the same.
 */
export const lazySiteRunner: Runner = {
  async runCode(request, options) {
    let runner: Runner;
    try {
      runner = (await import('@/lib/site-runner')).getSiteRunner();
    } catch {
      return { status: 'unavailable', reason: 'engine_load', message: 'The code runner could not be loaded', cases: [] };
    }
    return runner.runCode(request, options);
  },
};
