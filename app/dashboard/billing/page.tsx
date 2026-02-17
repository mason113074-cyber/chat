'use client';

import { useEffect, useState, useCallback } from 'react';

type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: Record<string, unknown>;
  sort_order: number;
};

type PlanInSub = Plan & { id: string };

type Subscription = {
  id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  plan: PlanInSub | Plan | null;
};

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};

const PLAN_CARD_STYLE: Record<string, string> = {
  free: 'border-gray-200 bg-gray-50',
  basic: 'border-blue-200 bg-blue-50/30',
  pro: 'border-purple-200 bg-purple-50/30',
  enterprise: 'border-amber-200 bg-amber-50/30',
};

const PER_PAGE = 10;

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentsPage, setPaymentsPage] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, subRes, paymentsRes, usageRes] = await Promise.all([
        fetch('/api/plans'),
        fetch('/api/subscription'),
        fetch('/api/payments'),
        fetch('/api/usage'),
      ]);
      if (plansRes.ok) {
        const j = await plansRes.json();
        setPlans((j.plans ?? []).map((p: Plan) => ({ ...p, features: Array.isArray(p.features) ? p.features : [] })));
      }
      if (subRes.ok) {
        const j = await subRes.json();
        setSubscription(j.subscription ?? null);
      }
      if (paymentsRes.ok) {
        const j = await paymentsRes.json();
        setPayments(j.payments ?? []);
      }
      if (usageRes.ok) {
        const j = await usageRes.json();
        setUsage({ used: j.used ?? 0, limit: j.limit ?? 100 });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentPlanSlug = subscription?.plan
    ? (subscription.plan as Plan).slug
    : 'free';
  const currentPlan = plans.find((p) => p.slug === currentPlanSlug) ?? plans.find((p) => p.slug === 'free');
  const planOrder = ['free', 'basic', 'pro', 'enterprise'];
  const sortedPlans = [...plans].sort(
    (a, b) => planOrder.indexOf(a.slug) - planOrder.indexOf(b.slug)
  );

  const handleCancelSubscription = async () => {
    if (!confirm('確定要取消訂閱嗎？訂閱將在目前計費週期結束後失效。')) return;
    setActionLoading('cancel');
    try {
      const res = await fetch('/api/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel_at_period_end: true }),
      });
      if (res.ok) await fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubscribe = async (planId: string, slug: string) => {
    setActionLoading(planId);
    try {
      if (slug === 'free') {
        if (subscription) {
          const res = await fetch('/api/subscription', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_id: planId }),
          });
          if (res.ok) await fetchData();
        }
        return;
      }
      if (subscription) {
        const res = await fetch('/api/subscription', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: planId }),
        });
        if (res.ok) await fetchData();
      } else {
        const res = await fetch('/api/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan_id: planId,
            billing_cycle: billingCycle,
          }),
        });
        if (res.ok) await fetchData();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const paginatedPayments = payments.slice(
    paymentsPage * PER_PAGE,
    (paymentsPage + 1) * PER_PAGE
  );
  const totalPages = Math.max(1, Math.ceil(payments.length / PER_PAGE));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-gray-500">載入中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">方案與計費</h1>

      {/* 訂閱狀態區塊 */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">目前訂閱狀態</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">方案</p>
            <p className="font-medium text-gray-900">
              {currentPlan?.name ?? '免費試用'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">狀態</p>
            <p className="font-medium text-gray-900">
              {subscription
                ? subscription.cancel_at_period_end
                  ? '已取消（期末生效）'
                  : subscription.status === 'trialing'
                    ? '試用中'
                    : '生效中'
                : '免費方案'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">下次扣款日</p>
            <p className="font-medium text-gray-900">
              {subscription?.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString('zh-TW')
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">本月 AI 回覆用量</p>
            {usage && (
              <>
                <p className="font-medium text-gray-900">
                  {usage.used} / {usage.limit > 1e6 ? '無限' : usage.limit}
                </p>
                {usage.limit < 1e6 && (
                  <div className="mt-1 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        usage.used >= usage.limit
                          ? 'bg-red-500'
                          : usage.used >= usage.limit * 0.8
                            ? 'bg-amber-500'
                            : 'bg-indigo-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (usage.used / usage.limit) * 100)}%`,
                      }}
                    />
                  </div>
                )}
                {usage.limit < 1e6 && usage.used >= usage.limit * 0.8 && usage.used < usage.limit && (
                  <p className="text-amber-600 text-xs mt-1">即將達到本月上限</p>
                )}
                {usage.limit < 1e6 && usage.used >= usage.limit && (
                  <p className="text-red-600 text-xs mt-1">已達本月上限</p>
                )}
              </>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            變更方案
          </button>
          {subscription && !subscription.cancel_at_period_end && (
            <button
              type="button"
              onClick={handleCancelSubscription}
              disabled={!!actionLoading}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {actionLoading === 'cancel' ? '處理中...' : '取消訂閱'}
            </button>
          )}
          <span className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500">
            更新付款方式 — 即將推出
          </span>
        </div>
      </section>

      {/* 方案選擇 */}
      <section id="plans-section" className="scroll-mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">選擇方案</h2>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">月繳</span>
          <button
            type="button"
            role="switch"
            aria-checked={billingCycle === 'yearly'}
            onClick={() => setBillingCycle((c) => (c === 'monthly' ? 'yearly' : 'monthly'))}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              billingCycle === 'yearly' ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-600">年繳</span>
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            省約 17%
          </span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sortedPlans.map((plan) => {
            const isCurrent = currentPlanSlug === plan.slug;
            const price =
              billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
            const monthlyEquivalent =
              billingCycle === 'yearly' ? Math.round(plan.price_yearly / 12) : plan.price_monthly;
            const savePercent =
              plan.price_monthly > 0 && plan.price_yearly > 0
                ? Math.round(
                    (1 - plan.price_yearly / 12 / plan.price_monthly) * 100
                  )
                : 0;
            const style = PLAN_CARD_STYLE[plan.slug] ?? 'border-gray-200 bg-white';
            const isPro = plan.slug === 'pro';

            const getCtaLabel = () => {
              if (isCurrent) return '目前方案';
              if (plan.slug === 'free') return '開始使用';
              const currentPrice = currentPlan
                ? billingCycle === 'yearly'
                  ? currentPlan.price_yearly
                  : currentPlan.price_monthly
                : 0;
              if (price > currentPrice) return `升級到 ${plan.name}`;
              if (price < currentPrice) return `降級到 ${plan.name}`;
              return '選擇方案';
            };

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-6 ${style} ${
                  isCurrent ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                {isPro && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-3 py-0.5 text-xs font-medium text-white">
                    最受歡迎
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{plan.description ?? ''}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">
                    NT$ {price.toLocaleString()}
                  </span>
                  <span className="text-gray-500">
                    /{billingCycle === 'yearly' ? '年' : '月'}
                  </span>
                </div>
                {billingCycle === 'yearly' && plan.price_yearly > 0 && savePercent > 0 && (
                  <p className="mt-1 text-xs text-green-600">
                    相當於每月 NT$ {monthlyEquivalent}，省 {savePercent}%
                  </p>
                )}
                <ul className="mt-4 space-y-2">
                  {(plan.features ?? []).slice(0, 6).map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handleSubscribe(plan.id, plan.slug)}
                  disabled={isCurrent || actionLoading !== null}
                  className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isCurrent ? '目前方案' : getCtaLabel()}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 付款紀錄 */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">付款紀錄</h2>
        {payments.length === 0 ? (
          <p className="py-8 text-center text-gray-500">尚無付款紀錄</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedPayments.map((pay) => (
                    <tr key={pay.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {new Date(pay.created_at).toLocaleDateString('zh-TW')}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        NT$ {pay.amount.toLocaleString()} {pay.currency}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={
                            pay.status === 'succeeded'
                              ? 'text-green-600'
                              : pay.status === 'failed'
                                ? 'text-red-600'
                                : 'text-gray-600'
                          }
                        >
                          {pay.status === 'succeeded'
                            ? '成功'
                            : pay.status === 'failed'
                              ? '失敗'
                              : pay.status === 'refunded'
                                ? '已退款'
                                : '處理中'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">下載收據 — 即將推出</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentsPage((p) => Math.max(0, p - 1))}
                  disabled={paymentsPage === 0}
                  className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
                >
                  上一頁
                </button>
                <span className="text-sm text-gray-600">
                  第 {paymentsPage + 1} / {totalPages} 頁
                </span>
                <button
                  type="button"
                  onClick={() => setPaymentsPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={paymentsPage >= totalPages - 1}
                  className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
                >
                  下一頁
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
