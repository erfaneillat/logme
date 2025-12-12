import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve the webapp at /app route
  basePath: '/app',

  // Export as static HTML for nginx hosting
  output: 'export',

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Trailing slash for cleaner URLs
  trailingSlash: true,
};

export default nextConfig;
