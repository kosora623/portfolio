/**
 * フレームワーク依存のリンクコンポーネントの窓口。
 * 現在は next/link をそのまま再エクスポートしている。
 * Astro 移行時（React Islands に残す場合）は、ここを素の <a> ラッパーに差し替えるだけで済む。
 */
export { default } from 'next/link';
