import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isPendingTimeOffReason, stripPendingTimeOffReason } from '@/lib/time-off-requests';
import { STAFF_WEEKDAYS } from '@/lib/staff-navigation';

export type StaffChipTone = 'default' | 'success' | 'warning' | 'danger';

export interface StaffAppointmentRecord {
  id: string;
  startAt: string;
  endAt: string | null;
  status: string;
  paymentStatus: string | null;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  notes: string | null;
}

export interface StaffTimeOffRecord {
  id: string;
  startAt: string;
  endAt: string;
  createdAt: string | null;
  isPending: boolean;
  reason: string | null;
}

export interface StaffWorkingHourRecord {
  id: string;
  dayOfWeek: number;
  dayLabel: string;
  startTime: string;
  endTime: string;
}

export interface StaffServiceOption {
  id: string;
  name: string;
}

interface AppointmentRow {
  id: string | null;
  start_at: string | null;
  end_at: string | null;
  status: string | null;
  payment_intent_id: string | null;
  customer_name_snapshot: string | null;
  customer_phone_snapshot: string | null;
  services: { name?: string | null } | null;
  customers: { name?: string | null; phone?: string | null } | null;
  notes: string | null;
}

interface PaymentIntentStatusItem {
  id: string | null;
  status: string | null;
}

interface WorkingHourRow {
  id: string | null;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
}

interface TimeOffRow {
  id: string | null;
  start_at: string | null;
  end_at: string | null;
  created_at: string | null;
  reason: string | null;
}

interface ServiceRow {
  id: string | null;
  name: string | null;
}

export const staffAppointmentStatusTone: Record<string, StaffChipTone> = {
  pending: 'warning',
  confirmed: 'default',
  cancelled: 'danger',
  no_show: 'danger',
  done: 'success',
};

export const staffAppointmentStatusLabel: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  no_show: 'No asistio',
  done: 'Realizada',
};

export const staffPaymentStatusTone: Record<string, StaffChipTone> = {
  pending: 'warning',
  processing: 'warning',
  approved: 'success',
  refunded: 'default',
  rejected: 'danger',
  cancelled: 'danger',
  expired: 'danger',
};

export const staffPaymentStatusLabel: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  approved: 'Aprobado',
  refunded: 'Devuelto',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  expired: 'Expirado',
};

export function isTerminalStaffAppointmentStatus(status: string) {
  return status === 'done' || status === 'no_show' || status === 'cancelled';
}

export function formatStaffDateTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('es-UY', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(new Date(value));
}

export function formatStaffDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone,
  }).format(new Date(value));
}

export function formatStaffTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('es-UY', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(new Date(value));
}

export function formatHours(minutes: number) {
  return `${(minutes / 60).toFixed(1)} h`;
}

async function loadPaymentStatusesByIntentId(
  paymentIntentIds: string[],
): Promise<Map<string, string>> {
  if (!paymentIntentIds.length) {
    return new Map<string, string>();
  }

  const supabase = await createSupabaseServerClient();
  const { data: paymentIntents } = await supabase
    .from('payment_intents')
    .select('id, status')
    .in('id', paymentIntentIds);

  const paymentStatusByIntentId = new Map<string, string>();

  (paymentIntents || []).forEach((item) => {
    const row = item as PaymentIntentStatusItem;
    const intentId = String(row.id || '').trim();
    const status = String(row.status || '')
      .trim()
      .toLowerCase();

    if (intentId && status) {
      paymentStatusByIntentId.set(intentId, status);
    }
  });

  return paymentStatusByIntentId;
}

export async function listStaffAppointments(input: {
  shopId: string;
  staffId: string;
  fromIso: string;
  toIso: string;
}): Promise<StaffAppointmentRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('appointments')
    .select(
      'id, start_at, end_at, status, payment_intent_id, customer_name_snapshot, customer_phone_snapshot, services(name), customers(name, phone), notes',
    )
    .eq('shop_id', input.shopId)
    .eq('staff_id', input.staffId)
    .gte('start_at', input.fromIso)
    .lt('start_at', input.toIso)
    .order('start_at');

  const rows = (data || []) as AppointmentRow[];
  const paymentIntentIds = Array.from(
    new Set(rows.map((item) => String(item.payment_intent_id || '').trim()).filter(Boolean)),
  );
  const paymentStatusByIntentId = await loadPaymentStatusesByIntentId(paymentIntentIds);

  return rows
    .filter((item) => item.id && item.start_at)
    .map((item) => ({
      id: String(item.id),
      startAt: String(item.start_at),
      endAt: item.end_at ? String(item.end_at) : null,
      status: String(item.status || 'pending').trim().toLowerCase() || 'pending',
      paymentStatus:
        paymentStatusByIntentId.get(String(item.payment_intent_id || '').trim()) || null,
      serviceName: String(item.services?.name || 'Servicio'),
      customerName: String(
        item.customer_name_snapshot || item.customers?.name || 'Cliente sin nombre',
      ),
      customerPhone: String(
        item.customer_phone_snapshot || item.customers?.phone || 'Sin telefono',
      ),
      notes: item.notes?.trim() || null,
    }));
}

export async function listStaffWorkingHours(input: {
  shopId: string;
  staffId: string;
}): Promise<StaffWorkingHourRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('working_hours')
    .select('id, day_of_week, start_time, end_time')
    .eq('shop_id', input.shopId)
    .eq('staff_id', input.staffId)
    .order('day_of_week')
    .order('start_time');

  return ((data || []) as WorkingHourRow[])
    .filter((item) => item.id && item.start_time && item.end_time)
    .map((item) => {
      const dayOfWeek = Number(item.day_of_week || 0);

      return {
        id: String(item.id),
        dayOfWeek,
        dayLabel: STAFF_WEEKDAYS[dayOfWeek] || 'Dia',
        startTime: String(item.start_time),
        endTime: String(item.end_time),
      };
    });
}

export async function listStaffTimeOffRecords(input: {
  shopId: string;
  staffId: string;
  limit?: number;
  fromIso?: string;
  toIso?: string;
}): Promise<StaffTimeOffRecord[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('time_off')
    .select('id, start_at, end_at, created_at, reason')
    .eq('shop_id', input.shopId)
    .eq('staff_id', input.staffId)
    .order('start_at', { ascending: false });

  if (input.fromIso) {
    query = query.gt('end_at', input.fromIso);
  }

  if (input.toIso) {
    query = query.lt('start_at', input.toIso);
  }

  if (!input.fromIso && !input.toIso) {
    query = query.limit(input.limit || 20);
  }

  const { data } = await query;

  return ((data || []) as TimeOffRow[])
    .filter((item) => item.id && item.start_at && item.end_at)
    .map((item) => ({
      id: String(item.id),
      startAt: String(item.start_at),
      endAt: String(item.end_at),
      createdAt: item.created_at ? String(item.created_at) : null,
      isPending: isPendingTimeOffReason(item.reason),
      reason: stripPendingTimeOffReason(item.reason),
    }));
}

export async function listStaffServiceOptions(shopId: string): Promise<StaffServiceOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('services')
    .select('id, name')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('name');

  return ((data || []) as ServiceRow[])
    .filter((item) => item.id && item.name)
    .map((item) => ({
      id: String(item.id),
      name: String(item.name),
    }));
}

export function splitTimeOffRecords(records: StaffTimeOffRecord[]) {
  return {
    pending: records.filter((record) => record.isPending),
    approved: records.filter((record) => !record.isPending),
  };
}
