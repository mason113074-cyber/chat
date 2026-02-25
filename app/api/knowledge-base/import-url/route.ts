import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearKnowledgeCache } from '@/lib/knowledge-search';
import dns from 'dns/promises';

type ImportItem = {
  title: string;
  content: string;
  category: string;
  sourceUrl: string;
};

const FETCH_TIMEOUT_MS = 8_000;
const TOTAL_TIMEOUT_MS = 25_000;
const MAX_HTML_BYTES = 2 * 1024 * 1024; // 2 MB per page
const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB total
const ALLOWED_SCHEMES = ['http:', 'https:'];

function isPrivateIP(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  const parts = ip.split('.').map(Number);
  if (parts.length === 4) {
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true; // link-local
    if (parts[0] === 0) return true;
  }
  if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true;
  return false;
}

async function validateUrl(url: string): Promise<void> {
  const parsed = new URL(url);
  if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
    throw new Error(`不允許的 URL scheme: ${parsed.protocol}`);
  }
  try {
    const addresses = await dns.resolve4(parsed.hostname).catch(() => []);
    const addresses6 = await dns.resolve6(parsed.hostname).catch(() => []);
    const all = [...addresses, ...addresses6];
    if (all.length > 0 && all.every(isPrivateIP)) {
      throw new Error('不允許存取內部網路位址');
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('不允許')) throw e;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html: string, fallback: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = match?.[1]?.replace(/\s+/g, ' ').trim();
  return title || fallback;
}

function guessCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/(退貨|退款|換貨|return|refund|exchange)/i.test(lower)) return '退換貨政策';
  if (/(運費|配送|物流|shipping|delivery)/i.test(lower)) return '物流配送';
  if (/(價格|方案|費用|price|pricing|plan)/i.test(lower)) return '價格方案';
  if (/(帳號|登入|註冊|account|login|register)/i.test(lower)) return '帳號設定';
  if (/(faq|常見問題)/i.test(lower)) return '常見問題';
  return 'general';
}

async function fetchPage(url: string): Promise<{ title: string; content: string }> {
  await validateUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CustomerAIPro-KB-Importer/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const contentLength = Number(res.headers.get('content-length') || 0);
    if (contentLength > MAX_HTML_BYTES) throw new Error(`頁面過大 (${contentLength} bytes)`);
    const html = await res.text();
    if (html.length > MAX_HTML_BYTES) throw new Error(`頁面過大 (${html.length} bytes)`);
    return {
      title: extractTitle(html, url),
      content: stripHtml(html),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function collectUrls(startUrl: string, depth: number, maxPages: number): Promise<string[]> {
  const urls = [startUrl];
  if (depth <= 1) return urls;

  await validateUrl(startUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(startUrl, {
      headers: { 'User-Agent': 'CustomerAIPro-KB-Importer/1.0' },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) return urls;
    const html = await res.text();

  const origin = new URL(startUrl).origin;
  const hrefMatches = Array.from(html.matchAll(/href\s*=\s*["']([^"']+)["']/gi));
  const set = new Set<string>(urls);
  for (const m of hrefMatches) {
    const raw = m[1]?.trim();
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) continue;
    try {
      const u = new URL(raw, startUrl);
      if (u.origin !== origin) continue;
      if (/\.(jpg|jpeg|png|gif|webp|svg|pdf|zip)$/i.test(u.pathname)) continue;
      set.add(u.toString());
      if (set.size >= maxPages) break;
    } catch {
      // ignore invalid links
    }
  }
  return Array.from(set).slice(0, maxPages);
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    const depth = Math.min(10, Math.max(1, Number(body.depth) || 1));
    const autoCategories = body.autoCategories !== false;
    const previewOnly = body.previewOnly === true;

    if (!url) return NextResponse.json({ error: 'URL 為必填' }, { status: 400 });
    try {
      const parsed = new URL(url);
      if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
        return NextResponse.json({ error: `不允許的 URL scheme: ${parsed.protocol}` }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'URL 格式不正確' }, { status: 400 });
    }

    const deadline = Date.now() + TOTAL_TIMEOUT_MS;
    const targetUrls = await collectUrls(url, depth, 10);
    const items: ImportItem[] = [];
    let totalBytes = 0;
    for (const target of targetUrls) {
      if (Date.now() > deadline) break;
      try {
        const page = await fetchPage(target);
        if (!page.content) continue;
        totalBytes += page.content.length;
        if (totalBytes > MAX_TOTAL_BYTES) break;
        const clipped = page.content.slice(0, 4000);
        items.push({
          title: page.title.slice(0, 200),
          content: clipped,
          category: autoCategories ? guessCategory(`${page.title} ${clipped}`) : 'general',
          sourceUrl: target,
        });
      } catch {
        // Continue importing other pages
      }
    }

    if (items.length === 0) return NextResponse.json({ error: '未取得可匯入內容' }, { status: 400 });

    if (previewOnly) return NextResponse.json({ preview: items });

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert(
        items.map((item) => ({
          user_id: user.id,
          title: item.title,
          content: `${item.content}\n\n來源：${item.sourceUrl}`,
          category: item.category || 'general',
          is_active: true,
        }))
      )
      .select('id');

    if (error) {
      console.error('POST /api/knowledge-base/import-url error:', error);
      return NextResponse.json({ error: '匯入失敗' }, { status: 500 });
    }

    await clearKnowledgeCache(user.id);
    return NextResponse.json({
      imported: data?.length ?? items.length,
      ids: data?.map((x) => x.id) ?? [],
      items,
    });
  } catch (e) {
    console.error('POST /api/knowledge-base/import-url error:', e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

