import { useTranslations } from 'next-intl';
import { Icon, ThemeSwitcher } from '@birb-math/theme';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from './locale-switcher';
import styles from './header.module.css';

export function Header() {
  const t = useTranslations('nav');
  const tTheme = useTranslations('theme');
  const tLanguage = useTranslations('language');

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        Birb Math
      </Link>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLink}>
          <Icon name="home" size={16} aria-hidden />
          {t('home')}
        </Link>
        <Link href="/content" className={styles.navLink}>
          <Icon name="book-open" size={16} aria-hidden />
          {t('content')}
        </Link>
        <Link href="/simulado" className={styles.navLink}>
          <Icon name="clipboard-list" size={16} aria-hidden />
          {t('simulado')}
        </Link>
      </nav>
      <div className={styles.controls}>
        <span className={styles.controlGroup}>
          <Icon name="palette" size={16} aria-hidden />
          <ThemeSwitcher
            labels={{
              themeLabel: tTheme('themeLabel'),
              appearanceLabel: tTheme('appearanceLabel'),
              themeNames: {
                default: tTheme('themes.default'),
                solarized: tTheme('themes.solarized'),
                monokai: tTheme('themes.monokai'),
                mocha: tTheme('themes.mocha'),
              },
              modeNames: {
                light: tTheme('modes.light'),
                dark: tTheme('modes.dark'),
                system: tTheme('modes.system'),
              },
            }}
          />
        </span>
        <span className={styles.controlGroup}>
          <Icon name="languages" size={16} aria-hidden />
          <LocaleSwitcher
            labels={{
              switcherLabel: tLanguage('switcherLabel'),
              localeNames: {
                'pt-BR': tLanguage('locales.pt-BR'),
                'en-US': tLanguage('locales.en-US'),
                es: tLanguage('locales.es'),
              },
            }}
          />
        </span>
      </div>
    </header>
  );
}
