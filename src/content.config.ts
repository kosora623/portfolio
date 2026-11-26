import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { tagInfo } from '@/data/tags';
import { fromFrontmatterDate } from '@/lib/blog-model';

const tagKeys = Object.keys(tagInfo) as [string, ...string[]];

const works = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: './content/works',
    // Next.js 版と同じく「ファイル名（拡張子なし・大文字小文字そのまま）」を URL に使う
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    slug: z.string().optional(),
    title: z.string(),
    year: z.number(),
    month: z.coerce.number().optional(),
    // 未定義のタグは表示側で扱えないので、ビルド時にエラーにする
    tags: z.array(z.enum(tagKeys)).default([]),
    summary: z.string().default(''),
    thumbnailUrl: z.string().optional(),
  }),
});

/**
 * ブログ記事（content/blog/*.md）。ファイル名が URL（/blog/<ファイル名>）になる。
 * "_" で始まるファイル（テンプレートなど）は読み込まない。
 */
const blog = defineCollection({
  loader: glob({
    pattern: '[!_]*.md',
    base: './content/blog',
    generateId: ({ entry }) => entry.replace(/.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    // YAML の日付（2026-11-15）や日時（2026-11-15T10:00:00+09:00）を受け付ける
    // 日付だけのときは日本時間の 0 時として扱う（src/lib/blog-model.ts）
    date: z.coerce.date().transform(fromFrontmatterDate),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    // 共有したときの OGP 画像（public/ からのパス、または絶対 URL）。省略時は記事ごとに自動生成した画像を使う
    image: z.string().optional(),
    // true の記事は npm run build に含めない（npm run dev では確認用に表示する）
    draft: z.boolean().default(false),
  }),
});

export const collections = { works, blog };
