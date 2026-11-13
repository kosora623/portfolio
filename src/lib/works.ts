/**
 * content/works/*.md を読み込むローダー（ビルド時・サーバー側専用）。
 *
 * データの形や並び順は ./work-model.ts に分離している。
 * Astro 移行時はこのファイルを Content Collections（getCollection）に置き換える想定。
 */
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { normalizeWork, sortWorks, type WorkFromMd } from './work-model';

export type { WorkFromMd } from './work-model';

const WORKS_DIR = path.join(process.cwd(), 'content', 'works');

export async function getWorkSlugs(): Promise<string[]> {
  const files = await fs.readdir(WORKS_DIR);
  return files.filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''));
}

export async function getWorkBySlug(slug: string): Promise<WorkFromMd | null> {
  try {
    const full = path.join(WORKS_DIR, `${slug}.md`);
    const raw = await fs.readFile(full, 'utf8');
    const { data, content } = matter(raw);
    return normalizeWork(data, content, slug);
  } catch {
    return null;
  }
}

export async function getAllWorks(): Promise<WorkFromMd[]> {
  const slugs = await getWorkSlugs();
  const works = await Promise.all(slugs.map(s => getWorkBySlug(s)));
  const list = works.filter(Boolean) as WorkFromMd[];
  return sortWorks(list);
}
