/**
 * リンクコンポーネントの窓口。Next.js 時代は next/link を再エクスポートしていた。
 * Astro では通常の <a> でページ遷移する。
 */
import type { ComponentPropsWithRef } from 'react';

export default function Link(props: ComponentPropsWithRef<'a'>) {
  return <a {...props} />;
}
