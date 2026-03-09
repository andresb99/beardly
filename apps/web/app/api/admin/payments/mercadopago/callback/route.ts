import { NextRequest, NextResponse } from 'next/server';
import { buildAdminHref } from '@/lib/workspace-routes';
import {
  connectShopMercadoPagoAccount,
  verifyMercadoPagoConnectState,
} from '@/lib/shop-payment-accounts.server';

function redirectToBarbershopSettings(request: NextRequest, shopSlug: string, payments: string) {
  return NextResponse.redirect(
    new URL(buildAdminHref('/admin/barbershop', shopSlug, { payments }), request.url),
  );
}

export async function GET(request: NextRequest) {
  const code = String(request.nextUrl.searchParams.get('code') || '').trim();
  const stateParam = String(request.nextUrl.searchParams.get('state') || '').trim();
  const oauthError = String(request.nextUrl.searchParams.get('error') || '').trim();

  let state;
  try {
    state = verifyMercadoPagoConnectState(stateParam);
  } catch {
    return NextResponse.redirect(new URL('/admin/barbershop?payments=invalid_state', request.url));
  }

  if (oauthError) {
    return redirectToBarbershopSettings(request, state.shopSlug, 'oauth_denied');
  }

  if (!code) {
    return redirectToBarbershopSettings(request, state.shopSlug, 'missing_code');
  }

  try {
    await connectShopMercadoPagoAccount({
      shopId: state.shopId,
      actorUserId: state.actorUserId,
      code,
    });

    return redirectToBarbershopSettings(request, state.shopSlug, 'connected');
  } catch {
    return redirectToBarbershopSettings(request, state.shopSlug, 'connect_error');
  }
}
