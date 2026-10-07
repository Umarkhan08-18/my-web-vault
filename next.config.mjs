/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow the app to be opened through preview / tunnel hosts (dev only).
  allowedDevOrigins: ['*.e2b.app', '*.e2b.dev', 'localhost', '127.0.0.1'],
};

export default nextConfig;
