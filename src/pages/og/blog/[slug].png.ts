/**
 * ブログ記事の OGP 画像（/og/blog/<slug>.png）。ビルド時に記事ごとに作る（src/lib/og-image.ts）。
 * frontmatter の image で画像を指定した記事は作らない。
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getPostEntries, type BlogPost } from '@/lib/blog';
import { renderPostOgImage } from '@/lib/og-image';

export const getStaticPaths = (async () => {
  const entries = await getPostEntries();
  return entries.filter(({ post }) => !post.image).map(({ post }) => ({ params: { slug: post.slug }, props: { post } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: BlogPost }> = async ({ props }) =>
  new Response(await renderPostOgImage(props.post), { headers: { 'Content-Type': 'image/png' } });
