/**
 * ブログ記事のデータモデルと純粋関数（Astro に依存しない）。
 */

export interface BlogPost {
  slug: string;
  title: string;
  date: Date;
  description: string;
  tags: string[];
  draft: boolean;
}

/** ビルドに含めるか（下書きは includeDrafts が true のときだけ） */
export function isVisible(post: Pick<BlogPost, 'draft'>, includeDrafts: boolean): boolean {
  return includeDrafts || !post.draft;
}

/** 新しい順: date 降順 → slug 昇順 */
export function comparePosts(a: BlogPost, b: BlogPost): number {
  const diff = b.date.getTime() - a.date.getTime();
  return diff !== 0 ? diff : a.slug.localeCompare(b.slug);
}

/** 日本時間の YYYY-MM-DD */
export function formatDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
