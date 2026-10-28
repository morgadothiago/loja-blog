import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Capas de posts ficam no Azure Blob Storage.
  images: {
    // Next 16: só qualidades listadas são servidas (padrão [75]); 85 = nitidez em telas FHD/2x.
    qualities: [75, 85],
    remotePatterns: [{ protocol: "https", hostname: "*.blob.core.windows.net" }],
  },
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
