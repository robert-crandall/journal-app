/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // For static site generation
  trailingSlash: true,
  images: {
    unoptimized: true // Required for static export
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

export default nextConfig
