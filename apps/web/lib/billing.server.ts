import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  isSubscriptionOperational,
  requiresReservationPayment,
  type SubscriptionStatus,
  type SubscriptionTier,
} from '@/lib/subscription-plans';

interface ShopSubscriptionRow {
  id: string;
  shop_id: string;
  plan: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_end: string | null;
  trial_ends_at: string | null;
}

export interface ResolvedShopBillingState {
  rawPlan: SubscriptionTier;
  effectivePlan: SubscriptionTier;
  status: SubscriptionStatus;
  requiresReservationPayment: boolean;
  isOperational: boolean;
}

function getFallbackSubscription() {
  return {
    rawPlan: 'free' as SubscriptionTier,
    effectivePlan: 'free' as SubscriptionTier,
    status: 'active' as SubscriptionStatus,
    requiresReservationPayment: false,
    isOperational: true,
  };
}

export async function isPlatformAdminUser(userId: string | null | undefined) {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    return false;
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', normalizedUserId)
    .maybeSingle();

  return Boolean(data?.user_id);
}

export async function getShopBillingState(shopId: string): Promise<ResolvedShopBillingState> {
  const normalizedShopId = String(shopId || '').trim();
  if (!normalizedShopId) {
    return getFallbackSubscription();
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('subscriptions')
    .select('id, shop_id, plan, status, current_period_end, trial_ends_at')
    .eq('shop_id', normalizedShopId)
    .maybeSingle();

  if (!data) {
    return getFallbackSubscription();
  }

  const row = data as ShopSubscriptionRow;
  const isOperational = isSubscriptionOperational(row.status);
  const effectivePlan =
    row.plan === 'app_admin' ? 'app_admin' : isOperational ? row.plan : 'free';

  return {
    rawPlan: row.plan,
    effectivePlan,
    status: row.status,
    requiresReservationPayment: requiresReservationPayment(effectivePlan),
    isOperational,
  };
}

export async function resolveShopTierForUser(shopId: string, userId: string | null | undefined) {
  if (await isPlatformAdminUser(userId)) {
    return {
      tier: 'app_admin' as SubscriptionTier,
      requiresReservationPayment: false,
      source: 'platform_admin' as const,
    };
  }

  const billingState = await getShopBillingState(shopId);
  return {
    tier: billingState.effectivePlan,
    requiresReservationPayment: billingState.requiresReservationPayment,
    source: 'subscription' as const,
  };
}

