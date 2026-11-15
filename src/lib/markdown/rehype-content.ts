/**
 * Markdown 本文（works / blog）の HTML をビルド時に整える rehype プラグイン。
 * Next.js 時代に react-markdown のカスタムコンポーネント（img / a / p）で行っていた処理を、そのまま移植したもの。
 *
 * - img: <span class="mx-auto w-full max-w-xl block"> で包み、next/image 相当の属性を付ける
 * - a: リンク色のクラスを付け、外部リンク（http/https）は新しいタブで開く
 * - p: 画像だけの段落は <p> を外す。先頭がリンクの段落で、リンク先が動画なら埋め込みに置き換える
 * - 生の HTML（raw ノード）は出力しない（react-markdown は rehype-raw なしでは HTML を描画しなかったため）
 */
import type { Element, ElementContent, Root, RootContent } from 'hast';
import { resolveEmbed, type EmbedTarget } from '../embed';

type Parent = Root | Element;
type Child = RootContent;

const isElement = (n: Child | undefined, tag?: string): n is Element =>
  !!n && n.type === 'element' && (!tag || n.tagName === tag);

function el(tagName: string, properties: Element['properties'], children: ElementContent[] = []): Element {
  return { type: 'element', tagName, properties, children };
}

function imageWrapper(img: Element): Element {
  const { src, alt, title } = img.properties;
  return el('span', { className: ['mx-auto', 'w-full', 'max-w-xl', 'block'] }, [
    el('img', {
      alt: alt ?? '',
      ...(title != null ? { title } : {}),
      loading: 'lazy',
      width: 800,
      height: 450,
      decoding: 'async',
      className: ['mx-auto', 'block', 'rounded-md', 'border', 'border-slate/20'],
      style: 'color: transparent; object-fit: cover;',
      src: src ?? '',
    }),
  ]);
}

const embedTitles: Record<EmbedTarget['kind'], string> = {
  youtube: 'YouTube video player',
  niconico: 'ニコニコ動画 プレーヤー',
  bilibili: 'bilibili プレーヤー',
};

function embed(target: EmbedTarget): Element {
  return el('div', { className: ['mx-auto', 'w-full', 'max-w-4xl', 'aspect-w-16', 'aspect-h-9'] }, [
    el('iframe', {
      src: target.src,
      title: embedTitles[target.kind],
      frameBorder: '0',
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      allowFullScreen: true,
      className: ['w-full', 'h-full', 'rounded-md'],
    }),
  ]);
}

function decorateLink(a: Element) {
  const href = a.properties.href;
  const incoming = Array.isArray(a.properties.className) ? a.properties.className : [];
  a.properties.className = [...incoming, 'text-teal', 'hover:underline', 'hover:text-teal/80'];
  if (typeof href === 'string' && /^https?:\/\//.test(href)) {
    a.properties.target = '_blank';
    a.properties.rel = ['noopener', 'noreferrer'];
  }
}

/** 段落を置き換える要素の配列を返す（変更しない場合は null） */
function transformParagraph(p: Element): Child[] | null {
  const [first] = p.children;
  if (p.children.length === 1 && isElement(first, 'img')) {
    return p.children; // 画像だけの段落は <p> で包まない
  }
  if (isElement(first, 'a') && typeof first.properties.href === 'string') {
    const target = resolveEmbed(first.properties.href);
    if (target) return [embed(target)];
  }
  return null;
}

function walk(parent: Parent) {
  const next: Child[] = [];
  for (const child of parent.children as Child[]) {
    // raw ノードは remark-rehype の allowDangerousHtml で作られる（hast の型定義には含まれない）
    if ((child as { type: string }).type === 'raw') continue;
    if (isElement(child, 'p')) {
      const replaced = transformParagraph(child);
      if (replaced) {
        for (const r of replaced) {
          if (isElement(r)) walk(r);
          next.push(isElement(r, 'img') ? imageWrapper(r) : r);
        }
        continue;
      }
    }
    if (isElement(child)) {
      walk(child);
      if (child.tagName === 'a') decorateLink(child);
      if (child.tagName === 'img') {
        next.push(imageWrapper(child));
        continue;
      }
    }
    next.push(child);
  }
  parent.children = next as Parent['children'];
}

export default function rehypeContent() {
  return (tree: Root) => {
    walk(tree);
  };
}
