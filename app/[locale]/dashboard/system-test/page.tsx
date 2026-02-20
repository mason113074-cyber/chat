'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { TestDashboard } from '@/components/dashboard/test-dashboard/TestDashboard';

export default function SystemTestPage() {
  const t = useTranslations('systemTest');
  const params = useParams();
  const locale = (params?.locale as string) ?? 'zh-TW';

  const translations = {
    title: t('title'),
    description: t('description'),
    runAllTests: t('runAllTests'),
    runningTests: t('runningTests'),
    totalTests: t('totalTests'),
    testsPassed: t('testsPassed'),
    testsFailed: t('testsFailed'),
    testsWarnings: t('testsWarnings'),
    collapse: t('collapse'),
    viewError: t('viewError'),
    loadingHistory: t('loadingHistory'),
    categories: {
      API: t('categories.API'),
      Database: t('categories.Database'),
      External: t('categories.External'),
      Security: t('categories.Security'),
      Feature: t('categories.Feature'),
      i18n: t('categories.i18n'),
    },
    history: {
      title: t('history.title'),
      totalChecks: t('history.totalChecks'),
      averageSuccessRate: t('history.averageSuccessRate'),
      failedChecks: t('history.failedChecks'),
      criticalFailures: t('history.criticalFailures'),
      successRateTrend: t('history.successRateTrend'),
      recentFailures: t('history.recentFailures'),
      days7: t('history.days7'),
      days30: t('history.days30'),
      days90: t('history.days90'),
      recent: t('history.recent'),
    },
  };

  return <TestDashboard locale={locale} translations={translations} />;
}
