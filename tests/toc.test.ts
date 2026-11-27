import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildToc } from '../src/lib/markdown/toc.ts';

const h = (depth: number, slug: string, text = slug) => ({ depth, slug, text });

test('buildToc: h2・h3 だけを使い、末尾の # を外す', () => {
  const toc = buildToc([h(2, 'a', 'はじめに#'), h(3, 'b', '準備 #'), h(4, 'c'), h(2, 'd', 'まとめ#')]);
  assert.deepEqual(toc, [
    { depth: 2, slug: 'a', text: 'はじめに' },
    { depth: 3, slug: 'b', text: '準備' },
    { depth: 2, slug: 'd', text: 'まとめ' },
  ]);
});

test('buildToc: 見出しが 3 つ未満なら空。脚注の見出しは数えない', () => {
  assert.deepEqual(buildToc([h(2, 'a'), h(2, 'b')]), []);
  assert.deepEqual(buildToc([h(2, 'a'), h(2, 'b'), h(2, 'footnote-label', 'Footnotes')]), []);
});
