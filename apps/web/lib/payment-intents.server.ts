import 'server-only';

import { createAppointmentFromBookingIntent, type BookingIntentPayload } from '@/lib/booking-payments.server';
import {
  createCourseEnrollmentFromIntent,
  type CourseEnrollmentIntentPayload,
} from '@/lib/course-payments.server';
import {
  getMercadoPagoPayment,
  searchLatestMercadoPagoPaymentByExternalReference,
  type MercadoPagoApiCredentials,
  type MercadoPagoPaymentResponse,
} from '@/lib/mercado-pago.server';
import { trackProductEvent } from '@/lib/product-analytics';
import {
  getPlatformMercadoPagoCredentials,
  getShopMercadoPagoCredentials,
} from '@/lib/shop-payment-accounts.server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { SubscriptionBillingMode, SubscriptionTier } from '@/lib/subscription-plans';

export type PaymentIntentStatus =
  | 'pending'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'expired';

export interface PaymentIntentRow {
  id: string;
  shop_id: string | null;
  intent_type: 'booking' | 'subscription' | 'course_enrollment';
  status: PaymentIntentStatus;
  external_reference: string;
  processed_at: string | null;
  provider_payment_id: string | null;
  shop_payment_account_id: string | null;
  created_by_user_id: string | null;
  payload: Record<string, unknown> | null;
}

export interface PaymentIntentSyncResult {
  ok: true;
  ignored?: boolean;
  processed?: boolean;
  status?: PaymentIntentStatus;
  paymentIntentId?: string;
  providerPaymentId?: string;
  externalReference?: string;
}

function getNextSubscriptionPeriodEnd(billingMode: SubscriptionBillingMode) {
  const next = new Date();
  if (billingMode === 'annual_installments') {
    next.setUTCFullYear(next.getUTCFullYear() + 1);
  } else {
    next.setUTCMonth(next.getUTCMonth() + 1);
  }

  return next.toISOString();
}

export function mapMercadoPagoStatus(status: string | undefined): PaymentIntentStatus {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'approved') {
    return 'approved';
  }

  if (normalized === 'pending' || normalized === 'in_process') {
    return 'processing';
  }

  if (normalized === 'rejected') {
    return 'rejected';
  }

  if (normalized === 'cancelled') {
    return 'cancelled';
  }

  if (normalized === 'refunded' || normalized === 'charged_back') {
    return 'refunded';
  }

  return 'pending';
}

async function markIntentBaseState(
  intentId: string,
  update: {
    status: PaymentIntentStatus;
    providerPaymentId: string;
    payerEmail: string | null;
    failureReason?: string | null;
    approvedAt?: string | null;
  },
) {
  const admin = createSupabaseAdminClient();
  await admin
    .from('payment_intents')
    .update({
      status: update.status,
      provider_payment_id: update.providerPaymentId,
      payer_email: update.payerEmail,
      failure_reason: update.failureReason || null,
      approved_at: update.approvedAt || null,
    })
    .eq('id', intentId);
}

async function processBookingIntent(intent: PaymentIntentRow, providerPaymentId: string, payerEmail: string | null) {
  const bookingPayload = intent.payload as (BookingIntentPayload & {
    source_channel?: string | null;
    created_by_user_email?: string | null;
  }) | null;
  if (!bookingPayload) {
    throw new Error('El payment intent de reserva no contiene payload de booking.');
  }

  const requestedSourceChannel =
    String(bookingPayload.source_channel || '').trim().toUpperCase() === 'MOBILE'
      ? 'MOBILE'
      : 'WEB';
  const requestedUserEmail = String(bookingPayload.created_by_user_email || '').trim().toLowerCase() || null;

  const appointment = await createAppointmentFromBookingIntent(
    {
      shop_id: String(bookingPayload.shop_id || ''),
      service_id: String(bookingPayload.service_id || ''),
      staff_id: String(bookingPayload.staff_id || ''),
      start_at: String(bookingPayload.start_at || ''),
      customer_name: String(bookingPayload.customer_name || ''),
      customer_phone: String(bookingPayload.customer_phone || ''),
      customer_email:
        typeof bookingPayload.customer_email === 'string' ? bookingPayload.customer_email : null,
      notes: typeof bookingPayload.notes === 'string' ? bookingPayload.notes : null,
    },
    {
      paymentIntentId: intent.id,
      sourceChannel: requestedSourceChannel,
      customerAuthUserId: intent.created_by_user_id,
      customerAuthUserEmail: requestedUserEmail,
    },
  );

  const admin = createSupabaseAdminClient();
  await admin
    .from('payment_intents')
    .update({
      status: 'approved',
      provider_payment_id: providerPaymentId,
      payer_email: payerEmail,
      approved_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      payload: {
        ...(intent.payload || {}),
        appointment_id: appointment.appointmentId,
        appointment_start_at: appointment.startAt,
      },
    })
    .eq('id', intent.id);
}

async function processSubscriptionIntent(
  intent: PaymentIntentRow,
  providerPaymentId: string,
  payerEmail: string | null,
) {
  const rawPayload = (intent.payload || {}) as {
    target_plan?: SubscriptionTier;
    billing_mode?: SubscriptionBillingMode;
    shop_id?: string;
  };
  const targetPlan = rawPayload.target_plan;
  const billingMode = rawPayload.billing_mode || 'monthly';
  const shopId = String(rawPayload.shop_id || intent.shop_id || '').trim();

  if (!shopId || !targetPlan) {
    throw new Error('Payload de suscripcion invalido.');
  }

  const admin = createSupabaseAdminClient();
  const periodEnd = getNextSubscriptionPeriodEnd(billingMode);

  const { error: subscriptionError } = await admin
    .from('subscriptions')
    .update({
      plan: targetPlan,
      status: 'active',
      trial_ends_at: null,
      current_period_end: periodEnd,
    })
    .eq('shop_id', shopId);

  if (subscriptionError) {
    throw new Error(subscriptionError.message || 'No se pudo activar la suscripcion.');
  }

  await admin
    .from('payment_intents')
    .update({
      status: 'approved',
      provider_payment_id: providerPaymentId,
      payer_email: payerEmail,
      approved_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      payload: {
        ...(intent.payload || {}),
        activated_plan: targetPlan,
        activated_at: new Date().toISOString(),
      },
    })
    .eq('id', intent.id);
}

async function processCourseEnrollmentIntent(
  intent: PaymentIntentRow,
  providerPaymentId: string,
  payerEmail: string | null,
) {
  const rawPayload = (intent.payload || {}) as {
    shop_id?: string;
    course_id?: string;
    course_title?: string;
    session_id?: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
  };

  const enrollment = await createCourseEnrollmentFromIntent(
    {
      shop_id: String(rawPayload.shop_id || intent.shop_id || ''),
      course_id: String(rawPayload.course_id || ''),
      course_title: String(rawPayload.course_title || 'Curso'),
      session_id: String(rawPayload.session_id || ''),
      name: String(rawPayload.customer_name || ''),
      phone: String(rawPayload.customer_phone || ''),
      email: String(rawPayload.customer_email || payerEmail || ''),
    } satisfies CourseEnrollmentIntentPayload,
    { paymentIntentId: intent.id },
  );

  const admin = createSupabaseAdminClient();
  await admin
    .from('payment_intents')
    .update({
      status: 'approved',
      provider_payment_id: providerPaymentId,
      payer_email: payerEmail,
      approved_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      payload: {
        ...(intent.payload || {}),
        enrollment_id: enrollment.enrollmentId,
        enrolled_at: new Date().toISOString(),
      },
    })
    .eq('id', intent.id);
}

async function applyMercadoPagoPaymentToIntent(intent: PaymentIntentRow, payment: MercadoPagoPaymentResponse) {
  const mappedStatus = mapMercadoPagoStatus(payment.status);
  const providerPaymentId = String(payment.id || '').trim();
  const payerEmail = String(payment.payer?.email || '').trim() || null;
  const failureReason = mappedStatus === 'approved' ? null : String(payment.status_detail || '').trim() || null;

  await markIntentBaseState(intent.id, {
    status: mappedStatus,
    providerPaymentId,
    payerEmail,
    failureReason,
    approvedAt: mappedStatus === 'approved' ? new Date().toISOString() : null,
  });

  void trackProductEvent({
    eventName: 'payment.intent_status_updated',
    shopId: intent.shop_id,
    userId: intent.created_by_user_id,
    source: 'system',
    metadata: {
      payment_intent_id: intent.id,
      intent_type: intent.intent_type,
      status: mappedStatus,
      provider_payment_id: providerPaymentId,
    },
  });

  if (mappedStatus !== 'approved') {
    return {
      ok: true,
      status: mappedStatus,
      paymentIntentId: intent.id,
      providerPaymentId,
      externalReference: intent.external_reference,
    } satisfies PaymentIntentSyncResult;
  }

  if (intent.processed_at) {
    return {
      ok: true,
      processed: true,
      status: mappedStatus,
      paymentIntentId: intent.id,
      providerPaymentId,
      externalReference: intent.external_reference,
    } satisfies PaymentIntentSyncResult;
  }

  if (intent.intent_type === 'booking') {
    await processBookingIntent(intent, providerPaymentId, payerEmail);
  } else if (intent.intent_type === 'course_enrollment') {
    await processCourseEnrollmentIntent(intent, providerPaymentId, payerEmail);
  } else {
    await processSubscriptionIntent(intent, providerPaymentId, payerEmail);
  }

  void trackProductEvent({
    eventName: 'payment.intent_processed',
    shopId: intent.shop_id,
    userId: intent.created_by_user_id,
    source: 'system',
    metadata: {
      payment_intent_id: intent.id,
      intent_type: intent.intent_type,
      status: 'approved',
    },
  });

  return {
    ok: true,
    status: 'approved',
    paymentIntentId: intent.id,
    providerPaymentId,
    externalReference: intent.external_reference,
  } satisfies PaymentIntentSyncResult;
}

async function getMercadoPagoCredentialsForIntent(intent: PaymentIntentRow) {
  const paymentAccountId = String(intent.shop_payment_account_id || '').trim();
  if (paymentAccountId) {
    const credentials = await getShopMercadoPagoCredentials({
      shopId: intent.shop_id,
      paymentAccountId,
    });

    if (!credentials) {
      throw new Error('No se encontro la cuenta de cobro asociada al pago.');
    }

    return {
      accessToken: credentials.accessToken,
    } satisfies MercadoPagoApiCredentials;
  }

  return getPlatformMercadoPagoCredentials();
}

async function findPaymentIntentByPaymentId(
  paymentId: string,
  options?: { paymentAccountId?: string | null; shopId?: string | null },
) {
  const admin = createSupabaseAdminClient();
  const { data: directMatch } = await admin
    .from('payment_intents')
    .select(
      'id, shop_id, intent_type, status, external_reference, processed_at, provider_payment_id, shop_payment_account_id, created_by_user_id, payload',
    )
    .eq('provider_payment_id', paymentId)
    .maybeSingle();

  if (directMatch) {
    return directMatch as PaymentIntentRow;
  }

  const paymentAccountId = String(options?.paymentAccountId || '').trim();
  if (paymentAccountId) {
    const { data: byAccount } = await admin
      .from('payment_intents')
      .select(
        'id, shop_id, intent_type, status, external_reference, processed_at, provider_payment_id, shop_payment_account_id, created_by_user_id, payload',
      )
      .eq('shop_payment_account_id', paymentAccountId)
      .order('created_at', { ascending: false })
      .limit(25);

    if ((byAccount || []).length) {
      return (byAccount || []) as PaymentIntentRow[];
    }
  }

  const shopId = String(options?.shopId || '').trim();
  if (shopId) {
    const { data: byShop } = await admin
      .from('payment_intents')
      .select(
        'id, shop_id, intent_type, status, external_reference, processed_at, provider_payment_id, shop_payment_account_id, created_by_user_id, payload',
      )
      .eq('shop_id', shopId)
      .eq('provider', 'mercado_pago')
      .order('created_at', { ascending: false })
      .limit(25);

    if ((byShop || []).length) {
      return (byShop || []) as PaymentIntentRow[];
    }
  }

  return null;
}

export async function processMercadoPagoPaymentWebhook(
  paymentId: string,
  options?: { paymentAccountId?: string | null; shopId?: string | null },
): Promise<PaymentIntentSyncResult> {
  const matchedIntent = await findPaymentIntentByPaymentId(paymentId, options);

  if (Array.isArray(matchedIntent)) {
    for (const candidate of matchedIntent) {
      try {
        const credentials = await getMercadoPagoCredentialsForIntent(candidate);
        const payment = await getMercadoPagoPayment(paymentId, credentials);
        const externalReference = String(payment.external_reference || '').trim();
        if (externalReference && externalReference === candidate.external_reference) {
          return applyMercadoPagoPaymentToIntent(candidate, payment);
        }
      } catch {
        continue;
      }
    }

    return { ok: true, ignored: true };
  }

  const paymentIntent = matchedIntent;
  if (!paymentIntent) {
    const fallbackPayment = await getMercadoPagoPayment(paymentId, getPlatformMercadoPagoCredentials()).catch(
      () => null,
    );
    const externalReference = String(fallbackPayment?.external_reference || '').trim();

    if (!fallbackPayment || !externalReference) {
      return { ok: true, ignored: true };
    }

    const fallbackIntent = await getPaymentIntentByExternalReference(externalReference);
    if (!fallbackIntent) {
      return { ok: true, ignored: true };
    }

    return applyMercadoPagoPaymentToIntent(fallbackIntent, fallbackPayment);
  }

  const credentials = await getMercadoPagoCredentialsForIntent(paymentIntent);
  const payment = await getMercadoPagoPayment(paymentId, credentials);
  const externalReference = String(payment.external_reference || '').trim();

  if (!externalReference || externalReference !== paymentIntent.external_reference) {
    return { ok: true, ignored: true };
  }

  return applyMercadoPagoPaymentToIntent(paymentIntent, payment);
}

async function getPaymentIntentByExternalReference(externalReference: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('payment_intents')
    .select(
      'id, shop_id, intent_type, status, external_reference, processed_at, provider_payment_id, shop_payment_account_id, created_by_user_id, payload',
    )
    .eq('external_reference', externalReference)
    .maybeSingle();

  return data as PaymentIntentRow | null;
}

export async function reconcileMercadoPagoPaymentIntents(options?: {
  limit?: number;
  shopId?: string | null;
}) {
  const limit = Math.max(1, Math.min(Number(options?.limit || 25), 100));
  const admin = createSupabaseAdminClient();
  let query = admin
    .from('payment_intents')
    .select(
      'id, shop_id, intent_type, status, external_reference, processed_at, provider_payment_id, shop_payment_account_id, created_by_user_id, payload',
    )
    .eq('provider', 'mercado_pago')
    .in('status', ['pending', 'processing', 'approved'])
    .order('created_at', { ascending: true })
    .limit(limit);

  const shopId = String(options?.shopId || '').trim();
  if (shopId) {
    query = query.eq('shop_id', shopId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'No se pudieron consultar payment intents para reconciliar.');
  }

  const intents = (data || []) as PaymentIntentRow[];
  const results: PaymentIntentSyncResult[] = [];

  for (const intent of intents) {
    if (intent.status === 'approved' && intent.processed_at) {
      results.push({
        ok: true,
        ignored: true,
        status: intent.status,
        paymentIntentId: intent.id,
        externalReference: intent.external_reference,
      });
      continue;
    }

    const providerPaymentId = String(intent.provider_payment_id || '').trim();
    const credentials = await getMercadoPagoCredentialsForIntent(intent);
    const payment = providerPaymentId
      ? await getMercadoPagoPayment(providerPaymentId, credentials).catch(() => null)
      : await searchLatestMercadoPagoPaymentByExternalReference(intent.external_reference, credentials).catch(
          () => null,
        );

    if (!payment) {
      results.push({
        ok: true,
        ignored: true,
        status: intent.status,
        paymentIntentId: intent.id,
        externalReference: intent.external_reference,
      });
      continue;
    }

    results.push(await applyMercadoPagoPaymentToIntent(intent, payment));
  }

  return results;
}
