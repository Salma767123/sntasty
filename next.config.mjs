/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    // Minimize client-side router cache so navigations get near-fresh server data
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
};

export default nextConfig;
