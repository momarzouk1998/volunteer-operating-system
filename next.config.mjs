/** @type {import('next').NextConfig} */
const nextConfig = {
  // رقم النسخة: بيتغير مع كل build — الواجهة بتقارنه برقم السيرفر عشان تعرف إن فيه تحديث
  env: { APP_BUILD_ID: String(Date.now()) },
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
