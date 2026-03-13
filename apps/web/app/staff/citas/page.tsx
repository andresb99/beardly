import { Card, CardBody } from '@heroui/card';
import { requireStaff } from '@/lib/auth';
import {
  isTerminalStaffAppointmentStatus,
  listStaffAppointments,
  listStaffServiceOptions,
} from '@/lib/staff-portal';
import { StaffAppointmentsList } from '@/components/staff/staff-appointments-list';
import { StaffManualBookingForm } from '@/components/staff/staff-manual-booking-form';

interface StaffAppointmentsPageProps {
  searchParams: Promise<{ shop?: string }>;
}

export default async function StaffAppointmentsPage({
  searchParams,
}: StaffAppointmentsPageProps) {
  const params = await searchParams;
  const ctx = await requireStaff({ shopSlug: params.shop });

  const now = new Date();
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 2);
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + 14);

  const [appointments, serviceOptions] = await Promise.all([
    listStaffAppointments({
      shopId: ctx.shopId,
      staffId: ctx.staffId,
      fromIso: start.toISOString(),
      toIso: end.toISOString(),
    }),
    listStaffServiceOptions(ctx.shopId),
  ]);

  const pendingClosureAppointments = appointments.filter((appointment) => {
    const startsAt = new Date(appointment.startAt);
    return (
      !Number.isNaN(startsAt.getTime()) &&
      startsAt.getTime() <= now.getTime() &&
      !isTerminalStaffAppointmentStatus(appointment.status)
    );
  });
  const upcomingAppointments = appointments.filter((appointment) => {
    const startsAt = new Date(appointment.startAt);
    return !Number.isNaN(startsAt.getTime()) && startsAt.getTime() > now.getTime();
  });
  const recentClosedAppointments = appointments
    .filter((appointment) => {
      const startsAt = new Date(appointment.startAt);
      return (
        !Number.isNaN(startsAt.getTime()) &&
        startsAt.getTime() <= now.getTime() &&
        isTerminalStaffAppointmentStatus(appointment.status)
      );
    })
    .reverse()
    .slice(0, 6);
  const defaultManualStartAt = new Date().toISOString().slice(0, 16);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="soft-panel rounded-[1.9rem] border-0 shadow-none">
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
                Registrar cliente presencial
              </h2>
              <p className="text-sm text-slate/80 dark:text-slate-300">
                El staff solo puede crear walk-ins para su propia agenda. No hay selector de equipo
                ni acceso a reservas de otros barberos.
              </p>
            </div>

            {serviceOptions.length === 0 ? (
              <p className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-3 text-sm text-fuchsia-100">
                Necesitas al menos un servicio activo para registrar un walk-in.
              </p>
            ) : null}

            <StaffManualBookingForm
              shopId={ctx.shopId}
              staffId={ctx.staffId}
              defaultStartAt={defaultManualStartAt}
              serviceOptions={serviceOptions}
            />
          </CardBody>
        </Card>

        <Card className="soft-panel rounded-[1.9rem] border-0 shadow-none">
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
                Citas para cerrar
              </h2>
              <p className="text-sm text-slate/80 dark:text-slate-300">
                Estado rapido para citas que ya pasaron y todavia siguen abiertas.
              </p>
            </div>

            <StaffAppointmentsList
              appointments={pendingClosureAppointments}
              emptyState="No hay citas pendientes de cierre."
              shopId={ctx.shopId}
              timeZone={ctx.shopTimezone}
              showStatusActions
            />
          </CardBody>
        </Card>
      </div>

      <Card className="soft-panel rounded-[1.9rem] border-0 shadow-none">
        <CardBody className="space-y-4 p-5">
          <div>
            <h2 className="text-xl font-semibold text-ink dark:text-slate-100">Agenda proxima</h2>
            <p className="text-sm text-slate/80 dark:text-slate-300">
              Tus reservas futuras con contexto de cliente, servicio y estado de pago.
            </p>
          </div>

          <StaffAppointmentsList
            appointments={upcomingAppointments}
            emptyState="No tienes citas proximas en esta ventana."
            shopId={ctx.shopId}
            timeZone={ctx.shopTimezone}
            showStatusActions
          />
        </CardBody>
      </Card>

      <Card className="soft-panel rounded-[1.9rem] border-0 shadow-none">
        <CardBody className="space-y-4 p-5">
          <div>
            <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
              Historial reciente
            </h2>
            <p className="text-sm text-slate/80 dark:text-slate-300">
              Ultimas citas visibles dentro de tu ventana operativa personal.
            </p>
          </div>

          <StaffAppointmentsList
            appointments={recentClosedAppointments}
            emptyState="Aun no hay movimientos recientes para mostrar."
            shopId={ctx.shopId}
            timeZone={ctx.shopTimezone}
          />
        </CardBody>
      </Card>
    </section>
  );
}
