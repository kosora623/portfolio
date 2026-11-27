/**
 * 記事の目次（純粋関数。Astro に依存しない）。
 * 見出しの一覧は Markdown の描画（render.ts）が返す metadata.headings を使う。
 */

export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

export interface TocItem {
  depth: 2 | 3;
  slug: string;
  text: string;
}

/** 目次を出す最小の見出しの数（h2 と h3 の合計）。短い記事には出さない */
export const TOC_MIN_HEADINGS = 3;

/**
 * h2・h3 だけを目次にする。脚注の見出し（footnote-label）は除き、
 * 見出しの末尾に付けたリンクの「#」は文字から外す。見出しが少ないときは空にする
 */
export function buildToc(headings: Heading[], min = TOC_MIN_HEADINGS): TocItem[] {
  const items = headings
    .filter(h => (h.depth === 2 || h.depth === 3) && h.slug !== 'footnote-label')
    .map(h => ({ depth: h.depth as 2 | 3, slug: h.slug, text: h.text.replace(/#$/, '').trim() }));
  return items.length >= min ? items : [];
}
