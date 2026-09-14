import type { ReactElement } from 'react';
import type { LessonBlockContent } from '@birb-math/content-schema';
import { compileLessonMdx } from '@/lib/compile-lesson-mdx';
import { ContentCallout } from './content-callout';
import styles from './lesson-blocks.module.css';

async function renderBlock(block: LessonBlockContent, showResolutionLabel: string): Promise<ReactElement> {
  if (block.type === 'text') {
    return <div key={block.id}>{await compileLessonMdx(block.bodyMdx ?? '')}</div>;
  }

  if (block.type === 'curiosity') {
    return (
      <ContentCallout key={block.id} icon="lightbulb" title={block.title ?? ''}>
        {await compileLessonMdx(block.bodyMdx ?? '')}
      </ContentCallout>
    );
  }

  if (block.type === 'real_world_application') {
    return (
      <ContentCallout key={block.id} icon="compass" title={block.title ?? ''}>
        {await compileLessonMdx(block.bodyMdx ?? '')}
      </ContentCallout>
    );
  }

  if (block.type === 'solved_exercise') {
    return (
      <div key={block.id} className={styles.exercise}>
        {await compileLessonMdx(block.promptMdx ?? '')}
        <details className={styles.resolution}>
          <summary>{showResolutionLabel}</summary>
          {await compileLessonMdx(block.resolutionMdx ?? '')}
        </details>
      </div>
    );
  }

  // type === 'simulator': rendered by <SimulatorBlock> (see Task 7). This
  // placeholder keeps the site buildable/testable before Task 7 lands.
  return <div key={block.id} data-testid={`simulator-placeholder-${block.id}`} />;
}

export async function LessonBlocks({ blocks, showResolutionLabel }: { blocks: LessonBlockContent[]; showResolutionLabel: string }) {
  const rendered = await Promise.all(blocks.map((block) => renderBlock(block, showResolutionLabel)));
  return <div className={styles.blocks}>{rendered}</div>;
}
