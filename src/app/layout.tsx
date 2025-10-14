'use client';

import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-navy text-slate antialiased">
        <Header />
        <main className="container mx-auto px-6 md:px-12 lg:px-24">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}