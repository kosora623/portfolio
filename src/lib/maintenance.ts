/**
 * メンテナンス（改修中）モードの切り替え。ビルド時（サーバー側）だけで評価する。
 *
 * PUBLIC_MAINTENANCE_MODE の値で制御する:
 *   - "true"  : 常に改修中ページを表示
 *   - "false" : 常に通常のサイトを表示
 *   - 未設定  : 本番ビルド (astro build) では改修中ページ、開発サーバー (astro dev) では通常サイト
 *
 * Next.js 時代の NEXT_PUBLIC_MAINTENANCE_MODE も、移行期間の互換のために読み取る
 * （PUBLIC_MAINTENANCE_MODE が設定されていればそちらを優先）。
 *
 * リファクタリングが終わったら、このデフォルトを false にするか
 * 環境変数で PUBLIC_MAINTENANCE_MODE=false を指定する。
 */
const flag: string | undefined =
  import.meta.env.PUBLIC_MAINTENANCE_MODE ?? process.env.NEXT_PUBLIC_MAINTENANCE_MODE;

export const MAINTENANCE_MODE =
  flag === 'true' ? true : flag === 'false' ? false : import.meta.env.PROD;
