import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://analytics.tiktok.com${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://www.googletagmanager.com https://analytics.tiktok.com",
              "font-src 'self' data:",
              `connect-src 'self' https://api.captureai.workers.dev https://www.google-analytics.com https://www.googletagmanager.com https://analytics.tiktok.com${process.env.NEXT_PUBLIC_DEV_API_URL ? ` ${process.env.NEXT_PUBLIC_DEV_API_URL}` : ''}`,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
