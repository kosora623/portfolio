'use client';

import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import * as React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {

  const ASCII_ART = 
  `==============================================\n\n` +
  `..............................................\n` +
  `..............................................\n` +
  `........=============........=============....\n` +
  `.........[[      ]]...........[[      ]]......\n` +
  `.........[[      ]]...........[[      ]]......\n` +
  `.........[[      ]]...........[[      ]]......\n` +
  `.........[[      ]]...........[[      ]]......\n` +
  `.........[[      ]]...........[[      ]]......\n` +
  `.........[[<<<<<<]]...........[[<<<<<<]]......\n` +
  `..............................................\n` +
  `..............................................\n` +
  `..............................................\n` +
  `..............................................\n` +
  `................@@******\\\**:&'$)..............\n` +
  `.................................]..............\n` +
  `.................................]..............\n` +
  `.................................]..............\n` +
  `.................................]..............\n` +
  `........................../@@@@./.............\n` +
  `...................*********..................\n` +
  `..............................................\n` +
  `..............................................\n` +
  `==============================================\n`;

  useEffect(() => {
    const commentNode = document.createComment(ASCII_ART);
  
    document.body.appendChild(commentNode);

    console.info("AA inserted into DOM! Check the Elements tab (<body>) for a surprise.");
  }, []);

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
function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void {
  // Delegate to React's built-in hook with correct typings
  React.useEffect(effect, deps);
}
