import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getSubjects, getTagTree, type Locale, type TopicNode } from '@birb-math/content-schema';
import { getDb } from '@birb-math/content-schema/src/client';
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
    <main className={styles.main}>
      <h1>{t('title')}</h1>
      {subjects.length === 0 || !hasAnyTags ? (
        <p className={styles.description}>{t('empty')}</p>
      ) : (
        <SimuladoPageClient subjects={subjects} tagTreesBySubject={tagTreesBySubject} locale={locale} />
      )}
    </main>
  );
}
