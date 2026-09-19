import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from '@birb-learn/theme';
import styles from './content-callout.module.css';

export type ContentCalloutColor = 'accent' | 'info';

const COLOR_VARS: Record<ContentCalloutColor, string> = {
  accent: 'var(--color-accent)',
  info: 'var(--color-info)',
};

export function ContentCallout({
  icon,
  title,
  color = 'accent',
  children,
}: {
  icon: IconName;
  title: string;
  color?: ContentCalloutColor;
  children: ReactNode;
}) {
  return (
    <aside className={styles.callout}>
      <div className={styles.header} style={{ '--callout-color': COLOR_VARS[color] } as CSSProperties}>
        <Icon name={icon} size={20} aria-hidden />
        <span className={styles.title}>{title}</span>
      </div>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
