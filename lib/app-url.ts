/**
 * Canonical app URL. Use everywhere instead of hardcoding.
 * Fallback only when env is missing (e.g. build without env).
 */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (url) return url;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://www.customeraipro.com';
}
