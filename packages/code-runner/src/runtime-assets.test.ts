import { readFileSync, statSync } from 'node:fs';
import { sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cdnAssetUrl, cdnReadAsset, RUNTIME_PACKAGES } from './runtime-assets';
import { nodeEngineEnv, packageManifestUrl } from './worker/node-env';

function installedVersion(pkg: string): string {
  const manifest = fileURLToPath(packageManifestUrl(pkg));
  return (JSON.parse(readFileSync(manifest, 'utf8')) as { version: string }).version;
}

describe('runtime packages', () => {
  it.each(Object.entries(RUNTIME_PACKAGES))('pins %s to the installed version', (pkg, version) => {
    expect(version).toBe(installedVersion(pkg));
  });

  it('lists the packages the engines load assets from', () => {
    expect(Object.keys(RUNTIME_PACKAGES)).toEqual(expect.arrayContaining(['typescript', '@typescript/vfs', 'pyodide', 'wasmoon', '@ruby/4.0-wasm-wasi', 'sql.js', '@electric-sql/pglite']));
  });

  it('finds the manifest of a package that does not export it', () => {
    expect(installedVersion('@ruby/4.0-wasm-wasi')).toBe(RUNTIME_PACKAGES['@ruby/4.0-wasm-wasi']);
  });

  it('builds CDN URLs at the pinned version', () => {
    expect(cdnAssetUrl('typescript', 'lib/lib.es5.d.ts')).toBe(
      `https://cdn.jsdelivr.net/npm/typescript@${RUNTIME_PACKAGES.typescript}/lib/lib.es5.d.ts`,
    );
  });
});

describe('engine environments', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('locates a package directory in Node as a path with a trailing separator', () => {
    const location = nodeEngineEnv.assetLocation('pyodide', '');
    expect(location.endsWith(sep)).toBe(true);
    expect(statSync(`${location}package.json`).isFile()).toBe(true);
  });

  it('reads the bytes of a package file in Node', async () => {
    const bytes = await nodeEngineEnv.readAsset('typescript', 'package.json');
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(JSON.parse(new TextDecoder().decode(bytes)).version).toBe(RUNTIME_PACKAGES.typescript);
  });

  it('downloads a package file from the CDN in browsers and rejects an error status', async () => {
    const requested: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      requested.push(url);
      return url.endsWith('missing') ? new Response('not found', { status: 404 }) : new Response('ok');
    });
    expect(new TextDecoder().decode(await cdnReadAsset('sql.js', 'dist/x'))).toBe('ok');
    expect(requested).toEqual([cdnAssetUrl('sql.js', 'dist/x')]);
    await expect(cdnReadAsset('sql.js', 'missing')).rejects.toThrow(/missing: the server answered 404/);
  });
});
