import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearKnowledgeCache } from '@/lib/knowledge-search';

type ImportItem = {
  title: string;
  content: string;
  category: string;
  sourceUrl: string;
};

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
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'CustomerAIPro-KB-Importer/1.0',
      Accept: 'text/html,application/xhtml+xml',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();
  return {
    title: extractTitle(html, url),
    content: stripHtml(html),
  };
}

async function collectUrls(startUrl: string, depth: number, maxPages: number): Promise<string[]> {
  const urls = [startUrl];
  if (depth <= 1) return urls;

  const res = await fetch(startUrl, {
    headers: { 'User-Agent': 'CustomerAIPro-KB-Importer/1.0' },
    cache: 'no-store',
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
      // Validate URL
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'URL 格式不正確' }, { status: 400 });
    }

    const targetUrls = await collectUrls(url, depth, 10);
    const items: ImportItem[] = [];
    for (const target of targetUrls) {
      try {
        const page = await fetchPage(target);
        if (!page.content) continue;
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

