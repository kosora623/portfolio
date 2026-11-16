/**
 * 作品タグの表示名とアイコン（一覧・詳細ページで共有する）。
 * キーは content.config.ts のスキーマでも使う（未定義のタグはビルド時にエラー）。
 */
import type { LineIconKey } from '@/components/icons/lineIcons';

export const tagInfo: Record<string, { name: string; icon: LineIconKey }> = {
  video: { name: '映像', icon: 'video' },
  music: { name: '音楽', icon: 'music' },
  code: { name: 'コード', icon: 'code' },
};
