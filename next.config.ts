import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['pino', 'pino-pretty', 'bullmq', 'ioredis', 'bcryptjs'],
};

export default nextConfig;
