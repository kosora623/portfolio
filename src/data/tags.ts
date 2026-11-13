/**
 * 作品タグの表示名と色（Tailwind クラス）。
 * 一覧・詳細ページで共有する。UI リニューアル時は color をデザイントークンに置き換える想定。
 */
export const tagInfo: Record<string, { name: string; color: string }> = {
  video: { name: 'Video', color: 'text-red-400' },
  code: { name: 'Code', color: 'text-green-400' },
  music: { name: 'Music', color: 'text-yellow-400' },
};
