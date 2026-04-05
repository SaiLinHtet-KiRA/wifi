import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    allowedDevOrigins: [
      "http://localhost:3000",
      "http://172.20.10.3:3000",
      "http://your-custom-domain.com",
    ],
  },
};

export default nextConfig;
