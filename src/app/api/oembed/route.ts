import { NextResponse } from 'next/server';
import createDOMPurify from 'isomorphic-dompurify';
import { JSDOM } from 'jsdom';

export const dynamic = 'force-dynamic';

// JSDOM window needs to be cast to the DOM window type for DOMPurify
const DOMPurify = createDOMPurify((new JSDOM('')).window as unknown as Window & typeof globalThis);

// Simple in-memory cache for oEmbed results. This is ephemeral and only for dev
// or lightweight caching in server runtime. Consider Redis or filesystem caching
// for production if needed.
const oembedCache = new Map<string, { html: string; ts: number }>();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

async function fetchWithTimeout(url: string, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function fetchWithRetry(url: string, attempts = 2, timeout = 5000) {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchWithTimeout(url, timeout);
      return res;
    } catch (err) {
      lastErr = err;
      // small backoff
      await new Promise(r => setTimeout(r, 200 * (i + 1)));
    }
  }
  throw lastErr;
}

function isTwitterUrl(url: string) {
  return /(?:https?:\/\/)?(?:www\.)?twitter\.com\//i.test(url) || /(?:https?:\/\/)?(?:www\.)?x\.com\//i.test(url);
}

function isNicoUrl(url: string) {
  return /(?:https?:\/\/)?(?:www\.)?nicovideo\.jp\/watch\//i.test(url) || /(?:https?:\/\/)?(?:www\.)?embed\.nicovideo\.jp\//i.test(url);
}

function isBiliUrl(url: string) {
  return /(?:https?:\/\/)?(?:www\.)?(?:bilibili\.com|b23\.tv)\//i.test(url);
}

function isInstagramUrl(url: string) {
  return /(?:https?:\/\/)?(?:www\.)?instagram\.com\//i.test(url) || /(?:https?:\/\/)?(?:www\.)?instagr\.am\//i.test(url);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 });

    let oembedHtml: string | null = null;

    // check cache first
    const cached = oembedCache.get(url);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json({ html: cached.html });
    }

    if (isTwitterUrl(url)) {
      // Twitter/X publish oembed
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=1`;
      const res = await fetchWithRetry(oembedUrl, 3, 5000);
      if (!res.ok) throw new Error('oembed fetch failed');
      const json = await res.json();
      oembedHtml = json.html || null;
    } else if (isNicoUrl(url)) {
      // try NicoNico oEmbed JSON endpoint
      const oembedUrl = `https://ext.nicovideo.jp/api/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetchWithRetry(oembedUrl, 2, 5000);
      if (res.ok) {
        const json = await res.json().catch(() => null);
        oembedHtml = json?.html ?? null;
      }
      // fallback: if no oembed, try embed iframe URL pattern
      if (!oembedHtml) {
        // attempt to transform into embed URL
        const m = url.match(/(?:nicovideo\.jp\/watch\/)([a-zA-Z0-9]+)/i);
        if (m?.[1]) {
          oembedHtml = `<iframe src="https://embed.nicovideo.jp/watch/${m[1]}" frameborder="0" allowfullscreen></iframe>`;
        }
      }
    } else if (isBiliUrl(url)) {
      // Bilibili does not provide a public oEmbed endpoint; construct embed iframe
      // Support urls like https://www.bilibili.com/video/BV... and short b23.tv links
      // Extract BV or av id
      const m = url.match(/(?:bilibili\.com\/video\/)([a-zA-Z0-9]+)/i) || url.match(/b23\.tv\/(\w+)/i);
      if (m?.[1]) {
        // For b23.tv short links, we cannot resolve without fetching; try direct iframe using the original url
        const embedUrl = url.includes('b23.tv') ? url : `https://player.bilibili.com/player.html?bvid=${m[1]}`;
        oembedHtml = `<iframe src="${embedUrl}" scrolling="no" border="0" frameborder="0" allowfullscreen></iframe>`;
      }
    } else if (isInstagramUrl(url)) {
      // Instagram oEmbed requires access token for the oembed endpoint in many cases.
      // Try the unauthenticated oembed endpoint which sometimes works for public posts.
      try {
        const oembedUrl = `https://graph.facebook.com/v9.0/instagram_oembed?url=${encodeURIComponent(url)}&omitscript=true`;
        const res = await fetchWithRetry(oembedUrl, 2, 5000);
        if (res.ok) {
          const json = await res.json().catch(() => null);
          oembedHtml = json?.html ?? null;
        }
      } catch {
        // ignore and fallback
      }
      // Last resort: try Instagram's embed endpoint (may be blocked)
      if (!oembedHtml) {
        const u = encodeURIComponent(url);
        const oembedUrl2 = `https://api.instagram.com/oembed/?url=${u}`;
        try {
          const res2 = await fetchWithRetry(oembedUrl2, 2, 5000);
          if (res2.ok) {
            const json2 = await res2.json().catch(() => null);
            oembedHtml = json2?.html ?? null;
          }
        } catch {
          // ignore
        }
      }
    } else {
      return NextResponse.json({ error: 'unsupported provider' }, { status: 400 });
    }

    if (!oembedHtml) return NextResponse.json({ error: 'no oembed html' }, { status: 502 });

    // Sanitize allowing iframe with limited attrs
    const clean = DOMPurify.sanitize(oembedHtml, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'style'],
    });

    // store in cache
    try {
      oembedCache.set(url, { html: clean, ts: Date.now() });
    } catch {}

    return NextResponse.json({ html: clean });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
