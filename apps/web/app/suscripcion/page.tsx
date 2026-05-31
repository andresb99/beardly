import type { Metadata } from 'next';
import { getCurrentAuthContext } from '@/lib/auth';
import { buildSitePageMetadata } from '@/lib/site-metadata';
import {
  getSubscriptionPlanDescriptor,
  PUBLIC_MARKETPLACE_PLANS,
} from '@/lib/subscription-plans';
import { buildAdminHref } from '@/lib/workspace-routes';

import { SubscriptionClient } from '@/components/public/subscription-client';

interface SubscriptionPageProps {
  searchParams: Promise<{
    shop?: string;
    billing?: string;
  }>;
}

export const metadata: Metadata = buildSitePageMetadata({
  title: 'Planes y precios',
  description:
    'Gestiona la suscripcion de tu cuenta y compara los planes Free, Pro y Business para tu operacion.',
  path: '/suscripcion',
});

export default async function SubscriptionPage({ searchParams }: SubscriptionPageProps) {
  const params = await searchParams;
  const ctx = await getCurrentAuthContext({ shopSlug: params.shop });
  const canManageSelectedWorkspace =
    ctx.selectedWorkspaceRole === 'admin' && Boolean(ctx.shopId && ctx.shopSlug);

  const selectedShopSlug = ctx.shopSlug || null;
  const manageWorkspaceHref =
    selectedShopSlug && canManageSelectedWorkspace
      ? buildAdminHref('/admin/barbershop', selectedShopSlug)
      : '/mis-barberias';

  const plans = PUBLIC_MARKETPLACE_PLANS.map((id) => getSubscriptionPlanDescriptor(id));

  return (
    <SubscriptionClient 
      plans={plans}
      ctx={{ role: ctx.role, shopSlug: ctx.shopSlug || null }}
      manageWorkspaceHref={manageWorkspaceHref}
    />
  );
}
