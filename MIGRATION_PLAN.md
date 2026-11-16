# Astro 移行計画（Next.js 15 → Astro）

最終更新: 2026-11-15 / ブランチ: `refactor/prepare-astro`（準備）→ `feat/astro`（Phase 1〜2 実施）

このドキュメントは「現状調査」「移行計画」「判断ログ」「実施内容と残タスク」をまとめたものです。
UI リニューアルの提案は別ファイル [UI_PROPOSAL.md](./UI_PROPOSAL.md) にあります。

---

## 0. サマリー

- サイトは **Next.js 15.5 / App Router / `output: 'export'`（完全静的）**。サーバー機能（API Routes・Server Actions・middleware）は使っておらず、Astro の静的出力にそのまま載せ替えられる構成。
- Next.js 固有の依存は `next/link`、`next/image`（unoptimized）、`next/dynamic`、`next/navigation`（`notFound`）、Metadata API の 5 つだけ。
- 「挙動を変えない」範囲で、**データ・純粋ロジックを UI から分離するリファクタリングを 5 コミット実施**した。どの段階でも lint・型チェック・ビルドが通り、ビルド出力（HTML・CSS・RSC ペイロード）が変更前と同一であることを機械的に確認している（検証方法は §5.2）。
- **2026-11-15: Phase 1〜2 を実施し、Astro への移行が完了した**（`feat/astro`）。React と Next.js 関連の依存はすべて削除し、トップページの JS は約 247kB → 約 41kB（gzip）になった。移行前後で、JS 実行後の DOM とスクリーンショット（デスクトップ／モバイル、通常／改修中モード）が一致することを確認している。結果は **§6**。
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
| B-4 | `EmbedFetcher` が、削除済みの `/api/oembed` を呼んでいる | 「先頭がリンクの段落」のリンク先が X / Instagram / ニコニコ / bilibili のとき「Embed error」になる。~~現在のコンテンツでは `oneday-op.md` の Instagram リンクが該当すると推定~~ → **Phase 1 の比較で訂正: 該当する段落はなかった**（`oneday-op.md` の Instagram リンクは段落の先頭が全角スペースのため対象外） | 移行時にビルド時処理へ置き換える（§2.1） |
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
| Framework preset | Next.js (Static HTML Export) | Astro（または None。ビルドコマンドと出力先が同じなのでプリセットは必須ではない） |
| Build command | `npm run build`（= `next build --turbopack`） | `npm run build`（= `astro build`） |
| Output directory | `out` | `out`（変更不要。`astro.config.mjs` の `outDir` で合わせた。D-14） |
| 環境変数 | `NEXT_PUBLIC_MAINTENANCE_MODE`（任意） | `PUBLIC_MAINTENANCE_MODE`。移行期間のため旧名も読む（新しい名前が優先） |
| Node バージョン | 未固定 | **Astro 7 は Node 22.23.4 以上が必須**。`.node-version`（`22`）と `package.json` の `engines` を追加した。Cloudflare Pages の環境変数 `NODE_VERSION` でも指定できる |
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
| D-13 | **（Phase 1〜2）検証方法を「JS 実行後の DOM」と「ピクセル比較」に変えた** | Next.js 版は作品ページの中身を CSR で描画していたため、静的 HTML 同士の比較では意味がない。ヘッドレス Chrome で全ページを開き、スクロールしてアニメーションを完了させた後の DOM と全画面スクリーンショットを、移行前（`main` のビルド）と比較した。詳細は §6.3 |
| D-14 | 出力先を `dist` ではなく `out` のままにした（`outDir: './out'`） | Cloudflare Pages の「出力ディレクトリ」設定を変えずにデプロイできるようにするため。計画（§2.4）からの変更 |
| D-15 | Tailwind を 4.1.14 → 4.3.5 に上げ、PostCSS プラグインから `@tailwindcss/vite` に切り替えた | Astro 7（Vite 8）では `@tailwindcss/postcss` が `@import "tailwindcss"` を解決できずビルドが失敗したため。Vite 8 に対応した `@tailwindcss/vite` は 4.3 系から。生成される CSS の書き方は変わった（`margin-inline`、`oklch` など）が、ピクセル比較で見た目が同一であることを確認した |
| D-16 | ESLint 本体（9 系）は上げず、`eslint-plugin-astro` は ESLint 9 に対応する 1.7 系を使った | 最新の `eslint-plugin-astro` 2 系以降は ESLint 10 が必須。ESLint のメジャー更新は影響範囲が大きいので見送った |
| D-17 | Markdown は Astro 標準の `render(entry)` ではなく、同じ設定のプロセッサで**元ファイルの本文**を描画する（`src/lib/markdown/render.ts`） | コンテンツコレクションの本文は前後の空白が trim されるため、本文先頭の全角スペース（字下げ）が消えてしまう。Next.js 版（gray-matter）と同じ表示にするため |
| D-18 | react-markdown のカスタム描画（img / a / p）は rehype プラグインに移植した（`src/lib/markdown/rehype-content.ts`）。生の HTML は出力しない | react-markdown は rehype-raw なしでは HTML を描画しなかったので、その挙動に合わせた（安全側）。ブログで HTML を書きたくなったら、このプラグインの raw ノードの除去を外す |
| D-19 | 埋め込み（B-4）はビルド時に解決する。YouTube・ニコニコ・bilibili は iframe、X・Instagram は通常のリンクのまま | 実行時の oEmbed（API Route）は静的サイトでは使えない。X / Instagram の公式埋め込みはトークンや外部スクリプトが必要なので見送った。現在のコンテンツに該当する段落はないため、表示は変わらない |
| D-20 | framer-motion は CSS アニメーション（`src/styles/motion.css`）+ IntersectionObserver（`src/scripts/motion.ts`）に置き換えた。移動量・時間・stagger は framer-motion の設定値をそのまま移した | アニメーションのためだけに React を残さないため。`animation-fill-mode` は `backwards` にした（`both` にすると終了後も合成レイヤーに残り、文字のアンチエイリアスが変わってピクセル比較で差が出た） |
| D-21 | JS が動かない環境では、アニメーション対象を隠さない（`html.motion` クラスがあるときだけ初期状態を隠す） | B-7 の解消。JS が有効な環境の見た目は変わらない |
| D-22 | `prefers-reduced-motion` への対応は追加しなかった | framer-motion 版も対応しておらず、追加すると挙動が変わるため。UI リニューアルで対応する（UI_PROPOSAL.md A-1） |
| D-23 | DevTools 向けの AA コメントは、ビルド時に文字列を埋め込んだインラインスクリプトで `<html>` の先頭に挿入する | Astro のテンプレートでは `<head>` より前に要素を出力できないため（ESLint のパーサーもエラーになる）。`<head>` 内に静的に置くと DevTools で折りたたまれて見えなくなる。fetch はなくなった |
| D-24 | react-icons は、使っている 5 つのアイコンの SVG を取り出して `src/components/icons/iconData.ts` に置いた | アイコンのためだけに React（または新しい依存）を入れないため。出力される SVG は react-icons と同じ |
| D-25 | ページ遷移は通常の `<a>`（MPA）にした。Next.js のクライアントサイド遷移・プリフェッチは再現していない | `<ClientRouter />`（View Transitions）を入れるとスクリプトの再実行の扱いが複雑になる。ページが軽くなったので、まずは素の遷移で十分と判断した。必要なら `prefetch` 設定で追加できる |
| D-26 | Content Collection のスキーマで `tags` を `video` / `code` / `music` に限定した | 未定義のタグで詳細ページが壊れる問題（B-8）を、ビルド時のエラーとして検出するため |
| D-27 | Astro の Markdown が付ける見出しの `id`（アンカー）はそのままにした | 表示には影響せず、ブログでは見出しへのリンクに使えるため。比較では無視している |
| D-28 | **（ブログ）「works と同じ OGP の仕組み」を先に作った**。works には OGP がなかったため、共通の `Seo.astro` / `src/lib/seo.ts` を作って works に適用し、ブログも同じものを使う | 指示の前提（works に OGP がある）が現状と違ったため。works ページに `<title>` が付いた以外、表示は変わらない |
| D-29 | og:url・og:image・canonical は、環境変数 `SITE_URL`（`astro.config` の `site`）があるときだけ出力する | 絶対 URL が必要だが、本番ドメインはリポジトリから確定できないため推測しなかった。Cloudflare Pages に `SITE_URL` を設定すれば出力される |
| D-30 | トップページには `<title>` / OGP を付けなかった | 依頼の範囲（works と同じ仕組みでブログに OGP）を超えるため。B-6 の残タスク |
| D-31 | 下書き（`draft: true`）は `npm run build` では除外し、`npm run dev` では「下書き」ラベル付きで表示する | 「ビルドに含めない」を満たしつつ、書いている途中の記事を手元で確認できるようにするため |
| D-32 | `content/blog/` の `_` で始まるファイルは読み込まない。書き方の見本として `_template.md` を置いた | 実際の記事は書いていない（サンプル記事を公開してしまわないため）。記事が 0 件の間はビルド時に glob-loader の警告が出るが、問題はない |
| D-33 | ブログはヘッダーのナビにまだ載せていない | 全ページのヘッダーの見た目が変わるため、判断を任せたい。載せる場合は `src/data/site.ts` の `navItems` に 1 行足すだけ |
| D-34 | ブログのタグは自由入力（works のような固定の一覧にしない）。日付は日本時間で表示する | ブログのタグは増えていくものなので。日時（`2026-11-14T21:00:00+09:00`）を書いた場合も日本時間の日付になる |
| D-35 | **UI リニューアルは案 K「kosora と空」で進める**（UI_PROPOSAL.md §6）。名前の表記は kosora に統一する | §3 の案 A〜C は「AI っぽい」として見送られ、比較を重ねた結果。作品が増えても崩れない一覧、トップに作品を置かない、落ち着いたエンジニアらしい見た目、という条件を満たすため |
| D-36 | ブログをヘッダーのナビに載せた（HOME / WORKS / BLOG。D-33 の決定） | ブログの仕上げとして。360px 幅でもロゴと 3 項目が 1 行に収まり、横スクロールが出ないことを確認した |
| D-37 | ブログ本文にだけ、見出し・リスト・引用・コードの最低限の書式を付けた（`global.css` の `.post-body`） | Tailwind の preflight で見出しやリストの書式が消えており、記事が読みにくかったため。works の本文は全角スペースや空行で見た目を作っているので、段落と works には触れていない。typography プラグインは依存が増えるので入れず、UI リニューアル（B-3）で作り直す前提の仮のもの |
| D-38 | 最初の記事「ポートフォリオサイトを Astro に移行しました」を `draft: true` で用意した（`content/blog/astro-migration.md`） | 文面は本人の確認が必要なため。公開するときは `draft: false` にする |

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

> 2026-11-15: Phase 1〜2 で対応済みのものにチェックを付けた。最新の残タスクは §6.6。

- [x] 未使用の依存を削除: `rehype-raw`、`isomorphic-dompurify`、`jsdom`、`src/types/jsdom.d.ts`（D-4）
- [x] 未使用の `src/components/PageTransition.tsx` を削除（D-4）
- [x] B-8: タグ参照を安全に（スキーマでも検証。D-26）
- [x] B-4: `EmbedFetcher` を廃止（D-19）
- [x] `README.md` を実際の内容に書き換える
- [ ] 純粋関数（`work-model.ts`、`embed.ts`）のユニットテストを追加（vitest を入れる場合）

### 5.2 移行時（Phase 1〜4）

- [x] §2.3 の手順で実施（Phase 1〜2）
- [x] `content.config.ts` のスキーマ（`thumbnailUrl` は public のパスのまま。`image()` 化は画像最適化と一緒に行う。`title: z.string()`, `year: z.number()`, `month: z.coerce.number().optional()`, `tags: z.array(z.enum(['video','code','music']))`, `summary: z.string().default('')`, `thumbnailUrl` → `image()`）
- [x] 埋め込み用の remark/rehype プラグイン（`src/lib/embed.ts` を利用）
- [ ] Cloudflare Pages の設定変更（§2.4）
- [ ] UI リニューアル（UI_PROPOSAL.md §6 の案 K で実装。D-35）

### 5.3 コンテンツ側（任意）

- Markdown 本文で、全角スペースや空行をレイアウト調整に使っている箇所が多い（`portfolio-site.md`、`ATMclicker.md` など）。Astro の Markdown では表示が変わる可能性があるため、移行時にスタイル側で余白を設計して、本文からは取り除くのがよい
- `M3-2025-autumn.md` は本文が空（「準備中」）。`draft: true` のようなフラグをスキーマに用意すると管理しやすい

---

## 6. Astro 移行（Phase 1〜2）の実施結果

2026-11-15、ブランチ `feat/astro`。

### 6.1 コミット一覧

| # | コミット | 内容 |
|---|---|---|
| 1 | `feat: migrate from Next.js to Astro (phase 1: React islands)` | Next.js を外して Astro に載せ替え。既存の React コンポーネントは Islands（`client:load` / `client:only`）としてそのまま使い、見た目が同一の状態を作った |
| 2 | `refactor: render Footer, MaintenancePage and ASCII comment without React` | 静的な部品を `.astro` に。アイコンは SVG データ化（D-24）、AA コメントはビルド時に埋め込み（D-23） |
| 3 | `refactor: render works pages as static Astro components` | 作品一覧・詳細を静的 HTML に。Markdown はビルド時に描画（D-17, D-18）、埋め込みもビルド時に解決（D-19）。パーティクルは React なしの tsParticles、アニメーションは CSS（D-20） |
| 4 | `refactor: render Home and Header as Astro components` | トップページとヘッダーを `.astro` に。React コンポーネントの描画がなくなった |
| 5 | `chore: remove React, Next.js leftovers and unused dependencies` | React 関連・未使用の依存とファイルを削除 |
| 6 | `chore: keep docs and content Markdown out of Tailwind class scanning` | D-12 の根本対策（`@source not`） |
| 7 | `docs: record Astro migration (phase 1-2)` | このセクション、判断ログ D-13〜D-27、README、`.node-version` |
| 8 | `feat: add title, description and OGP meta to works pages` | §7 |
| 9 | `feat: add blog (collection, list and post pages)` | §7 |
| 10 | `docs: record blog and OGP` | §7、判断ログ D-28〜D-34 |

### 6.2 構成（移行後）

```
astro.config.mjs              # outDir: out / build.format: 'file' / trailingSlash: 'never'
content/works/*.md            # 変更なし
public/                       # 変更なし（favicon.ico を src/app から移動）
src/
├── content.config.ts         # works コレクション（glob loader + zod スキーマ）
├── pages/                    # ルーティング
│   ├── index.astro
│   ├── works.astro           # → out/works.html
│   ├── works/[slug].astro    # → out/works/<slug>.html
│   └── 404.astro
├── layouts/BaseLayout.astro  # <head>、改修中モード、Header / Footer
├── components/               # すべて .astro（React なし）
│   ├── home/HomePage.astro
│   ├── works/WorksList.astro, WorkDetail.astro
│   ├── icons/Icon.astro, iconData.ts
│   └── Header / Footer / MaintenancePage / Particles / AsciiComment
├── scripts/                  # クライアントで動く JS（particles.ts, motion.ts）
├── styles/                   # global.css（Tailwind）, motion.css
├── data/                     # 変更なし（site / profile / tags）
└── lib/
    ├── work-model.ts         # 変更なし
    ├── works.ts              # getCollection ベースに
    ├── embed.ts              # ビルド時の埋め込み解決を追加
    ├── maintenance.ts        # PUBLIC_MAINTENANCE_MODE（旧名も読む）
    └── markdown/             # render.ts（描画）, rehype-content.ts（img / a / p の加工）
```

### 6.3 検証方法と結果

各コミットで次を実行した（スクリプトはリポジトリ外の作業用ディレクトリに置いた）。

1. `npm run lint`、`npx astro check`（エラー・警告 0）
2. `npm run build`（改修中モード）: 全 9 ページが改修中ページ（`noindex, nofollow`）になること
3. `PUBLIC_MAINTENANCE_MODE=false npm run build`（通常モード）: 全 URL のファイルが出力されること
   - `/` → `index.html`、`/works` → `works.html`、`/works/<slug>` → `works/<slug>.html` × 6、`404.html`
4. 移行前（`main` を Next.js でビルドしたもの）と移行後を、同じ簡易静的サーバー（Cloudflare Pages と同じく `/works` → `works.html` を返す）で配信し、ヘッドレス Chrome で比較:
   - **DOM 比較**: 全ページを開いてスクロールし、アニメーション完了後の DOM を取得。フレームワーク固有のもの（`astro-island`、Next.js の内部要素、アニメーション用の属性、属性の順序、インラインスタイルの書き方）を正規化して比較 → **全 9 ページ一致**
   - **ピクセル比較**: パーティクル（ランダム）を非表示にして全画面スクリーンショットを比較。1280px 幅・390px 幅 × 通常モード、1280px 幅 × 改修中モード → **一致**（唯一の差は YouTube iframe の中の 4px で、外部コンテンツの読み込みタイミングによるもの）
   - **ホバー**: トップページの「Works」ボタンのホバー時の計算済みスタイルが一致（`matrix(1.05, 0, 0, 1.05, 0, -4)`）
   - ヘッダーのスクロール時の背景切り替え、パーティクルの起動（`particles.js loaded`）、コンソールエラーがないことを確認

JS の転送量（gzip、HTML 内のインラインスクリプトを含む）:

| ページ | Next.js | Astro |
|---|---|---|
| `/` | 246.8 kB | 40.5 kB |
| `/works` | 162.6 kB | 40.5 kB |
| `/works/<slug>` | 160.5 kB | 40.5 kB |

残りはほぼ tsParticles 本体。

### 6.4 意図して変わったこと

| 項目 | 変化 | 理由 |
|---|---|---|
| 作品一覧・詳細の HTML | 中身が HTML に含まれるようになった（以前は JS 実行後に描画） | B-5 の解消。JS 実行後の DOM は同じ |
| JS が無効な環境 | トップページの内容が表示されるようになった（以前は `opacity:0` のまま） | B-7 の解消（D-21） |
| アニメーションの開始時刻 | わずかに早く始まる | 以前は JS の読み込み・描画を待ってから始まっていた。動き・時間・順序は同じ |
| 埋め込み（B-4） | 実行時の oEmbed 取得をやめ、ビルド時に解決 | D-19。現在のコンテンツでは表示は変わらない |
| 見出しの `id` | Markdown の見出しに `id` が付く | D-27 |
| ページ遷移 | クライアントサイド遷移 → 通常の遷移 | D-25 |
| AA コメント | `/ASCII.txt` を fetch しなくなった（挿入される位置・内容は同じ） | D-23 |
| CSS | Tailwind 4.3 の出力形式になった | D-15。見た目は同一 |

### 6.5 デプロイ時に確認すること

- Cloudflare Pages: ビルドコマンド `npm run build`、出力ディレクトリ `out` は**そのままでよい**
- **Node 22.23.4 以上**でビルドされること（`.node-version` を追加。効かない場合は環境変数 `NODE_VERSION`）
- 改修中モード: 未設定なら通常のサイト（2026-11-15 に既定値を変更）。改修中ページにするときは `PUBLIC_MAINTENANCE_MODE=true`（旧名 `NEXT_PUBLIC_MAINTENANCE_MODE=true` でも可）
- プレビューデプロイで、`/works/ATMclicker` などが 200 になり、末尾スラッシュ付きにリダイレクトされないこと

### 6.6 残タスク

- [x] 本番デプロイでの確認（§6.5）: 2026-11-15 に https://kosora623.com で確認。結果は §6.7
- [ ] UI リニューアル（UI_PROPOSAL.md §6 の案 K で実装。D-35）: B-1（色）、B-2（埋め込みの縦横比）、B-3（本文のタイポグラフィ）、`prefers-reduced-motion`（D-22）
- [ ] 画像の最適化（B-9）: `src/assets` に移して `astro:assets` を使う。frontmatter の `thumbnailUrl` を `image()` に
- [ ] トップページの `<title>` / description / OGP（B-6。works とブログは §7 で対応済み。D-30）
- [ ] Cloudflare Pages に `SITE_URL` を設定し、**再デプロイする**（og:url / og:image / canonical を出すため。D-29）。2026-11-15 時点の本番ではこの 3 つが出ていない（§6.7）
- [x] ブログをヘッダーのナビに載せる（D-36）
- [ ] 最初のブログ記事を公開する（下書きは用意済み。D-38）
- [ ] 純粋関数（`work-model.ts`、`embed.ts`、`rehype-content.ts`）のユニットテスト
- [ ] `eslint-plugin-astro` 2 系に上げるときは ESLint 10 への更新が必要（D-16）


### 6.7 本番デプロイの確認結果（2026-11-15）

確認先: https://kosora623.com （PR #3 マージ後の main）

| 項目 | 結果 |
|---|---|
| `/`、`/works`、`/works/<slug>` × 6、`/blog` | すべて 200、末尾スラッシュ付きへのリダイレクトなし。改修中ページではなく通常のサイト |
| `<title>` / og:title / description | works・blog は期待どおり（「ページ名 \| KSR」）。トップページは `<title>` なし（B-6、既知） |
| og:url / og:image / canonical | **全ページで出ていない**。`SITE_URL` 未設定のビルドと同じ出力。ローカルで `SITE_URL=https://kosora623.com npm run build` すると 3 つとも正しく出るので、コードの問題ではなく Cloudflare 側の設定（未設定、または設定後に再デプロイしていない） |
| 存在しない URL | エラー（4xx）が返ることは確認。`out/404.html` は出力されており、Cloudflare Pages はこれを 404 で返す仕様。ステータスコードと内容は直接確認できていない |
| コンソールエラー | 未確認（ブラウザで開ける環境がなかった） |

確認方法の制約: 作業環境のネットワーク設定で kosora623.com への直接接続（curl）ができなかったため、Web 取得ツール経由で確認した。ヘッダーと生の HTML は見られず、404 のステータスとコンソールは確認できていない。

---

## 7. ブログ機能と OGP

### 7.1 OGP（works・blog 共通）

- `BaseLayout` の `meta` プロパティ → `src/components/Seo.astro` → `src/lib/seo.ts` の `resolveMeta()`
- 出力: `<title>`（「ページ名 | KSR」）、`description`、`og:title` / `og:description` / `og:type` / `og:site_name` / `og:locale`、`twitter:card`
- `SITE_URL` があるときだけ: `canonical`、`og:url`、`og:image`（画像があれば `twitter:card` は `summary_large_image`）
- 作品詳細: タイトル・summary・サムネイル、`og:type=article`
- ブログ記事: タイトル・description、`og:type=article`、`article:published_time`
- 改修中モードでは出力しない（従来どおり「サイト改修中 | KSR」と `noindex, nofollow` だけ）

### 7.2 ブログ

| 項目 | 内容 |
|---|---|
| 記事 | `content/blog/<slug>.md`（`_` で始まるファイルは無視。`_template.md` が見本） |
| frontmatter | `title`（必須）、`date`（必須）、`description`（必須）、`tags`（任意）、`draft`（任意、既定 false） |
| URL | `/blog` → `out/blog.html`、`/blog/<slug>` → `out/blog/<slug>.html` |
| 並び順 | 日付の新しい順（同じ日付ならファイル名順） |
| 下書き | `npm run build` では除外。`npm run dev` では「下書き」ラベル付きで表示 |
| 本文 | works と同じ Markdown 描画（字下げの保持、リンク、動画の埋め込み、生 HTML は出力しない） |
| デザイン | works と同じクラスを使った最小限のもの。本文の見出し・リストなどは `.post-body` で仮の書式（D-37）。UI リニューアルで作り直す |
| コード | `src/content.config.ts`（スキーマ）、`src/lib/blog-model.ts`（純粋関数）、`src/lib/blog.ts`（読み込み）、`src/pages/blog*.astro`、`src/components/blog/` |

### 7.3 検証

- 一時的な記事（公開 2 件・下書き 1 件、字下げ・内部/外部リンク・YouTube URL・生 HTML・見出しを含む）でビルドし、次を確認してから一時記事を削除した
  - 下書きと `_template.md` が出力に含まれない／並び順／日本時間の日付表示
  - 本文の描画（字下げ、リンクのクラスと `target`、埋め込み、生 HTML の除去）
  - OGP（`SITE_URL` あり・なし、改修中モード）
  - 開発サーバーでは下書きが表示されること
- 記事 0 件の状態で、lint・型チェック・両モードのビルド・全 URL（`/blog` を含む 10 ページ）を確認。works ページの DOM は OGP 追加前と同一
