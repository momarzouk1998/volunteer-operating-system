/** @type {import('next').NextConfig} */
const nextConfig = {
  // رقم النسخة = SHA بتاع الـ commit (build-arg) — ثابت فى كل مراحل الـ build.
  // (Date.now() كان بيتحسب لكل مرحلة لوحدها فالمتصفح والسيرفر بياخدوا أرقام مختلفة
  // والشريط بيفضل ظاهر على طول.) بيتغير مع كل build — الواجهة بتقارنه برقم السيرفر عشان تعرف إن فيه تحديث
  env: { APP_BUILD_ID: process.env.BUILD_ID || 'dev' },
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
