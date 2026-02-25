import type { MetadataRoute } from 'next';
import { getAppUrl } from '@/lib/app-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl();
  const routes: { path: string; languages: Record<string, string> }[] = [
    { path: '/zh-TW', languages: { 'zh-Hant': `${base}/zh-TW`, en: `${base}/en` } },
    { path: '/en', languages: { 'zh-Hant': `${base}/zh-TW`, en: `${base}/en` } },
    { path: '/zh-TW/pricing', languages: { 'zh-Hant': `${base}/zh-TW/pricing`, en: `${base}/en/pricing` } },
    { path: '/en/pricing', languages: { 'zh-Hant': `${base}/zh-TW/pricing`, en: `${base}/en/pricing` } },
    { path: '/zh-TW/privacy', languages: { 'zh-Hant': `${base}/zh-TW/privacy`, en: `${base}/en/privacy` } },
    { path: '/en/privacy', languages: { 'zh-Hant': `${base}/zh-TW/privacy`, en: `${base}/en/privacy` } },
    { path: '/zh-TW/terms', languages: { 'zh-Hant': `${base}/zh-TW/terms`, en: `${base}/en/terms` } },
    { path: '/en/terms', languages: { 'zh-Hant': `${base}/zh-TW/terms`, en: `${base}/en/terms` } },
  ];

  return routes.map(({ path, languages }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path.endsWith('/pricing') ? ('weekly' as const) : ('monthly' as const),
    priority: path === '/zh-TW' || path === '/en' ? 1 : 0.8,
    alternates: { languages },
  }));
}
