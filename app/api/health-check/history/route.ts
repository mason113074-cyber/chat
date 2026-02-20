import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface LogSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
}

interface LogDetail {
  category: string;
  test: string;
  status: string;
  duration: number;
  message?: string;
}

interface HealthCheckLog {
  id: string;
  created_at: string;
  triggered_by: string;
  summary: LogSummary;
  details: LogDetail[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') || '7', 10), 90);
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('health_check_logs')
      .select('id, created_at, triggered_by, summary, details')
      .or(`user_id.eq.${user.id},triggered_by.eq.cron`)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    const logs = (data ?? []) as HealthCheckLog[];

    const trend = logs.map((log) => ({
      timestamp: log.created_at,
      triggeredBy: log.triggered_by,
      total: log.summary.total,
      passed: log.summary.passed,
      failed: log.summary.failed,
      successRate: log.summary.total > 0
        ? ((log.summary.passed / log.summary.total) * 100).toFixed(1)
        : '0',
    }));

    const totalChecks = logs.length;
    const averageSuccessRate =
      totalChecks > 0
        ? (
            trend.reduce((sum, t) => sum + parseFloat(t.successRate), 0) / totalChecks
          ).toFixed(1)
        : '0';

    const failedChecks = logs.filter((log) => log.summary.failed > 0);
    const criticalFailures = failedChecks.filter((log) => log.summary.failed >= 3);

    const recentFailures = failedChecks.slice(-5).map((log) => ({
      timestamp: log.created_at,
      failed: log.summary.failed,
      total: log.summary.total,
      tests: (log.details ?? [])
        .filter((d: LogDetail) => d.status === 'error')
        .map((d: LogDetail) => `${d.category}: ${d.test}`),
    }));

    return NextResponse.json({
      period: `${days} days`,
      totalChecks,
      averageSuccessRate: `${averageSuccessRate}%`,
      failedChecks: failedChecks.length,
      criticalFailures: criticalFailures.length,
      trend,
      recentFailures,
    });
  } catch (error) {
    console.error('Failed to fetch health check history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
