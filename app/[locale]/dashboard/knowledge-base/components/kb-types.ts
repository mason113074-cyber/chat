/** Shared types for knowledge-base page and components */

export type Item = {
  id: string;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Stats = {
  total: number;
  activeCount: number;
  lastUpdated: string | null;
  byCategory: Record<string, number>;
};

export type GapSuggestion = {
  id: string;
  questionExample: string;
  frequency: number;
  suggestedTitle: string;
  suggestedAnswer: string;
  suggestedCategory: string;
};

export const DEFAULT_CATEGORIES = [
  { value: 'general', labelKey: 'catGeneral' as const },
  { value: '常見問題', labelKey: 'catFaq' as const },
  { value: '產品資訊', labelKey: 'catProduct' as const },
  { value: '退換貨政策', labelKey: 'catReturn' as const },
  { value: '營業資訊', labelKey: 'catBusiness' as const },
] as const;

export const CATEGORY_COLOR: Record<string, string> = {
  general: 'bg-gray-100 text-gray-700',
  常見問題: 'bg-indigo-100 text-indigo-700',
  產品資訊: 'bg-emerald-100 text-emerald-700',
  退換貨政策: 'bg-amber-100 text-amber-700',
  營業資訊: 'bg-purple-100 text-purple-700',
};

export const PREVIEW_LEN = 100;

export interface KBContextValue {
  items: Item[];
  stats: Stats | null;
  loading: boolean;
  categoryOptions: string[];
  getCategoryLabel: (category: string) => string;
  fetchList: () => Promise<void>;
  fetchStats: () => Promise<void>;
  toast: { show: (msg: string, type: 'success' | 'error') => void };
}
