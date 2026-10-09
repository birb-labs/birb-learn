import { BirbLogo } from '@birb-learn/theme';
import styles from './hero-visual.module.css';

// Decorative only: a floating constellation of math symbols around the mark.
const SYMBOLS = [
  { glyph: '∫', className: 'integral' },
  { glyph: 'π', className: 'pi' },
  { glyph: '∞', className: 'infinity' },
  { glyph: 'Σ', className: 'sigma' },
  { glyph: '√x', className: 'root' },
  { glyph: 'lim', className: 'limit' },
] as const;

export function HeroVisual() {
  return (
    <div className={styles.visual} aria-hidden>
      <div className={styles.halo} />
      <div className={styles.ring} />
      <div className={styles.ringOuter} />
      <div className={styles.logoWrap}>
        <BirbLogo size={176} className={styles.logo} />
      </div>
      {SYMBOLS.map((symbol, index) => (
        <span
          key={symbol.glyph}
          className={`${styles.symbol} ${styles[symbol.className]}`}
          style={{ animationDelay: `${index * -1.1}s` }}
        >
          {symbol.glyph}
        </span>
      ))}
    </div>
  );
}
