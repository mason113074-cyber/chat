/**
 * Test Dashboard 型別定義
 */

export type TestStatus = 'pending' | 'running' | 'success' | 'error' | 'warning';
export type TestCategory = 'API' | 'Database' | 'External' | 'Security' | 'Feature' | 'i18n';
export type TriggerSource = 'user' | 'cron';

export interface TestResult {
  category: TestCategory | string;
  test: string;
  status: TestStatus;
  message?: string;
  duration?: number;
  timestamp?: string;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  running?: number;
}

export interface GroupedResults {
  [category: string]: TestResult[];
}

export interface HistoryData {
  period: string;
  totalChecks: number;
  averageSuccessRate: string;
  failedChecks: number;
  criticalFailures: number;
  trend: TrendPoint[];
  recentFailures: FailureRecord[];
}

export interface TrendPoint {
  timestamp: string;
  triggeredBy: TriggerSource | string;
  total: number;
  passed: number;
  failed: number;
  successRate: string;
}

export interface FailureRecord {
  timestamp: string;
  failed: number;
  total: number;
  tests: string[];
}

export interface TestDashboardTranslations {
  title?: string;
  description?: string;
  runAllTests?: string;
  runningTests?: string;
  totalTests?: string;
  testsPassed?: string;
  testsFailed?: string;
  testsWarnings?: string;
  collapse?: string;
  viewError?: string;
  loadingHistory?: string;
  categories?: Record<string, string>;
  history?: {
    title?: string;
    totalChecks?: string;
    averageSuccessRate?: string;
    failedChecks?: string;
    criticalFailures?: string;
    successRateTrend?: string;
    recentFailures?: string;
    days7?: string;
    days30?: string;
    days90?: string;
    recent?: string;
  };
}

export interface TestDashboardProps {
  locale: string;
  translations: TestDashboardTranslations;
}
