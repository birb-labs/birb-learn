import type { ReactNode } from 'react';
import { Icon, type IconName } from '@birb-math/theme';
import styles from './content-callout.module.css';

export function ContentCallout({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <aside className={styles.callout}>
      <div className={styles.header}>
        <Icon name={icon} size={20} aria-hidden />
        <span className={styles.title}>{title}</span>
      </div>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
