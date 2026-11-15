/**
 * 画像コンポーネントの窓口。Next.js 時代は next/image（unoptimized）を再エクスポートしていた。
 * next/image が出力していた <img> と同じ属性・スタイルを再現する。
 */
import type { CSSProperties } from 'react';

type Props = {
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
};

// next/image と同じ順序でスタイルをマージする（fill 用 → color: transparent → 呼び出し側の style）
const fillStyle: CSSProperties = {
  position: 'absolute',
  height: '100%',
  width: '100%',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  objectFit: undefined,
  objectPosition: undefined,
};

export default function Image({ src, alt, title, width, height, fill, className, style }: Props) {
  return (
    <img
      alt={alt}
      title={title}
      loading="lazy"
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      decoding="async"
      className={className}
      style={Object.assign({}, fill ? fillStyle : {}, { color: 'transparent' }, style)}
      src={src}
    />
  );
}
