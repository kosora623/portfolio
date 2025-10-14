"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import type { WorkFromMd } from '@/lib/works';

const ParticleBackground = dynamic(() => import('./ParticleBackground'), { ssr: false });
const WorksListClient = dynamic(() => import('@/app/works/WorksListClient'), { ssr: false });
const WorkDetailClient = dynamic(() => import('@/app/works/[slug]/WorkDetailClient'), { ssr: false });

type Props = {
  children?: React.ReactNode;
  works?: WorkFromMd[];
  work?: WorkFromMd | null;
};

export default function WorkPageShell({ children, works, work }: Props) {
  return (
    <div className="relative min-h-screen">
      <ParticleBackground />
      <div className="relative z-10">
        {works ? <WorksListClient works={works} /> : work ? <WorkDetailClient work={work} /> : children}
      </div>
    </div>
  );
}
