/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use standalone output in production builds
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: '/.well-known/:path*',
        destination: `${apiUrl}/.well-known/:path*`,
      },
      {
        source: '/nodeinfo/:path*',
        destination: `${apiUrl}/nodeinfo/:path*`,
      },
    ];
  },
}

module.exports = nextConfig