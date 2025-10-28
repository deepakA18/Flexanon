import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.zerion.io',
        port: '',
        pathname: '/**',
      },
      // Add other image hostnames if needed
      {
        protocol: 'https',
        hostname: '**.cdninstagram.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Alternative: if you want to allow multiple domains quickly
    domains: [
      'cdn.zerion.io',
      // Add other domains here as needed
    ],
  },
};

export default nextConfig;