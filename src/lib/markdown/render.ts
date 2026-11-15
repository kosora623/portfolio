/**
 * Markdown 本文を HTML に変換する（works / blog 共通、ビルド時専用）。
 *
 * Astro の render(entry) は前後の空白を trim した本文を描画するため、
 * 本文先頭の全角スペース（字下げ）が消えてしまう。Next.js 版と同じ表示にするため、
 * 元ファイルから読み直した本文を、同じ設定の Markdown プロセッサで描画する。
 */
import fs from 'node:fs/promises';
import { createMarkdownProcessor, parseFrontmatter, type MarkdownRenderer } from '@astrojs/markdown-remark';
import rehypeContent from './rehype-content';

let processor: Promise<MarkdownRenderer> | undefined;

function getProcessor() {
  processor ??= createMarkdownProcessor({
    // react-markdown + remark-gfm と同じ: GFM あり、コードの装飾なし、引用符の自動変換なし
    syntaxHighlight: false,
    gfm: true,
    smartypants: false,
    rehypePlugins: [rehypeContent],
  });
  return processor;
}

export async function renderMarkdown(markdown: string): Promise<string> {
  const { code } = await (await getProcessor()).render(markdown);
  return code;
}

/** コンテンツコレクションのエントリ（filePath を持つもの）の本文を、元ファイルから読み直して描画する */
export async function renderEntryBody(entry: { filePath?: string; body?: string }): Promise<string> {
  const body = entry.filePath
    ? parseFrontmatter(await fs.readFile(entry.filePath, 'utf8')).content
    : (entry.body ?? '');
  return renderMarkdown(body);
}
