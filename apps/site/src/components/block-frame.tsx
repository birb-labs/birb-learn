import type { ReactNode } from 'react';
import { Icon } from '@birb-learn/theme';
import { BLOCK_TYPE_META } from '@/lib/lesson-steps';
import type { LessonBlockType } from '@birb-learn/content-schema';
import styles from './block-frame.module.css';

/**
 * Card chrome shared by every non-prose lesson block. Each block type gets
 * its own icon and palette color (see `BLOCK_TYPE_META`) so a student can
 * tell a curiosity from a solved exercise at a glance, in every theme.
 */
export function BlockFrame({
  id,
  type,
  typeLabel,
  title,
  index,
  total,
  children,
}: {
  id: string;
  type: LessonBlockType;
  typeLabel: string;
  title?: string | null;
  index: number;
  total: number;
  children: ReactNode;
}) {
  const meta = BLOCK_TYPE_META[type];

  return (
    <section id={id} className={styles.frame} data-tone={meta.tone} data-block-type={type} data-step={index}>
      <header className={styles.header}>
        <span className={styles.badge} aria-hidden>
          <Icon name={meta.icon} size={20} />
        </span>
        <div className={styles.headings}>
          <p className={styles.typeLabel}>{typeLabel}</p>
          {title && <h2 className={styles.title}>{title}</h2>}
        </div>
        <span className={styles.counter} aria-hidden>
          {index + 1}/{total}
        </span>
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
