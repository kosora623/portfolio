/**
 * 画像の軽量版（scripts/make-images.mjs が生成する）のパス解決。
 * ビルド時（サーバー側）専用。
 *
 * - 一覧用サムネイル: /works-images/thumbs/... （384x216 の WebP）
 * - 本文用: /opt/... （幅 1200px までの WebP）。縦横の大きさは src/data/optimized-images.json に記録する
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** /works-images/01/a.jpg → /works-images/thumbs/01/a.webp */
export function thumbPathFor(url: string): string {
  return url.replace(/^\/works-images\//, '/works-images/thumbs/').replace(/\.[^./]+$/, '.webp');
}

/** /works-images/01/a.jpg → /opt/works-images/01/a.webp */
export function optimizedPathFor(url: string): string {
  return '/opt' + url.replace(/\.[^./]+$/, '.webp');
}

/** 生成済みの小さなサムネイルがあればそのパス、なければ元の画像のパスを返す */
export function listThumbnailSrc(url: string): string {
  if (!url.startsWith('/works-images/')) return url;
  const small = thumbPathFor(url);
  return existsSync(join(process.cwd(), 'public', small)) ? small : url;
}

export interface OptimizedImage {
  src: string;
  width: number;
  height: number;
}

export const OPTIMIZED_MANIFEST = 'src/data/optimized-images.json';

let manifest: Record<string, OptimizedImage> | undefined;

/** 本文の画像の軽量版。生成していない画像（外部 URL など）は undefined */
export function optimizedImage(url: string): OptimizedImage | undefined {
  if (!manifest) {
    const file = join(process.cwd(), OPTIMIZED_MANIFEST);
    manifest = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  }
  return manifest![url];
}
