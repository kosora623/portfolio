/**
 * Markdown 本文（works / blog）の HTML をビルド時に整える rehype プラグイン。
 * Next.js 時代に react-markdown のカスタムコンポーネント（img / a / p）で行っていた処理を、そのまま移植したもの。
 *
 * - img: <span class="content-image"> で包み、遅延読み込みの属性を付ける
 * - a: 外部リンク（http/https）は新しいタブで開く（見た目は CSS の .prose a）
 * - p: 空白（全角スペースを含む）だけの段落は出力しない。画像だけの段落は <p> を外す。先頭がリンクの段落で、リンク先が動画なら埋め込みに置き換える
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
  return el('span', { className: ['content-image'] }, [
    el('img', {
      alt: alt ?? '',
      ...(title != null ? { title } : {}),
      loading: 'lazy',
      width: 800,
      height: 450,
      decoding: 'async',
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
  return el('div', { className: ['content-embed'] }, [
    el('iframe', {
      src: target.src,
      title: embedTitles[target.kind],
      frameBorder: '0',
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      allowFullScreen: true,
      loading: 'lazy',
    }),
  ]);
}

function decorateLink(a: Element) {
  const href = a.properties.href;
  if (typeof href === 'string' && /^https?:\/\//.test(href)) {
    a.properties.target = '_blank';
    a.properties.rel = ['noopener', 'noreferrer'];
  }
}

/** 空白（全角スペースを含む）と改行だけの段落か。Markdown で余白を作るために書かれた行 */
function isBlankParagraph(p: Element): boolean {
  return p.children.every(c =>
    c.type === 'text' ? /^[\s\u3000]*$/.test(c.value) : c.type === 'element' && c.tagName === 'br',
  );
}

/** 段落がリンク 1 つだけで、その文字が URL そのものか */
function isBareUrlParagraph(p: Element): boolean {
  const kids = p.children.filter(c => !(c.type === 'text' && /^[\s\u3000]*$/.test(c.value)));
  const [a] = kids;
  if (kids.length !== 1 || !isElement(a, 'a')) return false;
  const text = a.children.map(c => (c.type === 'text' ? c.value : '')).join('').trim();
  return text === String(a.properties.href ?? '').trim();
}

/** 段落を置き換える要素の配列を返す（変更しない場合は null） */
function transformParagraph(p: Element): Child[] | null {
  if (isBlankParagraph(p)) return [];
  const [first] = p.children;
  if (p.children.length === 1 && isElement(first, 'img')) {
    return p.children; // 画像だけの段落は <p> で包まない
  }
  // 埋め込みにするのは、URL をそのまま 1 行に書いた段落だけ。
  // 「[動画はこちらから](URL)」のように文字を付けたリンクはリンクのまま残す
  if (isBareUrlParagraph(p) && isElement(first, 'a') && typeof first.properties.href === 'string') {
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
