import NextLink from 'next/link';
import { formatCurrency } from '@navaja/shared';
import { Card, CardBody } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Calendar, type CalendarEvent } from '@/components/calendar/calendar';
import { requireStaff } from '@/lib/auth';
import {
  deriveCalendarHours,
  resolveAppointmentEnd,
  toCalendarEventStatus,
} from '@/lib/calendar-schedule';
import { getStaffPerformanceDetail } from '@/lib/metrics';
import {
  formatHours,
  listStaffAppointments,
  listStaffTimeOffRecords,
  listStaffWorkingHours,
  splitTimeOffRecords,
} from '@/lib/staff-portal';
import { buildStaffHref } from '@/lib/workspace-routes';

interface StaffPageProps {
  searchParams: Promise<{ shop?: string }>;
}

function overlapsRange(startAt: string, endAt: string, rangeStart: Date, rangeEnd: Date) {
  const start = new Date(startAt);
  const end = new Date(endAt);

  return end.getTime() > rangeStart.getTime() && start.getTime() < rangeEnd.getTime();
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

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const params = await searchParams;
  const ctx = await requireStaff({ shopSlug: params.shop });

  const start = new Date();
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  const calendarRangeStart = startOfMonth(addMonths(start, -1));
  const calendarRangeEndExclusive = startOfMonth(addMonths(start, 2));

  const [
    appointments,
    timeOffRecords,
    calendarAppointments,
    calendarTimeOffRecords,
    workingHours,
    performance,
  ] = await Promise.all([
    listStaffAppointments({
      shopId: ctx.shopId,
      staffId: ctx.staffId,
      fromIso: start.toISOString(),
      toIso: end.toISOString(),
    }),
    listStaffTimeOffRecords({
      shopId: ctx.shopId,
      staffId: ctx.staffId,
      limit: 12,
    }),
    listStaffAppointments({
      shopId: ctx.shopId,
      staffId: ctx.staffId,
      fromIso: calendarRangeStart.toISOString(),
      toIso: calendarRangeEndExclusive.toISOString(),
    }),
    listStaffTimeOffRecords({
      shopId: ctx.shopId,
      staffId: ctx.staffId,
      fromIso: calendarRangeStart.toISOString(),
      toIso: calendarRangeEndExclusive.toISOString(),
    }),
    listStaffWorkingHours({
      shopId: ctx.shopId,
      staffId: ctx.staffId,
    }),
    getStaffPerformanceDetail(
      ctx.staffId,
      {
        range: 'last7',
      },
      ctx.shopId,
    ).catch(() => null),
  ]);

  const visibleTimeOffRecords = calendarTimeOffRecords.filter((record) =>
    overlapsRange(record.startAt, record.endAt, calendarRangeStart, calendarRangeEndExclusive),
  );
  const timeOff = splitTimeOffRecords(timeOffRecords);
  const nextAppointments = appointments.slice(0, 4);
  const calendarEvents: CalendarEvent[] = [
    ...calendarAppointments.map((appointment) => ({
      id: `appointment:${appointment.id}`,
      title: appointment.serviceName,
      clientName: appointment.customerName,
      start: new Date(appointment.startAt),
      end: resolveAppointmentEnd(appointment.startAt, appointment.endAt),
      status: toCalendarEventStatus(appointment.status),
      tone: toCalendarEventStatus(appointment.status),
    })),
    ...visibleTimeOffRecords.map((record) => ({
      id: `time-off:${record.id}`,
      title: record.reason || 'Bloque no disponible',
      clientName: record.isPending ? 'Ausencia pendiente' : 'Ausencia aprobada',
      start: new Date(record.startAt),
      end: new Date(record.endAt),
      tone: record.isPending ? ('pending' as const) : ('absence' as const),
      statusLabel: record.isPending ? 'Pendiente' : 'Ausencia',
    })),
  ];
  const calendarHours = deriveCalendarHours({
    workingHours,
    appointments: calendarAppointments,
    timeOffRecords: visibleTimeOffRecords,
  });

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="data-card rounded-[1.7rem] border-0 shadow-none">
          <CardBody className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
              Proximas citas
            </h2>
            <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
              {appointments.length}
            </p>
            <p className="mt-1 text-xs text-slate/70 dark:text-slate-400">
              Agenda propia de los proximos 7 dias.
            </p>
          </CardBody>
        </Card>

        <Card className="data-card rounded-[1.7rem] border-0 shadow-none">
          <CardBody className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
              Ausencias pendientes
            </h2>
            <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
              {timeOff.pending.length}
            </p>
            <p className="mt-1 text-xs text-slate/70 dark:text-slate-400">
              Solicitudes esperando respuesta del admin.
            </p>
          </CardBody>
        </Card>

        <Card className="data-card rounded-[1.7rem] border-0 shadow-none">
          <CardBody className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
              Resena promedio
            </h2>
            <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
              {performance ? performance.metric.trustedRating.toFixed(1) : '0.0'}
            </p>
            <p className="mt-1 text-xs text-slate/70 dark:text-slate-400">
              Valoracion consolidada de tu desempeno.
            </p>
          </CardBody>
        </Card>

        <Card className="data-card rounded-[1.7rem] border-0 shadow-none">
          <CardBody className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
              Facturacion 7d
            </h2>
            <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
              {performance ? formatCurrency(performance.metric.totalRevenueCents) : '$ 0'}
            </p>
            <p className="mt-1 text-xs text-slate/70 dark:text-slate-400">
              Solo tu produccion individual.
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="soft-panel rounded-[1.9rem] border-0 shadow-none">
          <CardBody className="space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
                  Acciones rapidas
                </h2>
                <p className="text-sm text-slate/80 dark:text-slate-300">
                  Entradas pensadas para resolver tu operativa diaria sin salir del flujo staff.
                </p>
              </div>
              {performance ? (
                <Chip
                  size="sm"
                  radius="full"
                  variant="flat"
                  className="border border-violet-400/18 bg-violet-500/[0.12] text-violet-100"
                >
                  {performance.metric.healthLabel}
                </Chip>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <NextLink
                href={buildStaffHref('/staff/citas', ctx.shopSlug)}
                className="data-card rounded-[1.5rem] p-4 no-underline transition-transform duration-150 hover:-translate-y-0.5"
              >
                <p className="text-sm font-semibold text-ink dark:text-slate-100">Mis citas</p>
                <p className="mt-2 text-xs leading-5 text-slate/70 dark:text-slate-400">
                  Ver agenda, registrar walk-ins y cerrar estados.
                </p>
              </NextLink>
              <NextLink
                href={buildStaffHref('/staff/metricas', ctx.shopSlug)}
                className="data-card rounded-[1.5rem] p-4 no-underline transition-transform duration-150 hover:-translate-y-0.5"
              >
                <p className="text-sm font-semibold text-ink dark:text-slate-100">Mis metricas</p>
                <p className="mt-2 text-xs leading-5 text-slate/70 dark:text-slate-400">
                  Facturacion, ocupacion, ticket y resenas propias.
                </p>
              </NextLink>
              <NextLink
                href={buildStaffHref('/staff/ausencias', ctx.shopSlug)}
                className="data-card rounded-[1.5rem] p-4 no-underline transition-transform duration-150 hover:-translate-y-0.5"
              >
                <p className="text-sm font-semibold text-ink dark:text-slate-100">Mis ausencias</p>
                <p className="mt-2 text-xs leading-5 text-slate/70 dark:text-slate-400">
                  Pedidos pendientes, historial y horario propio.
                </p>
              </NextLink>
            </div>

            {performance ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="data-card rounded-2xl p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                    Realizadas
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                    {performance.metric.completedAppointments}
                  </p>
                </div>
                <div className="data-card rounded-2xl p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                    Ocupacion
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                    {Math.round(performance.metric.occupancyRatio * 100)}%
                  </p>
                </div>
                <div className="data-card rounded-2xl p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                    Horas reservadas
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                    {formatHours(performance.metric.bookedMinutes)}
                  </p>
                </div>
                <div className="data-card rounded-2xl p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                    Ticket promedio
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                    {formatCurrency(performance.metric.averageTicketCents)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-[1.4rem] border border-white/50 bg-white/45 px-4 py-3 text-sm text-slate/75 dark:border-violet-400/10 dark:bg-violet-500/[0.06] dark:text-slate-300">
                Todavia no hay suficientes datos para armar un resumen confiable de tu desempeno.
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="soft-panel rounded-[1.9rem] border-0 shadow-none">
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
                Mi horario fijo
              </h2>
              <p className="text-sm text-slate/80 dark:text-slate-300">
                Referencia rapida de tus bloques habituales. No expone horarios del resto del equipo.
              </p>
            </div>

            {workingHours.length === 0 ? (
              <p className="text-sm text-slate/70 dark:text-slate-400">
                Todavia no hay horarios cargados para tu perfil.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {workingHours.map((entry) => (
                  <span
                    key={entry.id}
                    className="rounded-full border border-white/55 bg-white/45 px-3 py-1.5 text-[11px] font-semibold text-slate/80 dark:border-violet-400/10 dark:bg-violet-500/[0.06] dark:text-slate-300"
                  >
                    {entry.dayLabel.slice(0, 3)} {entry.startTime}-{entry.endTime}
                  </span>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Calendar
          events={calendarEvents}
          startHour={calendarHours.startHour}
          endHour={calendarHours.endHour}
          initialDate={start}
          locale="es-UY"
          title="Agenda visual de la semana"
          description="Reservas, huecos y ausencias en un solo plano para arrancar el dia con lectura operativa real."
          availableRangeStart={calendarRangeStart}
          availableRangeEndExclusive={calendarRangeEndExclusive}
        />

        <Card className="soft-panel rounded-[1.9rem] border-0 shadow-none">
          <CardBody className="space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
                  Lectura rapida
                </h2>
                <p className="text-sm text-slate/80 dark:text-slate-300">
                  Resumen corto de lo proximo y de los bloqueos que impactan tu semana.
                </p>
              </div>
              <span className="meta-chip">Dia, semana y mes</span>
            </div>

            <div className="grid gap-3">
              <div className="data-card rounded-[1.5rem] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                      Proximas citas
                    </p>
                    <p className="mt-2 text-base font-semibold text-ink dark:text-slate-100">
                      {nextAppointments.length}
                    </p>
                  </div>
                  <NextLink
                    href={buildStaffHref('/staff/citas', ctx.shopSlug)}
                    className="text-sm font-semibold text-[hsl(var(--primary))] no-underline dark:text-violet-200 dark:hover:text-violet-100"
                  >
                    Abrir agenda
                  </NextLink>
                </div>

                {nextAppointments.length === 0 ? (
                  <p className="mt-3 text-sm text-slate/75 dark:text-slate-400">
                    No tienes citas programadas para los proximos dias.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {nextAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="rounded-[1.1rem] border border-white/60 bg-white/55 px-3 py-3 dark:border-violet-400/10 dark:bg-violet-500/[0.06]"
                      >
                        <p className="text-sm font-semibold text-ink dark:text-slate-100">
                          {new Intl.DateTimeFormat('es-UY', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: ctx.shopTimezone,
                          }).format(new Date(appointment.startAt))}
                        </p>
                        <p className="mt-1 text-sm text-slate/80 dark:text-slate-300">
                          {appointment.serviceName} - {appointment.customerName}
                        </p>
                        <p className="mt-1 text-xs text-slate/70 dark:text-slate-400">
                          {appointment.customerPhone}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="data-card rounded-[1.5rem] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                      Solicitudes pendientes
                    </p>
                    <p className="mt-2 text-base font-semibold text-ink dark:text-slate-100">
                      {timeOff.pending.length} en revision
                    </p>
                  </div>
                  <NextLink
                    href={buildStaffHref('/staff/ausencias', ctx.shopSlug)}
                    className="text-sm font-semibold text-[hsl(var(--primary))] no-underline dark:text-violet-200 dark:hover:text-violet-100"
                  >
                    Ver ausencias
                  </NextLink>
                </div>
              </div>

              <div className="data-card rounded-[1.5rem] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                  Ausencias aprobadas
                </p>
                <p className="mt-2 text-base font-semibold text-ink dark:text-slate-100">
                  {timeOff.approved.length} registradas
                </p>
                <p className="mt-2 text-sm text-slate/75 dark:text-slate-400">
                  Tambien se pintan dentro de la agenda semanal para leer huecos reales.
                </p>
              </div>

              {performance ? (
                <div className="data-card rounded-[1.5rem] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                    Insight principal
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate/80 dark:text-slate-300">
                    {performance.insights[0]}
                  </p>
                </div>
              ) : null}
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
