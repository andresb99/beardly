import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import {
  buildMercadoPagoOAuthAuthorizationUrl,
  createMercadoPagoConnectState,
} from '@/lib/shop-payment-accounts.server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const shopSlug = request.nextUrl.searchParams.get('shop') || undefined;
  const ctx = await requireAdmin({ shopSlug });
  const admin = createSupabaseAdminClient();
  const { data: location } = await admin
    .from('shop_locations')
    .select('country_code')
    .eq('shop_id', ctx.shopId)
    .maybeSingle();

  const state = createMercadoPagoConnectState({
    shopId: ctx.shopId,
    shopSlug: ctx.shopSlug,
    actorUserId: ctx.userId,
  });
  const authorizationUrl = buildMercadoPagoOAuthAuthorizationUrl({
    state,
    countryCode: String((location as { country_code?: string | null } | null)?.country_code || 'UY'),
  });

  return NextResponse.redirect(authorizationUrl);
}
