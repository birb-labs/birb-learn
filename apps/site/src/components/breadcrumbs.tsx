import { Fragment } from 'react';
import { Icon } from '@birb-learn/theme';
import { Link } from '@/i18n/navigation';
import styles from './breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: string;
  /** Omit on the current page. */
  href?: string;
}

export function Breadcrumbs({ items, label }: { items: BreadcrumbItem[]; label: string }) {
  return (
    <nav className={styles.breadcrumbs} aria-label={label}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${index}-${item.label}`}>
              <li className={styles.item}>
                {item.href && !isLast ? (
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                ) : (
                  <span className={styles.current} aria-current={isLast ? 'page' : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li className={styles.separator} aria-hidden>
                  <Icon name="chevron-right" size={14} />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
