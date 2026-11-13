# Astro 移行計画（Next.js 15 → Astro）

最終更新: 2026-11-14 / ブランチ: `refactor/prepare-astro`

このドキュメントは「現状調査」「移行計画」「判断ログ」「実施内容と残タスク」をまとめたものです。
UI リニューアルの提案は別ファイル [UI_PROPOSAL.md](./UI_PROPOSAL.md) にあります。

---

## 0. サマリー

- サイトは **Next.js 15.5 / App Router / `output: 'export'`（完全静的）**。サーバー機能（API Routes・Server Actions・middleware）は使っておらず、Astro の静的出力にそのまま載せ替えられる構成。
- Next.js 固有の依存は `next/link`、`next/image`（unoptimized）、`next/dynamic`、`next/navigation`（`notFound`）、Metadata API の 5 つだけ。
- 「挙動を変えない」範囲で、**データ・純粋ロジックを UI から分離するリファクタリングを 5 コミット実施**した。どの段階でも lint・型チェック・ビルドが通り、ビルド出力（HTML・CSS・RSC ペイロード）が変更前と同一であることを機械的に確認している（検証方法は §5.2）。
- 調査中に**既存の不具合**がいくつか見つかった（カスタム色が未定義で効いていない、YouTube 埋め込みの高さが潰れる、oEmbed が 404 になる など）。見た目や挙動が変わるため今回は修正せず、§1.5 と UI_PROPOSAL.md に記録した。

---

## 1. 現状の把握

### 1.1 構成

| 項目 | 内容 |
|---|---|
| フレームワーク | Next.js 15.5.4（App Router, Turbopack ビルド） |
| 出力 | `output: 'export'` → `out/` に静的 HTML |
| React | 19.1.0 |
| スタイル | Tailwind CSS v4（`@tailwindcss/postcss`）、`src/app/globals.css` |
| コンテンツ | `content/works/*.md`（frontmatter + Markdown、6 件） |
| 画像 | `public/` 配下（最適化なし） |
| ホスティング | Cloudflare Pages（`content/works/portfolio-site.md` の記述より。リポジトリ内にデプロイ設定ファイルはない） |
| テスト | なし（lint のみ） |

ルート:

| パス | ファイル | 生成方法 |
|---|---|---|
| `/` | `src/app/page.tsx`（ページ全体が `'use client'`） | 静的 |
| `/works` | `src/app/works/page.tsx` → `WorkPageShell` → `WorksListClient`（`ssr:false`） | 静的（ただし本体は CSR） |
| `/works/[slug]` | `src/app/works/[slug]/page.tsx`（`generateStaticParams`） → `WorkDetailClient`（`ssr:false`） | SSG（ただし本体は CSR） |

### 1.2 使っている Next.js の機能

| 機能 | 使用 | 使用箇所 / 備考 |
|---|---|---|
| App Router | ✅ | `src/app/` |
| Pages Router | ❌ | — |
| `next/link` | ✅ | Header、Home（`motion.create(Link)`）、Works 一覧、Works 詳細 → **現在は `src/components/framework/Link.ts` 経由** |
| `next/image` | ✅ | Home（プロフィール画像）、Works 一覧（サムネイル `fill`）、Works 詳細（Markdown 内画像）→ **現在は `src/components/framework/Image.ts` 経由**。`images.unoptimized: true` なので、実体はほぼ `<img>` |
| `next/font` | ❌ | 未使用。`globals.css` が `--font-geist-sans` を参照しているが読み込まれておらず、body は Arial |
| Metadata API | ✅（一部） | `layout.tsx` で改修中モードのときだけ `title` / `robots` を設定。**通常モードでは `<title>` も description も出力されていない** |
| `generateStaticParams` | ✅ | `works/[slug]` |
| `next/navigation`（`notFound`） | ✅ | `works/[slug]/page.tsx` |
| `next/dynamic`（`ssr:false`） | ✅ | `WorkPageShell`（Particle / 一覧 / 詳細）、`WorkDetailClient`（EmbedFetcher） |
| API Routes | ❌ | かつて `src/app/api/oembed/route.ts` があったが、静的書き出しのためコミット `ff9c93e` で削除済み。**ただし呼び出し側の `EmbedFetcher` は残っている**（§1.5） |
| Server Actions | ❌ | — |
| middleware | ❌ | — |
| 環境変数 | ✅ | `NEXT_PUBLIC_MAINTENANCE_MODE`（`src/lib/maintenance.ts`）。未設定のときは production ビルドで改修中ページになる |
| Server Components | ✅ | `layout.tsx`、`works/page.tsx`、`works/[slug]/page.tsx`、`Footer`、`MaintenancePage`（fs 読み込みはビルド時のみ） |

### 1.3 クライアント側のインタラクションが必要なコンポーネント

| コンポーネント | `'use client'` の理由 | 本当に JS が必要か |
|---|---|---|
| `src/app/page.tsx`（HomePage） | framer-motion のアニメーション、`useInView` によるスクロール表示 | **ほぼ不要**。CSS アニメーションと IntersectionObserver の小さなスクリプトで代替できる |
| `Header` | スクロール量で背景を切り替える `useState` + scroll イベント | 小さなスクリプトで十分（React は不要） |
| `ParticleBackground` | tsParticles（canvas、クリックで追加・ホバーで反発） | **必要**（canvas 描画）。ただし React ラッパーは不要 |
| `WorkPageShell` | `next/dynamic` の `ssr:false` を使うため | 不要（レイアウトの役割だけ） |
| `WorksListClient` | framer-motion の stagger 表示 | 不要（静的リスト + CSS） |
| `WorkDetailClient` | framer-motion、react-markdown をクライアントで実行 | 不要（Markdown はビルド時に HTML 化できる） |
| `EmbedFetcher` | `/api/oembed` を fetch（現在は 404） | 不要（ビルド時に解決するか、静的な iframe / リンクカードにする） |
| `AsciiCommentClient` | `/ASCII.txt` を fetch して HTML コメントを差し込む隠し要素 | 不要（ビルド時に静的なコメントとして出力できる。ASCII.txt に `--` が含まれないことは確認済み） |
| `PageTransition` | framer-motion | **未使用**（どこからも import されていない） |

### 1.4 依存ライブラリと Astro での扱い

| パッケージ | 現在の用途 | Astro での扱い | 判定 |
|---|---|---|---|
| `next` / `eslint-config-next` | フレームワーク | 削除 | 置き換え |
| `react` / `react-dom` | UI | React Islands を残す場合だけ `@astrojs/react` と一緒に残す | 条件付きで残す |
| `framer-motion` | 出現アニメーション、ホバー | React Island 内なら動く。`.astro` に移すなら CSS アニメーション + IntersectionObserver で置き換え（必要なら `motion` のバニラ API） | 置き換え推奨 |
| `react-intersection-observer` | スクロール出現 | ネイティブの `IntersectionObserver` で置き換え | 置き換え |
| `@tsparticles/react` | パーティクル | React ラッパーをやめ、`@tsparticles/slim` + `tsParticles.load()` を `<script>` から呼ぶ | 置き換え |
| `@tsparticles/slim` | パーティクル本体 | そのまま使える | 残す |
| `gray-matter` | frontmatter 解析 | Content Collections が解析するので不要 | 削除 |
| `react-markdown` / `remark-gfm` | Markdown 表示（クライアント側） | Astro 標準の Markdown（GFM は標準で有効）+ 独自の remark/rehype プラグイン | 置き換え |
| `rehype-raw` | **未使用** | — | 削除（今すぐ削除しても可。§3 判断ログ D-4） |
| `isomorphic-dompurify` / `jsdom` | **未使用**（かつての oEmbed API 用と思われる。`src/types/jsdom.d.ts` も残骸） | — | 削除（同上） |
| `react-icons` | SNS アイコン | `.astro` から使うなら `astro-icon` + Iconify、またはインライン SVG。React コンポーネントを client ディレクティブなしで使えばゼロ JS で静的 HTML になるが、そのためだけに React を残すのは過剰 | 置き換え推奨 |
| `tailwindcss` v4 | スタイル | `@tailwindcss/vite` で使える | 残す |

**Astro で「使えない」依存はない**。ただし `next/*` 系と `react-markdown` はビルド時処理（Astro のほうが得意）に置き換えたほうが、出力も JS 量も大きく改善する。

### 1.5 調査で見つかった既存の問題（今回は修正していない）

| # | 問題 | 影響 | 対応方針 |
|---|---|---|---|
| B-1 | `navy` / `teal` / `slate` / `light-slate` などのカスタム色が **Tailwind v4 の `@theme` に定義されていない**。ビルド後の CSS にもこれらのクラスが存在しない | 想定していた配色が一切効いていない。実際の表示は `#0a0a0a` 背景に `#ededed` 文字の白黒と、タグの赤・緑・黄だけ | UI リニューアルで色トークンを定義し直す（UI_PROPOSAL.md） |
| B-2 | YouTube 埋め込みの `aspect-w-16 aspect-h-9` は Tailwind v3 のプラグイン用クラスで、v4 では無効 | iframe が既定の高さ（150px）になり、潰れて見える可能性が高い | Tailwind v4 標準の 16:9 アスペクト比ユーティリティ（`aspect-ratio: 16 / 9`）に変更（見た目が変わるので移行時に対応） |
| B-3 | `prose` クラスも `@tailwindcss/typography` が無いため無効 | Markdown 本文の見出し・リストなどにスタイルが当たっていない | リニューアル時に本文用のタイポグラフィを設計する |
| B-4 | `EmbedFetcher` が、削除済みの `/api/oembed` を呼んでいる | 「リンク 1 つだけの段落」のリンク先が X / Instagram / ニコニコ / bilibili のとき「Embed error」になる。現在のコンテンツでは `oneday-op.md` の Instagram リンクが該当すると推定 | 移行時にビルド時処理へ置き換える（§2.1） |
| B-5 | `/works` と `/works/[slug]` の本体が `ssr:false` のため、**HTML に中身が入っていない**（CSR bailout） | SEO・初期表示・JS を切った環境に弱い | Astro で静的 HTML にすれば自然に解決する |
| B-6 | 通常モードでは `<title>`、description、OGP がない | 検索・SNS シェア時の表示 | 移行時に BaseLayout に SEO 用のプロパティを用意する |
| B-7 | Home の各セクションが `style="opacity:0"` の状態で HTML に出力される（17 か所） | JS が読み込まれないとトップページがほぼ空白 | CSS アニメーション + `prefers-reduced-motion` で対応 |
| B-8 | `WorkDetailClient` が `tagInfo[tag].color` を使っており、未定義のタグがあると例外になる（一覧側は `?.` で安全） | タグを増やしたときに詳細ページが壊れる | 移行時に安全な参照に統一する |
| B-9 | `public/works-images/01/` の画像が 1.3MB / 2.2MB あり、最適化されていない | 表示速度 | `src/assets` に移して `astro:assets` で最適化 |

---

## 2. 移行計画

### 2.1 機能ごとの置き換え

| Next.js | Astro での置き換え | メモ |
|---|---|---|
| `src/app/layout.tsx` | `src/layouts/BaseLayout.astro` | `<html lang="ja">`、Header/Footer、SEO 用 props（title, description, og:image） |
| `src/app/page.tsx` | `src/pages/index.astro` | データは `src/data/profile.ts`・`site.ts` をそのまま import |
| `src/app/works/page.tsx` | `src/pages/works/index.astro` | `getCollection('works')` → `sortWorks()`（`src/lib/work-model.ts` を流用） |
| `src/app/works/[slug]/page.tsx` + `generateStaticParams` | `src/pages/works/[slug].astro` + `getStaticPaths()` | `render(entry)` → `<Content />` |
| `notFound()` | `getStaticPaths` に無い slug は自動で 404。`src/pages/404.astro` を用意 | |
| `src/lib/works.ts`（fs + gray-matter） | `src/content.config.ts` の Content Collection（`glob()` loader で `content/works/**/*.md` を指定）+ zod スキーマ | `normalizeWork` の型変換（month が文字列の場合など）は `z.coerce.number()` などで表現 |
| `next/image` | `astro:assets` の `<Image />` / `<Picture />` | 最適化するには画像を `src/assets/` に移す必要がある（`public/` の画像は最適化されない）。frontmatter の `thumbnailUrl` はスキーマの `image()` に変更 |
| `next/link` | 普通の `<a href>` | ページ遷移のアニメーションが欲しければ `<ClientRouter />`（View Transitions） |
| `next/dynamic` `ssr:false` | `client:only="react"` / `client:visible` / `client:idle` | ただし後述のとおり、ほとんどは JS 不要にする |
| Metadata API | BaseLayout の `<head>` に直接書く | 改修中モードの `robots: noindex` も layout の props で切り替え |
| `react-markdown` のカスタムレンダラー（img / a / p） | remark/rehype プラグイン（`astro.config.mjs` の `markdown.remarkPlugins` / `rehypePlugins`） | 外部リンクに `target=_blank` を付ける処理、URL だけの段落の埋め込み判定には `src/lib/embed.ts` の関数をそのまま流用 |
| `EmbedFetcher`（実行時 oEmbed） | **ビルド時に解決**。YouTube / ニコニコ / bilibili は iframe URL を組み立てるだけ。X はビルド時に oEmbed を取得、Instagram はトークンが必要なのでリンクカードにフォールバック | 実行時の fetch がなくなる |
| `NEXT_PUBLIC_MAINTENANCE_MODE` | `PUBLIC_MAINTENANCE_MODE`（`import.meta.env`）。改修中モードでは全ページを Maintenance レイアウトで出す、または `index.astro` だけ出して他は生成しない | `src/lib/maintenance.ts` のロジックをそのまま移植（`process.env.NODE_ENV` → `import.meta.env.PROD`） |
| `AsciiCommentClient`（実行時 fetch） | ビルド時に `ASCII.txt` を読み、`<Fragment set:html={'<!--' + ascii + '-->'} />` で出力 | `--` を含まないことをビルド時にチェックする |
| `globals.css` + `@tailwindcss/postcss` | `src/styles/global.css` + `@tailwindcss/vite` | UI リニューアルに合わせて `@theme` トークンを定義し直す |
| `out/` | `dist/` | |

### 2.2 React Islands として残すか、`.astro` に書き換えるか

基本方針: **「JS が無くても成り立つものは `.astro` にする」**。ポートフォリオは読み物が中心なので、Islands は最小限にする。

| コンポーネント | 判断 | 理由 |
|---|---|---|
| Header | `.astro` + インラインスクリプト（数行） | 状態はスクロール位置による class の切り替えだけ。React ランタイム（約 60KB）を読み込むほどではない |
| Footer | `.astro` | 静的 |
| MaintenancePage | `.astro` | 静的 |
| Home（hero / about / interests / hobbies / socials） | `.astro` | 中身は静的なテキスト。出現アニメーションは CSS + IntersectionObserver（共通のスクリプトを 1 つ）で再現する |
| ParticleBackground | **Island 相当で残す**。ただし React をやめ、`.astro` 内の `<script>` から `@tsparticles/slim` を直接呼ぶ。`requestIdleCallback` や `client:idle` 相当のタイミングで遅延読み込みし、`prefers-reduced-motion` のときは起動しない | canvas とインタラクションには JS が必須。React ラッパーを外せば、tsParticles 本体だけで済む |
| WorkPageShell | 廃止（レイアウトに吸収） | `ssr:false` を回避するためだけに存在している |
| WorksListClient | `.astro` | 静的なリスト。ホバー時のサムネイル表示は CSS だけで実現できる |
| WorkDetailClient | `.astro`（`<Content />`） | Markdown をビルド時に HTML 化できる。B-5 も解決する |
| EmbedFetcher | 廃止 | §2.1 のとおりビルド時に解決する |
| AsciiCommentClient | 廃止（ビルド時に出力） | 同上 |
| PageTransition | 廃止 | 未使用。遷移アニメーションが欲しければ `<ClientRouter />` |

> 移行中のつなぎとしては、既存の React コンポーネントを `client:load` でそのまま Island として載せることもできる（§2.3 Phase 1）。最終形では上の表に寄せる。

### 2.3 段階的な移行手順

**Phase 0 — 準備（このブランチで実施済み）**
- データ・純粋ロジックを `src/data/`、`src/lib/` に分離
- Next.js 固有の import（Link/Image）の窓口を一か所に集約
- 詳細は §4

**Phase 1 — Astro プロジェクトの土台（別ブランチ `feat/astro`）**
1. 新しいブランチで `npm create astro@latest` 相当の最小構成を追加する（既存の Next.js のファイルとは別のディレクトリで始めて、最後に入れ替えるのが安全）。`@astrojs/react`、`@tailwindcss/vite` を追加
2. `src/data/*`、`src/lib/work-model.ts`、`src/lib/embed.ts`、`content/`、`public/` をそのまま使う
3. `content.config.ts` に `works` コレクションを定義し、zod スキーマで現在の frontmatter を検証する
4. BaseLayout / 404 / Maintenance を作る
5. 動作確認のため、まずは既存の React コンポーネントを `client:load` で載せて、現状と同じ見た目で動く状態にする（**見た目を変えない移行**と **UI リニューアル**を分けると、問題の切り分けがしやすい）

**Phase 2 — `.astro` 化と JS 削減**
1. Footer / Maintenance / Works 一覧 / Works 詳細を `.astro` に
2. Markdown のカスタム処理を remark/rehype プラグイン化し、EmbedFetcher を廃止（B-4 解決）
3. Home・Header を `.astro` + 小さなスクリプトに。framer-motion・react-intersection-observer を外す
4. ParticleBackground をバニラスクリプト化。この時点で React が不要になれば `@astrojs/react` を外す

**Phase 3 — UI リニューアル**（UI_PROPOSAL.md の案から 1 つ選んで実装）
- デザイントークン（`@theme`）を定義（B-1, B-3 解決）
- 画像を `src/assets` に移して `astro:assets` 化（B-9）
- SEO/OGP（B-6）、アクセシビリティ対応

**Phase 4 — 切り替え**
1. Cloudflare Pages のプレビューデプロイで、全 URL（`/`, `/works`, `/works/<slug>` × 6）が 200 になること、リンク切れがないことを確認
2. 本番ブランチに反映し、Next.js 関連のファイル・依存を削除

### 2.4 デプロイ設定の変更点（Cloudflare Pages）

| 項目 | 現在（推定） | 移行後 |
|---|---|---|
| Framework preset | Next.js (Static HTML Export) | Astro |
| Build command | `npm run build`（= `next build --turbopack`） | `npm run build`（= `astro build`） |
| Output directory | `out` | `dist` |
| 環境変数 | `NEXT_PUBLIC_MAINTENANCE_MODE`（任意） | `PUBLIC_MAINTENANCE_MODE` に名前を変更 |
| Node バージョン | 未固定 | Astro が要求するバージョン以上を `NODE_VERSION` か `.nvmrc` で固定 |
| アダプター | — | 完全静的なら不要（`@astrojs/cloudflare` は SSR を使う場合だけ） |

**URL の互換性**: Next.js の export は `works/ATMclicker.html` の形式（`trailingSlash: false`）。Astro は既定で `works/ATMclicker/index.html` を出力する。Cloudflare Pages はどちらの形式でも `/works/ATMclicker` で配信できるが、末尾スラッシュ付きへのリダイレクトの有無が変わる可能性がある。`astro.config` で `build.format: 'file'` を指定すれば現在と同じ形式になるので、**最初は `'file'` にして URL を完全に維持する**のを推奨する。

### 2.5 リスク

| リスク | 影響 | 対策 |
|---|---|---|
| URL 形式の変化（末尾スラッシュ） | 外部からのリンク・検索結果 | `build.format: 'file'`、移行前後で全 URL を確認 |
| Markdown の描画差（react-markdown と Astro 標準の差） | 本文の見た目・埋め込み | 移行前後で各作品ページを目視比較。特に「URL だけの段落」の判定ロジック |
| 画像パスの変更（`public` → `src/assets`） | 画像が表示されない | frontmatter を `image()` スキーマで検証し、パスの誤りをビルドエラーにする |
| 改修中モードの既定値（production では改修中） | 移行直後にサイトが「改修中」のまま、または意図せず公開 | 環境変数を明示的に設定する。既定値の方針を README に書く |
| Instagram / X の埋め込み仕様の変化 | ビルド時の oEmbed が失敗 | 失敗したらリンクカードにフォールバックし、ビルドは止めない |
| React 19 と `@astrojs/react` の対応 | Phase 1 で Islands が動かない | 導入時に最新の対応状況を確認する（Phase 2 で React を外せば解消） |
| テストがない | 退行に気付けない | §5.2 の比較スクリプトの考え方を流用し、移行前後の HTML テキストを比較する。リンクチェッカーを CI に入れる |

---

## 3. 判断ログ

自律実行のなかで判断に迷った点と、その結論・理由です。いずれも「安全で元に戻しやすい方」を選んでいます。

| ID | 判断 | 理由 |
|---|---|---|
| D-1 | **挙動が変わらないことをビルド出力の比較で検証**することにした（HTML のテキスト・属性、CSS ルールの集合、RSC ペイロード中の文字列とその並び順）。改修中モード／通常モードの両方でビルドする | テストがないため。見た目・挙動を変えないという制約を機械的に守るため |
| D-2 | Footer の React `key` を `index` のままにした（`link.id` にすると RSC ペイロードの key が変わる） | key は表示に影響しないが、「出力が同一」という検証基準を厳密に保つため。Astro 化で消える箇所なので実害はない |
| D-3 | 既存の不具合（§1.5 の B-1〜B-9）は修正しなかった | どれも見た目や挙動が変わるため。指示どおり計画と提案に記録するだけにした |
| D-4 | 未使用の依存（`rehype-raw`、`isomorphic-dompurify`、`jsdom`）と未使用ファイル（`PageTransition.tsx`、`src/types/jsdom.d.ts`）は**削除しなかった** | 削除自体は安全と考えられるが、`package-lock.json` が大きく変わり「依存パッケージの大幅な削除」に当たりうるため。Phase 2 でまとめて削除する |
| D-5 | `next/dynamic` は `React.lazy` などに置き換えなかった | `ssr:false` の挙動（HTML に中身を出さない）が変わり、出力が変わるため。Astro 化で廃止される箇所 |
| D-6 | `NEXT_PUBLIC_MAINTENANCE_MODE` の名前は変えなかった | 本番環境の設定と結びついていて、変更すると挙動が変わる危険があるため。Astro 移行時に `PUBLIC_` に名前を変える |
| D-7 | Link/Image は「中身は再エクスポートだけの窓口ファイル」にとどめ、`<a>` / `<img>` への置き換えはしなかった | `next/link` のプリフェッチや `next/image` の出力属性（`data-nimg`、`loading="lazy"` など）が変わってしまうため |
| D-8 | アニメーションの variants（framer-motion）は UI 側に残した | UI リニューアルで作り直す前提で、見た目に関わる部分には触れないという指示に従った |
| D-9 | `src/app/` はルーティング専用にし、クライアントコンポーネントを `src/components/works/` に移した | Astro の `src/pages`（ルーティング）と `src/components`（UI）の分け方に合わせておくと、移行時の対応が分かりやすい。ファイルの移動だけで出力は同一 |
| D-10 | ユニットテスト基盤（vitest など）は追加しなかった | 依存の追加になるため。純粋関数（`work-model.ts`、`embed.ts`）は分離したので、Phase 1 でテストを追加しやすい状態になっている |
| D-12 | ドキュメントには Tailwind のクラス名と同じ単語を書かないようにした | Tailwind v4 の自動ソース検出がリポジトリ直下の `.md` も読み取るため。最初の版では、文中のクラス名が原因で未使用の CSS ルールが追加されてしまった（比較検証で検出）。表示への影響はないが、`globals.css` に `@source not "../../*.md";` のような除外を書くのが根本的な対策。これは CSS の変更になるので、Astro 移行時に実施する |
| D-11 | `git` の `core.autocrlf=true` で、作業ツリーに LF/CRLF の警告が出るが、そのままにした | リポジトリ内部は LF で、既存の運用どおり。`.gitattributes` の追加は今回の範囲外 |

---

## 4. 実施したこと

### 4.1 コミット一覧（`refactor/prepare-astro`）

| # | コミット | 内容 |
|---|---|---|
| 1 | `refactor: separate works data model from fs loader` | `src/lib/work-model.ts` を新設（`WorkFromMd` 型、`normalizeWork`、`compareWorks`、`sortWorks`）。`works.ts` は fs + gray-matter による読み込みだけに。クライアント側の型 import は fs を含まないモジュールから取るように変更 |
| 2 | `refactor: extract tag metadata and embed URL detection` | 一覧と詳細で重複していた `tagInfo` を `src/data/tags.ts` に。YouTube / X / ニコニコ / bilibili / Instagram の URL 判定を `src/lib/embed.ts` に（`isOEmbedTarget` を追加） |
| 3 | `refactor: move site/profile content into src/data` | `src/data/site.ts`（サイト名、連絡先、ナビ、SNS リンク、フッターに出す SNS）、`src/data/profile.ts`（hero / about の文言、スキル、興味、趣味）、`src/components/socialIcons.ts`（アイコンのキー → react-icons の対応）。Home / Header / Footer / MaintenancePage はこれらを参照するように |
| 4 | `refactor: move works client components out of app/ into components/works` | `WorksListClient` / `WorkDetailClient` を `src/components/works/` に移動 |
| 5 | `refactor: route next/link and next/image through framework adapters` | `src/components/framework/{Link,Image}.ts`。Next.js 固有の import はこの 2 つと `next/dynamic`（2 か所）、`next/navigation`（1 か所）だけになった |
| 6 | `docs: add Astro migration plan and UI renewal proposal` | このファイルと UI_PROPOSAL.md |
| 7 | `docs: avoid Tailwind class tokens in docs` | ドキュメント中のクラス名が CSS 生成に拾われた問題の修正（D-12） |

### 4.2 リファクタリング後のディレクトリ構成

```
src/
├── app/                      # ルーティング専用（Astro では src/pages に相当）
│   ├── layout.tsx
│   ├── page.tsx
│   └── works/
│       ├── page.tsx
│       └── [slug]/page.tsx
├── components/               # UI（Astro 移行時に .astro 化 or Island 化）
│   ├── framework/            # ★ Next.js 固有 API の窓口（Link, Image）
│   ├── works/                # ★ 一覧・詳細の UI
│   ├── socialIcons.ts        # ★ アイコンキー → react-icons
│   └── Header / Footer / ParticleBackground / ...
├── data/                     # ★ フレームワーク非依存のデータ（そのまま Astro へ持っていける）
│   ├── profile.ts
│   ├── site.ts
│   └── tags.ts
└── lib/
    ├── work-model.ts         # ★ フレームワーク非依存（型・正規化・並び順）
    ├── embed.ts              # ★ フレームワーク非依存（URL 判定）
    ├── works.ts              # fs ローダー（Astro では Content Collections に置き換え）
    └── maintenance.ts
```

★ = 今回追加・移動したもの。`src/data/` と `src/lib/work-model.ts`・`embed.ts` は React にも Next.js にも依存しない。

### 4.3 検証方法

各コミットで次を実行し、すべて通ることを確認した:

1. `npm run lint`（エラー・警告なし）
2. `npx tsc --noEmit`
3. `npm run build`（改修中モード）→ 変更前の出力と比較
4. `NEXT_PUBLIC_MAINTENANCE_MODE=false npm run build`（通常モード）→ 変更前の出力と比較

比較の内容: `<script>` と `<link>` を除いた HTML、チャンクのハッシュを除いたパス、CSS ルールの集合、RSC ペイロード（`.txt`）に含まれる文字列とその**並び順**（CSR で描画される作品一覧の内容・順序も確認できる）。5 コミットすべて「IDENTICAL」。比較スクリプトに差分の検出能力があることは、改修中モードと通常モードの出力を比べて差分が検出されることで確認した。

ページサイズ（First Load JS）も変更前と同じ（`/` 209kB、`/works` 120kB）。

---

## 5. 残タスク

### 5.1 移行前にやっておけること（挙動が変わるので、確認のうえで実施）

- [ ] 未使用の依存を削除: `rehype-raw`、`isomorphic-dompurify`、`jsdom`、`src/types/jsdom.d.ts`（D-4）
- [ ] 未使用の `src/components/PageTransition.tsx` を削除（D-4）
- [ ] B-8: `WorkDetailClient` のタグ参照を `tagInfo[tag]?.` に（未定義のタグで落ちないように）
- [ ] B-4: `EmbedFetcher` を外し、該当する段落は通常のリンクとして表示する（移行までの暫定対応）
- [ ] `README.md` を create-next-app のテンプレートから実際の内容に書き換える（改修中モードの使い方など）
- [ ] 純粋関数（`work-model.ts`、`embed.ts`）のユニットテストを追加（vitest を入れる場合）

### 5.2 移行時（Phase 1〜4）

- [ ] §2.3 の手順で実施
- [ ] `content.config.ts` のスキーマ（`title: z.string()`, `year: z.number()`, `month: z.coerce.number().optional()`, `tags: z.array(z.enum(['video','code','music']))`, `summary: z.string().default('')`, `thumbnailUrl` → `image()`）
- [ ] 埋め込み用の remark/rehype プラグイン（`src/lib/embed.ts` を利用）
- [ ] Cloudflare Pages の設定変更（§2.4）
- [ ] UI リニューアル（UI_PROPOSAL.md）

### 5.3 コンテンツ側（任意）

- Markdown 本文で、全角スペースや空行をレイアウト調整に使っている箇所が多い（`portfolio-site.md`、`ATMclicker.md` など）。Astro の Markdown では表示が変わる可能性があるため、移行時にスタイル側で余白を設計して、本文からは取り除くのがよい
- `M3-2025-autumn.md` は本文が空（「準備中」）。`draft: true` のようなフラグをスキーマに用意すると管理しやすい
