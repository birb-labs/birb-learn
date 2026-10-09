'use client';

import { useLocale } from 'next-intl';
import { Icon } from '@birb-learn/theme';
import { routing } from '@/i18n/routing';
import { usePathname, useRouter } from '@/i18n/navigation';
import styles from './locale-switcher.module.css';

export interface LocaleSwitcherLabels {
  switcherLabel: string;
  localeNames: Record<string, string>;
}

export function LocaleSwitcher({ labels }: { labels: LocaleSwitcherLabels }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className={styles.wrapper}>
      <Icon name="globe" size={16} aria-hidden className={styles.icon} />
      <select
        aria-label={labels.switcherLabel}
        value={locale}
        onChange={(event) => router.replace(pathname, { locale: event.target.value })}
        className={styles.select}
      >
        {routing.locales.map((code) => (
          <option key={code} value={code}>
            {labels.localeNames[code]}
          </option>
        ))}
      </select>
      <Icon name="chevron-down" size={14} aria-hidden className={styles.chevron} />
    </label>
  );
}
