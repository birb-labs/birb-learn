'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Icon, type IconName } from './icon';
import styles from './theme-switcher.module.css';
import { THEME_MODES, THEME_NAMES, type ThemeMode, type ThemeName } from './theme-types';
import { useTheme } from './theme-provider';

export interface ThemeSwitcherLabels {
  themeLabel: string;
  appearanceLabel: string;
  themeNames: Record<ThemeName, string>;
  modeNames: Record<ThemeMode, string>;
}

// Static previews: the swatches must show each theme's own colors no matter
// which theme is currently active, so they cannot read the live CSS variables.
const THEME_SWATCHES: Record<ThemeName, { base: string; accent: string; highlight: string }> = {
  default: { base: '#2f0840', accent: '#a78bfa', highlight: '#ffb100' },
  solarized: { base: '#002b36', accent: '#2074af', highlight: '#b58900' },
  monokai: { base: '#272822', accent: '#a6e22e', highlight: '#f92672' },
  mocha: { base: '#1e1e2e', accent: '#c398f6', highlight: '#fab387' },
};

const MODE_ICONS: Record<ThemeMode, IconName> = {
  light: 'sun',
  dark: 'moon',
  system: 'monitor',
};

export function ThemeSwitcher({ labels }: { labels: ThemeSwitcherLabels }) {
  const { theme, mode, resolvedMode, setTheme, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const triggerIcon: IconName = resolvedMode === 'dark' ? 'moon' : 'sun';

  return (
    <div className={styles.switcher} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={labels.themeLabel}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.triggerSwatch} aria-hidden style={{ background: THEME_SWATCHES[theme].accent }} />
        <Icon name={triggerIcon} size={16} aria-hidden />
      </button>

      {open && (
        <div id={panelId} className={styles.panel}>
          <div className={styles.group} role="radiogroup" aria-label={labels.themeLabel}>
            <span className={styles.groupLabel}>{labels.themeLabel}</span>
            <div className={styles.themeList}>
              {THEME_NAMES.map((name) => {
                const swatch = THEME_SWATCHES[name];
                return (
                  <button
                    key={name}
                    type="button"
                    role="radio"
                    aria-checked={theme === name}
                    className={styles.themeOption}
                    onClick={() => setTheme(name)}
                  >
                    <span className={styles.swatch} aria-hidden style={{ background: swatch.base }}>
                      <span style={{ background: swatch.accent }} />
                      <span style={{ background: swatch.highlight }} />
                    </span>
                    <span className={styles.optionName}>{labels.themeNames[name]}</span>
                    {theme === name && <Icon name="check" size={14} aria-hidden className={styles.checkmark} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.group} role="radiogroup" aria-label={labels.appearanceLabel}>
            <span className={styles.groupLabel}>{labels.appearanceLabel}</span>
            <div className={styles.modeList}>
              {THEME_MODES.map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={mode === value}
                  className={styles.modeOption}
                  onClick={() => setMode(value)}
                >
                  <Icon name={MODE_ICONS[value]} size={16} aria-hidden />
                  <span>{labels.modeNames[value]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
