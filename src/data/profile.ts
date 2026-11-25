/**
 * トップページに表示するプロフィール情報。
 * 文言を変えるときはここだけ編集すればよい（UI 側は表示のみ担当）。
 * icon は src/components/icons/LineIcon.astro のキー。
 */
import type { LineIconKey } from '@/components/icons/lineIcons';

export const hero = {
  name: 'kosora',
  tagline: 'いろんなものを作ります。映像、音楽、プログラミング。',
} as const;

export const about = {
  intro: '大学で情報系を学びながら、映像・音楽・プログラミングで制作をしています。',
} as const;

export interface StackGroup {
  label: string;
  icon: LineIconKey;
  items: string[];
}

/** 使っている技術・ツール（分野ごと） */
export const stack: StackGroup[] = [
  { label: '映像', icon: 'video', items: ['Aviutl', 'Adobe After Effects', 'Blender'] },
  { label: '音楽', icon: 'music', items: ['Cubase', 'GarageBand'] },
  { label: 'コード', icon: 'code', items: ['TypeScript', 'Python', 'Java', 'Astro'] },
  { label: '勉強中', icon: 'book', items: ['C++', 'Rust', 'Elixir'] },
];

export interface ProfileItem {
  title: string;
  icon: LineIconKey;
  description?: string;
}

export const interests: ProfileItem[] = [
  { title: 'モーショングラフィックス', icon: 'motion' },
  { title: 'ジェネラティブアート', icon: 'generative' },
  { title: 'インタラクティブアート', icon: 'cursor' },
  { title: 'Web フロントエンド', icon: 'web' },
  { title: '画像処理', icon: 'image' },
  { title: 'サウンドデザイン', icon: 'wave' },
  { title: 'ブラウザ拡張・ツール作り', icon: 'tool' },
  { title: 'プログラミング言語', icon: 'lambda' },
];

export const hobbies: ProfileItem[] = [
  { title: '散歩', icon: 'pin', description: 'いろんな場所に出没します。どこかで会えるかも...？' },
  { title: '音楽ゲーム', icon: 'gamepad', description: '大体の機種には触っています。指押しが大好物。' },
  { title: '電子工作', icon: 'chip', description: 'Arduino と STM32 が手元にあります。何に使おうか考え中です。' },
];
