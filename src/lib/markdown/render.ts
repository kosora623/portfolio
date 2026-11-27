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
import type { Heading } from './toc';

/**
 * コードの色。ライト・ダーク両方の色を CSS 変数（--shiki-light / --shiki-dark）で出し、
 * どちらを使うかは global.css で決める（ダークモードの切り替えボタンにも合わせるため）
 */
export const shikiConfig = {
  themes: { light: 'github-light', dark: 'github-dark-dimmed' },
  defaultColor: false,
} as const;

let processor: Promise<MarkdownRenderer> | undefined;

function getProcessor() {
  processor ??= createMarkdownProcessor({
    // GFM あり、引用符の自動変換なし。コードはビルド時に Shiki で色を付ける（ページに JS は増えない）
    syntaxHighlight: 'shiki',
    shikiConfig,
    gfm: true,
    smartypants: false,
    rehypePlugins: [rehypeContent],
    // 脚注（[^1]）の見出しと「本文へ戻る」リンクの読み上げを日本語にする
    remarkRehype: { footnoteLabel: '脚注', footnoteBackLabel: (i: number) => `本文の ${i + 1} 番目の参照へ戻る` },
  });
  return processor;
}

export async function renderMarkdown(markdown: string): Promise<string> {
  return (await renderMarkdownWithHeadings(markdown)).html;
}

/** HTML と見出しの一覧（目次用）を返す */
export async function renderMarkdownWithHeadings(markdown: string): Promise<{ html: string; headings: Heading[] }> {
  const { code, metadata } = await (await getProcessor()).render(markdown);
  return { html: code, headings: metadata.headings };
}

/** コンテンツコレクションのエントリ（filePath を持つもの）の本文を、元ファイルから読み直して描画する */
export async function renderEntryBody(entry: { filePath?: string; body?: string }): Promise<string> {
  return renderMarkdown(await readBody(entry));
}

/** renderEntryBody と同じく描画し、見出しの一覧も返す（ブログ記事の目次用） */
export async function renderEntryWithHeadings(entry: { filePath?: string; body?: string }) {
  return renderMarkdownWithHeadings(await readBody(entry));
}

async function readBody(entry: { filePath?: string; body?: string }): Promise<string> {
  return entry.filePath ? parseFrontmatter(await fs.readFile(entry.filePath, 'utf8')).content : (entry.body ?? '');
}
