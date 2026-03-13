import { Chip } from '@heroui/chip';
import { StaffAppointmentStatusForm } from '@/components/staff/appointment-status-form';
import {
  formatStaffDateTime,
  isTerminalStaffAppointmentStatus,
  staffAppointmentStatusLabel,
  staffAppointmentStatusTone,
  staffPaymentStatusLabel,
  staffPaymentStatusTone,
  type StaffAppointmentRecord,
} from '@/lib/staff-portal';

interface StaffAppointmentsListProps {
  appointments: StaffAppointmentRecord[];
  emptyState: string;
  shopId: string;
  timeZone: string;
  showStatusActions?: boolean;
}

export function StaffAppointmentsList({
  appointments,
  emptyState,
  shopId,
  timeZone,
  showStatusActions = false,
}: StaffAppointmentsListProps) {
  if (!appointments.length) {
    return <p className="text-sm text-slate/70 dark:text-slate-400">{emptyState}</p>;
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => {
        const paymentLabel = appointment.paymentStatus
          ? staffPaymentStatusLabel[appointment.paymentStatus] || appointment.paymentStatus
          : 'Sin pago online';
        const paymentTone = appointment.paymentStatus
          ? staffPaymentStatusTone[appointment.paymentStatus] || 'default'
          : 'default';
        const isTerminal = isTerminalStaffAppointmentStatus(appointment.status);

        return (
          <div key={appointment.id} className="surface-card rounded-[1.5rem] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink dark:text-slate-100">
                  {formatStaffDateTime(appointment.startAt, timeZone)} · {appointment.serviceName}
                </p>
                <p className="mt-1 text-xs text-slate/70 dark:text-slate-400">
                  Cliente: {appointment.customerName} · {appointment.customerPhone}
                </p>
                {appointment.notes ? (
                  <p className="mt-1 text-xs text-slate/70 dark:text-slate-400">
                    Notas: {appointment.notes}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Chip
                  size="sm"
                  radius="full"
                  variant="flat"
                  color={staffAppointmentStatusTone[appointment.status] || 'default'}
                >
                  {staffAppointmentStatusLabel[appointment.status] || appointment.status}
                </Chip>
                <Chip size="sm" radius="full" variant="flat" color={paymentTone}>
                  Pago: {paymentLabel}
                </Chip>
              </div>
            </div>

            {showStatusActions && !isTerminal ? (
              <StaffAppointmentStatusForm
                appointmentId={appointment.id}
                status={appointment.status}
                shopId={shopId}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
