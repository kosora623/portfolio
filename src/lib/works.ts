/**
 * works コレクション（content/works/*.md）を読み込むローダー（ビルド時専用）。
 * データの形や並び順は ./work-model.ts に分離している。
 */
import fs from 'node:fs/promises';
import { getCollection } from 'astro:content';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { normalizeWork, sortWorks, type WorkFromMd } from './work-model';

export type { WorkFromMd } from './work-model';

/**
 * Markdown 本文を元ファイルから読み直す。
 * entry.body は前後の空白が trim されており、本文先頭の全角スペース（字下げ）が消えてしまうため。
 */
async function readRawBody(filePath: string | undefined, fallback: string | undefined) {
  if (!filePath) return fallback;
  const raw = await fs.readFile(filePath, 'utf8');
  return parseFrontmatter(raw).content;
}

/** 新しい順に並べた全作品 */
export async function getAllWorks(): Promise<WorkFromMd[]> {
  const entries = await getCollection('works');
  const works = await Promise.all(
    entries.map(async e => normalizeWork(e.data, await readRawBody(e.filePath, e.body), e.id)),
  );
  return sortWorks(works);
}
