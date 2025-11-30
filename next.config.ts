import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  turbopack: {
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
  experimental: {
    // Disable OG image generation to reduce bundle size
    disableOptimizedLoading: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude Vercel OG dependencies (saves ~1.4 MB)
    if (isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        "@vercel/og": false,
        sharp: false,
      };
    }

    return config;
  },
};

export default nextConfig;
