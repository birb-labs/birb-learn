import type { ReactElement } from 'react';
import type { LessonBlockContent } from '@birb-math/content-schema';
import { compileLessonMdx } from '@/lib/compile-lesson-mdx';
import { ContentCallout } from './content-callout';
import { SimulatorBlock } from './simulators/simulator-block';
import styles from './lesson-blocks.module.css';

async function renderBlock(block: LessonBlockContent, showResolutionLabel: string): Promise<ReactElement> {
  if (block.type === 'text') {
    return <div key={block.id}>{await compileLessonMdx(block.bodyMdx ?? '')}</div>;
  }

  if (block.type === 'curiosity') {
    return (
      <ContentCallout key={block.id} icon="lightbulb" title={block.title ?? ''} color="accent">
        {await compileLessonMdx(block.bodyMdx ?? '')}
      </ContentCallout>
    );
  }

  if (block.type === 'real_world_application') {
    return (
      <ContentCallout key={block.id} icon="compass" title={block.title ?? ''} color="info">
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

  return <SimulatorBlock key={block.id} simulatorKey={block.simulatorKey ?? ''} params={block.simulatorParams} caption={block.caption} />;
}

export async function LessonBlocks({ blocks, showResolutionLabel }: { blocks: LessonBlockContent[]; showResolutionLabel: string }) {
  const rendered = await Promise.all(blocks.map((block) => renderBlock(block, showResolutionLabel)));
  return <div className={styles.blocks}>{rendered}</div>;
}
