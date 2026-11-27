import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectTags, comparePosts, postsAboutWork, formatDate, fromFrontmatterDate, isVisible, skyFor, tagHref, toJstIso, type BlogPost } from '../src/lib/blog-model.ts';

const post = (slug: string, iso: string): BlogPost => ({ slug, title: slug, date: new Date(iso), description: '', tags: [], works: [], draft: false });

test('isVisible: 下書きは includeDrafts のときだけ', () => {
  assert.equal(isVisible({ draft: false }, false), true);
  assert.equal(isVisible({ draft: true }, false), false);
  assert.equal(isVisible({ draft: true }, true), true);
});

test('comparePosts: 新しい順、同じ日時は slug 順', () => {
  const list = [post('b', '2026-11-01T00:00:00Z'), post('c', '2026-11-16T00:00:00Z'), post('a', '2026-11-01T00:00:00Z')];
  assert.deepEqual(list.sort(comparePosts).map(p => p.slug), ['c', 'a', 'b']);
});

test('fromFrontmatterDate: 日付だけの値は日本時間の 0 時、時刻つきはそのまま', () => {
  // YAML の 2026-11-16 は UTC 0 時の Date になる
  assert.equal(toJstIso(fromFrontmatterDate(new Date('2026-11-16'))), '2026-11-16T00:00:00+09:00');
  const withTime = new Date('2026-11-16T21:30:00+09:00');
  assert.equal(fromFrontmatterDate(withTime).getTime(), withTime.getTime());
});

test('formatDate: 日本時間の日付（UTC では前日でも）', () => {
  assert.equal(formatDate(new Date('2026-11-15T15:30:00Z')), '2026-11-16');
  assert.equal(formatDate(fromFrontmatterDate(new Date('2026-11-16'))), '2026-11-16');
});

test('skyFor: 投稿時刻（日本時間）で空の色を選ぶ。日付だけの記事は昼', () => {
  assert.equal(skyFor(fromFrontmatterDate(new Date('2026-11-16'))), 'day');
  assert.equal(skyFor(new Date('2026-11-16T06:30:00+09:00')), 'morning');
  assert.equal(skyFor(new Date('2026-11-16T12:00:00+09:00')), 'day');
  assert.equal(skyFor(new Date('2026-11-16T17:00:00+09:00')), 'evening');
  assert.equal(skyFor(new Date('2026-11-16T23:15:00+09:00')), 'night');
  assert.equal(skyFor(new Date('2026-11-16T00:30:00+09:00')), 'night');
});

test('collectTags: 件数の多い順、同数なら名前順。1 記事に同じタグが重複しても 1 件', () => {
  const posts = [{ tags: ['diary', 'astro'] }, { tags: ['astro', 'astro'] }, { tags: ['code'] }];
  assert.deepEqual(collectTags(posts), [
    { tag: 'astro', count: 2 },
    { tag: 'code', count: 1 },
    { tag: 'diary', count: 1 },
  ]);
});

test('tagHref: 日本語や記号は URL エンコードする', () => {
  assert.equal(tagHref('diary'), '/blog/tags/diary');
  assert.equal(tagHref('日記'), '/blog/tags/%E6%97%A5%E8%A8%98');
});

test('postsAboutWork: その作品を取り上げた記事だけを、元の順のまま返す', () => {
  const posts = [
    { slug: 'b', works: ['oneday-op'] },
    { slug: 'a', works: [] },
    { slug: 'c', works: ['portfolio-site', 'oneday-op'] },
  ];
  assert.deepEqual(postsAboutWork(posts, 'oneday-op').map(p => p.slug), ['b', 'c']);
  assert.deepEqual(postsAboutWork(posts, 'none'), []);
});
