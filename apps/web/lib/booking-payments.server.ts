import 'server-only';

import { bookingInputSchema } from '@navaja/shared';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

function normalizeEmail(value: string | null | undefined) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return normalized || null;
}

export interface BookingIntentPayload {
  shop_id: string;
  service_id: string;
  staff_id: string;
  start_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  notes: string | null;
}

export interface CreatedAppointmentResult {
  appointmentId: string;
  startAt: string;
}

export async function createAppointmentFromBookingIntent(
  payload: BookingIntentPayload,
  options?: { paymentIntentId?: string | null },
): Promise<CreatedAppointmentResult> {
  const parsed = bookingInputSchema.safeParse({
    ...payload,
    staff_id: payload.staff_id,
  });

  if (!parsed.success || !parsed.data.staff_id) {
    throw new Error('Payload de reserva invalido para generar la cita.');
  }

  const normalizedPaymentIntentId = String(options?.paymentIntentId || '').trim() || null;
  const supabase = createSupabaseAdminClient();

  if (normalizedPaymentIntentId) {
    const { data: existingAppointment } = await supabase
      .from('appointments')
      .select('id, start_at')
      .eq('payment_intent_id', normalizedPaymentIntentId)
      .maybeSingle();

    if (existingAppointment?.id) {
      return {
        appointmentId: String(existingAppointment.id),
        startAt: String(existingAppointment.start_at),
      };
    }
  }

  const resolvedCustomerEmail = normalizeEmail(payload.customer_email);

  const [{ data: shop }, { data: service }, { data: staffMember }] = await Promise.all([
    supabase
      .from('shops')
      .select('id, status')
      .eq('id', payload.shop_id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('services')
      .select('id')
      .eq('id', payload.service_id)
      .eq('shop_id', payload.shop_id)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('staff')
      .select('id')
      .eq('id', payload.staff_id)
      .eq('shop_id', payload.shop_id)
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  if (!shop) {
    throw new Error('La barbershop seleccionada no esta disponible.');
  }

  if (!service) {
    throw new Error('El servicio seleccionado no esta disponible.');
  }

  if (!staffMember) {
    throw new Error('El barbero seleccionado no esta disponible.');
  }

  const { data: existingCustomer, error: existingCustomerError } = await supabase
    .from('customers')
    .select('id')
    .eq('shop_id', payload.shop_id)
    .eq('phone', payload.customer_phone)
    .maybeSingle();

  if (existingCustomerError) {
    throw new Error(existingCustomerError.message || 'No se pudo validar el cliente.');
  }

  let customerId = existingCustomer?.id as string | undefined;

  if (customerId) {
    const customerUpdatePayload: {
      name: string;
      email?: string | null;
    } = {
      name: payload.customer_name,
    };

    if (resolvedCustomerEmail) {
      customerUpdatePayload.email = resolvedCustomerEmail;
    }

    const { error: customerUpdateError } = await supabase
      .from('customers')
      .update(customerUpdatePayload)
      .eq('id', customerId)
      .eq('shop_id', payload.shop_id);

    if (customerUpdateError) {
      throw new Error(customerUpdateError.message || 'No se pudo actualizar el cliente.');
    }
  } else {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        shop_id: payload.shop_id,
        name: payload.customer_name,
        phone: payload.customer_phone,
        email: resolvedCustomerEmail,
      })
      .select('id')
      .single();

    if (customerError || !customer) {
      throw new Error(customerError?.message || 'No se pudo crear el cliente.');
    }

    customerId = customer.id as string;
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      shop_id: payload.shop_id,
      staff_id: payload.staff_id,
      customer_id: customerId,
      service_id: payload.service_id,
      start_at: payload.start_at,
      status: 'pending',
      notes: payload.notes || null,
      payment_intent_id: normalizedPaymentIntentId,
    })
    .select('id, start_at')
    .single();

  if (appointmentError || !appointment) {
    throw new Error(appointmentError?.message || 'No se pudo crear la cita.');
  }

  return {
    appointmentId: String(appointment.id),
    startAt: String(appointment.start_at),
  };
}

