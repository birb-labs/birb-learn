'use client';

import { useId, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import styles from './physics.module.css';

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '-': '⁻',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

/** Locale-aware number formatting; switches to scientific notation for very large/small values. */
export function formatPhysicsNumber(value: number, locale: string, maximumFractionDigits = 2): string {
  if (!Number.isFinite(value)) return '—';
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude >= 1e6 || magnitude < 1e-3)) {
    const exponent = Math.floor(Math.log10(magnitude));
    const mantissa = value / Math.pow(10, exponent);
    const mantissaText = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(mantissa);
    const exponentText = String(exponent)
      .split('')
      .map((char) => SUPERSCRIPT_DIGITS[char] ?? char)
      .join('');
    return `${mantissaText} × 10${exponentText}`;
  }
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

export function useFormatNumber() {
  const locale = useLocale();
  return (value: number, maximumFractionDigits = 2) => formatPhysicsNumber(value, locale, maximumFractionDigits);
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const format = useFormatNumber();
  const digits = step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
  return (
    <div className={styles.slider}>
      <label htmlFor={id} className={styles.sliderLabel}>
        <span>{label}</span>
        <output htmlFor={id} className={styles.sliderValue}>
          {format(value, digits)} {unit}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export type BarTone = 'kinetic' | 'potential' | 'elastic' | 'mechanical' | 'dissipated' | 'work' | 'negative';

export function EnergyBars({
  items,
  max,
  unit,
  ariaLabel,
}: {
  items: { label: string; value: number; tone: BarTone }[];
  max: number;
  unit: string;
  ariaLabel: string;
}) {
  const format = useFormatNumber();
  const scale = max > 0 ? max : 1;
  return (
    <div className={styles.bars} role="group" aria-label={ariaLabel}>
      {items.map((item) => (
        <div key={item.label} className={styles.barRow}>
          <span className={styles.barLabel}>{item.label}</span>
          <div className={styles.barTrack}>
            <div
              className={`${styles.barFill} ${styles[item.tone]}`}
              style={{ width: `${Math.min(100, (Math.abs(item.value) / scale) * 100)}%` }}
            />
          </div>
          <span className={styles.barValue}>
            {format(item.value, 1)} {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Readout({ children }: { children: ReactNode }) {
  return <p className={styles.readout}>{children}</p>;
}
