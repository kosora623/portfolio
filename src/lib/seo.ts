/**
 * ページの <title> / description / OGP の組み立て（works・blog 共通）。
 *
 * og:url・og:image・canonical は絶対 URL が必要なので、astro.config.mjs の `site`
 * （環境変数 SITE_URL）が設定されているときだけ出力する。
 */
import { site } from '@/data/site';
import { toJstIso } from './blog-model';

/** 画像のないページ（トップ・一覧など）で使う共通の OG 画像（1200×630） */
export const DEFAULT_OG_IMAGE = '/og.png';

export interface PageMeta {
  /** ページ固有のタイトル（サイト名 site.title は自動で付く。サイト名そのもののときは付けない） */
  title: string;
  description?: string;
  /** public/ からのパス（/works-images/... など）または絶対 URL。省略時は DEFAULT_OG_IMAGE */
  image?: string;
  type?: 'website' | 'article';
  /** 記事の公開日（type: 'article' のとき article:published_time に出力） */
  publishedTime?: Date;
}

export interface ResolvedMeta {
  title: string;
  description?: string;
  type: 'website' | 'article';
  url?: string;
  image?: string;
  publishedTime?: string;
  twitterCard: 'summary' | 'summary_large_image';
}

/** build.format: 'file' では Astro.url が /works/foo.html になるので、公開 URL（/works/foo）に直す */
export function toPublicPath(pathname: string): string {
  if (pathname === '/index.html') return '/';
  return pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
}

export function resolveMeta(meta: PageMeta, pathname: string, siteUrl: URL | undefined): ResolvedMeta {
  const abs = (p: string) => (siteUrl ? new URL(p, siteUrl).href : undefined);
  const src = meta.image ?? DEFAULT_OG_IMAGE;
  const image = /^https?:\/\//.test(src) ? src : abs(src);
  return {
    title: meta.title === site.title ? meta.title : `${meta.title} | ${site.title}`,
    description: meta.description,
    type: meta.type ?? 'website',
    url: abs(toPublicPath(pathname)),
    image,
    publishedTime: meta.type === 'article' && meta.publishedTime ? toJstIso(meta.publishedTime) : undefined,
    twitterCard: image ? 'summary_large_image' : 'summary',
  };
}
