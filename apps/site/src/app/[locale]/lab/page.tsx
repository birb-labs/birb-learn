import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@birb-learn/content-schema';
import { LabSmoke } from '@/components/lab-smoke';
import styles from '@/styles/page.module.css';

// Temporary: hosts the runner smoke test until the real lab page replaces it.
export default async function LabPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className={styles.main} id="main-content">
      <div className={styles.container}>
        <LabSmoke />
      </div>
    </main>
  );
}
