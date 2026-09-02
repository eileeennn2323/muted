import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/references", destination: "/references.html" },
      { source: "/pitch", destination: "/pitch.html" },
    ];
  },
};

export default nextConfig;
