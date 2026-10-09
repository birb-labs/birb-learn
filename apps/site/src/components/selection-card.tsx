import type { ReactNode } from 'react';
import { Icon, type IconName } from '@birb-learn/theme';
import { Link } from '@/i18n/navigation';
import type { CardTone } from '@/lib/slug-icons';
import styles from './selection-card.module.css';

export function SelectionCard({
  href,
  icon,
  tone = 'accent',
  title,
  description,
  meta,
  footer,
  openLabel,
}: {
  href: string;
  icon: IconName;
  tone?: CardTone;
  title: string;
  description?: string;
  meta?: string[];
  footer?: ReactNode;
  openLabel: string;
}) {
  return (
    <article className={styles.card} data-tone={tone}>
      <div className={styles.badge} aria-hidden>
        <Icon name={icon} size={26} />
      </div>
      <h2 className={styles.title}>
        {/* The stretched link makes the whole card clickable while keeping a single focus target. */}
        <Link href={href} className={styles.link}>
          {title}
        </Link>
      </h2>
      {description && <p className={styles.description}>{description}</p>}
      {meta && meta.length > 0 && (
        <ul className={styles.meta}>
          {meta.map((item) => (
            <li key={item} className={styles.chip}>
              {item}
            </li>
          ))}
        </ul>
      )}
      {footer && <div className={styles.footer}>{footer}</div>}
      <span className={styles.open} aria-hidden>
        {openLabel}
        <Icon name="arrow-right" size={16} />
      </span>
    </article>
  );
}
