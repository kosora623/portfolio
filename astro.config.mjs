// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import rehypeContent from './src/lib/markdown/rehype-content.ts';

// https://astro.build/config
export default defineConfig({
  // 公開 URL（例: https://example.com）。OGP の og:url / og:image と canonical に使う。
  // 未設定のときは、それらのタグを出力しない（src/lib/seo.ts）。
  site: process.env.SITE_URL || undefined,
  // Cloudflare Pages の出力ディレクトリ設定（out）を変えずに済むよう、Next.js の export と同じ場所に出力する
  outDir: './out',
  // /works/oneday-op → works/oneday-op.html（Next.js の static export と同じ URL 形式）
  build: { format: 'file' },
  trailingSlash: 'never',
  // sitemap-index.xml / sitemap-0.xml を出力する（site が未設定のときは何もしない）
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    // works / blog の本文は src/lib/markdown/render.ts で描画している（同じ設定）。
    // ここは Astro 標準の render() を使う場合のための設定。
    syntaxHighlight: 'shiki',
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark-dimmed' }, defaultColor: false },
    processor: unified({ smartypants: false, rehypePlugins: [rehypeContent] }),
  },
});
