import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: false,
    remotePatterns: [],
  },
  experimental: {
    serverActions: {
      // Accommodate two ~5MB HEIC foot photos + FormData overhead
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
