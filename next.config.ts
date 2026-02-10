import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    minimumCacheTTL: 60 * 60 * 24,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "xn--80afcd8a1app.xn--p1ai",
      },
      {
        protocol: "https",
        hostname: "медграфт.рф",
      },
    ],
  },
};

export default nextConfig;
