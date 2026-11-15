/**
 * トップページに表示するプロフィール情報。
 * 文言を変えるときはここだけ編集すればよい（UI 側は表示のみ担当）。
 */

export const hero = {
  greeting: 'ようこそ！',
  title: '小空 - KSR です',
  subtitle: 'いろんなものを作ります',
  roles: 'Video Production / Programming / Music Composition',
} as const;

export const about = {
  intro: 'こんにちは、小空 - KSR です。',
  skillsLabel: '使用している主な技術・ツール:',
  profileImage: { src: '/profile.jpg', alt: 'KSR Profile Picture', width: 300, height: 300 },
} as const;

export const skills = ['Aviutl', 'Adobe After Effects', 'Blender','Cakewalk', 'Cubase','GarageBand','HTML/CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Three.js', 'Python', 'Processing', 'C++', 'OpenCV', 'C#', 'Unity', 'Flutter', 'Dart', 'Git/GitHub'];

export interface ProfileItem {
  title: string;
  description: string;
}

export const interests: ProfileItem[] = [
  { title: 'モーショングラフィックス - Motion Graphics', description: '' },
  { title: 'ジェネラティブアート - Generative Art',  description: '' },
  { title: 'インタラクティブアート - Interactive Art', description:'' },
  { title: 'Webフロントエンド - WebFrontend', description: '' },
  { title: '画像処理 - Image Processing', description: '' },
  { title: 'サウンドデザイン - Sound Design', description: '' },
];

export const hobbies: ProfileItem[] = [
  { title: '散歩 - Walk', description: 'いろんな場所に出没します。どこかで会えるかも...？' },
  { title: '音楽ゲーム - Music Game', description: '大体の機種には触っています。指押しが大好物。' },
  { title: '電子工作 - Electronics', description: '最近始めました。Arduino Uno R3で遊んでいます。' },
];
