import { createSiteRunner, type Runner } from '@birb-learn/code-runner';

let siteRunner: Runner | undefined;

/**
 * The one code runner of the page (Web Workers plus Compiler Explorer), created
 * on first use. Browser-only: call it from event handlers or effects, never
 * while rendering, so SSR and the static export never spawn workers.
 */
export function getSiteRunner(): Runner {
  if (typeof window === 'undefined') throw new Error('getSiteRunner() is browser-only');
  siteRunner ??= createSiteRunner();
  return siteRunner;
}
