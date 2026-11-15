import React from 'react';
import type { WorkFromMd } from '@/lib/work-model';
import ParticleBackground from './ParticleBackground';
import WorksListClient from '@/components/works/WorksListClient';
import WorkDetailClient from '@/components/works/WorkDetailClient';

type Props = {
  children?: React.ReactNode;
  works?: WorkFromMd[];
  work?: WorkFromMd | null;
};

/** Astro 側から client:only で読み込む（Next.js 時代の ssr:false と同じく、クライアントだけで描画する） */
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
