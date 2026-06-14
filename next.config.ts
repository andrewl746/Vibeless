import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use native require for firebase-admin (Node-only, dynamic requires) instead
  // of bundling it into the route handlers.
  serverExternalPackages: ["firebase-admin"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
