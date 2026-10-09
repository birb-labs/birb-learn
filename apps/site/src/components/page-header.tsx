import type { ReactNode } from 'react';
import { Icon, type IconName } from '@birb-learn/theme';
import styles from './page-header.module.css';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  breadcrumbs,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: IconName;
  breadcrumbs?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.glow} aria-hidden />
      <div className={styles.inner}>
        {breadcrumbs}
        <div className={styles.row}>
          {icon && (
            <span className={styles.iconBadge} aria-hidden>
              <Icon name={icon} size={28} />
            </span>
          )}
          <div className={styles.text}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      </div>
    </header>
  );
}
