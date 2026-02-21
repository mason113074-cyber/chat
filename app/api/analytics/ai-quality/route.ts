import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthFromRequest } from '@/lib/auth-helper';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    let user = auth?.user ?? null;
    const supabase = auth?.supabase ?? await createClient();
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return NextResponse.json({ error: '未授權' }, { status: 401 });
      user = u;
    }
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const admin = getSupabaseAdmin();

    const contactsRes = await admin
      .from('contacts')
      .select('id')
      .eq('user_id', user.id);
    const contactIds = (contactsRes.data ?? []).map((c: { id: string }) => c.id);
    if (contactIds.length === 0) {
      return NextResponse.json({
        totalConversations: 0,
        aiHandledCount: 0,
        humanHandoffCount: 0,
        aiHandledRate: 0,
        avgConfidenceScore: 0,
        confidenceDistribution: [],
        feedbackStats: { positive: 0, negative: 0, total: 0, positiveRate: 0 },
        topLowConfidenceQuestions: [],
      });
    }

    const { data: convs } = await admin
      .from('conversations')
      .select('id, message, role, status, resolved_by, confidence_score, created_at')
      .in('contact_id', contactIds)
      .gte('created_at', since.toISOString())
      .eq('role', 'assistant');

    const userConvs = (convs ?? []).filter((c: { role: string }) => c.role === 'user');
    const assistantConvs = convs ?? [];
    const totalConversations = assistantConvs.length;
    const aiHandledCount = assistantConvs.filter(
      (c: { resolved_by?: string }) => c.resolved_by === 'ai'
    ).length;
    const humanHandoffCount = assistantConvs.filter(
      (c: { status?: string }) => c.status === 'needs_human'
    ).length;
    const aiHandledRate = totalConversations > 0 ? (aiHandledCount / totalConversations) * 100 : 0;
    const withConfidence = assistantConvs.filter((c: { confidence_score?: number }) => c.confidence_score != null);
    const avgConfidenceScore =
      withConfidence.length > 0
        ? withConfidence.reduce((s: number, c: { confidence_score: number }) => s + (c.confidence_score ?? 0), 0) / withConfidence.length
        : 0;

    const buckets = [
      { range: '0-20%', min: 0, max: 0.2, count: 0 },
      { range: '20-40%', min: 0.2, max: 0.4, count: 0 },
      { range: '40-60%', min: 0.4, max: 0.6, count: 0 },
      { range: '60-80%', min: 0.6, max: 0.8, count: 0 },
      { range: '80-100%', min: 0.8, max: 1.01, count: 0 },
    ];
    for (const c of withConfidence) {
      const sc = c.confidence_score ?? 0;
      const b = buckets.find((x) => sc >= x.min && sc < x.max);
      if (b) b.count++;
    }
    const confidenceDistribution = buckets.map(({ range, count }) => ({ range, count }));

    const { data: feedbacks } = await admin
      .from('ai_feedback')
      .select('rating')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString());
    const positive = (feedbacks ?? []).filter((f: { rating: string }) => f.rating === 'positive').length;
    const negative = (feedbacks ?? []).filter((f: { rating: string }) => f.rating === 'negative').length;
    const total = positive + negative;

    const lowConfidence = assistantConvs
      .filter((c: { confidence_score?: number }) => c.confidence_score != null && c.confidence_score < 0.6)
      .sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((c: { id: string; message: string; confidence_score: number; created_at: string }) => ({
        conversation_id: c.id,
        question: c.message?.slice(0, 80) ?? '',
        confidence: c.confidence_score,
        date: c.created_at,
      }));

    return NextResponse.json({
      totalConversations,
      aiHandledCount,
      humanHandoffCount,
      aiHandledRate,
      avgConfidenceScore,
      confidenceDistribution,
      feedbackStats: {
        positive,
        negative,
        total,
        positiveRate: total > 0 ? (positive / total) * 100 : 0,
      },
      topLowConfidenceQuestions: lowConfidence,
    });
  } catch (e) {
    console.error('AI quality API error:', e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
