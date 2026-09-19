import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  transpilePackages: ['@birb-learn/theme', '@birb-learn/content-schema', '@birb-learn/math-input'],
};

export default withNextIntl(nextConfig);
