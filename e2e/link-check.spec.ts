import { test, expect } from '@playwright/test';

const LOCALE = 'en';

function isCheckable(href: string): boolean {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  return true;
}

function toAbsolute(href: string, baseURL: string): string {
  if (href.startsWith('http')) return href;
  const base = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  return href.startsWith('/') ? `${base}${href}` : `${base}/${href}`;
}

test.describe('Link check', () => {
  test('Home /en has no 404 links', async ({ page, baseURL }) => {
    await page.goto(`/${LOCALE}`);
    await page.waitForLoadState('domcontentloaded');

    const hrefs = await page.locator('a[href]').evaluateAll((nodes) =>
      nodes.map((a) => (a as HTMLAnchorElement).getAttribute('href')).filter((h): h is string => !!h)
    );
    const checkable = [...new Set(hrefs.filter(isCheckable))];

    for (const href of checkable) {
      const url = toAbsolute(href, baseURL!);
      if (!url.startsWith(baseURL!)) continue; // same-origin only
      const res = await page.request.get(url, { maxRedirects: 5 });
      expect(res.status(), `Link ${href} (${url}) should not 404`).not.toBe(404);
    }
  });

  test('Help /en/help has no 404 links', async ({ page, baseURL }) => {
    await page.goto(`/${LOCALE}/help`);
    await page.waitForLoadState('domcontentloaded');

    const hrefs = await page.locator('a[href]').evaluateAll((nodes) =>
      nodes.map((a) => (a as HTMLAnchorElement).getAttribute('href')).filter((h): h is string => !!h)
    );
    const checkable = [...new Set(hrefs.filter(isCheckable))];

    for (const href of checkable) {
      const url = toAbsolute(href, baseURL!);
      if (!url.startsWith(baseURL!)) continue;
      const res = await page.request.get(url, { maxRedirects: 5 });
      expect(res.status(), `Link ${href} (${url}) should not 404`).not.toBe(404);
    }
  });

  test('Help categories and articles load without 404', async ({ page, baseURL }) => {
    await page.goto(`/${LOCALE}/help`);
    await page.waitForLoadState('domcontentloaded');

    const categoryLinks = await page.locator('a[href*="/help/"]').evaluateAll((nodes) => {
      const out: string[] = [];
      const seen = new Set<string>();
      for (const a of nodes) {
        const href = (a as HTMLAnchorElement).getAttribute('href');
        if (!href) continue;
        const path = href.replace(/^https?:\/\/[^/]+/, '').split('/').filter(Boolean);
        if (path.length >= 2 && path[path.length - 2] === 'help') {
          const slug = path[path.length - 1];
          if (!seen.has(slug)) {
            seen.add(slug);
            out.push(href.startsWith('/') ? href : `/${href}`);
          }
        }
      }
      return out;
    });

    for (const catHref of categoryLinks) {
      const res = await page.request.get(toAbsolute(catHref, baseURL!), { maxRedirects: 5 });
      expect(res.status(), `Category ${catHref} should not 404`).not.toBe(404);

      await page.goto(toAbsolute(catHref, baseURL!));
      await page.waitForLoadState('domcontentloaded');

      const articleLinks = await page.locator('a[href*="/help/"]').evaluateAll((nodes) => {
        const out: string[] = [];
        for (const a of nodes) {
          const href = (a as HTMLAnchorElement).getAttribute('href');
          if (!href) continue;
          const path = href.replace(/^https?:\/\/[^/]+/, '').split('/').filter(Boolean);
          if (path.length >= 3 && path[path.length - 3] === 'help') {
            const normalized = href.startsWith('/') ? href : `/${href}`;
            out.push(normalized);
          }
        }
        return [...new Set(out)];
      });

      for (const artHref of articleLinks) {
        const artRes = await page.request.get(toAbsolute(artHref, baseURL!), { maxRedirects: 5 });
        expect(artRes.status(), `Article ${artHref} should not 404`).not.toBe(404);
      }
    }
  });
});
