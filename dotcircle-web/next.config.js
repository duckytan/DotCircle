/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14 已默认启用 App Router，不需要 experimental.appDir
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig