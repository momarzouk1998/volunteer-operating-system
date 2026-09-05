import './globals.css';
import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { getCurrentUser } from '@/lib/auth';
import AppLayout from '@/components/AppLayout';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'منصة إدارة وتشغيل المتطوعين | جمعية خواطر أحلى شباب',
  description: 'النظام الرقمي المؤسسي لإدارة المتطوعين، القوافل الميدانية، الساعات، والنقاط لجمعية خواطر أحلى شباب 2026',
  icons: {
    icon: '/images/logo.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-cairo min-h-screen">
        <AppLayout currentUser={currentUser}>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
