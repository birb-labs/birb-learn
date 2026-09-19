/**
 * Moves a value saved under a pre-rebrand `birb-math-*` key over to its
 * `birb-learn-*` replacement, so renaming the keys does not silently
 * reset a returning visitor's theme, reading progress or simulado
 * history.
 *
 * Call it immediately before every read of `currentKey`: it is
 * idempotent, and once the current key exists (or the legacy key is
 * gone) it does nothing.
 */
export function migrateLegacyStorageKey(legacyKey: string, currentKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem(currentKey) !== null) return;
    const legacyValue = window.localStorage.getItem(legacyKey);
    if (legacyValue === null) return;
    window.localStorage.setItem(currentKey, legacyValue);
    window.localStorage.removeItem(legacyKey);
  } catch {
    // Disabled or quota-exhausted localStorage: dropping the migration
    // is preferable to throwing out of a caller's read path.
  }
}
