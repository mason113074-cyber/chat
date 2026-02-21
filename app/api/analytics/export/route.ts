import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const format = request.nextUrl.searchParams.get('format') || 'csv';
    const days = Math.min(90, Math.max(7, Number(request.nextUrl.searchParams.get('days')) || 30));
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);

    const { data: contactRows } = await supabase.from('contacts').select('id').eq('user_id', user.id);
    const contactIds = (contactRows ?? []).map((c) => c.id);

    const dateToKey = (d: Date) => d.toISOString().slice(0, 10);
    const trendMap: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      trendMap[dateToKey(d)] = 0;
    }

    if (contactIds.length > 0) {
      const { data: rows } = await supabase
        .from('conversations')
        .select('created_at')
        .in('contact_id', contactIds)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      for (const r of rows ?? []) {
        const k = dateToKey(new Date(r.created_at!));
        if (k in trendMap) trendMap[k]++;
      }
    }

    let resolutionRate = 0;
    if (contactIds.length > 0) {
      const { data: assistantRows } = await supabase
        .from('conversations')
        .select('id, is_resolved')
        .in('contact_id', contactIds)
        .eq('role', 'assistant')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      const total = assistantRows?.length ?? 0;
      const resolved = assistantRows?.filter((r) => r.is_resolved === true).length ?? 0;
      resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    }

    if (format === 'csv') {
      const header = 'date,conversations,resolution_rate\n';
      const rows = Object.keys(trendMap)
        .sort()
        .map((date) => `${date},${trendMap[date]},${resolutionRate}`);
      const csv = header + rows.join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="analytics-export-${dateToKey(start)}-${dateToKey(end)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      series: Object.keys(trendMap).sort().map((date) => ({ date, count: trendMap[date] })),
      resolution_rate: resolutionRate,
    });
  } catch (err) {
    console.error('GET /api/analytics/export error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
