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
  intro: '',
} as const;

export interface StackGroup {
  label: string;
  icon: LineIconKey;
  items: string[];
}

/** 使っている技術・ツール（分野ごと） */
export const stack: StackGroup[] = [
  { label: '映像', icon: 'video', items: ['Adobe After Effects', 'Blender'] },
  { label: '音楽', icon: 'music', items: ['Cubase'] },
  {
    label: 'コード',
    icon: 'code',
    items: ['TypeScript', 'Python', 'C++'],
  },
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
  { title: '画像処理', icon: 'image' },
  { title: 'サウンドデザイン', icon: 'wave' },
];

export const hobbies: ProfileItem[] = [
  { title: '散歩', icon: 'pin', description: 'いろんな場所に出没します。どこかで会えるかも...？' },
  { title: '音楽ゲーム', icon: 'gamepad', description: '大体の機種には触っています。指押しが大好物。' },
  { title: '電子工作', icon: 'chip', description: '最近始めました。Arduino Uno R3で遊んでいます。' },
];
