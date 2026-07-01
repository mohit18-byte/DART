import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@dart/shared'],
  experimental: {
    serverComponentsExternalPackages: ['postgres'],
  },
};

export default nextConfig;
