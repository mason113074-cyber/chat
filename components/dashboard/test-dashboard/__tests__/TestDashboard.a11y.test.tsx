import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { TestDashboard } from '../TestDashboard';
import { TestProgressBar } from '../TestProgressBar';

const mockTranslations = {
  title: 'System Test',
  description: 'Run tests',
  runAllTests: 'Run All Tests',
  runningTests: 'Running Tests...',
  totalTests: 'Total Tests',
  testsPassed: 'Passed',
  testsFailed: 'Failed',
  testsWarnings: 'Warnings',
  collapse: 'Collapse',
  viewError: 'View error',
  loadingHistory: 'Loading history...',
  categories: {
    API: 'API',
    Database: 'Database',
    External: 'External',
    Security: 'Security',
    Feature: 'Feature',
    i18n: 'i18n',
  },
  history: {
    title: 'History',
    totalChecks: 'Total Checks',
    averageSuccessRate: 'Avg Success Rate',
    failedChecks: 'Failed Checks',
    criticalFailures: 'Critical Failures',
    successRateTrend: 'Success Rate Trend',
    recentFailures: 'Recent Failures',
    days7: '7 days',
    days30: '30 days',
    days90: '90 days',
    recent: 'Recent',
  },
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function createMockFetch(runDelayMs = 20) {
  return vi.fn((url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof Request ? url.url : url.toString();
    if (urlStr.includes('/api/health-check/history')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            period: '7 days',
            totalChecks: 0,
            averageSuccessRate: '0%',
            failedChecks: 0,
            criticalFailures: 0,
            trend: [],
            recentFailures: [],
          }),
      } as Response);
    }
    const response: Response = {
      ok: true,
      json: () => {
        if (urlStr.includes('/api/settings') && !urlStr.includes('line')) return Promise.resolve({ systemPrompt: '', aiModel: 'gpt-4o-mini' });
        if (urlStr.includes('/api/knowledge-base') && !urlStr.includes('test')) return Promise.resolve({ items: [] });
        if (urlStr.includes('/api/chat')) return Promise.resolve({ content: 'ok' });
        if (urlStr.includes('/api/settings/line/test')) return Promise.resolve({ success: true });
        if (urlStr.includes('/api/health/supabase') || urlStr.includes('/api/health/openai')) return Promise.resolve({ status: 'ok' });
        if (urlStr.includes('/api/health/security')) return Promise.resolve({ status: 'ok' });
        if (urlStr.includes('/api/health/feature')) return Promise.resolve({ status: 'ok' });
        if (urlStr.includes('/api/health/i18n')) return Promise.resolve({ status: 'ok' });
        if (urlStr.includes('/api/knowledge-base/test')) return Promise.resolve({ answer: 'ok', sources: [] });
        return Promise.resolve({});
      },
    } as Response;
    return delay(runDelayMs).then(() => response);
  });
}

describe('TestDashboard a11y', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', createMockFetch());
  });

  it('should have no axe accessibility violations on initial render', async () => {
    const { container } = render(<TestDashboard locale="zh-TW" translations={mockTranslations} />);
    await waitFor(() => {
      expect(screen.getByText('System Test')).toBeInTheDocument();
    }, { timeout: 3000 });

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it('should have no axe violations after tests complete', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    const { container } = render(<TestDashboard locale="zh-TW" translations={mockTranslations} />);
    const button = screen.getByRole('button', { name: /Run All Tests/i });
    await user.click(button);
    await waitFor(
      () => {
        expect(screen.getByText('Total Tests')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  }, 15000);
});

describe('TestProgressBar a11y', () => {
  it('should expose aria-valuenow, aria-valuemin, aria-valuemax on progressbar', () => {
    render(<TestProgressBar progress={45} translations={mockTranslations} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '45');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });
});
