import { Card, CardBody } from '@heroui/card';
import { requireStaff } from '@/lib/auth';
import {
  formatStaffDate,
  formatStaffDateTime,
  listStaffTimeOffRecords,
  listStaffWorkingHours,
  splitTimeOffRecords,
} from '@/lib/staff-portal';
import { StaffTimeOffRequestForm } from '@/components/staff/staff-time-off-request-form';

interface StaffTimeOffPageProps {
  searchParams: Promise<{ shop?: string }>;
}

export default async function StaffTimeOffPage({ searchParams }: StaffTimeOffPageProps) {
  const params = await searchParams;
  const ctx = await requireStaff({ shopSlug: params.shop });

  const [timeOffRecords, workingHours] = await Promise.all([
    listStaffTimeOffRecords({
      shopId: ctx.shopId,
      staffId: ctx.staffId,
      limit: 20,
    }),
    listStaffWorkingHours({
      shopId: ctx.shopId,
      staffId: ctx.staffId,
    }),
  ]);

  const timeOff = splitTimeOffRecords(timeOffRecords);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="soft-panel rounded-[1.9rem] border-0 shadow-none">
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
                Solicitar ausencia
              </h2>
              <p className="text-sm text-slate/80 dark:text-slate-300">
                La solicitud entra como pendiente y el admin la resuelve desde su inbox. El staff
                no puede autoaprobar ni tocar ausencias ajenas.
              </p>
            </div>

            <StaffTimeOffRequestForm shopId={ctx.shopId} />
          </CardBody>
        </Card>

        <Card className="soft-panel rounded-[1.9rem] border-0 shadow-none">
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
                Mi horario fijo
              </h2>
              <p className="text-sm text-slate/80 dark:text-slate-300">
                Referencia de tus bloques habituales para planificar ausencias sin abrir datos del
                equipo.
              </p>
            </div>

            {workingHours.length === 0 ? (
              <p className="text-sm text-slate/70 dark:text-slate-400">
                Todavia no hay horarios definidos para tu perfil.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {workingHours.map((entry) => (
                  <div key={entry.id} className="data-card rounded-[1.5rem] p-4">
                    <p className="text-sm font-semibold text-ink dark:text-slate-100">
                      {entry.dayLabel}
                    </p>
                    <p className="mt-2 text-sm text-slate/80 dark:text-slate-300">
                      {entry.startTime} - {entry.endTime}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="soft-panel rounded-[1.9rem] border-0 shadow-none">
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
                Solicitudes pendientes
              </h2>
              <p className="text-sm text-slate/80 dark:text-slate-300">
                Pedidos enviados y todavia sin decision.
              </p>
            </div>

            {timeOff.pending.length === 0 ? (
              <p className="text-sm text-slate/70 dark:text-slate-400">
                No tienes solicitudes pendientes.
              </p>
            ) : (
              <div className="space-y-3">
                {timeOff.pending.map((item) => (
                  <div key={item.id} className="data-card rounded-[1.5rem] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink dark:text-slate-100">
                          {formatStaffDateTime(item.startAt, ctx.shopTimezone)}
                        </p>
                        <p className="mt-1 text-xs text-slate/70 dark:text-slate-400">
                          hasta {formatStaffDateTime(item.endAt, ctx.shopTimezone)}
                        </p>
                        <p className="mt-2 text-sm text-slate/80 dark:text-slate-300">
                          {item.reason || 'Sin motivo'}
                        </p>
                      </div>
                      <span className="meta-chip border-fuchsia-400/18 bg-fuchsia-500/10 text-fuchsia-200">
                        Pendiente
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="soft-panel rounded-[1.9rem] border-0 shadow-none">
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
                Historial aprobado
              </h2>
              <p className="text-sm text-slate/80 dark:text-slate-300">
                Registro de ausencias ya incorporadas a tu agenda.
              </p>
            </div>

            {timeOff.approved.length === 0 ? (
              <p className="text-sm text-slate/70 dark:text-slate-400">
                Aun no tienes ausencias aprobadas.
              </p>
            ) : (
              <div className="space-y-3">
                {timeOff.approved.map((item) => (
                  <div key={item.id} className="data-card rounded-[1.5rem] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink dark:text-slate-100">
                          {formatStaffDateTime(item.startAt, ctx.shopTimezone)}
                        </p>
                        <p className="mt-1 text-xs text-slate/70 dark:text-slate-400">
                          hasta {formatStaffDateTime(item.endAt, ctx.shopTimezone)}
                        </p>
                        <p className="mt-2 text-sm text-slate/80 dark:text-slate-300">
                          {item.reason || 'Sin motivo'}
                        </p>
                        {item.createdAt ? (
                          <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-slate/50 dark:text-slate-500">
                            Solicitada el {formatStaffDate(item.createdAt, ctx.shopTimezone)}
                          </p>
                        ) : null}
                      </div>
                      <span className="meta-chip border-violet-400/18 bg-violet-500/10 text-violet-200">
                        Aprobada
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
