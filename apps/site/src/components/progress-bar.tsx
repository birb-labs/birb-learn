import type { CSSProperties } from 'react';
import styles from './progress-bar.module.css';

/** Accessible determinate progress meter. `value` and `max` are counts, not percentages. */
export function ProgressBar({
  value,
  max,
  label,
  size = 'md',
  tone = 'accent',
}: {
  value: number;
  max: number;
  label: string;
  size?: 'sm' | 'md';
  tone?: 'accent' | 'success';
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div
      className={`${styles.track} ${size === 'sm' ? styles.sm : ''}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      data-tone={tone}
    >
      <div className={styles.fill} style={{ '--progress': `${percent}%` } as CSSProperties} />
    </div>
  );
}
