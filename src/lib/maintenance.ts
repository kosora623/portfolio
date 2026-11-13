/**
 * メンテナンス（改修中）モードの切り替え
 *
 * NEXT_PUBLIC_MAINTENANCE_MODE の値で制御する:
 *   - "true"  : 常に改修中ページを表示
 *   - "false" : 常に通常のサイトを表示
 *   - 未設定  : 本番ビルド (next build) では改修中ページ、開発サーバー (next dev) では通常サイト
 *
 * リファクタリングが終わったら、このデフォルトを false にするか
 * 環境変数で NEXT_PUBLIC_MAINTENANCE_MODE=false を指定する。
 */
const flag = process.env.NEXT_PUBLIC_MAINTENANCE_MODE;

export const MAINTENANCE_MODE =
  flag === 'true' ? true : flag === 'false' ? false : process.env.NODE_ENV === 'production';
