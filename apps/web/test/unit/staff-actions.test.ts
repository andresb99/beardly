const createAppointmentFromBookingIntentMock = vi.fn();
const revalidatePathMock = vi.fn();

function createStaffLookupSupabaseMock() {
  const staffQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };

  staffQuery.select.mockReturnValue(staffQuery);
  staffQuery.eq.mockReturnValue(staffQuery);
  staffQuery.maybeSingle.mockResolvedValue({
    data: {
      id: '33333333-3333-3333-3333-333333333333',
      shop_id: '11111111-1111-1111-1111-111111111111',
    },
  });

  return {
    from: vi.fn((table: string) => {
      if (table === 'staff') {
        return staffQuery;
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

describe('staff manual appointment permissions', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('forces staff-created manual bookings to stay on the actor staff profile', async () => {
    vi.doMock('@/lib/auth', () => ({
      getCurrentAuthContext: vi.fn().mockResolvedValue({
        role: 'staff',
        userId: 'user-1',
        email: 'staff@example.com',
        staffId: '33333333-3333-3333-3333-333333333333',
        shopId: '11111111-1111-1111-1111-111111111111',
        shopSlug: 'barberandres',
        shopName: 'Barber Andres',
        shopTimezone: 'America/Montevideo',
        selectedWorkspaceRole: 'staff',
        availableWorkspaces: [],
      }),
      requireAdmin: vi.fn(),
      requireAuthenticated: vi.fn(),
      requireStaff: vi.fn(),
    }));
    vi.doMock('@/lib/booking-payments.server', () => ({
      createAppointmentFromBookingIntent: createAppointmentFromBookingIntentMock,
    }));
    vi.doMock('@/lib/env', () => ({
      env: {
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      },
    }));
    vi.doMock('@/lib/env.server', () => ({
      serverEnv: {
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      },
      getMercadoPagoServerEnv: vi.fn(() => ({
        MERCADO_PAGO_ACCESS_TOKEN: 'test-access-token-1234567890',
      })),
    }));
    vi.doMock('@/lib/mercado-pago.server', () => ({
      createMercadoPagoCheckoutPreference: vi.fn(),
      getMercadoPagoPayment: vi.fn(),
      isMercadoPagoConfigured: vi.fn(() => false),
    }));
    vi.doMock('@/lib/supabase/server', () => ({
      createSupabaseServerClient: vi.fn().mockResolvedValue(createStaffLookupSupabaseMock()),
    }));
    vi.doMock('next/cache', () => ({
      revalidatePath: revalidatePathMock,
    }));
    vi.doMock('next/navigation', () => ({
      redirect: vi.fn(),
    }));

    const { createManualAppointmentAction } = await import('@/app/admin/actions');
    const formData = new FormData();
    formData.set('shop_id', '11111111-1111-1111-1111-111111111111');
    formData.set('service_id', '22222222-2222-2222-2222-222222222222');
    formData.set('staff_id', '33333333-3333-3333-3333-333333333333');
    formData.set('source_channel', 'ADMIN_CREATED');
    formData.set('start_at', '2026-03-12T15:00:00');
    formData.set('customer_name', 'Cliente Walk In');
    formData.set('customer_phone', '+59899111222');
    formData.set('customer_email', 'cliente@example.com');

    await createManualAppointmentAction(formData);

    expect(createAppointmentFromBookingIntentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        shop_id: '11111111-1111-1111-1111-111111111111',
        service_id: '22222222-2222-2222-2222-222222222222',
        staff_id: '33333333-3333-3333-3333-333333333333',
        customer_name: 'Cliente Walk In',
      }),
      expect.objectContaining({
        sourceChannel: 'WALK_IN',
        initialStatus: 'confirmed',
      }),
    );
  });

  it('marks admin-created manual bookings as confirmed from creation', async () => {
    vi.doMock('@/lib/auth', () => ({
      getCurrentAuthContext: vi.fn().mockResolvedValue({
        role: 'admin',
        userId: 'admin-1',
        email: 'admin@example.com',
        staffId: 'staff-admin-1',
        shopId: '11111111-1111-1111-1111-111111111111',
        shopSlug: 'barberandres',
        shopName: 'Barber Andres',
        shopTimezone: 'America/Montevideo',
        selectedWorkspaceRole: 'admin',
        availableWorkspaces: [],
      }),
      requireAdmin: vi.fn(),
      requireAuthenticated: vi.fn(),
      requireStaff: vi.fn(),
    }));
    vi.doMock('@/lib/booking-payments.server', () => ({
      createAppointmentFromBookingIntent: createAppointmentFromBookingIntentMock,
    }));
    vi.doMock('@/lib/env', () => ({
      env: {
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      },
    }));
    vi.doMock('@/lib/env.server', () => ({
      serverEnv: {
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      },
      getMercadoPagoServerEnv: vi.fn(() => ({
        MERCADO_PAGO_ACCESS_TOKEN: 'test-access-token-1234567890',
      })),
    }));
    vi.doMock('@/lib/mercado-pago.server', () => ({
      createMercadoPagoCheckoutPreference: vi.fn(),
      getMercadoPagoPayment: vi.fn(),
      isMercadoPagoConfigured: vi.fn(() => false),
    }));
    vi.doMock('@/lib/supabase/server', () => ({
      createSupabaseServerClient: vi.fn().mockResolvedValue(createStaffLookupSupabaseMock()),
    }));
    vi.doMock('next/cache', () => ({
      revalidatePath: revalidatePathMock,
    }));
    vi.doMock('next/navigation', () => ({
      redirect: vi.fn(),
    }));

    const { createManualAppointmentAction } = await import('@/app/admin/actions');
    const formData = new FormData();
    formData.set('shop_id', '11111111-1111-1111-1111-111111111111');
    formData.set('service_id', '22222222-2222-2222-2222-222222222222');
    formData.set('staff_id', '33333333-3333-3333-3333-333333333333');
    formData.set('source_channel', 'ADMIN_CREATED');
    formData.set('start_at', '2026-03-12T15:00');
    formData.set('customer_name', 'Cliente Mostrador');
    formData.set('customer_phone', '+59899111222');
    formData.set('customer_email', 'cliente@example.com');

    await createManualAppointmentAction(formData);

    expect(createAppointmentFromBookingIntentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        staff_id: '33333333-3333-3333-3333-333333333333',
        customer_name: 'Cliente Mostrador',
      }),
      expect.objectContaining({
        sourceChannel: 'ADMIN_CREATED',
        initialStatus: 'confirmed',
      }),
    );
  });
});
