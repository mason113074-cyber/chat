/**
 * Format a date as relative time (e.g. "2 天前" / "2 days ago") without date-fns.
 */
export function formatRelativeTime(
  date: Date,
  options: { addSuffix?: boolean; locale?: string } = {}
): string {
  const { addSuffix = true, locale = 'zh-TW' } = options;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const isZh = locale.startsWith('zh');
  let text: string;
  if (diffSec < 60) {
    text = isZh ? '剛剛' : 'just now';
  } else if (diffMin < 60) {
    text = isZh ? `${diffMin} 分鐘前` : `${diffMin} min ago`;
  } else if (diffHour < 24) {
    text = isZh ? `${diffHour} 小時前` : `${diffHour} hr ago`;
  } else if (diffDay < 30) {
    text = isZh ? `${diffDay} 天前` : `${diffDay} days ago`;
  } else {
    return date.toLocaleDateString(locale);
  }
  return text;
}
