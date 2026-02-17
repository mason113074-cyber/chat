import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('GET /api/subscription error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscription: data ?? null });
  } catch (error) {
    console.error('GET /api/subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const planId = body?.plan_id;
    const billingCycle = body?.billing_cycle ?? 'monthly';

    if (!planId || typeof planId !== 'string') {
      return NextResponse.json(
        { error: 'plan_id is required' },
        { status: 400 }
      );
    }

    const cycle = billingCycle === 'yearly' ? 'yearly' : 'monthly';
    const now = new Date();
    const periodStart = now.toISOString();
    const periodEnd = new Date(now);
    if (cycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: 'active',
        billing_cycle: cycle,
        current_period_start: periodStart,
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        payment_provider: 'mock',
        updated_at: periodStart,
      })
      .select('*, plan:plans(*)')
      .single();

    if (error) {
      console.error('POST /api/subscription error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscription: data });
  } catch (error) {
    console.error('POST /api/subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const cancelAtPeriodEnd = body?.cancel_at_period_end;
    const planId = body?.plan_id;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof cancelAtPeriodEnd === 'boolean') {
      updates.cancel_at_period_end = cancelAtPeriodEnd;
    }
    if (typeof planId === 'string' && planId) {
      updates.plan_id = planId;
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', sub.id)
      .eq('user_id', user.id)
      .select('*, plan:plans(*)')
      .single();

    if (error) {
      console.error('PATCH /api/subscription error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscription: data });
  } catch (error) {
    console.error('PATCH /api/subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
