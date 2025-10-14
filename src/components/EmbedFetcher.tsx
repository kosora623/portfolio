"use client";

import { useEffect, useState } from 'react';

export default function EmbedFetcher({ url }: { url: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/oembed?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        if (!mounted) return;
        if (json.html) {
          setHtml(json.html);
          setErr(null);
        } else {
          setErr(json.error ?? 'no html');
        }
      } catch (e) {
        if (!mounted) return;
        setErr((e as Error).message);
      }
    })();
    return () => { mounted = false; };
  }, [url, attempts]);

  if (err) {
    return (
      <div className="space-y-2">
        <div className="text-red-400">Embed error: {err}</div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAttempts(a => a + 1)}
            className="px-3 py-1 rounded bg-teal text-black"
          >
            Retry
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
            Open original
          </a>
        </div>
      </div>
    );
  }
  if (!html) return <div className="text-slate">Loading embed...</div>;
  return <div className="mx-auto max-w-4xl" dangerouslySetInnerHTML={{ __html: html }} />;
}
