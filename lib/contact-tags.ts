export const DEFAULT_TAGS = [
  { name: '🟢 詢價客戶', color: 'green' },
  { name: '🔵 技術支援', color: 'blue' },
  { name: '🟡 高價值潛客', color: 'yellow' },
  { name: '🟣 VIP', color: 'purple' },
  { name: '🔴 需跟進', color: 'red' },
  { name: '⚪ 一般訪客', color: 'gray' },
] as const;

export const TAG_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray'] as const;
export type TagColor = (typeof TAG_COLORS)[number];

export const AUTO_TAG_NAMES = {
  inquiry: '🟢 詢價客戶',
  support: '🔵 技術支援',
  highValue: '🟡 高價值潛客',
} as const;
