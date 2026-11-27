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
