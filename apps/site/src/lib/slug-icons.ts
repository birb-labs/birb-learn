import type { IconName } from '@birb-learn/theme';

const KNOWN_ICONS: Record<string, IconName> = {
  matematica: 'sigma',
  mathematics: 'sigma',
  fisica: 'atom',
  quimica: 'flask',
  biologia: 'brain',
  calculo: 'infinity',
  algebra: 'calculator',
  geometria: 'ruler',
  estatistica: 'bar-chart',
  trigonometria: 'pi',
  mecanica: 'orbit',
  limites: 'line-chart',
};

const FALLBACK_ICONS: IconName[] = ['library', 'graduation-cap', 'layers', 'compass', 'sparkles', 'brain'];

/** Picks a stable icon for a discipline/subject slug, falling back to a hash of the slug. */
export function iconForSlug(slug: string): IconName {
  const known = KNOWN_ICONS[slug];
  if (known) return known;
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return FALLBACK_ICONS[hash % FALLBACK_ICONS.length];
}

export type CardTone = 'accent' | 'info' | 'success' | 'warning';
const TONES: CardTone[] = ['accent', 'info', 'success', 'warning'];

/** Cycles card colors by position so neighbouring cards read as distinct. */
export function toneForIndex(index: number): CardTone {
  return TONES[index % TONES.length];
}
