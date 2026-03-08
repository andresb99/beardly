import Link from 'next/link';
import { formatCurrency } from '@navaja/shared';
import { Card, CardBody } from '@heroui/card';
import { HealthChip } from '@/components/admin/health-chip';
import { KpiCard } from '@/components/admin/kpi-card';
import { MetricsApexOverview } from '@/components/admin/metrics-apex-overview';
import { StaffPerformanceVisuals } from '@/components/admin/staff-performance-visuals';
import { StaffComparisonTable } from '@/components/admin/staff-comparison-table';
import { StaffPerformanceFilters } from '@/components/admin/staff-performance-filters';
import { requireAdmin } from '@/lib/auth';
import {
  getDashboardMetricsForDateRange,
  getStaffPerformanceDashboard,
  resolveBookingChannelView,
  type BookingMetricsChannelView,
} from '@/lib/metrics';
import { buildAdminHref } from '@/lib/workspace-routes';

interface MetricsPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    channel?: string;
    compare?: string | string[];
    shop?: string;
  }>;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatHours(minutes: number) {
  return `${(minutes / 60).toFixed(1)} h`;
}

function buildDetailHref(staffId: string, shopSlug: string, from: string, to: string) {
  return buildAdminHref(`/admin/performance/${staffId}`, shopSlug, {
    from,
    to,
  });
}

function getChannelViewLabel(channelView: BookingMetricsChannelView) {
  if (channelView === 'ONLINE_ONLY') {
    return 'Solo online';
  }

  if (channelView === 'WALK_INS_ONLY') {
    return 'Solo presenciales';
  }

  return 'Todos los canales';
}

export default async function MetricsPage({ searchParams }: MetricsPageProps) {
  const params = await searchParams;
  const ctx = await requireAdmin({ shopSlug: params.shop });
  const selectedChannel = resolveBookingChannelView(params.channel);
  const [dashboard, channelMetrics] = await Promise.all([
    getStaffPerformanceDashboard(params, ctx.shopId, ctx.shopSlug),
    getDashboardMetricsForDateRange(
      {
        range: params.range,
        from: params.from,
        to: params.to,
      },
      ctx.shopId,
      selectedChannel,
    ),
  ]);
  const highlightedStaff = dashboard.staff.slice(0, 3);
  const hiddenStaffCount = Math.max(0, dashboard.staff.length - highlightedStaff.length);

  return (
    <section className="space-y-7">
      <div className="section-hero px-6 py-7 md:px-8 md:py-9">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="hero-eyebrow">Metricas</p>
            <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold text-ink md:text-[2.35rem] dark:text-slate-100">
              Rendimiento del equipo
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate/80 dark:text-slate-300">
              Vista operativa para celular: lo esencial primero y el detalle solo cuando lo necesites.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Rango
              </p>
              <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                {dashboard.dateRange.label}
              </p>
            </div>
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Comparando
              </p>
              <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                {dashboard.compareMetrics.length || dashboard.compareSelection.length || 0} perfiles
              </p>
            </div>
          </div>
        </div>
      </div>

      <details className="group rounded-[1.9rem]">
        <summary className="list-none cursor-pointer">
          <Card className="spotlight-card soft-panel rounded-[1.9rem] border-0 shadow-none">
            <CardBody className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-ink dark:text-slate-100">
                  Filtros y comparacion
                </h2>
                <p className="text-sm text-slate/80 dark:text-slate-300">
                  Fecha, canal y equipo. Expandir solo cuando quieras ajustar la vista.
                </p>
              </div>
              <span className="meta-chip" data-tone="default">
                Expandir
              </span>
            </CardBody>
          </Card>
        </summary>
        <div className="mt-4">
          <StaffPerformanceFilters
            shopSlug={ctx.shopSlug}
            dateRange={dashboard.dateRange}
            selectedChannel={selectedChannel}
            compareSelection={dashboard.compareSelection}
            staff={dashboard.staff}
          />
        </div>
      </details>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Reservas reales"
          value={`${channelMetrics.channelBreakdown.totalAppointments}`}
          hint={`Online ${channelMetrics.channelBreakdown.onlineAppointments} | Presenciales ${channelMetrics.channelBreakdown.walkInAppointments}`}
        />
        <KpiCard label="Facturacion" value={formatCurrency(channelMetrics.estimatedRevenueCents)} />
        <KpiCard label="Ocupacion" value={formatPercent(channelMetrics.occupancyRatio)} />
        <KpiCard
          label="Tasa completadas"
          value={formatPercent(channelMetrics.statusSummary.completionRate)}
          hint={`${channelMetrics.statusSummary.doneAppointments} realizadas`}
        />
      </div>

      <details className="group rounded-[1.9rem]">
        <summary className="list-none cursor-pointer">
          <Card className="spotlight-card soft-panel rounded-[1.9rem] border-0 shadow-none">
            <CardBody className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-ink dark:text-slate-100">
                  Indicadores secundarios
                </h2>
                <p className="text-sm text-slate/80 dark:text-slate-300">
                  Ticket, cancelaciones, no-show, capacidad, cola y mix de canal.
                </p>
              </div>
              <span className="meta-chip" data-tone="default">
                Expandir
              </span>
            </CardBody>
          </Card>
        </summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Ticket promedio"
            value={formatCurrency(channelMetrics.averageTicketCents)}
          />
          <KpiCard
            label="Cancelaciones"
            value={formatPercent(channelMetrics.statusSummary.cancellationRate)}
            hint={`${channelMetrics.statusSummary.cancelledAppointments} canceladas`}
          />
          <KpiCard
            label="No show"
            value={formatPercent(channelMetrics.statusSummary.noShowRate)}
            hint={`${channelMetrics.statusSummary.noShowAppointments} sin asistencia`}
          />
          <KpiCard
            label="Capacidad libre"
            value={formatHours(channelMetrics.capacitySummary.idleMinutes)}
            hint={`${formatPercent(channelMetrics.capacitySummary.utilizationGapRatio)} sin vender`}
          />
          <KpiCard
            label="Cola activa"
            value={`${channelMetrics.statusSummary.activeQueueAppointments}`}
            hint={`Pendientes ${channelMetrics.statusSummary.pendingAppointments} | Confirmadas ${channelMetrics.statusSummary.confirmedAppointments}`}
          />
          <KpiCard
            label="Vista activa"
            value={`${channelMetrics.channelBreakdown.filteredAppointments}`}
            hint={getChannelViewLabel(selectedChannel)}
          />
          <KpiCard
            label="Facturacion / hora"
            value={formatCurrency(channelMetrics.revenuePerAvailableHourCents)}
          />
          <KpiCard label="Resena promedio" value={dashboard.team.averageRating.toFixed(1)} />
          <KpiCard
            label="Mix online/presencial"
            value={`${formatPercent(channelMetrics.channelBreakdown.onlineShare)} / ${formatPercent(
              channelMetrics.channelBreakdown.walkInShare,
            )}`}
            hint="Distribucion del total real"
          />
        </div>
      </details>

      <MetricsApexOverview metrics={channelMetrics} selectedChannel={selectedChannel} />

      <details className="group rounded-[1.9rem]">
        <summary className="list-none cursor-pointer">
          <Card className="spotlight-card soft-panel rounded-[1.9rem] border-0 shadow-none">
            <CardBody className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-ink dark:text-slate-100">
                  Analisis avanzado por staff
                </h2>
                <p className="text-sm text-slate/80 dark:text-slate-300">
                  Graficos comparativos y detalle individual. Expandir solo cuando lo necesites.
                </p>
              </div>
              <span className="meta-chip" data-tone="default">
                Expandir
              </span>
            </CardBody>
          </Card>
        </summary>

        <div className="mt-4 space-y-4">
          <StaffPerformanceVisuals staff={dashboard.staff} />

          {dashboard.insights.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {dashboard.insights.map((item) => (
                <Link
                  key={`${item.label}-${item.value}`}
                  href={item.href || buildAdminHref('/admin/metrics', ctx.shopSlug)}
                  className="data-card block rounded-[1.6rem] p-4 no-underline"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-3 text-xl font-semibold text-ink dark:text-slate-100">
                    {item.value}
                  </p>
                </Link>
              ))}
            </div>
          ) : null}

          {dashboard.compareMetrics.length >= 2 ? (
            <Card className="spotlight-card soft-panel rounded-[1.9rem] border-0 shadow-none">
              <CardBody className="space-y-3 p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-ink dark:text-slate-100">
                      Comparacion directa
                    </h2>
                    <p className="text-sm text-slate/80 dark:text-slate-300">
                      Vista rapida de 2 a 4 miembros del equipo.
                    </p>
                  </div>
                </div>
                <StaffComparisonTable staff={dashboard.compareMetrics} />
              </CardBody>
            </Card>
          ) : null}

          <div className="space-y-4">
            {highlightedStaff.map((item) => (
              <Card
                key={item.staffId}
                className="spotlight-card soft-panel rounded-[2rem] border-0 shadow-none"
              >
                <CardBody className="space-y-5 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight text-ink dark:text-slate-100">
                          {item.staffName}
                        </h2>
                        <HealthChip metric={item} />
                      </div>
                      <p className="text-sm text-slate/80 dark:text-slate-300">
                        {item.completedAppointments} realizadas, {item.reviewCount} resenas
                      </p>
                    </div>

                    <div className="grid min-w-[280px] gap-2 sm:grid-cols-3">
                      <div className="data-card rounded-2xl p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                          Facturacion
                        </p>
                        <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                          {formatCurrency(item.totalRevenueCents)}
                        </p>
                      </div>
                      <div className="data-card rounded-2xl p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                          Por hora
                        </p>
                        <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                          {formatCurrency(item.revenuePerAvailableHourCents)}
                        </p>
                      </div>
                      <div className="data-card rounded-2xl p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                          Recompra
                        </p>
                        <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                          {formatPercent(item.repeatClientRate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
                    <div className="data-card rounded-[1.6rem] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                            Pulso operativo
                          </p>
                          <p className="mt-2 text-sm text-slate/80 dark:text-slate-300">
                            Lectura rapida del ritmo comercial, fidelizacion y valor por visita.
                          </p>
                        </div>
                        <p className="text-2xl font-semibold text-ink dark:text-slate-100">
                          {formatPercent(item.occupancyRatio)}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/55 bg-white/42 px-3 py-3 dark:border-transparent dark:bg-white/[0.03]">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                            Ticket
                          </p>
                          <p className="mt-1 text-sm font-semibold text-ink dark:text-slate-100">
                            {formatCurrency(item.averageTicketCents)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/55 bg-white/42 px-3 py-3 dark:border-transparent dark:bg-white/[0.03]">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                            Recompra
                          </p>
                          <p className="mt-1 text-sm font-semibold text-ink dark:text-slate-100">
                            {formatPercent(item.repeatClientRate)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/55 bg-white/42 px-3 py-3 dark:border-transparent dark:bg-white/[0.03]">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                            Ticket x hora
                          </p>
                          <p className="mt-1 text-sm font-semibold text-ink dark:text-slate-100">
                            {formatCurrency(item.revenuePerAvailableHourCents)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="data-card rounded-[1.6rem] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                            Calidad percibida
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
                            {item.trustedRating.toFixed(1)}
                          </p>
                        </div>
                        <div className="rounded-full border border-white/55 bg-white/52 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate/75 dark:border-transparent dark:bg-white/[0.05] dark:text-slate-300">
                          {dashboard.team.totalRevenueCents > 0
                            ? `${formatPercent(item.totalRevenueCents / dashboard.team.totalRevenueCents)} del equipo`
                            : 'Sin base'}
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2">
                        <div className="rounded-2xl border border-white/55 bg-white/42 px-3 py-3 dark:border-transparent dark:bg-white/[0.03]">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                            Resenas verificadas
                          </p>
                          <p className="mt-1 text-sm font-semibold text-ink dark:text-slate-100">
                            {item.reviewCount}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/55 bg-white/42 px-3 py-3 dark:border-transparent dark:bg-white/[0.03]">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                            Cancelacion total
                          </p>
                          <p className="mt-1 text-sm font-semibold text-ink dark:text-slate-100">
                            {formatPercent(item.cancellationRate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="data-card rounded-2xl p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                        Disponibles
                      </p>
                      <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                        {formatHours(item.availableMinutes)}
                      </p>
                    </div>
                    <div className="data-card rounded-2xl p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                        Reservadas
                      </p>
                      <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                        {formatHours(item.bookedMinutes)}
                      </p>
                    </div>
                    <div className="data-card rounded-2xl p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                        Cancelaciones
                      </p>
                      <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                        {item.staffCancellations + item.customerCancellations}
                      </p>
                      <p className="mt-1 text-xs text-slate/70 dark:text-slate-400">
                        Eq. {item.staffCancellations} / Cli. {item.customerCancellations}
                      </p>
                    </div>
                    <div className="data-card rounded-2xl p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                        No show
                      </p>
                      <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                        {item.noShowAppointments}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/45 pt-4 dark:border-white/6">
                    <p className="text-sm text-slate/80 dark:text-slate-300">
                      Ticket {formatCurrency(item.averageTicketCents)} | Retencion{' '}
                      {formatPercent(item.repeatClientRate)}
                    </p>
                    <Link
                      href={buildDetailHref(
                        item.staffId,
                        ctx.shopSlug,
                        dashboard.dateRange.fromDate,
                        dashboard.dateRange.toDate,
                      )}
                      className="inline-flex rounded-full border border-white/55 bg-white/45 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] no-underline text-ink transition hover:bg-white/68 dark:border-transparent dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/[0.06]"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </CardBody>
              </Card>
            ))}

            {hiddenStaffCount > 0 ? (
              <p className="text-sm text-slate/70 dark:text-slate-400">
                {hiddenStaffCount} perfiles adicionales ocultos para mantener una vista limpia.
                Usa la comparacion o el detalle individual para profundizar.
              </p>
            ) : null}
          </div>
        </div>
      </details>
    </section>
  );
}
