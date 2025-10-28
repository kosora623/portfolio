'use client';

import * as React from 'react';

export default function AsciiCommentClient() {
  React.useEffect(() => {
    let cancelled = false;

    async function insertAscii() {
      try {
        const res = await fetch('/ASCII.txt');
        if (!res.ok) return;
        const txt = await res.text();
        if (cancelled) return;
        const commentNode = document.createComment(txt);
        // Insert the comment as the very first child of <html> so it's shown at the top
        // of the Elements panel when DevTools is opened.
        const root = document.documentElement;
        if (root && root.firstChild) {
          root.insertBefore(commentNode, root.firstChild);
        } else if (document.body) {
          // fallback: prepend to body
          document.body.prepend(commentNode);
        } else {
          // last-resort: append to document (cast to Document/Node for TS)
          (document as Document).appendChild(commentNode as unknown as Node);
        }
        if (process.env.NODE_ENV !== 'production') {
          console.info('AA inserted into DOM! Check the Elements tab (<body>) for a surprise.');
        }
      } catch (err) {
        console.error('Failed to fetch or insert ASCII art', err);
      }
    }

    insertAscii();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
