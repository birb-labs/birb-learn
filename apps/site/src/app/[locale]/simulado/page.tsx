import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getSubjects, getTagTree, type Locale, type TopicNode } from '@birb-learn/content-schema';
import { getDb } from '@birb-learn/content-schema/src/client';
import { Icon } from '@birb-learn/theme';
import { PageHeader } from '@/components/page-header';
import { SimuladoPageClient } from '@/components/simulado-page-client';
import styles from '@/styles/page.module.css';

export default async function SimuladoPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('simulado');
  const db = getDb();
  const subjects = await getSubjects(db, locale);
  const tagTreesBySubject: Record<number, TopicNode[]> = {};
  for (const subject of subjects) {
    tagTreesBySubject[subject.id] = await getTagTree(db, locale, subject.id);
  }
  const hasAnyTags = Object.values(tagTreesBySubject).some((tree) => tree.length > 0);

  return (
    <main className={styles.main} id="main-content">
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} icon="clipboard-list" />
      <div className={`${styles.container} ${styles.narrow}`}>
        {subjects.length === 0 || !hasAnyTags ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <Icon name="inbox" size={28} aria-hidden />
            </span>
            <p>{t('empty')}</p>
          </div>
        ) : (
          <SimuladoPageClient subjects={subjects} tagTreesBySubject={tagTreesBySubject} locale={locale} />
        )}
      </div>
    </main>
  );
}
