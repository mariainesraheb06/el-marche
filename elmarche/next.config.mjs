/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }] },
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },
};

export default nextConfig;