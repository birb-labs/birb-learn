import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@birb-learn/content-schema';
import { LabClient } from '@/components/lab-client';
import { PageHeader } from '@/components/page-header';
import styles from '@/styles/page.module.css';

export default async function LabPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('lab');

  return (
    <main className={styles.main} id="main-content">
      <PageHeader title={t('title')} subtitle={t('intro')} icon="code" />
      <div className={styles.container}>
        <LabClient />
      </div>
    </main>
  );
}
