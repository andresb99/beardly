import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isPendingTimeOffReason, stripPendingTimeOffReason } from '@/lib/time-off-requests';

export interface AdminScheduleStaffMember {
  id: string;
  name: string;
}

export interface AdminScheduleAppointment {
  id: string;
  staffId: string;
  staffName: string;
  startAt: string;
  endAt: string | null;
  status: string;
  serviceName: string;
  customerName: string;
}

export interface AdminScheduleTimeOffRecord {
  id: string;
  staffId: string;
  staffName: string;
  startAt: string;
  endAt: string;
  isPending: boolean;
  reason: string | null;
}

export interface AdminScheduleWorkingHour {
  id: string;
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface StaffRow {
  id: string | null;
  name: string | null;
}

interface AppointmentRow {
  id: string | null;
  staff_id: string | null;
  start_at: string | null;
  end_at: string | null;
  status: string | null;
  customer_name_snapshot: string | null;
  customers: { name?: string | null } | null;
  services: { name?: string | null } | null;
}

interface WorkingHourRow {
  id: string | null;
  staff_id: string | null;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
}

interface TimeOffRow {
  id: string | null;
  staff_id: string | null;
  start_at: string | null;
  end_at: string | null;
  reason: string | null;
}

export async function getAdminScheduleOverview(input: {
  shopId: string;
  fromIso: string;
  toIso: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: staffData } = await supabase
    .from('staff')
    .select('id, name')
    .eq('shop_id', input.shopId)
    .eq('is_active', true)
    .order('name');

  const staff = ((staffData || []) as StaffRow[])
    .filter((item) => item.id && item.name)
    .map((item) => ({
      id: String(item.id),
      name: String(item.name).trim() || 'Barbero',
    }));

  const staffIds = staff.map((item) => item.id);

  if (!staffIds.length) {
    return {
      staff,
      appointments: [] as AdminScheduleAppointment[],
      timeOffRecords: [] as AdminScheduleTimeOffRecord[],
      workingHours: [] as AdminScheduleWorkingHour[],
    };
  }

  const staffNameById = new Map(staff.map((item) => [item.id, item.name]));
  const [{ data: appointmentData }, { data: workingHourData }, { data: timeOffData }] =
    await Promise.all([
      supabase
        .from('appointments')
        .select(
          'id, staff_id, start_at, end_at, status, customer_name_snapshot, customers(name), services(name)',
        )
        .eq('shop_id', input.shopId)
        .in('staff_id', staffIds)
        .gte('start_at', input.fromIso)
        .lt('start_at', input.toIso)
        .order('start_at'),
      supabase
        .from('working_hours')
        .select('id, staff_id, day_of_week, start_time, end_time')
        .eq('shop_id', input.shopId)
        .in('staff_id', staffIds)
        .order('day_of_week')
        .order('start_time'),
      supabase
        .from('time_off')
        .select('id, staff_id, start_at, end_at, reason')
        .eq('shop_id', input.shopId)
        .in('staff_id', staffIds)
        .lt('start_at', input.toIso)
        .gt('end_at', input.fromIso)
        .order('start_at'),
    ]);

  const appointments = ((appointmentData || []) as AppointmentRow[])
    .filter((item) => item.id && item.staff_id && item.start_at)
    .map((item) => ({
      id: String(item.id),
      staffId: String(item.staff_id),
      staffName: staffNameById.get(String(item.staff_id)) || 'Barbero',
      startAt: String(item.start_at),
      endAt: item.end_at ? String(item.end_at) : null,
      status: String(item.status || 'pending').trim().toLowerCase() || 'pending',
      serviceName: String(item.services?.name || 'Servicio'),
      customerName: String(item.customer_name_snapshot || item.customers?.name || 'Cliente'),
    }));

  const workingHours = ((workingHourData || []) as WorkingHourRow[])
    .filter((item) => item.id && item.staff_id && item.start_time && item.end_time)
    .map((item) => ({
      id: String(item.id),
      staffId: String(item.staff_id),
      dayOfWeek: Number(item.day_of_week || 0),
      startTime: String(item.start_time),
      endTime: String(item.end_time),
    }));

  const timeOffRecords = ((timeOffData || []) as TimeOffRow[])
    .filter((item) => item.id && item.staff_id && item.start_at && item.end_at)
    .map((item) => ({
      id: String(item.id),
      staffId: String(item.staff_id),
      staffName: staffNameById.get(String(item.staff_id)) || 'Barbero',
      startAt: String(item.start_at),
      endAt: String(item.end_at),
      isPending: isPendingTimeOffReason(item.reason),
      reason: stripPendingTimeOffReason(item.reason),
    }));

  return {
    staff,
    appointments,
    timeOffRecords,
    workingHours,
  };
}
