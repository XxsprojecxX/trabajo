const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {},
  outputFileTracingIncludes: {},
  webpack(config) {
    config.resolve.alias['@/lib'] = path.join(__dirname, 'app/lib');
    config.resolve.alias['@/components'] = path.join(
      __dirname,
      'app/components'
    );
    return config;
  }
};

module.exports = nextConfig;