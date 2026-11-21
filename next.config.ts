
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* IMAGE OPTIMIZATION */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  /* CACHE AND PARTIAL PRE-RENDERING */
  cacheComponents: true,
  partialPrefetching: true,

  /* TURBOPACK */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
