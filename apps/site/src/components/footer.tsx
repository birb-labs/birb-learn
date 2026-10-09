import { useTranslations } from 'next-intl';
import { BirbLogo, Icon } from '@birb-learn/theme';
import { Link } from '@/i18n/navigation';
import { NAV_ITEMS } from './nav-links';
import styles from './footer.module.css';

const CONTACT_EMAIL = 'contato@birblabs.com';
const GITHUB_URL = 'https://github.com/birb-labs/birb-learn';
const KOFI_URL = 'https://ko-fi.com/p4tit0z';

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tHome = useTranslations('home');

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.about}>
            <Link href="/" className={styles.brand}>
              <BirbLogo size={32} className={styles.logo} />
              <span className={styles.wordmark}>{tHome('title')}</span>
            </Link>
            <p className={styles.tagline}>{t('tagline')}</p>
          </div>

          <nav className={styles.column} aria-label={t('explore')}>
            <h2 className={styles.columnTitle}>{t('explore')}</h2>
            <ul className={styles.list}>
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.link}>
                    {tNav(item.messageKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className={styles.column} aria-label={t('project')}>
            <h2 className={styles.columnTitle}>{t('project')}</h2>
            <ul className={styles.list}>
              <li>
                <a href={GITHUB_URL} className={styles.link} rel="noopener noreferrer">
                  <Icon name="code" size={14} aria-hidden />
                  {t('sourceCode')}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className={styles.link}>
                  <Icon name="mail" size={14} aria-hidden />
                  {t('contact')}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} {t('rights')}
          </p>
          <a href={KOFI_URL} className={styles.donate} rel="noopener noreferrer">
            <Icon name="heart" size={12} aria-hidden />
            {t('donate')}
          </a>
        </div>
      </div>
    </footer>
  );
}
