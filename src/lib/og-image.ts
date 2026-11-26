/**
 * ブログ記事の OGP 画像（1200×630 の PNG）をビルド時に作る。
 * デザインは「空の額縁」：投稿時刻の空のグラデーションの上に、タイトルを書いた紙のカードを重ねる。
 *
 * satori（レイアウト → SVG）と resvg（SVG → PNG）はビルド時だけ使う開発用の依存で、配信するページには含まれない。
 * フォントは Google Fonts から、画像に出る文字だけのサブセットをその場で取ってくる（リポジトリにフォントを置かない）。
 */
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { site } from '@/data/site';
import { formatDate, skyFor, type BlogPost, type Sky } from './blog-model';

const WIDTH = 1200;
const HEIGHT = 630;
/** 空の額縁の太さ */
const FRAME = 56;

/** src/styles/global.css の --color-* / --sky-* と同じ色 */
const color = { paper: '#f5f7f9', ink: '#1c2128', muted: '#5f6875' };
const skyColors: Record<Sky, [string, string]> = {
  morning: ['#f3d3c0', '#c6d9ec'],
  day: ['#8ec1ea', '#ddedf8'],
  evening: ['#e9a98e', '#8e97c6'],
  night: ['#18233f', '#46557f'],
};

type Node = { type: string; props: { style?: Record<string, unknown>; children?: Node | string | (Node | string)[] } };
const h = (style: Record<string, unknown>, children?: Node['props']['children']): Node => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});

/**
 * Google Fonts から text に含まれる文字だけのフォントを取る。
 * User-Agent を付けないと TTF の URL が返る（satori は woff2 を読めない）。
 */
async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer> {
  const query = `family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(`https://fonts.googleapis.com/css2?${query}`)).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`フォントを取得できませんでした: ${family} ${weight}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`フォントを取得できませんでした: ${family} ${weight} (${res.status})`);
  return res.arrayBuffer();
}

function layout(post: BlogPost): { tree: Node; titleText: string; monoText: string } {
  const [top, bottom] = skyColors[skyFor(post.date)];
  const meta = [formatDate(post.date).replaceAll('-', '.'), ...post.tags.slice(0, 2).map(t => `#${t}`)].join('  ');
  const square = h({ width: 24, height: 24, backgroundImage: `linear-gradient(${top}, ${bottom})` });

  const tree = h(
    { width: WIDTH, height: HEIGHT, alignItems: 'center', justifyContent: 'center', backgroundImage: `linear-gradient(${top}, ${bottom})` },
    h(
      { width: WIDTH - FRAME * 2, height: HEIGHT - FRAME * 2, flexDirection: 'column', boxSizing: 'border-box', padding: '60px 72px', backgroundColor: color.paper, color: color.ink },
      [
        h(
          { flex: 1, alignItems: 'center' },
          h(
            {
              // satori の lineClamp（3 行を超えたら「…」）は display: block のときだけ効く
              display: 'block',
              fontFamily: 'Noto Sans JP',
              fontWeight: 700,
              fontSize: post.title.length > 40 ? 50 : 58,
              lineHeight: 1.42,
              lineClamp: 3,
            },
            post.title,
          ),
        ),
        h({ justifyContent: 'space-between', alignItems: 'center', fontFamily: 'JetBrains Mono' }, [
          h({ fontSize: 24, color: color.muted, whiteSpace: 'pre' }, meta),
          h({ alignItems: 'center', gap: 12, fontSize: 28, fontWeight: 500 }, [square, site.shortName]),
        ]),
      ],
    ),
  );
  // 省略記号「…」もフォントのサブセットに入れる
  return { tree, titleText: `${post.title}…`, monoText: meta + site.shortName };
}

/** 記事の OGP 画像（PNG）。フォントが取れないとき（オフラインのビルドなど）は共通の OGP 画像で代用する */
export async function renderPostOgImage(post: BlogPost): Promise<Uint8Array<ArrayBuffer>> {
  const { tree, titleText, monoText } = layout(post);
  let fonts;
  try {
    fonts = [
      { name: 'Noto Sans JP', data: await loadGoogleFont('Noto Sans JP', 700, titleText), weight: 700 as const },
      { name: 'JetBrains Mono', data: await loadGoogleFont('JetBrains Mono', 400, monoText), weight: 400 as const },
      { name: 'JetBrains Mono', data: await loadGoogleFont('JetBrains Mono', 500, monoText), weight: 500 as const },
    ];
  } catch (e) {
    console.warn(`[og-image] ${post.slug}: ${(e as Error).message}。共通の OGP 画像を使います`);
    return new Uint8Array(await readFile(join(process.cwd(), 'public', 'og.png')));
  }
  const svg = await satori(tree as Parameters<typeof satori>[0], { width: WIDTH, height: HEIGHT, fonts });
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng());
}
