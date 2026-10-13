// Runtime packages whose files (WASM binaries, standard libraries, ...) the
// engines load at run time. Browsers fetch them from the CDN at the exact
// version installed here; Node workers read them from `node_modules`.
// Each engine task adds its packages; a test keeps the versions in sync with
// the installed `package.json` files.
export const RUNTIME_PACKAGES = {
  typescript: '6.0.3',
  '@typescript/vfs': '1.6.5',
  pyodide: '314.0.7',
  wasmoon: '1.16.0',
} as const satisfies Record<string, string>;

export type RuntimePackage = keyof typeof RUNTIME_PACKAGES;

/** URL of a file of a runtime package on the CDN, pinned to the installed version. */
export function cdnAssetUrl(pkg: RuntimePackage, path: string): string {
  const version: string = RUNTIME_PACKAGES[pkg];
  return `https://cdn.jsdelivr.net/npm/${pkg}@${version}/${path}`;
}
