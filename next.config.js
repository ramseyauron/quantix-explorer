/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/node/:path*',
        destination: (process.env.NEXT_PUBLIC_NODE_URL || 'http://127.0.0.1:8560') + '/:path*',
      },
    ]
  },
}

module.exports = nextConfig
