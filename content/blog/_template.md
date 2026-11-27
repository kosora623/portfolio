---
# このファイルは "_" で始まるので公開されません。新しい記事はコピーして作ってください。
# ファイル名がそのまま URL になります（例: content/blog/hello.md → /blog/hello）
title: 記事のタイトル
date: 2026-11-15
description: 一覧ページと OGP に表示する説明文
tags:
  - diary
# works: # この記事で取り上げた作品（content/works のファイル名）。作品ページに記事へのリンクが出ます
#   - oneday-op
# image: /blog-images/xx.png # 共有したときの画像（1200×630 推奨）。省略すると自動で作ります
draft: true # true の間は npm run build に含まれません（npm run dev では表示されます）
---

本文は Markdown で書きます。作品ページと同じく、

- 画像: `![説明](/works-images/xx.png)`
- URL だけの段落（YouTube / ニコニコ動画 / bilibili）は埋め込みプレーヤーになります
- 表: `| 見出し | 見出し |` の下に `| --- | --- |`（`:---:` で中央、`---:` で右寄せ）
- 脚注: 本文に `[^1]`、どこかの行に `[^1]: 脚注の文`（記事の末尾にまとめて表示されます）

https://youtu.be/xxxxxxxxxxx
