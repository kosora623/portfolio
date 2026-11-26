import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adjacentWorks, formatYearMonth, groupByYear, normalizeWork, sortWorks, type WorkFromMd } from '../src/lib/work-model.ts';

const w = (slug: string, year: number, month?: number): WorkFromMd => ({ slug, title: slug, year, month, tags: [], summary: '' });

test('normalizeWork: 省略された値を既定値で埋め、文字列の月を数値にする', () => {
  const work = normalizeWork({ title: 'A', year: 2025, month: '6' }, undefined, 'a');
  assert.equal(work.slug, 'a');
  assert.equal(work.month, 6);
  assert.deepEqual(work.tags, []);
  assert.equal(work.summary, '');
  assert.equal(work.content, '');
});

test('normalizeWork: frontmatter の slug を優先する', () => {
  assert.equal(normalizeWork({ slug: 'x', title: 'A', year: 2025 }, '', 'file').slug, 'x');
});

test('sortWorks: 年 → 月の新しい順、月なしは同じ年の最後、同順は slug 順。元の配列は変えない', () => {
  const input = [w('b', 2024, 5), w('a', 2025), w('c', 2025, 3), w('z', 2025, 3), w('d', 2025, 11)];
  const sorted = sortWorks(input);
  assert.deepEqual(sorted.map(x => x.slug), ['d', 'c', 'z', 'a', 'b']);
  assert.equal(input[0].slug, 'b');
});

test('formatYearMonth: 月を 2 桁で、なければ年だけ', () => {
  assert.equal(formatYearMonth({ year: 2025, month: 6 }), '2025.06');
  assert.equal(formatYearMonth({ year: 2025 }), '2025');
});

test('groupByYear: 並び順を保って年ごとにまとめる', () => {
  const groups = groupByYear([w('a', 2025, 5), w('b', 2025, 1), w('c', 2024)]);
  assert.deepEqual(groups.map(g => [g.year, g.works.map(x => x.slug)]), [[2025, ['a', 'b']], [2024, ['c']]]);
});

test('adjacentWorks: 前後の作品。端と存在しない slug', () => {
  const list = [w('a', 2025), w('b', 2024), w('c', 2023)];
  assert.deepEqual(adjacentWorks(list, 'b'), { newer: list[0], older: list[2] });
  assert.deepEqual(adjacentWorks(list, 'a'), { newer: undefined, older: list[1] });
  assert.deepEqual(adjacentWorks(list, 'none'), {});
});
