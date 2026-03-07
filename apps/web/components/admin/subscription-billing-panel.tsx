'use client';

import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import {
  getSubscriptionPlanDescriptor,
  getSubscriptionPriceCents,
  type SubscriptionBillingMode,
  type SubscriptionTier,
} from '@/lib/subscription-plans';

interface SubscriptionBillingPanelProps {
  shopId: string;
  currentPlan: SubscriptionTier;
  currentStatus: 'trialing' | 'active' | 'past_due' | 'cancelled';
  billingMessage?: 'success' | 'pending' | 'failure' | null;
}

const paidPlanOptions: Array<{
  tier: Extract<SubscriptionTier, 'pro' | 'business'>;
  label: string;
  description: string;
}> = [
  {
    tier: 'pro',
    label: 'Pro',
    description: 'Cursos, convocatorias y metricas operativas.',
  },
  {
    tier: 'business',
    label: 'Business',
    description: 'Multi-sede, permisos avanzados y soporte prioritario.',
  },
];

const UYU_FORMATTER = new Intl.NumberFormat('es-UY', {
  style: 'currency',
  currency: 'UYU',
  maximumFractionDigits: 0,
});

function formatUyuCents(amountCents: number) {
  return UYU_FORMATTER.format(Math.round(amountCents / 100));
}

export function SubscriptionBillingPanel({
  shopId,
  currentPlan,
  currentStatus,
  billingMessage = null,
}: SubscriptionBillingPanelProps) {
  const [billingMode, setBillingMode] = useState<SubscriptionBillingMode>('monthly');
  const [submittingPlan, setSubmittingPlan] = useState<SubscriptionTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startSubscriptionCheckout(targetPlan: Extract<SubscriptionTier, 'pro' | 'business'>) {
    setSubmittingPlan(targetPlan);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          shop_id: shopId,
          target_plan: targetPlan,
          billing_mode: billingMode,
        }),
      });

      if (!response.ok) {
        const rawBody = (await response.text().catch(() => '')) || '';
        let maybeJson: { message?: string; error?: string } | null = null;

        if (rawBody) {
          try {
            maybeJson = JSON.parse(rawBody) as { message?: string; error?: string };
          } catch {
            maybeJson = null;
          }
        }

        setSubmittingPlan(null);
        setError(
          maybeJson?.message ||
            maybeJson?.error ||
            rawBody ||
            'No se pudo iniciar el checkout de suscripcion.',
        );
        return;
      }

      const payload = (await response.json()) as { checkout_url?: string };
      if (!payload.checkout_url) {
        setSubmittingPlan(null);
        setError('No se pudo iniciar el checkout de Mercado Pago.');
        return;
      }

      window.location.assign(payload.checkout_url);
    } catch (requestError) {
      setSubmittingPlan(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo iniciar el checkout de suscripcion.',
      );
    }
  }

  return (
    <div className="space-y-4">
      {billingMessage === 'success' ? (
        <p className="status-banner success">Pago recibido. En breve se actualiza tu suscripcion.</p>
      ) : null}
      {billingMessage === 'pending' ? (
        <p className="status-banner warning">
          El pago quedo pendiente. Verifica el estado en Mercado Pago.
        </p>
      ) : null}
      {billingMessage === 'failure' ? (
        <p className="status-banner error">No se pudo completar el pago de la suscripcion.</p>
      ) : null}
      {error ? <p className="status-banner error">{error}</p> : null}

      <div className="rounded-[1.35rem] border border-white/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-ink dark:text-slate-100">Suscripcion actual</p>
            <p className="text-xs text-slate/75 dark:text-slate-400">
              Plan {getSubscriptionPlanDescriptor(currentPlan).name} - estado {currentStatus}
            </p>
          </div>

          <div className="flex items-center rounded-full border border-white/70 bg-white/72 p-1 dark:border-white/10 dark:bg-black/20">
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                billingMode === 'monthly'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate/75 dark:text-slate-300'
              }`}
              onClick={() => setBillingMode('monthly')}
            >
              Mensual
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                billingMode === 'annual_installments'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate/75 dark:text-slate-300'
              }`}
              onClick={() => setBillingMode('annual_installments')}
            >
              Anual en cuotas
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {paidPlanOptions.map((option) => {
          const isCurrent = currentPlan === option.tier && currentStatus === 'active';
          const isLoading = submittingPlan === option.tier;
          const amountCents = getSubscriptionPriceCents(option.tier, billingMode);
          const priceLabel =
            billingMode === 'monthly'
              ? `${formatUyuCents(amountCents)} / mes`
              : `12x ${formatUyuCents(amountCents)} / mes`;

          return (
            <article key={option.tier} className="surface-card rounded-[1.3rem] p-4">
              <p className="text-lg font-semibold text-ink dark:text-slate-100">{option.label}</p>
              <p className="mt-1 text-xs text-slate/70 dark:text-slate-400">{option.description}</p>
              <p className="mt-2 text-sm font-semibold text-ink dark:text-slate-200">{priceLabel}</p>

              <button
                type="button"
                disabled={isCurrent || isLoading || submittingPlan !== null}
                className="action-primary mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60"
                onClick={() => void startSubscriptionCheckout(option.tier)}
              >
                {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {isCurrent ? 'Plan activo' : `Pagar ${option.label}`}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
