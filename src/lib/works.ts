/**
 * works コレクション（content/works/*.md）を読み込むローダー（ビルド時専用）。
 * データの形や並び順は ./work-model.ts に分離している。
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { normalizeWork, sortWorks, type WorkFromMd } from './work-model';

export type { WorkFromMd } from './work-model';

/** 新しい順に並べた全作品（コレクションのエントリと、表示用に正規化したデータの組） */
export async function getAllWorkEntries(): Promise<{ entry: CollectionEntry<'works'>; work: WorkFromMd }[]> {
  const entries = await getCollection('works');
  const pairs = entries.map(entry => ({ entry, work: normalizeWork(entry.data, undefined, entry.id) }));
  const order = sortWorks(pairs.map(p => p.work));
  return order.map(w => pairs.find(p => p.work === w)!);
}

/** 新しい順に並べた全作品 */
export async function getAllWorks(): Promise<WorkFromMd[]> {
  return (await getAllWorkEntries()).map(p => p.work);
}
