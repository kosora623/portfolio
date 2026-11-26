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

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * front matter の date を日本時間として読む。
 * YAML の日付だけの値（2026-11-16）は UTC の 0 時（日本時間 9 時）になるので、日本時間の 0 時に直す。
 * 時刻まで書いた値（2026-11-16T10:00:00+09:00）はそのまま使う。
 */
export function fromFrontmatterDate(date: Date): Date {
  const isDateOnly =
    date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0;
  return isDateOnly ? new Date(date.getTime() - JST_OFFSET_MS) : date;
}

/** 日本時間の ISO 8601（2026-11-16T00:00:00+09:00）。OGP の article:published_time と RSS 用 */
export function toJstIso(date: Date): string {
  return `${new Date(date.getTime() + JST_OFFSET_MS).toISOString().slice(0, 19)}+09:00`;
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
