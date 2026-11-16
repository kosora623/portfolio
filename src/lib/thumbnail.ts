/**
 * Works 一覧用の小さなサムネイル（scripts/make-thumbs.mjs が生成する）のパス解決。
 * ビルド時（サーバー側）専用。
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** /works-images/01/a.jpg → /works-images/thumbs/01/a.webp */
export function thumbPathFor(url: string): string {
  return url.replace(/^\/works-images\//, '/works-images/thumbs/').replace(/\.[^./]+$/, '.webp');
}

/** 生成済みの小さなサムネイルがあればそのパス、なければ元の画像のパスを返す */
export function listThumbnailSrc(url: string): string {
  if (!url.startsWith('/works-images/')) return url;
  const small = thumbPathFor(url);
  return existsSync(join(process.cwd(), 'public', small)) ? small : url;
}
