import { BirbLogo } from '@birb-learn/theme';
import styles from './not-found.module.css';

// Served as `404.html` by the static export. It sits outside the locale
// routes (so no next-intl context exists), hence the three static languages.
export default function NotFound() {
  return (
    <main className={styles.page}>
      <BirbLogo size={88} className={styles.logo} />
      <h1 className={styles.code}>404</h1>
      <p className={styles.message}>
        Página não encontrada · Page not found · Página no encontrada
      </p>
      <a href="/" className={styles.button}>
        Birb Learn
      </a>
    </main>
  );
}
