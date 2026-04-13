import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["resend", "bcryptjs"],
  },
};

export default nextConfig;
