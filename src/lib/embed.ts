/**
 * Markdown 本文中の URL から埋め込み種別を判定する純粋関数群。
 * ビルド時の rehype プラグイン（src/lib/markdown/rehype-content.ts）から使う。
 */

export function getYouTubeEmbedUrl(url: string): string | null {
  // support watch?v= and youtu.be links and embed urls
  const m1 = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]+)/);
  const m2 = url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([\w-]+)/);
  const m3 = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]+)/);
  const id = m1?.[1] ?? m2?.[1] ?? m3?.[1] ?? null;
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function isTwitterUrl(url: string) {
  return /(?:https?:\/\/)?(?:www\.)?twitter\.com\//i.test(url) || /(?:https?:\/\/)?(?:www\.)?x\.com\//i.test(url);
}

export function isNicoUrl(url: string) {
  return /(?:https?:\/\/)?(?:www\.)?nicovideo\.jp\/watch\//i.test(url) || /(?:https?:\/\/)?(?:www\.)?embed\.nicovideo\.jp\//i.test(url);
}

export function isBiliUrl(url: string) {
  return /(?:https?:\/\/)?(?:www\.)?(?:bilibili\.com|b23\.tv)\//i.test(url);
}

export function isInstagramUrl(url: string) {
  return /(?:https?:\/\/)?(?:www\.)?instagram\.com\//i.test(url) || /(?:https?:\/\/)?(?:www\.)?instagr\.am\//i.test(url);
}

/** Next.js 版で実行時 oEmbed（EmbedFetcher）に渡していた URL か */
export function isOEmbedTarget(url: string) {
  return isTwitterUrl(url) || isNicoUrl(url) || isBiliUrl(url) || isInstagramUrl(url);
}

/** ニコニコ動画のプレーヤー URL（動画 ID が取れない場合は null） */
export function getNicoEmbedUrl(url: string): string | null {
  const m = url.match(/nicovideo\.jp\/watch\/((?:sm|nm|so)?\d+)/i);
  return m ? `https://embed.nicovideo.jp/watch/${m[1]}` : null;
}

/** bilibili のプレーヤー URL（BV 番号が取れない場合は null。b23.tv の短縮 URL は解決できない） */
export function getBiliEmbedUrl(url: string): string | null {
  const m = url.match(/bilibili\.com\/video\/(BV[\w]+)/i);
  return m ? `https://player.bilibili.com/player.html?bvid=${m[1]}&autoplay=0` : null;
}

/**
 * 「URL だけの段落」をビルド時に埋め込む先。
 * - YouTube / ニコニコ / bilibili: iframe
 * - X / Instagram: 公式の埋め込みにはトークンや外部スクリプトが必要なため、通常のリンクのまま（null）
 */
export type EmbedTarget = { kind: 'youtube' | 'niconico' | 'bilibili'; src: string };

export function resolveEmbed(url: string): EmbedTarget | null {
  const yt = getYouTubeEmbedUrl(url);
  if (yt) return { kind: 'youtube', src: yt };
  if (isNicoUrl(url)) {
    const src = getNicoEmbedUrl(url);
    return src ? { kind: 'niconico', src } : null;
  }
  if (isBiliUrl(url)) {
    const src = getBiliEmbedUrl(url);
    return src ? { kind: 'bilibili', src } : null;
  }
  return null;
}
