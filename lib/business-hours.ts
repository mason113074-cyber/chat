/** Sprint 7: 營業時間判斷 */
export interface BusinessHoursConfig {
  timezone: string;
  schedule: Record<
    string,
    { enabled: boolean; start: string; end: string }
  >;
}

export function isWithinBusinessHours(
  config: BusinessHoursConfig | { timezone?: string; schedule?: Record<string, { enabled?: boolean; start?: string; end?: string }> } | null | undefined
): boolean {
  if (!config?.schedule || typeof config.schedule !== 'object') return true;
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: config.timezone || 'Asia/Taipei' })
  );
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayKey = dayNames[now.getDay()];
  const daySchedule = config.schedule[dayKey];
  if (!daySchedule?.enabled || !daySchedule?.start || !daySchedule?.end) return false;
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  return currentTime >= daySchedule.start && currentTime <= daySchedule.end;
}
