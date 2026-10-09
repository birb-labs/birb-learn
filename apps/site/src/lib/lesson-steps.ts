import type { LessonBlockContent, LessonBlockType } from '@birb-learn/content-schema';
import type { IconName } from '@birb-learn/theme';

export type BlockTone = 'neutral' | 'warning' | 'info' | 'success' | 'accent';

export interface BlockTypeMeta {
  icon: IconName;
  tone: BlockTone;
}

/** Visual identity of each lesson block type: one icon and one palette color per type. */
export const BLOCK_TYPE_META: Record<LessonBlockType, BlockTypeMeta> = {
  text: { icon: 'book-open', tone: 'neutral' },
  curiosity: { icon: 'lightbulb', tone: 'warning' },
  real_world_application: { icon: 'compass', tone: 'info' },
  solved_exercise: { icon: 'pencil', tone: 'success' },
  simulator: { icon: 'sliders', tone: 'accent' },
};

/** One entry of the lesson's step list (the stepper / side outline). */
export interface LessonStep {
  id: string;
  type: LessonBlockType;
  title: string;
}

export function stepId(index: number): string {
  return `step-${index + 1}`;
}

/** Strips the most common Markdown/MDX inline syntax so a heading reads as plain text. */
function stripInlineMarkup(text: string): string {
  return text
    .replace(/\$[^$]*\$/g, '') // inline math is not meaningful in a short label
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** First Markdown heading of an MDX body, as plain text (undefined when there is none). */
export function firstHeading(mdx: string | null): string | undefined {
  if (!mdx) return undefined;
  const match = mdx.match(/^\s{0,3}#{1,4}\s+(.+?)\s*#*\s*$/m);
  if (!match) return undefined;
  const heading = stripInlineMarkup(match[1]);
  return heading || undefined;
}

export function buildLessonSteps(
  blocks: LessonBlockContent[],
  typeLabels: Record<LessonBlockType, string>,
): LessonStep[] {
  return blocks.map((block, index) => {
    const title =
      block.title?.trim() ||
      firstHeading(block.bodyMdx) ||
      (block.type === 'text' ? undefined : typeLabels[block.type]) ||
      typeLabels[block.type];
    return { id: stepId(index), type: block.type, title };
  });
}
