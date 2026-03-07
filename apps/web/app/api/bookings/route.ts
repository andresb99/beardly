import { NextResponse, type NextRequest } from 'next/server';
import { bookingInputSchema } from '@navaja/shared';
import { createAppointmentFromBookingIntent } from '@/lib/booking-payments.server';
import { resolveShopTierForUser } from '@/lib/billing.server';
import { env } from '@/lib/env';
import { getMercadoPagoServerEnv } from '@/lib/env.server';
import { createMercadoPagoCheckoutPreference } from '@/lib/mercado-pago.server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function normalizeEmail(value: string | null | undefined) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return normalized || null;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = bookingInputSchema.safeParse(body);

  if (!parsed.success) {
    return new NextResponse(parsed.error.flatten().formErrors.join(', ') || 'Datos de reserva invalidos.', {
      status: 400,
    });
  }

  if (!parsed.data.staff_id) {
    return new NextResponse('Selecciona un horario valido con barbero asignado.', { status: 400 });
  }

  const sessionSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionSupabase.auth.getUser();

  const resolvedCustomerEmail =
    normalizeEmail(parsed.data.customer_email) ?? normalizeEmail(user?.email) ?? null;

  const supabase = createSupabaseAdminClient();

  const [{ data: shop }, { data: service }, { data: staffMember }] = await Promise.all([
    supabase
      .from('shops')
      .select('id, status')
      .eq('id', parsed.data.shop_id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('services')
      .select('id, name, price_cents')
      .eq('id', parsed.data.service_id)
      .eq('shop_id', parsed.data.shop_id)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('staff')
      .select('id, name')
      .eq('id', parsed.data.staff_id)
      .eq('shop_id', parsed.data.shop_id)
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  if (!shop) {
    return new NextResponse('La barbershop seleccionada no esta disponible.', { status: 400 });
  }

  if (!service) {
    return new NextResponse('El servicio seleccionado no esta disponible.', { status: 400 });
  }

  if (!staffMember) {
    return new NextResponse('El barbero seleccionado no esta disponible.', { status: 400 });
  }

  const tierResolution = await resolveShopTierForUser(parsed.data.shop_id, user?.id ?? null);

  if (tierResolution.requiresReservationPayment) {
    if (!resolvedCustomerEmail) {
      return new NextResponse('Para completar el pago necesitas ingresar un email valido.', {
        status: 400,
      });
    }

    const externalReference = [
      'booking',
      parsed.data.shop_id.slice(0, 8),
      Date.now().toString(36),
      Math.random().toString(36).slice(2, 10),
    ].join('-');
    const serviceName = String((service as { name?: string } | null)?.name || 'Servicio');
    const staffName = String((staffMember as { name?: string } | null)?.name || 'Barbero');
    const amountCents = Number((service as { price_cents?: number } | null)?.price_cents || 0);

    const paymentPayload = {
      shop_id: parsed.data.shop_id,
      service_id: parsed.data.service_id,
      staff_id: parsed.data.staff_id,
      start_at: parsed.data.start_at,
      customer_name: parsed.data.customer_name,
      customer_phone: parsed.data.customer_phone,
      customer_email: resolvedCustomerEmail,
      notes: parsed.data.notes || null,
      service_name: serviceName,
      staff_name: staffName,
    };

    const { data: paymentIntent, error: paymentIntentError } = await supabase
      .from('payment_intents')
      .insert({
        shop_id: parsed.data.shop_id,
        intent_type: 'booking',
        status: 'pending',
        provider: 'mercado_pago',
        external_reference: externalReference,
        amount_cents: amountCents,
        currency_code: 'UYU',
        payer_email: resolvedCustomerEmail,
        payload: paymentPayload,
        created_by_user_id: user?.id || null,
      })
      .select('id')
      .single();

    if (paymentIntentError || !paymentIntent) {
      return new NextResponse(paymentIntentError?.message || 'No se pudo iniciar el pago.', {
        status: 400,
      });
    }

    const bookingStateParams = new URLSearchParams({
      payment_intent: String(paymentIntent.id),
      service: serviceName,
      staff: staffName,
      start: parsed.data.start_at,
    });

    try {
      const mercadoPagoEnv = getMercadoPagoServerEnv();
      const webhookToken = mercadoPagoEnv.MERCADO_PAGO_WEBHOOK_TOKEN?.trim() || null;
      const webhookUrl = webhookToken
        ? `${env.NEXT_PUBLIC_APP_URL}/api/payments/mercadopago/webhook?token=${encodeURIComponent(webhookToken)}`
        : `${env.NEXT_PUBLIC_APP_URL}/api/payments/mercadopago/webhook`;

      const checkout = await createMercadoPagoCheckoutPreference({
        item: {
          id: parsed.data.service_id,
          title: `Reserva - ${serviceName}`,
          description: `Reserva en barbershop ${parsed.data.shop_id.slice(0, 8)}`,
          amountCents,
        },
        payerEmail: resolvedCustomerEmail,
        externalReference,
        successUrl: `${env.NEXT_PUBLIC_APP_URL}/book/success?${bookingStateParams.toString()}&payment_status=approved`,
        pendingUrl: `${env.NEXT_PUBLIC_APP_URL}/book/success?${bookingStateParams.toString()}&payment_status=pending`,
        failureUrl: `${env.NEXT_PUBLIC_APP_URL}/book/success?${bookingStateParams.toString()}&payment_status=failure`,
        notificationUrl: webhookUrl,
        metadata: {
          intent_id: String(paymentIntent.id),
          intent_type: 'booking',
        },
      });

      await supabase
        .from('payment_intents')
        .update({
          provider_preference_id: checkout.preferenceId,
          checkout_url: checkout.checkoutUrl,
        })
        .eq('id', paymentIntent.id);

      return NextResponse.json({
        requires_payment: true,
        payment_intent_id: paymentIntent.id,
        checkout_url: checkout.checkoutUrl,
      });
    } catch (checkoutError) {
      await supabase
        .from('payment_intents')
        .update({
          status: 'rejected',
          failure_reason:
            checkoutError instanceof Error ? checkoutError.message : 'No se pudo crear el checkout.',
        })
        .eq('id', paymentIntent.id);

      return new NextResponse(
        checkoutError instanceof Error ? checkoutError.message : 'No se pudo iniciar el pago.',
        { status: 400 },
      );
    }
  }

  try {
    const appointment = await createAppointmentFromBookingIntent({
      shop_id: parsed.data.shop_id,
      service_id: parsed.data.service_id,
      staff_id: parsed.data.staff_id,
      start_at: parsed.data.start_at,
      customer_name: parsed.data.customer_name,
      customer_phone: parsed.data.customer_phone,
      customer_email: resolvedCustomerEmail,
      notes: parsed.data.notes || null,
    });

    return NextResponse.json({
      appointment_id: appointment.appointmentId,
      start_at: appointment.startAt,
      requires_payment: false,
    });
  } catch (createError) {
    return new NextResponse(
      createError instanceof Error ? createError.message : 'No se pudo crear la cita.',
      { status: 400 },
    );
  }
}

