/**
 * 画像の軽量版を作る（npm run images。npm run thumbs も同じ）。
 *
 * content/works/*.md と content/blog/*.md から、public/ の画像（/ で始まるパス）を集めて書き出す。
 *
 * 1. 一覧用サムネイル: frontmatter の thumbnailUrl（/works-images/...）から
 *    public/works-images/thumbs/ 以下に 384x216（16:9・中央で切り抜き）の WebP。
 *    一覧のサムネイル枠は最大 128x72 なので、3 倍の解像度まで足りる。
 * 2. 本文用: 本文の ![](/...) の画像から public/opt/ 以下に、幅 1200px まで（拡大はしない）の WebP。
 *    本文の列は最大でおよそ 600px なので、高解像度の画面でも足りる。
 *    縦横の大きさを src/data/optimized-images.json に書き、本文の <img> の width / height に使う。
 *
 * 作品・記事を追加したり画像を差し替えたりしたら実行して、生成物もコミットする。
 * 生成していない画像は、元の画像をそのまま表示する（src/lib/thumbnail.ts）。
 */
import { createRequire } from 'node:module';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { thumbPathFor, optimizedPathFor, OPTIMIZED_MANIFEST } from '../src/lib/thumbnail.ts';

// sharp は astro の依存として入っているものを使う（直接の依存には加えない）
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('astro/package.json'))('sharp');

const root = process.cwd();
const BODY_MAX_WIDTH = 1200;

const thumbs = new Set();
const bodies = new Set();
for (const dir of ['content/works', 'content/blog']) {
  for (const name of await readdir(join(root, dir))) {
    if (!name.endsWith('.md') || name.startsWith('_')) continue;
    const text = await readFile(join(root, dir, name), 'utf8');
    const m = text.match(/^thumbnailUrl:\s*['"]?([^'"\r\n]+?)['"]?\s*$/m);
    if (m && m[1].startsWith('/works-images/')) thumbs.add(m[1]);
    for (const img of text.matchAll(/!\[[^\]]*\]\((\/[^)\s]+)/g)) bodies.add(img[1]);
  }
}

const kb = n => `${Math.round(n / 1024)} KB`;

for (const url of [...thumbs].sort()) {
  const out = join(root, 'public', thumbPathFor(url));
  await mkdir(dirname(out), { recursive: true });
  const info = await sharp(join(root, 'public', url))
    .rotate()
    .resize(384, 216, { fit: 'cover', position: 'centre' })
    .webp({ quality: 78 })
    .toFile(out);
  console.log(`thumb ${url} -> ${thumbPathFor(url)} (${kb(info.size)})`);
}

const manifest = {};
for (const url of [...bodies].sort()) {
  const src = optimizedPathFor(url);
  const out = join(root, 'public', src);
  await mkdir(dirname(out), { recursive: true });
  const info = await sharp(join(root, 'public', url))
    .rotate()
    .resize({ width: BODY_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(out);
  manifest[url] = { src, width: info.width, height: info.height };
  console.log(`body  ${url} -> ${src} ${info.width}x${info.height} (${kb(info.size)})`);
}
await writeFile(join(root, OPTIMIZED_MANIFEST), JSON.stringify(manifest, null, 2) + '\n');
