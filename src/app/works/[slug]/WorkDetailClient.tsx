"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { WorkFromMd } from '@/lib/works';
import dynamic from 'next/dynamic';

type MdNode = { type?: string; tagName?: string; children?: MdNode[] };

const EmbedFetcher = dynamic(() => import('@/components/EmbedFetcher'), { ssr: false });

function getYouTubeEmbedUrl(url: string): string | null {
  // support watch?v= and youtu.be links and embed urls
  const m1 = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]+)/);
  const m2 = url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([\w-]+)/);
  const m3 = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]+)/);
  const id = m1?.[1] ?? m2?.[1] ?? m3?.[1] ?? null;
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

function isTwitterUrl(url: string) {
  return /(?:https?:\/\/)?(?:www\.)?twitter\.com\//i.test(url) || /(?:https?:\/\/)?(?:www\.)?x\.com\//i.test(url);
}

function isNicoUrl(url: string) {
  return /(?:https?:\/\/)?(?:www\.)?nicovideo\.jp\/watch\//i.test(url) || /(?:https?:\/\/)?(?:www\.)?embed\.nicovideo\.jp\//i.test(url);
}

function isBiliUrl(url: string) {
  return /(?:https?:\/\/)?(?:www\.)?(?:bilibili\.com|b23\.tv)\//i.test(url);
}

function isInstagramUrl(url: string) {
  return /(?:https?:\/\/)?(?:www\.)?instagram\.com\//i.test(url) || /(?:https?:\/\/)?(?:www\.)?instagr\.am\//i.test(url);
}

const tagInfo: Record<string, { name: string; color: string }> = {
  video: { name: 'Video', color: 'text-red-400' },
  code: { name: 'Code', color: 'text-green-400' },
  music: { name: 'Music', color: 'text-yellow-400' },
};

export default function WorkDetailClient({ work }: { work: WorkFromMd }) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen pt-24">
      <motion.div 
        className="max-w-3xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Link href="/works" className="text-teal hover:underline mb-8 inline-block">
            &larr; Back to Works
          </Link>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex items-center space-x-4 mb-2">
          <p className="text-teal font-mono">{work.year}</p>
          <div className="flex space-x-3">
            {work.tags.map(tag => (
                <span key={tag} className={`font-mono text-sm ${tagInfo[tag].color}`}>{tagInfo[tag].name}</span>
            ))}
          </div>
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-bold text-light-slate mb-8">
          {work.title}
        </motion.h1>
        
        <div className="space-y-8">
          <motion.div variants={itemVariants}>
            <div className="prose max-w-none text-slate text-lg leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  img: ({ src, alt, title }) => (
                    <span className="mx-auto w-full max-w-xl block">
                      <Image
                        src={(src as unknown as string) ?? ''}
                        alt={alt ?? ''}
                        title={title as string | undefined}
                        width={800}
                        height={450}
                        className="mx-auto block rounded-md border border-slate/20"
                        style={{ objectFit: 'cover' }}
                      />
                    </span>
                  ),
                  a: ({ href, children, ...props }) => {
                    const isExternal = typeof href === 'string' && href.match(/^https?:\/\//);
                    const incomingClass = (props as { className?: string }).className ?? '';
                    const className = `${incomingClass} text-teal hover:underline hover:text-teal/80`;
                    return (
                      <a
                        href={href}
                        className={className}
                        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {children}
                      </a>
                    );
                  },

                  p: ({ node, children }) => {
                    const mdNode = node as unknown as { children?: MdNode[] };
                    const onlyChild = mdNode?.children?.[0];
                    const isDirectImage = onlyChild?.type === 'image';
                    const isImgElement = onlyChild?.type === 'element' && onlyChild?.tagName === 'img';
                    const isLinkWithImage = onlyChild?.type === 'element' && onlyChild?.tagName === 'a' && onlyChild?.children?.[0]?.type === 'image';

                    if (mdNode?.children?.length === 1 && (isDirectImage || isImgElement || isLinkWithImage)) {
                      return <>{children}</>;
                    }

                    // children may be a single link element when markdown has a bare URL on its own line
                    const firstChild = Array.isArray(children) ? children[0] : children;
                    let href: string | null = null;
                    if (React.isValidElement(firstChild)) {
                      const el = firstChild as React.ReactElement<{ href?: string }>;
                      if (typeof el.props?.href === 'string') href = el.props.href;
                    }

                    if (typeof href === 'string') {
                      const yt = getYouTubeEmbedUrl(href);
                      if (yt) {
                        return (
                          <div className="mx-auto w-full max-w-4xl aspect-w-16 aspect-h-9">
                            <iframe
                              src={yt}
                              title="YouTube video player"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full rounded-md"
                            />
                          </div>
                        );
                      }
                      if (isTwitterUrl(href) || isNicoUrl(href) || isBiliUrl(href) || isInstagramUrl(href)) {
                        return <EmbedFetcher url={href} />;
                      }
                    }

                    return <p>{children}</p>;
                  },
                }}
              >
                {work.content ?? ''}
              </ReactMarkdown>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}