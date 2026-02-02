import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
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
