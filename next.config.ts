import path from 'path'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  // Prevent lockfile-detection warnings from parent directories.
  outputFileTracingRoot: path.join(__dirname),
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
export default withNextIntl(nextConfig)
