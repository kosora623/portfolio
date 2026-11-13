/**
 * サイト全体で使う設定・リンク類。
 * UI フレームワーク非依存のプレーンなデータ（アイコンは文字列キーで持ち、
 * 実際のアイコンコンポーネントへの対応は src/components/socialIcons.ts で行う）。
 */

export const site = {
  shortName: 'KSR',
  contactEmail: 'contact@kosora623.com',
} as const;

export const navItems = [
  { name: 'HOME', href: '/' },
  { name: 'WORKS', href: '/works' },
] as const;

export type SocialIconKey = 'email' | 'github' | 'youtube' | 'twitter' | 'play';

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
  { id: 'twitter', name: 'Twitter', href: 'https://twitter.com/kosora623', icon: 'twitter', handle: '@kosora623' },
  { id: 'niconico', name: 'Niconico', href: 'https://www.nicovideo.jp/user/89885173', icon: 'play', handle: 'ニコニコ動画' },
  { id: 'bilibili', name: 'Bilibili', href: 'https://space.bilibili.com/553358219', icon: 'play', handle: 'Bilibili' },
];

/** フッターに表示する SNS（この順で表示） */
const footerSocialIds = ['github', 'twitter', 'youtube'] as const;

export const footerSocialLinks: SocialLink[] = footerSocialIds.map(
  id => socialLinks.find(l => l.id === id)!,
);
