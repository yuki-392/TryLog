import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['bjphqmzlirudxzvfpnye.supabase.co'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
