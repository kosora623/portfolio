/**
 * サイト全体で使う設定・リンク類。
 * UI フレームワーク非依存のプレーンなデータ（アイコンは文字列キーで持ち、
 * 実際の SVG は src/components/icons/iconData.ts にある）。
 */

export const site = {
  shortName: 'kosora',
  /** タブ・検索結果・OGP に出すサイト名 */
  title: '小空の部屋',
  /** フッターの © の開始年 */
  since: 2025,
  contactEmail: 'contact@kosora623.com',
} as const;

/** ページごとの description（OGP にも使う） */
export const pageDescriptions = {
  home: 'kosora のポートフォリオサイトです。映像・音楽・プログラミングの制作物とブログを載せています。',
  works: 'kosora の制作物（映像・音楽・プログラミング）の一覧です。',
  blog: '小空のブログです。',
} as const;

export const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Works', href: '/works' },
  { name: 'Blog', href: '/blog' },
] as const;

export type SocialIconKey = 'email' | 'github' | 'youtube' | 'x' | 'play';

export interface SocialLink {
  id: string;
  name: string;
  href: string;
  handle: string;
  icon: SocialIconKey;
}

/** トップページ「各種SNS」セクションの並び順 */
export const socialLinks: SocialLink[] = [
  { id: 'email', name: 'Email', href: `mailto:${site.contactEmail}`, icon: 'email', handle: site.contactEmail },
  { id: 'github', name: 'GitHub', href: 'https://github.com/kosora623', icon: 'github', handle: '@kosora623' },
  { id: 'youtube', name: 'YouTube', href: 'https://youtube.com/@k0sora623', icon: 'youtube', handle: '@k0sora623' },
  { id: 'x', name: 'X', href: 'https://x.com/kosora_623', icon: 'x', handle: '@kosora_623' },
  { id: 'niconico', name: 'Niconico', href: 'https://www.nicovideo.jp/user/89885173', icon: 'play', handle: 'ニコニコ動画' },
  { id: 'bilibili', name: 'Bilibili', href: 'https://space.bilibili.com/553358219', icon: 'play', handle: 'Bilibili' },
];

/** フッターに表示する SNS（この順で表示） */
const footerSocialIds = ['github', 'x', 'youtube'] as const;

export const footerSocialLinks: SocialLink[] = footerSocialIds.map(
  id => socialLinks.find(l => l.id === id)!,
);
