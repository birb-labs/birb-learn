'use client';

import { useTranslations } from 'next-intl';
import { Icon } from '@birb-learn/theme';
import { Link, usePathname } from '@/i18n/navigation';
import { isNavItemActive, NAV_ITEMS } from './nav-links';
import styles from './header.module.css';

export function HeaderNav({ onNavigate, variant = 'desktop' }: { onNavigate?: () => void; variant?: 'desktop' | 'drawer' }) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <nav className={variant === 'drawer' ? styles.drawerNav : styles.nav} aria-label={t('primaryLabel')}>
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={styles.navLink}
            aria-current={active ? 'page' : undefined}
            data-active={active || undefined}
            onClick={onNavigate}
          >
            <Icon name={item.icon} size={variant === 'drawer' ? 20 : 16} aria-hidden />
            {t(item.messageKey)}
          </Link>
        );
      })}
    </nav>
  );
}
