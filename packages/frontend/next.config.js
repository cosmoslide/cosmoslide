/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use standalone output in production builds
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig