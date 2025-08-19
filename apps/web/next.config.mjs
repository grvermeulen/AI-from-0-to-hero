/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  // Enable RUM collection via Sentry instrumentation
  instrumentationHook: true,
};

export default nextConfig;

