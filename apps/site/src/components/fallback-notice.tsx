import { useTranslations } from 'next-intl';
import { Icon } from '@birb-learn/theme';
import styles from './fallback-notice.module.css';

export function FallbackNotice() {
  const t = useTranslations('content');
  return (
    <p className={styles.notice}>
      <Icon name="languages" size={16} aria-hidden />
      {t('notTranslatedYet')}
    </p>
  );
}
