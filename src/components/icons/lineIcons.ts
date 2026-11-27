/**
 * 線のアイコン（24×24 のグリッド、線幅は CSS で指定）。サイト独自に描いたもの。
 * SNS などのブランドのロゴは iconData.ts（Font Awesome）を使う。
 */
export const lineIcons = {
  video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.5v5l4.5-2.5z"/>',
  music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
  motion: '<circle cx="7" cy="12" r="3"/><path d="M13 12h8M14 8h5M14 16h5"/>',
  cursor: '<path d="M6 4l12 7-5 1.5L11 18z"/>',
  web: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M3 9h18M6 6.8h.01M8.5 6.8h.01"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 15l-5-4.5L7 19"/>',
  wave: '<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 10.5v3"/>',
  pin: '<path d="M12 21s6-5.5 6-10.5a6 6 0 10-12 0C6 15.5 12 21 12 21z"/><circle cx="12" cy="10.5" r="2"/>',
  gamepad: '<rect x="3" y="8" width="18" height="9" rx="4.5"/><path d="M8 11v3M6.5 12.5h3M16 12.5h.01"/>',
  chip: '<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3"/>',
  book: '<path d="M4 5.5A1.5 1.5 0 015.5 4H11v15H5.5A1.5 1.5 0 014 17.5zM20 5.5A1.5 1.5 0 0018.5 4H13v15h5.5a1.5 1.5 0 001.5-1.5z"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6.5L20.5 7"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z"/>',
  external: '<path d="M8 16L16 8M10 8h6v6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
} as const;

export type LineIconKey = keyof typeof lineIcons;
