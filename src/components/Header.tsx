'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'HOME', href: '/' },
    { name: 'WORKS', href: '/works' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 pointer-events-auto transition-all duration-300 ${isScrolled ? 'bg-navy/80 backdrop-blur-sm shadow-lg' : 'bg-transparent'}`}
      role="banner"
    >
      <nav className="container mx-auto p-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-teal tracking-wider z-50 pointer-events-auto">
          KSR
        </Link>
        <div className="space-x-6 flex items-center">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-light-slate transition-all duration-200 transform hover:text-teal hover:scale-105 hover:translate-y-[-2px] z-50 pointer-events-auto"
            >
              <span className="relative after:absolute after:inset-x-0 after:-bottom-1 after:h-[2px] after:bg-transparent hover:after:bg-teal after:transition-all after:duration-200">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}