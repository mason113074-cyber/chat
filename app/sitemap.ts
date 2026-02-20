import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://www.customeraipro.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '/',
    '/zh-TW',
    '/en',
    '/zh-TW/pricing',
    '/en/pricing',
    '/zh-TW/privacy',
    '/zh-TW/terms',
    '/en/privacy',
    '/en/terms',
  ];

  return routes.map((path) => ({
    url: `${BASE_URL}${path === '/' ? '' : path}`,
    lastModified: new Date(),
    changeFrequency: path === '/' || path.endsWith('/pricing') ? 'weekly' as const : 'monthly' as const,
    priority: path === '/' || path === '/zh-TW' || path === '/en' ? 1 : 0.8,
  }));
}
