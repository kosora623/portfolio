"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import type { WorkFromMd } from '@/lib/works';

const tagInfo: Record<string, { name: string; color: string }> = {
  video: { name: 'Video', color: 'text-red-400' },
  code: { name: 'Code', color: 'text-green-400' },
  music: { name: 'Music', color: 'text-yellow-400' },
};

export default function WorksListClient({ works }: { works: WorkFromMd[] }) {

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <motion.div
        className="max-w-3xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-bold text-light-slate mb-12">
          My Works
        </motion.h1>

        <motion.div variants={containerVariants} className="border-t border-slate/20">
          {works.map((work) => (
            <motion.div key={work.slug} variants={itemVariants}>
              <Link
                href={`/works/${work.slug}`}
                className="group relative block py-6 px-6 border-b border-slate/20 transition-colors hover:bg-slate/5 overflow-hidden"
              >
                {work.thumbnailUrl && (
                  <Image
                    src={work.thumbnailUrl}
                    alt={`${work.title} thumbnail`}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="absolute inset-0 z-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                  />
                )}

                <div className="relative z-10 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-light-slate group-hover:text-teal transition-colors mb-1">
                      {work.title}
                    </h2>
                    <p className="text-slate text-sm mb-2">{work.summary}</p>
                    <div className="flex space-x-3">
                      {work.tags.map(tag => (
                        <span key={tag} className={`font-mono text-xs ${tagInfo[tag]?.color ?? ''}`}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-teal font-mono text-lg ml-8">{work.year}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
