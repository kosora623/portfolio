/**
 * Works 一覧用の小さなサムネイルを作る（npm run thumbs）。
 *
 * content/works/*.md の thumbnailUrl（public/ からのパス）を読み、
 * public/works-images/thumbs/ 以下に 384x216（16:9・中央で切り抜き）の WebP を書き出す。
 * 一覧のサムネイル枠は最大 128x72 なので、3 倍の解像度まで足りる。
 *
 * 作品を追加・サムネイルを差し替えたら実行して、生成物もコミットする。
 * 生成済みのファイルがない作品は、一覧で元の画像をそのまま使う（src/lib/thumbnail.ts）。
 */
import { createRequire } from 'node:module';
import { readdir, readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { thumbPathFor } from '../src/lib/thumbnail.ts';

// sharp は astro の依存として入っているものを使う（直接の依存には加えない）
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('astro/package.json'))('sharp');

const root = process.cwd();
const worksDir = join(root, 'content', 'works');

const urls = new Set();
for (const name of await readdir(worksDir)) {
  if (!name.endsWith('.md')) continue;
  const text = await readFile(join(worksDir, name), 'utf8');
  const m = text.match(/^thumbnailUrl:\s*['"]?([^'"\r\n]+?)['"]?\s*$/m);
  if (m && m[1].startsWith('/')) urls.add(m[1]);
}

for (const url of urls) {
  const src = join(root, 'public', url);
  const out = join(root, 'public', thumbPathFor(url));
  await mkdir(dirname(out), { recursive: true });
  const info = await sharp(src).rotate().resize(384, 216, { fit: 'cover', position: 'centre' }).webp({ quality: 78 }).toFile(out);
  console.log(`${url} -> ${thumbPathFor(url)} (${Math.round(info.size / 1024)} KB)`);
}
