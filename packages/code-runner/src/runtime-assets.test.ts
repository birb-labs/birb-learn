import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { cdnAssetUrl, RUNTIME_PACKAGES } from './runtime-assets';

function installedVersion(pkg: string): string {
  const manifest = fileURLToPath(import.meta.resolve(`${pkg}/package.json`));
  return (JSON.parse(readFileSync(manifest, 'utf8')) as { version: string }).version;
}

describe('runtime packages', () => {
  it.each(Object.entries(RUNTIME_PACKAGES))('pins %s to the installed version', (pkg, version) => {
    expect(version).toBe(installedVersion(pkg));
  });

  it('lists the packages the engines load assets from', () => {
    expect(Object.keys(RUNTIME_PACKAGES)).toEqual(expect.arrayContaining(['typescript', '@typescript/vfs']));
  });

  it('builds CDN URLs at the pinned version', () => {
    expect(cdnAssetUrl('typescript', 'lib/lib.es5.d.ts')).toBe(
      `https://cdn.jsdelivr.net/npm/typescript@${RUNTIME_PACKAGES.typescript}/lib/lib.es5.d.ts`,
    );
  });
});
