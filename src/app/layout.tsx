import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AsciiCommentClient from '@/components/AsciiCommentClient';
import MaintenancePage from '@/components/MaintenancePage';
import { MAINTENANCE_MODE } from '@/lib/maintenance';

export const metadata: Metadata | undefined = MAINTENANCE_MODE
  ? { title: 'サイト改修中 | KSR', robots: { index: false, follow: false } }
  : undefined;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (MAINTENANCE_MODE) {
    return (
      <html lang="ja">
        <body className="antialiased">
          <MaintenancePage />
        </body>
      </html>
    );
  }

  return (
    <html lang="ja">
      <body className="bg-navy text-slate antialiased">
        <Header />
        <main className="container mx-auto px-6 md:px-12 lg:px-24">
          {children}
        </main>
        <Footer />
        <AsciiCommentClient />
      </body>
    </html>
  );
}
