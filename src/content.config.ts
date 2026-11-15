import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { tagInfo } from '@/data/tags';

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

export const collections = { works };
