import NextLink from 'next/link';
import { formatCurrency } from '@navaja/shared';
import { Card, CardBody } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { requireStaff } from '@/lib/auth';
import { METRIC_RANGES } from '@/lib/constants';
import { getStaffPerformanceDetail } from '@/lib/metrics';
import { STAFF_METRIC_RANGE_OPTIONS } from '@/lib/staff-navigation';
import { formatHours, formatStaffDate } from '@/lib/staff-portal';
import { cn } from '@/lib/cn';
import { buildStaffHref } from '@/lib/workspace-routes';

interface StaffMetricsPageProps {
  searchParams: Promise<{ shop?: string; range?: string }>;
}

export default async function StaffMetricsPage({ searchParams }: StaffMetricsPageProps) {
  const params = await searchParams;
  const ctx = await requireStaff({ shopSlug: params.shop });
  const selectedRange =
    params.range === METRIC_RANGES.today ||
    params.range === METRIC_RANGES.last7 ||
    params.range === METRIC_RANGES.month
      ? params.range
      : METRIC_RANGES.last7;
  const performance = await getStaffPerformanceDetail(
    ctx.staffId,
    {
      range: selectedRange,
    },
    ctx.shopId,
  ).catch(() => null);

  return (
    <section className="space-y-6">
      <Card className="soft-panel rounded-[1.9rem] border-0 shadow-none">
        <CardBody className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
                Metricas personales
              </h2>
              <p className="text-sm text-slate/80 dark:text-slate-300">
                Lectura exclusiva de tu rendimiento. No hay comparativas del resto del local ni
                datos globales del negocio.
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

          <div className="flex flex-wrap gap-2">
            {STAFF_METRIC_RANGE_OPTIONS.map((option) => {
              const href = buildStaffHref('/staff/metricas', ctx.shopSlug, {
                range: option.key,
              });
              const isActive = selectedRange === option.key;

              return (
                <NextLink
                  key={option.key}
                  href={href}
                  className={cn('nav-link-pill no-underline', isActive && 'shadow-[0_16px_24px_-18px_rgba(15,23,42,0.28)]')}
                  data-active={String(isActive)}
                >
                  {option.label}
                </NextLink>
              );
            })}
          </div>

          {performance ? (
            <p className="text-xs uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
              Periodo: {performance.dateRange.label}
            </p>
          ) : null}
        </CardBody>
      </Card>

      {!performance ? (
        <Card className="soft-panel rounded-[1.9rem] border-0 shadow-none">
          <CardBody className="p-5">
            <p className="text-sm text-slate/70 dark:text-slate-400">
              Todavia no hay suficientes datos para mostrar tus metricas en este periodo.
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="data-card rounded-[1.7rem] border-0 shadow-none">
              <CardBody className="p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                  Facturacion
                </h3>
                <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
                  {formatCurrency(performance.metric.totalRevenueCents)}
                </p>
              </CardBody>
            </Card>

            <Card className="data-card rounded-[1.7rem] border-0 shadow-none">
              <CardBody className="p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                  Ticket promedio
                </h3>
                <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
                  {formatCurrency(performance.metric.averageTicketCents)}
                </p>
              </CardBody>
            </Card>

            <Card className="data-card rounded-[1.7rem] border-0 shadow-none">
              <CardBody className="p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                  Ocupacion
                </h3>
                <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
                  {Math.round(performance.metric.occupancyRatio * 100)}%
                </p>
              </CardBody>
            </Card>

            <Card className="data-card rounded-[1.7rem] border-0 shadow-none">
              <CardBody className="p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                  Horas reservadas
                </h3>
                <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
                  {formatHours(performance.metric.bookedMinutes)}
                </p>
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="soft-panel rounded-[1.9rem] border-0 shadow-none">
              <CardBody className="space-y-4 p-5">
                <div>
                  <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
                    Salud del desempeno
                  </h2>
                  <p className="text-sm text-slate/80 dark:text-slate-300">
                    Indicadores clave para entender calidad, recurrencia y estabilidad.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="data-card rounded-[1.5rem] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                      Citas realizadas
                    </p>
                    <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                      {performance.metric.completedAppointments}
                    </p>
                  </div>
                  <div className="data-card rounded-[1.5rem] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                      Clientes recurrentes
                    </p>
                    <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                      {Math.round(performance.metric.repeatClientRate * 100)}%
                    </p>
                  </div>
                  <div className="data-card rounded-[1.5rem] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                      Cancelaciones
                    </p>
                    <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                      {Math.round(performance.metric.cancellationRate * 100)}%
                    </p>
                  </div>
                  <div className="data-card rounded-[1.5rem] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                      No show
                    </p>
                    <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                      {performance.metric.noShowAppointments}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/55 bg-white/45 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                    Insights
                  </p>
                  <div className="mt-3 space-y-2">
                    {performance.insights.map((insight) => (
                      <p key={insight} className="text-sm leading-6 text-slate/80 dark:text-slate-300">
                        {insight}
                      </p>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="soft-panel rounded-[1.9rem] border-0 shadow-none">
              <CardBody className="space-y-4 p-5">
                <div>
                  <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
                    Resenas recientes
                  </h2>
                  <p className="text-sm text-slate/80 dark:text-slate-300">
                    Feedback publicado dentro del periodo seleccionado.
                  </p>
                </div>

                {performance.recentReviews.length === 0 ? (
                  <p className="text-sm text-slate/70 dark:text-slate-400">
                    Aun no hay resenas publicadas en esta ventana.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {performance.recentReviews.map((review) => (
                      <div key={review.id} className="data-card rounded-[1.5rem] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-ink dark:text-slate-100">
                            {review.customerName}
                          </p>
                          <Chip
                            size="sm"
                            radius="full"
                            variant="flat"
                            className="border border-violet-400/18 bg-violet-500/[0.12] text-violet-100"
                          >
                            {review.rating}/5
                          </Chip>
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate/50 dark:text-slate-500">
                          {formatStaffDate(review.submittedAt, ctx.shopTimezone)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate/80 dark:text-slate-300">
                          {review.comment || 'Sin comentario adicional.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </section>
  );
}
