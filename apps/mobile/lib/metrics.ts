import { calculateBookedMinutes } from '@navaja/shared';
import { env } from './env';
import { supabase } from './supabase';

export type MetricRange = 'today' | 'last7' | 'month';

export interface DashboardMetrics {
  rangeLabel: string;
  countsByStatus: Record<string, number>;
  estimatedRevenueCents: number;
  averageTicketCents: number;
  topServices: Array<{ service: string; count: number }>;
  revenueByStaff: Array<{ staff_id: string; staff: string; revenue_cents: number }>;
  occupancyRatio: number;
}

export interface StaffPerformanceMetric {
  staffId: string;
  staffName: string;
  totalRevenueCents: number;
  completedAppointments: number;
  availableMinutes: number;
  bookedMinutes: number;
  serviceMinutes: number;
  revenuePerAvailableHourCents: number;
  occupancyRatio: number;
  staffCancellations: number;
  customerCancellations: number;
  adminCancellations: number;
  systemCancellations: number;
  totalCancellations: number;
  noShowAppointments: number;
  uniqueCustomers: number;
  repeatCustomers: number;
  repeatClientRate: number;
  reviewCount: number;
  averageRating: number;
  shopAverageRating: number;
  trustedRating: number;
  averageTicketCents: number;
  cancellationRate: number;
  health: 'top' | 'healthy' | 'attention';
  healthLabel: string;
  healthTone: 'success' | 'warning' | 'danger';
}

export interface StaffRatingTrendPoint {
  periodStart: string;
  averageRating: number;
  reviewCount: number;
}

export interface RecentStaffReview {
  id: string;
  rating: number;
  comment: string | null;
  submittedAt: string;
  customerName: string;
}

export interface StaffPerformanceDetail {
  rangeLabel: string;
  metric: StaffPerformanceMetric;
  ratingTrend: StaffRatingTrendPoint[];
  recentReviews: RecentStaffReview[];
  insights: string[];
}

interface AppointmentMetricRow {
  id: string | null;
  status: string | null;
  price_cents: number | null;
  start_at: string | null;
  end_at: string | null;
  cancelled_by: string | null;
  customer_id: string | null;
  service_id?: string | null;
  services?: { name?: string | null } | null;
  staff?: { id?: string | null; name?: string | null } | null;
}

interface ReviewMetricRow {
  id: string | null;
  rating: number | null;
  comment: string | null;
  submitted_at: string | null;
  customers?: { name?: string | null } | null;
}

function parseTimePart(value: string | number | null | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseNumeric(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampRatio(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function calculateTrustedRating(
  averageRating: number,
  reviewCount: number,
  shopAverageRating: number,
  minimumReviewWeight = 5,
) {
  const v = Math.max(0, reviewCount);
  const m = Math.max(1, minimumReviewWeight);
  const r = Math.max(0, averageRating);
  const c = Math.max(0, shopAverageRating);
  return Number((((v / (v + m)) * r + (m / (v + m)) * c).toFixed(2)));
}

function getHealthStatus(metric: {
  occupancyRatio: number;
  trustedRating: number;
  reviewCount: number;
  staffCancellations: number;
  totalCancellations: number;
  completedAppointments: number;
}): Pick<StaffPerformanceMetric, 'health' | 'healthLabel' | 'healthTone'> {
  const trackedAppointments = metric.completedAppointments + metric.totalCancellations;
  const staffCancellationRate =
    trackedAppointments > 0 ? metric.staffCancellations / trackedAppointments : 0;

  if (
    metric.occupancyRatio >= 0.8 &&
    metric.trustedRating >= 4.6 &&
    staffCancellationRate <= 0.04 &&
    metric.completedAppointments >= 3
  ) {
    return {
      health: 'top',
      healthLabel: 'Top',
      healthTone: 'success',
    };
  }

  if (
    metric.occupancyRatio < 0.55 ||
    staffCancellationRate > 0.08 ||
    (metric.reviewCount >= 5 && metric.trustedRating < 4.3)
  ) {
    return {
      health: 'attention',
      healthLabel: 'Atencion',
      healthTone: 'danger',
    };
  }

  return {
    health: 'healthy',
    healthLabel: 'Saludable',
    healthTone: 'warning',
  };
}

function getDateRange(range: MetricRange) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);

  if (range === 'today') {
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end, label: 'Hoy' };
  }

  if (range === 'last7') {
    start.setUTCDate(start.getUTCDate() - 6);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end, label: 'Ultimos 7 dias' };
  }

  start.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(1);
  return { start, end, label: 'Este mes' };
}

function getRangeDates(start: Date, end: Date) {
  const rangeDates: Date[] = [];
  for (let cursor = new Date(start); cursor < end; cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)) {
    rangeDates.push(new Date(cursor));
  }
  return rangeDates;
}

function calculateWorkedMinutes(
  rangeDates: Date[],
  workingHours: Array<{
    day_of_week: number | null;
    start_time: string | null;
    end_time: string | null;
  }>,
) {
  return workingHours.reduce((acc, item) => {
    const [startHourRaw, startMinuteRaw] = String(item.start_time)
      .split(':')
      .slice(0, 2)
      .map(Number);
    const [endHourRaw, endMinuteRaw] = String(item.end_time)
      .split(':')
      .slice(0, 2)
      .map(Number);
    const startHour = parseTimePart(startHourRaw);
    const startMinute = parseTimePart(startMinuteRaw);
    const endHour = parseTimePart(endHourRaw);
    const endMinute = parseTimePart(endMinuteRaw);
    const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
    const matchingDays = rangeDates.filter((date) => date.getUTCDay() === Number(item.day_of_week || 0)).length;
    return acc + Math.max(0, minutes) * matchingDays;
  }, 0);
}

function calculateTimeOffMinutes(
  timeOff: Array<{
    start_at: string | null;
    end_at: string | null;
  }>,
) {
  return timeOff.reduce((acc, item) => {
    const intervalMinutes = Math.round((new Date(String(item.end_at)).getTime() - new Date(String(item.start_at)).getTime()) / 60000);
    return acc + Math.max(0, intervalMinutes);
  }, 0);
}

function toMonthPeriodStart(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-01`;
}

export async function getDashboardMetrics(range: MetricRange): Promise<DashboardMetrics> {
  const { start, end, label } = getDateRange(range);

  const [{ data: appointments }, { data: workingHours }, { data: timeOff }] = await Promise.all([
    supabase
      .from('appointments')
      .select('status, price_cents, start_at, end_at, services(name), staff(id, name)')
      .eq('shop_id', env.EXPO_PUBLIC_SHOP_ID)
      .gte('start_at', start.toISOString())
      .lt('start_at', end.toISOString()),
    supabase
      .from('working_hours')
      .select('staff_id, day_of_week, start_time, end_time')
      .eq('shop_id', env.EXPO_PUBLIC_SHOP_ID),
    supabase
      .from('time_off')
      .select('staff_id, start_at, end_at')
      .eq('shop_id', env.EXPO_PUBLIC_SHOP_ID)
      .lt('start_at', end.toISOString())
      .gt('end_at', start.toISOString()),
  ]);

  const list = appointments || [];
  const countsByStatus = list.reduce<Record<string, number>>((acc, item) => {
    const status = String(item.status || 'desconocido');
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const doneAppointments = list.filter((item) => item.status === 'done');
  const estimatedRevenueCents = doneAppointments.reduce((acc, item) => acc + Number(item.price_cents || 0), 0);
  const averageTicketCents = doneAppointments.length
    ? Math.round(estimatedRevenueCents / doneAppointments.length)
    : 0;

  const serviceCounter = new Map<string, number>();
  for (const row of list) {
    const serviceName = (row.services as { name?: string } | null)?.name || 'Sin servicio';
    serviceCounter.set(serviceName, (serviceCounter.get(serviceName) || 0) + 1);
  }

  const topServices = [...serviceCounter.entries()]
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const revenueByStaffMap = new Map<string, { staff_id: string; staff: string; revenue_cents: number }>();
  for (const row of doneAppointments) {
    const staffId = String((row.staff as { id?: string } | null)?.id || 'unassigned');
    const staffName = String((row.staff as { name?: string } | null)?.name || 'Sin asignar');
    const current = revenueByStaffMap.get(staffId);
    if (!current) {
      revenueByStaffMap.set(staffId, {
        staff_id: staffId,
        staff: staffName,
        revenue_cents: Number(row.price_cents || 0),
      });
      continue;
    }

    revenueByStaffMap.set(staffId, {
      ...current,
      revenue_cents: current.revenue_cents + Number(row.price_cents || 0),
    });
  }

  const revenueByStaff = [...revenueByStaffMap.values()]
    .sort((a, b) => b.revenue_cents - a.revenue_cents);

  const rangeDates = getRangeDates(start, end);
  const workedMinutes = calculateWorkedMinutes(
    rangeDates,
    ((workingHours || []) as Array<{ day_of_week: number | null; start_time: string | null; end_time: string | null }>),
  );
  const timeOffMinutes = calculateTimeOffMinutes(
    ((timeOff || []) as Array<{ start_at: string | null; end_at: string | null }>),
  );

  const availableMinutes = Math.max(0, workedMinutes - timeOffMinutes);
  const bookedMinutes = calculateBookedMinutes(
    list.map((item) => ({
      status: String(item.status),
      start_at: String(item.start_at),
      end_at: String(item.end_at),
    })),
    start.toISOString(),
    end.toISOString(),
  );

  const occupancyRatio = availableMinutes ? bookedMinutes / availableMinutes : 0;

  return {
    rangeLabel: label,
    countsByStatus,
    estimatedRevenueCents,
    averageTicketCents,
    topServices,
    revenueByStaff,
    occupancyRatio,
  };
}

export async function getStaffPerformanceDetail(
  staffId: string,
  range: MetricRange,
): Promise<StaffPerformanceDetail | null> {
  const parsedStaffId = String(staffId || '').trim();
  if (!parsedStaffId) {
    return null;
  }

  const { start, end, label } = getDateRange(range);

  const [
    { data: staffRow },
    { data: appointmentsRows },
    { data: workingHoursRows },
    { data: timeOffRows },
    { data: reviewsRows },
    { data: shopReviewsRows },
  ] = await Promise.all([
    supabase
      .from('staff')
      .select('id, name')
      .eq('shop_id', env.EXPO_PUBLIC_SHOP_ID)
      .eq('id', parsedStaffId)
      .maybeSingle(),
    supabase
      .from('appointments')
      .select('id, status, price_cents, start_at, end_at, cancelled_by, customer_id')
      .eq('shop_id', env.EXPO_PUBLIC_SHOP_ID)
      .eq('staff_id', parsedStaffId)
      .gte('start_at', start.toISOString())
      .lt('start_at', end.toISOString()),
    supabase
      .from('working_hours')
      .select('day_of_week, start_time, end_time')
      .eq('shop_id', env.EXPO_PUBLIC_SHOP_ID)
      .eq('staff_id', parsedStaffId),
    supabase
      .from('time_off')
      .select('start_at, end_at')
      .eq('shop_id', env.EXPO_PUBLIC_SHOP_ID)
      .eq('staff_id', parsedStaffId)
      .lt('start_at', end.toISOString())
      .gt('end_at', start.toISOString()),
    supabase
      .from('appointment_reviews')
      .select('id, rating, comment, submitted_at, customers(name)')
      .eq('shop_id', env.EXPO_PUBLIC_SHOP_ID)
      .eq('staff_id', parsedStaffId)
      .eq('status', 'published')
      .gte('submitted_at', start.toISOString())
      .lt('submitted_at', end.toISOString())
      .order('submitted_at', { ascending: false }),
    supabase
      .from('appointment_reviews')
      .select('rating')
      .eq('shop_id', env.EXPO_PUBLIC_SHOP_ID)
      .eq('status', 'published')
      .gte('submitted_at', start.toISOString())
      .lt('submitted_at', end.toISOString()),
  ]);

  if (!staffRow?.id) {
    return null;
  }

  const appointments = (appointmentsRows || []) as AppointmentMetricRow[];
  const workingHours = (workingHoursRows || []) as Array<{
    day_of_week: number | null;
    start_time: string | null;
    end_time: string | null;
  }>;
  const timeOff = (timeOffRows || []) as Array<{
    start_at: string | null;
    end_at: string | null;
  }>;
  const reviews = (reviewsRows || []) as ReviewMetricRow[];

  const doneAppointments = appointments.filter((item) => item.status === 'done');
  const completedAppointments = doneAppointments.length;
  const totalRevenueCents = doneAppointments.reduce((acc, item) => acc + parseNumeric(item.price_cents), 0);
  const averageTicketCents = completedAppointments > 0 ? Math.round(totalRevenueCents / completedAppointments) : 0;

  const rangeDates = getRangeDates(start, end);
  const workedMinutes = calculateWorkedMinutes(rangeDates, workingHours);
  const timeOffMinutes = calculateTimeOffMinutes(timeOff);
  const availableMinutes = Math.max(0, workedMinutes - timeOffMinutes);

  const bookedMinutes = calculateBookedMinutes(
    appointments.map((item) => ({
      status: String(item.status || ''),
      start_at: String(item.start_at || ''),
      end_at: String(item.end_at || item.start_at || ''),
    })),
    start.toISOString(),
    end.toISOString(),
  );

  const serviceMinutes = doneAppointments.reduce((acc, item) => {
    const startAt = new Date(String(item.start_at || '')).getTime();
    const endAt = new Date(String(item.end_at || item.start_at || '')).getTime();
    if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) {
      return acc;
    }
    return acc + Math.round((endAt - startAt) / 60000);
  }, 0);

  const cancellations = appointments.filter((item) => item.status === 'cancelled');
  const staffCancellations = cancellations.filter((item) => item.cancelled_by === 'staff').length;
  const customerCancellations = cancellations.filter((item) => item.cancelled_by === 'customer').length;
  const adminCancellations = cancellations.filter((item) => item.cancelled_by === 'admin').length;
  const systemCancellations = cancellations.filter((item) => item.cancelled_by === 'system').length;
  const totalCancellations = cancellations.length;
  const noShowAppointments = appointments.filter((item) => item.status === 'no_show').length;

  const customerVisits = new Map<string, number>();
  for (const row of doneAppointments) {
    const customerId = String(row.customer_id || '');
    if (!customerId) {
      continue;
    }
    customerVisits.set(customerId, (customerVisits.get(customerId) || 0) + 1);
  }
  const uniqueCustomers = customerVisits.size;
  const repeatCustomers = [...customerVisits.values()].filter((count) => count > 1).length;
  const repeatClientRate = uniqueCustomers > 0 ? repeatCustomers / uniqueCustomers : 0;

  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? Number((reviews.reduce((acc, item) => acc + parseNumeric(item.rating), 0) / reviewCount).toFixed(2))
      : 0;
  const shopReviewRatings = (shopReviewsRows || []).map((item) => parseNumeric(item.rating as number | null));
  const shopAverageRating =
    shopReviewRatings.length > 0
      ? Number((shopReviewRatings.reduce((acc, value) => acc + value, 0) / shopReviewRatings.length).toFixed(2))
      : averageRating;
  const trustedRating = calculateTrustedRating(averageRating, reviewCount, shopAverageRating);

  const cancellationBase = completedAppointments + totalCancellations;
  const cancellationRate = cancellationBase > 0 ? totalCancellations / cancellationBase : 0;
  const occupancyRatio = availableMinutes > 0 ? bookedMinutes / availableMinutes : 0;
  const revenuePerAvailableHourCents =
    availableMinutes > 0 ? Math.round((totalRevenueCents * 60) / availableMinutes) : 0;

  const baseMetric: StaffPerformanceMetric = {
    staffId: String(staffRow.id),
    staffName: String(staffRow.name || 'Barbero'),
    totalRevenueCents,
    completedAppointments,
    availableMinutes,
    bookedMinutes,
    serviceMinutes,
    revenuePerAvailableHourCents,
    occupancyRatio: clampRatio(occupancyRatio),
    staffCancellations,
    customerCancellations,
    adminCancellations,
    systemCancellations,
    totalCancellations,
    noShowAppointments,
    uniqueCustomers,
    repeatCustomers,
    repeatClientRate: clampRatio(repeatClientRate),
    reviewCount,
    averageRating,
    shopAverageRating,
    trustedRating,
    averageTicketCents,
    cancellationRate: clampRatio(cancellationRate),
    health: 'healthy',
    healthLabel: 'Saludable',
    healthTone: 'warning',
  };

  const metric: StaffPerformanceMetric = {
    ...baseMetric,
    ...getHealthStatus(baseMetric),
  };

  const trendByMonth = new Map<
    string,
    {
      ratingTotal: number;
      reviewCount: number;
    }
  >();
  for (const review of reviews) {
    const submittedAt = String(review.submitted_at || '');
    const periodStart = toMonthPeriodStart(submittedAt);
    if (!periodStart) {
      continue;
    }

    const current = trendByMonth.get(periodStart) || {
      ratingTotal: 0,
      reviewCount: 0,
    };
    current.ratingTotal += parseNumeric(review.rating);
    current.reviewCount += 1;
    trendByMonth.set(periodStart, current);
  }

  const ratingTrend = [...trendByMonth.entries()]
    .map(([periodStart, item]) => ({
      periodStart,
      reviewCount: item.reviewCount,
      averageRating: Number((item.ratingTotal / item.reviewCount).toFixed(2)),
    }))
    .sort((left, right) => (left.periodStart < right.periodStart ? -1 : 1));

  const recentReviews: RecentStaffReview[] = reviews.slice(0, 5).map((review) => ({
    id: String(review.id || ''),
    rating: Math.max(1, Math.min(5, Math.round(parseNumeric(review.rating)))),
    comment: ((review.comment as string | null) || null)?.trim() || null,
    submittedAt: String(review.submitted_at || ''),
    customerName: String((review.customers as { name?: string } | null)?.name || 'Cliente'),
  }));

  const insights: string[] = [];
  if (metric.occupancyRatio < 0.6) {
    insights.push('La ocupacion esta por debajo del nivel esperado para el periodo.');
  }
  if (metric.staffCancellations > 0 && metric.cancellationRate > 0.05) {
    insights.push('Las cancelaciones hechas por el equipo requieren seguimiento.');
  }
  if (metric.completedAppointments >= 8 && metric.reviewCount < 3) {
    insights.push('El volumen atendido es bueno, pero faltan reseñas verificadas.');
  }
  if (metric.repeatClientRate >= 0.45) {
    insights.push('La recompra esta fuerte y sostiene el desempeño del periodo.');
  }
  if (!insights.length) {
    insights.push('El desempeño se mantiene estable en los indicadores clave.');
  }

  return {
    rangeLabel: label,
    metric,
    ratingTrend,
    recentReviews,
    insights,
  };
}
