import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import pkg from './package.json';

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // register: true,
  // scope: "/app",
  // sw: "service-worker.js",
  // Workbox options particularly useful for static export
  workboxOptions: {
    disableDevLogs: true,
  },
});

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

  // Enable React Compiler (React Forget) for performance
  // @ts-ignore - Supported in Next 16
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  // @ts-ignore - Silence Turbopack warning
  turbopack: {},
};

export default withPWA(nextConfig);
