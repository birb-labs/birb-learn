import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getContentTree, type Locale } from '@birb-learn/content-schema';
import { getDb } from '@birb-learn/content-schema/src/client';
import { Icon } from '@birb-learn/theme';
import { ContentTree } from '@/components/content-tree';
import styles from '@/styles/page.module.css';

export default async function ContentIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('content');
  const tree = await getContentTree(getDb(), locale);

  return (
    <main className={styles.main}>
      <h1>{t('title')}</h1>
      {tree.length === 0 ? (
        <p className={styles.emptyState}>
          <Icon name="inbox" size={20} aria-hidden />
          {t('empty')}
        </p>
      ) : (
        <ContentTree tree={tree} />
      )}
    </main>
  );
}
