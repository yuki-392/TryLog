import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['bjphqmzlirudxzvfpnye.supabase.co'],
  },
};

module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig;
