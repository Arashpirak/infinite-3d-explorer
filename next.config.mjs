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
  // Vercel deployment optimizations
  output: 'standalone',
  experimental: {
    // Optimize for Vercel deployment
    serverComponentsExternalPackages: ['sharp'],
  },
  // Configure webpack to avoid eval usage in production
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Disable eval-based source maps in production
      config.devtool = 'source-map';
      
      // Ensure webpack doesn't use eval for code splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
        },
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Secure CSP without unsafe-eval
            value: [
              "default-src 'self'", 
              "script-src 'self' 'unsafe-inline' https:",
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
