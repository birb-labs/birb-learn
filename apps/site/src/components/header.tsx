import { useTranslations } from 'next-intl';
import { BirbLogo, ThemeSwitcher } from '@birb-learn/theme';
import { Link } from '@/i18n/navigation';
import { HeaderNav } from './header-nav';
import { LocaleSwitcher } from './locale-switcher';
import { MobileMenu } from './mobile-menu';
import styles from './header.module.css';

export function Header() {
  const tHome = useTranslations('home');
  const tTheme = useTranslations('theme');
  const tLanguage = useTranslations('language');

  const localeSwitcher = (
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
  );

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <BirbLogo size={36} className={styles.logo} />
          <span className={styles.wordmark}>{tHome('title')}</span>
        </Link>

        <div className={styles.desktopNav}>
          <HeaderNav />
        </div>

        <div className={styles.controls}>
          <div className={styles.desktopOnly}>{localeSwitcher}</div>
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
          <MobileMenu>{localeSwitcher}</MobileMenu>
        </div>
      </div>
    </header>
  );
}
