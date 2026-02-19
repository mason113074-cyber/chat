'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { getNextPlanSlug } from '@/lib/plans';

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

type BillingUsage = {
  plan: string;
  conversations: { used: number; limit: number; percentage: number };
  knowledge: { used: number; limit: number; percentage: number };
  billing_period: { start: string; end: string; days_remaining: number };
};

const PLAN_CARD_STYLE: Record<string, string> = {
  free: 'border-gray-200 bg-gray-50',
  basic: 'border-blue-200 bg-blue-50/30',
  pro: 'border-purple-200 bg-purple-50/30',
  enterprise: 'border-amber-200 bg-amber-50/30',
};

const PER_PAGE = 10;

export default function BillingPage() {
  const t = useTranslations('billing');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [billingUsage, setBillingUsage] = useState<BillingUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentsPage, setPaymentsPage] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [displayConvPct, setDisplayConvPct] = useState(0);
  const [displayKnowledgePct, setDisplayKnowledgePct] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const timeoutId = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          setError(t('loadTimeout'));
          return false;
        }
        return prev;
      });
    }, 10000);
    try {
      const [plansRes, subRes, paymentsRes, usageRes] = await Promise.all([
        fetch('/api/plans'),
        fetch('/api/subscription'),
        fetch('/api/payments'),
        fetch('/api/billing/usage'),
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
        setBillingUsage(j);
        setUsage({
          used: j.conversations?.used ?? 0,
          limit: j.conversations?.limit === -1 ? Number.MAX_SAFE_INTEGER : (j.conversations?.limit ?? 100),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadFailed'));
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (billingUsage == null) return;
    const convPct = billingUsage.conversations.limit === -1 ? 0 : Math.min(100, billingUsage.conversations.percentage);
    const knowledgePct = billingUsage.knowledge.limit === -1 ? 0 : Math.min(100, billingUsage.knowledge.percentage);
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDisplayConvPct(convPct);
        setDisplayKnowledgePct(knowledgePct);
      });
    });
    return () => cancelAnimationFrame(rafId);
  }, [billingUsage]);

  const currentPlanSlug = subscription?.plan
    ? (subscription.plan as Plan).slug
    : 'free';
  const currentPlan = plans.find((p) => p.slug === currentPlanSlug) ?? plans.find((p) => p.slug === 'free');
  const planOrder = ['free', 'basic', 'pro', 'enterprise'];
  const sortedPlans = [...plans].sort(
    (a, b) => planOrder.indexOf(a.slug) - planOrder.indexOf(b.slug)
  );

  const handleCancelSubscription = async () => {
    if (!confirm(t('cancelConfirm'))) return;
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-3 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠</div>
          <h2 className="text-xl font-semibold mb-2">{t('loadFailed')}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => fetchData()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            {t('reload')}
          </button>
        </div>
      </div>
    );
  }

  const conv = billingUsage?.conversations ?? { used: 0, limit: 0, percentage: 0 };
  const isUnlimitedConv = conv.limit === -1;
  const nextPlanSlug = getNextPlanSlug(currentPlanSlug);
  const nextPlanName = nextPlanSlug ? plans.find((p) => p.slug === nextPlanSlug)?.name ?? t('higherPlan') : null;

  const barColor = (pct: number) =>
    pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">{t('pageTitle')}</h1>

      {/* 用量概覽 */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('usageOverview')}</h2>

        {/* 對話用量 */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">📊 {t('monthlyConversationUsage')}</p>
          <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor(isUnlimitedConv ? 0 : conv.percentage)}`}
              style={{ width: isUnlimitedConv ? '0%' : `${displayConvPct}%` }}
            />
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {isUnlimitedConv
              ? t('usedUnlimited', { used: conv.used })
              : t('usedOfLimit', { used: conv.used, limit: conv.limit }) + (conv.percentage > 0 ? ` · ${conv.percentage}%` : '')}
          </p>
        </div>

        {/* 知識庫用量 */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">📚 {t('knowledgeBaseItems')}</p>
          <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor(
                billingUsage?.knowledge.limit === -1 ? 0 : (billingUsage?.knowledge.percentage ?? 0)
              )}`}
              style={{
                width: billingUsage?.knowledge.limit === -1 ? '0%' : `${displayKnowledgePct}%`,
              }}
            />
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {billingUsage?.knowledge.limit === -1
              ? t('usedUnlimitedEntries', { used: billingUsage?.knowledge.used ?? 0 })
              : t('usedOfLimitEntries', { used: billingUsage?.knowledge.used ?? 0, limit: billingUsage?.knowledge.limit ?? 0 }) +
                ((billingUsage?.knowledge.percentage ?? 0) > 0 ? ` · ${billingUsage?.knowledge.percentage}%` : '')}
          </p>
        </div>

        {/* 帳單週期 */}
        {billingUsage?.billing_period && (
          <>
            <p className="text-xs text-gray-500">
              {t('billingPeriod', {
                start: billingUsage.billing_period.start,
                end: billingUsage.billing_period.end,
                days: billingUsage.billing_period.days_remaining,
              })}
            </p>
            <p className="text-xs text-gray-400 mt-1">{t('usageResetsMonthly')}</p>
          </>
        )}

        {/* 超額警告 */}
        {!isUnlimitedConv && conv.limit > 0 && (
          <>
            {conv.percentage >= 100 && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex flex-wrap items-center gap-3">
                <span className="text-red-600">❌</span>
                <p className="text-red-800 text-sm flex-1">{t('limitReached')}</p>
                <button
                  type="button"
                  onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  {t('upgradePlan')}
                </button>
              </div>
            )}
            {conv.percentage >= 95 && conv.percentage < 100 && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex flex-wrap items-center gap-3">
                <span className="text-red-600">🚨</span>
                <p className="text-red-800 text-sm flex-1">{t('limitAlmostReached', { remaining: conv.limit - conv.used })}</p>
                <button
                  type="button"
                  onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  {t('upgradeNow')}
                </button>
              </div>
            )}
            {conv.percentage >= 80 && conv.percentage < 95 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex flex-wrap items-center gap-3">
                <span className="text-amber-600">⚠️</span>
                <p className="text-amber-800 text-sm flex-1">
                  {t('usageWarning', { percentage: conv.percentage, plan: nextPlanName ?? t('higherPlan') })}
                </p>
                <button
                  type="button"
                  onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
                >
                  {t('upgradePlan')}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* 訂閱狀態區塊 */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('subscriptionStatus')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">{t('plan')}</p>
            <p className="font-medium text-gray-900">
              {currentPlan?.name ?? t('freeTrial')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('status')}</p>
            <p className="font-medium text-gray-900">
              {subscription
                ? subscription.cancel_at_period_end
                  ? t('cancelledAtPeriodEnd')
                  : subscription.status === 'trialing'
                    ? t('trialing')
                    : t('active')
                : t('freePlan')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('nextBillingDate')}</p>
            <p className="font-medium text-gray-900">
              {subscription?.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString('zh-TW')
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('monthlyAiUsage')}</p>
            {usage && (
              <>
                <p className="font-medium text-gray-900">
                  {usage.used} / {usage.limit > 1e6 ? t('unlimited') : usage.limit}
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
                  <p className="text-amber-600 text-xs mt-1">{t('approachingLimit')}</p>
                )}
                {usage.limit < 1e6 && usage.used >= usage.limit && (
                  <p className="text-red-600 text-xs mt-1">{t('reachedLimit')}</p>
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
            {t('changePlan')}
          </button>
          {subscription && !subscription.cancel_at_period_end && (
            <button
              type="button"
              onClick={handleCancelSubscription}
              disabled={!!actionLoading}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {actionLoading === 'cancel' ? t('processing') : t('cancelSubscription')}
            </button>
          )}
          <span className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500">
            {t('contactToUpdatePayment')}
          </span>
        </div>
      </section>

      {/* 方案選擇 */}
      <section id="plans-section" className="scroll-mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('choosePlan')}</h2>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">{t('monthly')}</span>
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
          <span className="text-sm text-gray-600">{t('yearly')}</span>
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            {t('savePercent')}
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
              if (isCurrent) return t('currentPlan');
              if (plan.slug === 'free') return t('getStarted');
              const currentPrice = currentPlan
                ? billingCycle === 'yearly'
                  ? currentPlan.price_yearly
                  : currentPlan.price_monthly
                : 0;
              if (price > currentPrice) return t('upgradeTo', { plan: plan.name });
              if (price < currentPrice) return t('downgradeTo', { plan: plan.name });
              return t('selectPlan');
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
                    {t('mostPopular')}
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{plan.description ?? ''}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">
                    NT$ {price.toLocaleString()}
                  </span>
                  <span className="text-gray-500">
                    /{billingCycle === 'yearly' ? t('year') : t('month')}
                  </span>
                </div>
                {billingCycle === 'yearly' && plan.price_yearly > 0 && savePercent > 0 && (
                  <p className="mt-1 text-xs text-green-600">
                    {t('yearlyEquivalent', { monthly: monthlyEquivalent, savePercent })}
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
                  {isCurrent ? t('currentPlan') : getCtaLabel()}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 付款紀錄 */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('paymentHistory')}</h2>
        {payments.length === 0 ? (
          <p className="py-8 text-center text-gray-500">{t('noPayments')}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('date')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('amount')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('payStatus')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('action')}</th>
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
                            ? t('paySucceeded')
                            : pay.status === 'failed'
                              ? t('payFailed')
                              : pay.status === 'refunded'
                                ? t('payRefunded')
                                : t('payProcessing')}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{t('receiptContactSupport')}</td>
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
                  {t('prevPage')}
                </button>
                <span className="text-sm text-gray-600">
                  {t('pageOf', { current: paymentsPage + 1, total: totalPages })}
                </span>
                <button
                  type="button"
                  onClick={() => setPaymentsPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={paymentsPage >= totalPages - 1}
                  className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
                >
                  {t('nextPage')}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
