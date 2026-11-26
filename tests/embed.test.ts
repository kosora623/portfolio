import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getYouTubeEmbedUrl, resolveEmbed } from '../src/lib/embed.ts';

test('getYouTubeEmbedUrl: watch / youtu.be / embed の形式から埋め込み URL を作る', () => {
  const expected = 'https://www.youtube.com/embed/abc_-12';
  assert.equal(getYouTubeEmbedUrl('https://www.youtube.com/watch?v=abc_-12'), expected);
  assert.equal(getYouTubeEmbedUrl('https://youtu.be/abc_-12'), expected);
  assert.equal(getYouTubeEmbedUrl('https://www.youtube.com/embed/abc_-12'), expected);
  assert.equal(getYouTubeEmbedUrl('https://example.com/watch?v=abc'), null);
});

test('resolveEmbed: ニコニコ動画と bilibili', () => {
  assert.deepEqual(resolveEmbed('https://www.nicovideo.jp/watch/sm12345'), {
    kind: 'niconico',
    src: 'https://embed.nicovideo.jp/watch/sm12345',
  });
  assert.deepEqual(resolveEmbed('https://www.bilibili.com/video/BV1xx411c7mD'), {
    kind: 'bilibili',
    src: 'https://player.bilibili.com/player.html?bvid=BV1xx411c7mD&autoplay=0',
  });
});

test('resolveEmbed: 埋め込まない URL は null（X・Instagram・ID の取れない URL）', () => {
  assert.equal(resolveEmbed('https://x.com/kosora_623/status/1'), null);
  assert.equal(resolveEmbed('https://www.instagram.com/p/abc/'), null);
  assert.equal(resolveEmbed('https://b23.tv/abc'), null);
  assert.equal(resolveEmbed('https://kosora623.com/'), null);
});
