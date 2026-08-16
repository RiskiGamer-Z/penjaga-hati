import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin root ke root monorepo agar Turbopack bisa resolve paket Next.js
  // yang di-symlink pnpm ke node_modules/.pnpm di root. Kedua nilai wajib sama.
  outputFileTracingRoot: path.join(__dirname, "..", ".."),
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ycywlgkzxbfplnceqqxr.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
