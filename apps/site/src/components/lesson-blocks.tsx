import type { ReactElement } from 'react';
import type { LessonBlockContent, LessonBlockType } from '@birb-learn/content-schema';
import { Icon } from '@birb-learn/theme';
import { compileLessonMdx } from '@/lib/compile-lesson-mdx';
import { stepId } from '@/lib/lesson-steps';
import { BlockFrame } from './block-frame';
import { SimulatorBlock } from './simulators/simulator-block';
import styles from './lesson-blocks.module.css';

export interface LessonBlockLabels {
  blockTypes: Record<LessonBlockType, string>;
  showResolution: string;
  hideResolution: string;
  exerciseTry: string;
  resolution: string;
}

async function renderBlock(
  block: LessonBlockContent,
  index: number,
  total: number,
  labels: LessonBlockLabels,
): Promise<ReactElement> {
  const id = stepId(index);
  const frame = { id, type: block.type, typeLabel: labels.blockTypes[block.type], index, total };

  if (block.type === 'text') {
    return (
      <section key={block.id} id={id} className={styles.prose} data-block-type="text" data-step={index}>
        {await compileLessonMdx(block.bodyMdx ?? '')}
      </section>
    );
  }

  if (block.type === 'curiosity' || block.type === 'real_world_application') {
    return (
      <BlockFrame key={block.id} {...frame} title={block.title}>
        {await compileLessonMdx(block.bodyMdx ?? '')}
      </BlockFrame>
    );
  }

  if (block.type === 'solved_exercise') {
    return (
      <BlockFrame key={block.id} {...frame} title={block.title}>
        <div className={styles.prompt}>{await compileLessonMdx(block.promptMdx ?? '')}</div>
        <p className={styles.tryHint}>
          <Icon name="target" size={14} aria-hidden />
          {labels.exerciseTry}
        </p>
        <details className={styles.resolution}>
          <summary className={styles.resolutionSummary}>
            <Icon name="chevron-right" size={16} aria-hidden className={styles.resolutionChevron} />
            <span className={styles.showLabel}>{labels.showResolution}</span>
            <span className={styles.hideLabel}>{labels.hideResolution}</span>
          </summary>
          <div className={styles.resolutionBody}>
            <p className={styles.resolutionHeading}>
              <Icon name="check-circle-2" size={16} aria-hidden />
              {labels.resolution}
            </p>
            {await compileLessonMdx(block.resolutionMdx ?? '')}
          </div>
        </details>
      </BlockFrame>
    );
  }

  return (
    <BlockFrame key={block.id} {...frame} title={block.title}>
      <SimulatorBlock simulatorKey={block.simulatorKey ?? ''} params={block.simulatorParams} caption={block.caption} />
    </BlockFrame>
  );
}

export async function LessonBlocks({
  blocks,
  labels,
}: {
  blocks: LessonBlockContent[];
  labels: LessonBlockLabels;
}) {
  const rendered = await Promise.all(blocks.map((block, index) => renderBlock(block, index, blocks.length, labels)));
  return <div className={styles.blocks}>{rendered}</div>;
}
