import type { NextConfig } from 'next';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    // Proxy /api/* and /media/* to the NestJS backend in dev.
    return [
      { source: '/api/:path*', destination: `${API}/api/:path*` },
      { source: '/media/:path*', destination: `${API}/media/:path*` },
    ];
  },
};

export default nextConfig;
