import { notFound } from 'next/navigation';
import { getWorkSlugs, getWorkBySlug } from '@/lib/works';
import WorkPageShell from '@/components/WorkPageShell';

export async function generateStaticParams() {
  const slugs = await getWorkSlugs();
  return slugs.map(slug => ({ slug }));
}

export default async function WorkDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params as { slug: string };

  const work = await getWorkBySlug(slug);

  if (!work) {
    notFound();
  }

  return <WorkPageShell work={work} />;
}