/**
 * 作品（Works）のデータモデルと純粋関数。
 *
 * このファイルは Node.js の fs や Next.js の API に依存しない。
 * Astro 移行時は Content Collections のスキーマ定義・並び替えにそのまま流用できる。
 */

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

/** gray-matter 等で読み取った frontmatter を WorkFromMd に正規化する */
export function normalizeWork(
  data: Record<string, unknown>,
  content: string | undefined,
  fallbackSlug: string,
): WorkFromMd {
  return {
    slug: (data.slug as string | undefined) ?? fallbackSlug,
    title: data.title,
    year: data.year,
    month: typeof data.month === 'number' ? data.month : (typeof data.month === 'string' ? Number(data.month) : undefined),
    tags: (data.tags as string[] | undefined) ?? [],
    summary: (data.summary as string | undefined) ?? '',
    thumbnailUrl: (data.thumbnailUrl as string | undefined) ?? undefined,
    content: content ?? '',
  } as WorkFromMd;
}

/** 新しい順: year 降順 → month 降順（未指定は 0 扱い）→ slug 昇順 */
export function compareWorks(a: WorkFromMd, b: WorkFromMd): number {
  // primary: year desc
  if ((b.year ?? 0) !== (a.year ?? 0)) return (b.year ?? 0) - (a.year ?? 0);
  // secondary: month desc (newer month first). treat undefined as 0 (earliest)
  const aMonth = a.month ?? 0;
  const bMonth = b.month ?? 0;
  if (bMonth !== aMonth) return bMonth - aMonth;
  // fallback: slug
  return a.slug.localeCompare(b.slug);
}

/** 非破壊で並び替えたコピーを返す */
export function sortWorks(works: WorkFromMd[]): WorkFromMd[] {
  return [...works].sort(compareWorks);
}
