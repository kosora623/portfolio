/**
 * ブログの RSS 2.0 フィード（/rss.xml）。依存を増やさないよう、XML は手で組み立てる。
 * 記事のリンクは絶対 URL が必要なので astro.config.mjs の `site`（SITE_URL）を使う。
 * 未設定のとき（ローカルのビルドなど）は相対 URL になる。
 */
import type { APIRoute } from 'astro';
import { getPostEntries } from '@/lib/blog';
import { site, pageDescriptions } from '@/data/site';

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const GET: APIRoute = async ({ site: siteUrl }) => {
  const abs = (p: string) => (siteUrl ? new URL(p, siteUrl).href : p);
  const posts = (await getPostEntries()).map(e => e.post);

  const items = posts
    .map(post => {
      const url = abs(`/blog/${post.slug}`);
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <description>${escapeXml(post.description)}</description>`,
        `      <pubDate>${post.date.toUTCString()}</pubDate>`,
        ...post.tags.map(tag => `      <category>${escapeXml(tag)}</category>`),
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${site.title}のブログ`)}</title>
    <link>${escapeXml(abs('/blog'))}</link>
    <atom:link href="${escapeXml(abs('/rss.xml'))}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(pageDescriptions.blog)}</description>
    <language>ja</language>
${posts[0] ? `    <lastBuildDate>${posts[0].date.toUTCString()}</lastBuildDate>\n` : ''}${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
