/**
 * Markdown 本文中の URL から埋め込み種別を判定する純粋関数群。
 * React / Next.js に依存しないため、Astro 移行後は remark/rehype プラグインからも流用できる。
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

/** oEmbed 経由での埋め込み対象（現状 EmbedFetcher に渡しているもの）か */
export function isOEmbedTarget(url: string) {
  return isTwitterUrl(url) || isNicoUrl(url) || isBiliUrl(url) || isInstagramUrl(url);
}
