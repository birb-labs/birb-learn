'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@birb-learn/theme';
import { usePathname } from '@/i18n/navigation';
import { HeaderNav } from './header-nav';
import styles from './header.module.css';

/** Hamburger button plus the slide-down drawer shown below the tablet breakpoint. */
export function MobileMenu({ children }: { children?: ReactNode }) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const drawerId = useId();

  // Close when the route changes (covers back/forward as well as link clicks).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={styles.menuButton}
        aria-expanded={open}
        aria-controls={drawerId}
        aria-label={open ? t('closeMenu') : t('openMenu')}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={open ? 'x' : 'menu'} size={20} aria-hidden />
      </button>
      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} aria-hidden />
          <div id={drawerId} className={styles.drawer}>
            <HeaderNav variant="drawer" onNavigate={() => setOpen(false)} />
            {children && <div className={styles.drawerFooter}>{children}</div>}
          </div>
        </>
      )}
    </>
  );
}
