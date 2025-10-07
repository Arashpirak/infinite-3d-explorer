/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // TEMP: allow 'unsafe-eval' to unblock production while we locate offending code
            value: [
              "default-src 'self'", 
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https:",
              "style-src 'self' 'unsafe-inline' https:",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https:",
              "font-src 'self' data: https:",
              "frame-ancestors 'self'",
              "base-uri 'self'"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

export default nextConfig
