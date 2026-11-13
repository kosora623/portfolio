/**
 * フレームワーク依存の画像コンポーネントの窓口。
 * 現在は next/image（next.config.ts で unoptimized）をそのまま再エクスポートしている。
 * Astro 移行時は .astro 側で astro:assets の <Image /> / <Picture /> を使い、
 * React Islands に残る箇所はここを <img> ラッパーに差し替える。
 */
export { default } from 'next/image';
