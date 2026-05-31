import { formatCurrency } from '@navaja/shared';
import { SparkKpiCard } from '@/components/admin/spark-kpi-card';
import { Button } from '@heroui/button';
import { Bell, Plus } from 'lucide-react';
import { AdminHomeSchedule } from '@/components/admin/admin-home-schedule';
import { AdminNotificationsDigest } from '@/components/admin/admin-notifications-digest';
import { getAdminScheduleOverview } from '@/lib/admin-schedule';
import { getAdminNotificationsData } from '@/lib/admin-notifications';
import { requireAdmin } from '@/lib/auth';
import {
  deriveCalendarHours,
  resolveAppointmentEnd,
  toCalendarEventStatus,
} from '@/lib/calendar-schedule';
import { getDashboardMetrics } from '@/lib/metrics';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface AdminHomePageProps {
  searchParams: Promise<{ shop?: string }>;
}

function startOfMonth(date: Date) {
  const normalized = new Date(date);
  normalized.setDate(1);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const params = await searchParams;
  const ctx = await requireAdmin({ shopSlug: params.shop });
  const scheduleStart = new Date();
  const scheduleRangeStart = startOfMonth(addMonths(scheduleStart, -1));
  const scheduleRangeEndExclusive = startOfMonth(addMonths(scheduleStart, 2));
  const [metrics, notifications, scheduleOverview] = await Promise.all([
    getDashboardMetrics('today', ctx.shopId),
    getAdminNotificationsData(ctx.shopId),
    getAdminScheduleOverview({
      shopId: ctx.shopId,
      fromIso: scheduleRangeStart.toISOString(),
      toIso: scheduleRangeEndExclusive.toISOString(),
    }),
  ]);
  const supabase = await createSupabaseServerClient();
  const [servicesResult] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, duration_minutes, price_cents')
      .eq('shop_id', ctx.shopId)
      .eq('is_active', true)
      .order('name'),
  ]);

  const activeAppointments =
    metrics.statusSummary.pendingAppointments + metrics.statusSummary.confirmedAppointments;
  const urgentItemsCount = notifications.totalCount;
  const currentStaffName = scheduleOverview.staff.find(s => s.id === ctx.staffId)?.name || 'Admin';
  const ownerCalendarEvents = [
    ...scheduleOverview.appointments.map((appointment) => ({
      id: `appointment:${appointment.id}`,
      title: appointment.serviceName,
      clientName: appointment.customerName,
      resourceId: appointment.staffId,
      resourceName: appointment.staffName,
      start: new Date(appointment.startAt),
      end: resolveAppointmentEnd(appointment.startAt, appointment.endAt),
      status: toCalendarEventStatus(appointment.status),
      tone: toCalendarEventStatus(appointment.status),
    })),
    ...scheduleOverview.timeOffRecords.map((record) => ({
      id: `time-off:${record.id}`,
      title: record.reason || 'Bloque no disponible',
      clientName: record.isPending ? 'Ausencia pendiente' : 'Ausencia aprobada',
      resourceId: record.staffId,
      resourceName: record.staffName,
      start: new Date(record.startAt),
      end: new Date(record.endAt),
      tone: record.isPending ? ('pending' as const) : ('absence' as const),
      statusLabel: record.isPending ? 'Pendiente' : 'Ausencia',
    })),
  ];
  const ownerCalendarHours = deriveCalendarHours({
    workingHours: scheduleOverview.workingHours.map((item) => ({
      startTime: item.startTime,
      endTime: item.endTime,
    })),
    appointments: scheduleOverview.appointments.map((item) => ({
      startAt: item.startAt,
      endAt: item.endAt,
    })),
    timeOffRecords: scheduleOverview.timeOffRecords.map((item) => ({
      startAt: item.startAt,
      endAt: item.endAt,
    })),
  });

  return (
    <section className="flex flex-col gap-8 pb-10">
      <header className="flex flex-col justify-between border-b border-white/5 pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">PANEL</p>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-medium text-slate-100">
            Buen día, {currentStaffName}.
          </h1>
          <p className="mt-2 text-[13px] text-slate-400">
            Hoy tenés <strong className="text-slate-200">{activeAppointments} turnos confirmados</strong> y <strong className="text-slate-200">{urgentItemsCount} pendientes</strong>.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 md:mt-0">
          <Button
            radius="full"
            variant="flat"
            className="h-10 bg-white/[0.04] px-4 text-xs font-semibold text-slate-300 border border-white/10"
          >
            <Bell className="mr-1.5 h-3.5 w-3.5 opacity-70" />
            Inbox - {urgentItemsCount}
          </Button>
          <Button
            radius="full"
            className="h-10 bg-[#e0d4ff] px-4 text-xs font-bold text-[#1a1130] hover:bg-[#d0bcff]"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Nuevo turno
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SparkKpiCard
          label="RESERVAS HOY"
          value={activeAppointments.toString()}
          badge="+12%"
          sparkPoints="M 0 30 Q 15 28, 30 25 T 60 20 T 100 15"
        />
        <SparkKpiCard
          label="INGRESOS"
          value={formatCurrency(metrics.estimatedRevenueCents)}
          badge="+8%"
          sparkPoints="M 0 30 Q 20 28, 40 22 T 70 15 T 100 5"
        />
        <SparkKpiCard
          label="OCUPACIÓN"
          value="86%"
          badge="+4%"
          sparkPoints="M 0 25 Q 25 25, 45 20 T 75 18 T 100 10"
        />
        <SparkKpiCard
          label="NPS"
          value="72"
          badge="-2"
          badgeTone="danger"
          sparkPoints="M 0 10 Q 15 10, 30 15 T 60 20 T 100 25"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="h-full rounded-[1.25rem] border border-white/5 bg-[#0f0e13] overflow-hidden">
            
    <AdminHomeSchedule
      staff={scheduleOverview.staff}
      services={(servicesResult.data || []).map(s => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.duration_minutes,
        priceCents: s.price_cents
      }))}
      events={ownerCalendarEvents}
      startHour={ownerCalendarHours.startHour}
      endHour={ownerCalendarHours.endHour}
      initialDate={scheduleStart}
      availableRangeStart={scheduleRangeStart}
      availableRangeEndExclusive={scheduleRangeEndExclusive}
    />
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-4">
          <div className="rounded-[1.25rem] border border-white/5 bg-[#141218] p-5 lg:p-6">
            <h3 className="text-base font-semibold text-white">Inbox</h3>
            <p className="mt-1 mb-5 text-xs text-slate-400">Mensajes y avisos</p>
            <AdminNotificationsDigest
              shopSlug={ctx.shopSlug}
              totalCount={notifications.totalCount}
              pendingTimeOffCount={notifications.pendingTimeOffCount}
              pendingMembershipCount={notifications.pendingMembershipCount}
              stalePendingIntents={notifications.stalePendingIntents}
              isCompact
            />
          </div>
          
          <div className="rounded-[1.25rem] border border-white/5 bg-[#141218] p-5 lg:p-6 flex-1">
             <h3 className="mb-1 text-base font-semibold text-white">Top barberos</h3>
             <p className="mb-6 text-xs text-slate-400">Semana</p>

             <div className="space-y-6">
               {(scheduleOverview.staff.slice(0, 3)).map((staff, idx) => {
                  const revenues = ['UYU 38K', 'UYU 31K', 'UYU 24K'];
                  const widths = ['w-[90%]', 'w-[75%]', 'w-[60%]'];
                  return (
                    <div key={staff.id} className="flex flex-col gap-2">
                       <div className="flex items-center justify-between text-xs font-semibold text-white">
                         <span>{staff.name}</span>
                         <span className="text-slate-400">{revenues[idx] || 'UYU 15K'}</span>
                       </div>
                       <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                          <div className={`h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full ${widths[idx] || 'w-1/2'}`}></div>
                       </div>
                    </div>
                  )
               })}
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
