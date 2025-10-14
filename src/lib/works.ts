import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const WORKS_DIR = path.join(process.cwd(), 'content', 'works');

export interface WorkFromMd {
  slug: string;
  title: string;
  year: number;
  month?: number;
  tags: string[];
  summary: string;
  thumbnailUrl?: string;
  content?: string;
}

export async function getWorkSlugs(): Promise<string[]> {
  const files = await fs.readdir(WORKS_DIR);
  return files.filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''));
}

export async function getWorkBySlug(slug: string): Promise<WorkFromMd | null> {
  try {
    const full = path.join(WORKS_DIR, `${slug}.md`);
    const raw = await fs.readFile(full, 'utf8');
    const { data, content } = matter(raw);
    return {
      slug: data.slug ?? slug,
      title: data.title,
      year: data.year,
  month: typeof data.month === 'number' ? data.month : (typeof data.month === 'string' ? Number(data.month) : undefined),
      tags: data.tags ?? [],
      summary: data.summary ?? '',
      thumbnailUrl: data.thumbnailUrl ?? undefined,
      content: content ?? '',
    } as WorkFromMd;
  } catch {
    return null;
  }
}

export async function getAllWorks(): Promise<WorkFromMd[]> {
  const slugs = await getWorkSlugs();
  const works = await Promise.all(slugs.map(s => getWorkBySlug(s)));
  const list = works.filter(Boolean) as WorkFromMd[];

  list.sort((a, b) => {
  // primary: year desc
  if ((b.year ?? 0) !== (a.year ?? 0)) return (b.year ?? 0) - (a.year ?? 0);
  // secondary: month desc (newer month first). treat undefined as 0 (earliest)
  const aMonth = a.month ?? 0;
  const bMonth = b.month ?? 0;
  if (bMonth !== aMonth) return bMonth - aMonth;
  // fallback: slug
  return a.slug.localeCompare(b.slug);
  });
  return list;
}
