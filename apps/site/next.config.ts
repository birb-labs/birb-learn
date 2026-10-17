import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  transpilePackages: [
    '@birb-learn/theme',
    '@birb-learn/content-schema',
    '@birb-learn/math-input',
    '@birb-learn/code-runner',
  ],
  turbopack: {
    resolveAlias: {
      // wasmoon (the Lua engine) runs `await import('module')` in a branch taken
      // only under Node; browsers never reach it, but the bundler must resolve it.
      module: { browser: './src/lib/empty-module.ts' },
    },
  },
};

export default withNextIntl(nextConfig);
