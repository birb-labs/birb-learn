import { getTranslations } from 'next-intl/server';
import { Icon } from '@birb-learn/theme';
import { Breadcrumbs } from './breadcrumbs';
import { FallbackNotice } from './fallback-notice';
import styles from './lesson-header.module.css';

export async function LessonHeader({
  title,
  discipline,
  subject,
  topicName,
  sectionName,
  lessonNumber,
  lessonTotal,
  isFallback,
}: {
  title: string;
  discipline: { slug: string; name: string };
  subject: { slug: string; name: string };
  topicName: string;
  sectionName: string;
  lessonNumber: number;
  lessonTotal: number;
  isFallback: boolean;
}) {
  const t = await getTranslations('content');

  return (
    <header className={styles.header}>
      <Breadcrumbs
        label={t('breadcrumbLabel')}
        items={[
          { label: t('title'), href: '/content' },
          { label: discipline.name, href: `/content/${discipline.slug}` },
          { label: subject.name, href: `/content/${discipline.slug}/${subject.slug}` },
          { label: title },
        ]}
      />
      <p className={styles.eyebrow}>{t('lesson.lessonOf', { current: lessonNumber, total: lessonTotal })}</p>
      <h1 className={styles.title}>{title}</h1>
      <ul className={styles.tags}>
        <li className={styles.tag}>
          <Icon name="layers" size={14} aria-hidden />
          {topicName}
        </li>
        <li className={styles.tag}>
          <Icon name="route" size={14} aria-hidden />
          {sectionName}
        </li>
      </ul>
      {isFallback && <FallbackNotice />}
    </header>
  );
}
