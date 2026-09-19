import { getTranslations } from 'next-intl/server';
import { Icon } from '@birb-learn/theme';
import { Link } from '@/i18n/navigation';
import styles from './lesson-breadcrumb.module.css';

export async function LessonBreadcrumb({
  subject,
  topic,
  section,
}: {
  subject: { slug: string; name: string };
  topic: { slug: string; name: string };
  section: { slug: string; name: string };
}) {
  const t = await getTranslations('content');
  const label = t('breadcrumbLabel');

  return (
    <nav className={styles.breadcrumb} aria-label={label}>
      <Link href="/content">{subject.name}</Link>
      <Icon name="chevron-right" size={14} aria-hidden />
      <span>{topic.name}</span>
      <Icon name="chevron-right" size={14} aria-hidden />
      <span>{section.name}</span>
    </nav>
  );
}
