import { render, screen } from '@testing-library/react';

describe('StaffAppointmentsPage', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('renders a self-scoped walk-in form without team selector', async () => {
    vi.doMock('@/lib/auth', () => ({
      requireStaff: vi.fn().mockResolvedValue({
        userId: 'user-1',
        staffId: 'staff-self',
        role: 'staff',
        email: 'staff@example.com',
        shopId: 'shop-1',
        shopSlug: 'barberandres',
        shopName: 'Barber Andres',
        shopTimezone: 'America/Montevideo',
      }),
    }));
    vi.doMock('@/lib/staff-portal', () => ({
      isTerminalStaffAppointmentStatus: (status: string) =>
        status === 'done' || status === 'no_show' || status === 'cancelled',
      listStaffAppointments: vi.fn().mockResolvedValue([
        {
          id: 'appointment-1',
          startAt: '2026-03-12T18:00:00.000Z',
          endAt: '2026-03-12T18:45:00.000Z',
          status: 'confirmed',
          paymentStatus: 'approved',
          serviceName: 'Corte clasico',
          customerName: 'Lucia Perez',
          customerPhone: '+59899111222',
          notes: null,
        },
      ]),
      listStaffServiceOptions: vi.fn().mockResolvedValue([
        {
          id: 'service-1',
          name: 'Corte clasico',
        },
      ]),
      formatStaffDateTime: vi.fn((value: string) => value),
      staffAppointmentStatusLabel: {
        pending: 'Pendiente',
        confirmed: 'Confirmada',
        cancelled: 'Cancelada',
        no_show: 'No asistio',
        done: 'Realizada',
      },
      staffAppointmentStatusTone: {
        pending: 'warning',
        confirmed: 'default',
        cancelled: 'danger',
        no_show: 'danger',
        done: 'success',
      },
      staffPaymentStatusLabel: {
        approved: 'Aprobado',
      },
      staffPaymentStatusTone: {
        approved: 'success',
      },
    }));
    vi.doMock('@/app/admin/actions', () => ({
      createManualAppointmentAction: vi.fn(),
      updateOwnAppointmentStatusAction: vi.fn(),
    }));

    const { default: StaffAppointmentsPage } = await import('@/app/staff/citas/page');
    const view = render(await StaffAppointmentsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText('Registrar cliente presencial')).toBeInTheDocument();
    expect(screen.queryByLabelText('Barbero')).not.toBeInTheDocument();
    expect(screen.getByText('Citas para cerrar')).toBeInTheDocument();
    expect(screen.getByText('Agenda proxima')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Actualizar' }).length).toBeGreaterThan(0);
    expect(view.container.querySelector('input[name="staff_id"][value="staff-self"]')).not.toBeNull();
    expect(view.container.querySelector('input[name="source_channel"][value="WALK_IN"]')).not.toBeNull();
  });
});
