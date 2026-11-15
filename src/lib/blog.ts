/**
 * blog コレクション（content/blog/*.md）を読み込む（ビルド時専用）。
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { comparePosts, isVisible, type BlogPost } from './blog-model';

export type { BlogPost } from './blog-model';

/** 下書きを含めるのは開発サーバーのときだけ（npm run build では除外） */
const includeDrafts = import.meta.env.DEV;

function toPost(entry: CollectionEntry<'blog'>): BlogPost {
  return { slug: entry.id, ...entry.data };
}

/** 公開する記事を新しい順に（コレクションのエントリと、表示用データの組） */
export async function getPostEntries(): Promise<{ entry: CollectionEntry<'blog'>; post: BlogPost }[]> {
  const entries = await getCollection('blog', e => isVisible(e.data, includeDrafts));
  return entries
    .map(entry => ({ entry, post: toPost(entry) }))
    .sort((a, b) => comparePosts(a.post, b.post));
}
