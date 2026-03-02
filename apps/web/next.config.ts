/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  images: {
    qualities: [75, 100],
  },
  transpilePackages: ['@navaja/shared'],
};

export default nextConfig;

