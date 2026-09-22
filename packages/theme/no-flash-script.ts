import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  LEGACY_MODE_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
  MODE_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from './theme-types';

export const noFlashScript = `(function() {
  document.documentElement.setAttribute('data-theme', '${DEFAULT_THEME}');
  document.documentElement.setAttribute('data-mode', 'light');
  try {
    // Same contract as migrateLegacyStorageKey (storage-migration.ts),
    // inlined because this runs before any bundle is available. Each call
    // is wrapped in its own try/catch, matching the helper's per-call
    // containment, so a throw from one migration (quota exhausted,
    // private-browsing storage) can't skip the other migration or the
    // reads below.
    var migrate = function (legacyKey, currentKey) {
      try {
        if (window.localStorage.getItem(currentKey) !== null) return;
        var legacyValue = window.localStorage.getItem(legacyKey);
        if (legacyValue === null) return;
        window.localStorage.setItem(currentKey, legacyValue);
        window.localStorage.removeItem(legacyKey);
      } catch (e) {}
    };
    migrate('${LEGACY_THEME_STORAGE_KEY}', '${THEME_STORAGE_KEY}');
    migrate('${LEGACY_MODE_STORAGE_KEY}', '${MODE_STORAGE_KEY}');
    var theme = window.localStorage.getItem('${THEME_STORAGE_KEY}') || '${DEFAULT_THEME}';
    var mode = window.localStorage.getItem('${MODE_STORAGE_KEY}') || '${DEFAULT_MODE}';
    var resolved = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', resolved);
  } catch (e) {}
})();`;
