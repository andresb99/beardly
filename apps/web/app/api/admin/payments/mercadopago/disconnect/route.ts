import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { disconnectShopMercadoPagoAccount } from '@/lib/shop-payment-accounts.server';
import { buildAdminHref } from '@/lib/workspace-routes';

export async function POST(request: NextRequest) {
  const shopSlug = request.nextUrl.searchParams.get('shop') || undefined;
  const ctx = await requireAdmin({ shopSlug });

  try {
    await disconnectShopMercadoPagoAccount(ctx.shopId);
    return NextResponse.redirect(
      new URL(buildAdminHref('/admin/barbershop', ctx.shopSlug, { payments: 'disconnected' }), request.url),
    );
  } catch {
    return NextResponse.redirect(
      new URL(buildAdminHref('/admin/barbershop', ctx.shopSlug, { payments: 'disconnect_error' }), request.url),
    );
  }
}
