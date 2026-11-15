# kosora portfolio

小空 - KSR のポートフォリオサイト。[Astro](https://astro.build/) による完全静的サイトです（2026-11 に Next.js から移行）。

## 必要なもの

- Node.js 22.23.4 以上（`.node-version` 参照）

## コマンド

```bash
npm install
npm run dev      # 開発サーバー（http://localhost:4321）
npm run build    # 静的ビルド → out/
npm run preview  # ビルド結果の確認
npm run lint     # ESLint
npm run check    # 型チェック（astro check）
```

## 改修中モード

`PUBLIC_MAINTENANCE_MODE` で切り替えます（旧名 `NEXT_PUBLIC_MAINTENANCE_MODE` も読みます）。

| 値 | 動作 |
|---|---|
| `true` | 全ページを改修中ページにする（`noindex, nofollow`） |
| `false` | 通常のサイト |
| 未設定 | `npm run build` では改修中ページ、`npm run dev` では通常のサイト |

```bash
PUBLIC_MAINTENANCE_MODE=false npm run build
```

## コンテンツ

- 作品: `content/works/*.md`（スキーマは `src/content.config.ts`）。ファイル名が URL（`/works/<ファイル名>`）になります
- プロフィール・リンクなど: `src/data/`

## ディレクトリ

| パス | 内容 |
|---|---|
| `src/pages/` | ルーティング |
| `src/layouts/` | 共通レイアウト（`<head>`、改修中モード） |
| `src/components/` | UI（すべて `.astro`） |
| `src/scripts/` | クライアントで動く JS（パーティクル、スクロール時の出現） |
| `src/lib/` | データの読み込み・Markdown の描画など |
| `src/data/` | サイトの設定・プロフィール |

## デプロイ

Cloudflare Pages。ビルドコマンド `npm run build`、出力ディレクトリ `out`。

移行の経緯・判断の記録は [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)、UI リニューアルの案は [UI_PROPOSAL.md](./UI_PROPOSAL.md) にあります。
