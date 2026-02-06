/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  },
  webpack: (config, { isServer }) => {
    // Ignore undici module (used by Firebase but not needed client-side)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        undici: false,
      }
      // Use IgnorePlugin to ignore undici and its files
      const webpack = require('webpack')
      config.plugins = config.plugins || []
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^undici$/,
          contextRegExp: /node_modules/,
        })
      )
      // Also mark as external
      config.externals = config.externals || []
      config.externals.push('undici')
    }
    return config
  },
}

module.exports = nextConfig
