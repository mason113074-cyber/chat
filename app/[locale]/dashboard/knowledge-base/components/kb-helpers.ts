import { DEFAULT_CATEGORIES } from './kb-types';

export function categoryLabelKey(category: string): (typeof DEFAULT_CATEGORIES)[number]['labelKey'] | null {
  return DEFAULT_CATEGORIES.find((c) => c.value === category)?.labelKey ?? null;
}

export function parseTxt(content: string): { title: string; content: string; category: string }[] {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: { title: string; content: string; category: string }[] = [];
  for (const line of lines) {
    const idx = line.indexOf('|||');
    if (idx >= 0) {
      const title = line.slice(0, idx).trim();
      const content = line.slice(idx + 3).trim();
      if (title) out.push({ title, content, category: 'general' });
    }
  }
  return out;
}

export function parseCsv(content: string): { title: string; content: string; category: string }[] {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const titleIdx = headers.indexOf('title');
  const contentIdx = headers.indexOf('content');
  const categoryIdx = headers.indexOf('category');
  if (titleIdx < 0 || contentIdx < 0) return [];
  const out: { title: string; content: string; category: string }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].match(/("([^"]*)")|([^,]+)/g)?.map((c) => c.replace(/^"|"$/g, '').trim()) ?? lines[i].split(',');
    const title = (row[titleIdx] ?? '').trim();
    const content = (row[contentIdx] ?? '').trim();
    const category = categoryIdx >= 0 && row[categoryIdx] ? (row[categoryIdx] ?? 'general').trim() : 'general';
    if (title) out.push({ title, content, category });
  }
  return out;
}
