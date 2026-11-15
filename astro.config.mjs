// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import rehypeContent from './src/lib/markdown/rehype-content.ts';

// https://astro.build/config
export default defineConfig({
  // Cloudflare Pages の出力ディレクトリ設定（out）を変えずに済むよう、Next.js の export と同じ場所に出力する
  outDir: './out',
  // /works/ATMclicker → works/ATMclicker.html（Next.js の static export と同じ URL 形式）
  build: { format: 'file' },
  trailingSlash: 'never',
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    // works / blog の本文は src/lib/markdown/render.ts で描画している（同じ設定）。
    // ここは Astro 標準の render() を使う場合のための設定。
    syntaxHighlight: false,
    processor: unified({ smartypants: false, rehypePlugins: [rehypeContent] }),
  },
});
