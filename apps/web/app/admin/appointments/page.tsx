import { formatCurrency } from '@navaja/shared';
import { Card, CardBody } from '@heroui/card';
import { AdminAppointmentsFilters } from '@/components/admin/appointments-filters';
import { AdminAppointmentsPagination } from '@/components/admin/appointments-pagination';
import { AdminAppointmentsViewSwitcher } from '@/components/admin/appointments-view-switcher';
import { createManualAppointmentAction } from '@/app/admin/actions';
import {
  ADMIN_APPOINTMENTS_DEFAULT_PAGE_SIZE,
  ADMIN_APPOINTMENTS_DEFAULT_SORT_BY,
  ADMIN_APPOINTMENTS_DEFAULT_SORT_DIR,
  ADMIN_APPOINTMENTS_PAGE_SIZE_OPTIONS,
  isAdminAppointmentsSortDir,
  isAdminAppointmentsSortField,
  type AdminAppointmentsQueryState,
  type AdminAppointmentsSortDir,
  type AdminAppointmentsSortField,
} from '@/lib/admin-appointments';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface AppointmentsPageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    staff_id?: string;
    status?: string;
    shop?: string;
    view?: string;
    page?: string;
    page_size?: string;
    sort_by?: string;
    sort_dir?: string;
  }>;
}

interface AppointmentListItem {
  id: string | null;
  staff_id: string | null;
  start_at: string | null;
  status: string | null;
  payment_intent_id?: string | null;
  source_channel?: string | null;
  price_cents: number | null;
  notes: string | null;
  customer_name_snapshot?: string | null;
  customer_phone_snapshot?: string | null;
  customers: { name?: string | null; phone?: string | null } | null;
  services: { name?: string | null } | null;
  staff: { name?: string | null } | null;
}

interface PaymentIntentStatusItem {
  id: string | null;
  status: string | null;
}

interface AppointmentRow {
  id: string;
  startAtLabel: string;
  startAtValue: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  staffName: string;
  sourceChannelLabel: string;
  status: string;
  paymentStatus: string | null;
  priceLabel: string;
  priceCents: number;
}

function formatDateInput(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value || '1970';
  const month = parts.find((part) => part.type === 'month')?.value || '01';
  const day = parts.find((part) => part.type === 'day')?.value || '01';

  return `${year}-${month}-${day}`;
}

function isMissingSourceChannelColumnError(error: unknown) {
  const message = String((error as { message?: string } | null)?.message || '')
    .trim()
    .toLowerCase();

  return (
    message.includes('source_channel') &&
    message.includes('appointments') &&
    (message.includes('schema cache') || message.includes('column'))
  );
}

function isMissingPaymentIntentColumnError(error: unknown) {
  const message = String((error as { message?: string } | null)?.message || '')
    .trim()
    .toLowerCase();

  return (
    message.includes('payment_intent_id') &&
    message.includes('appointments') &&
    (message.includes('schema cache') || message.includes('column'))
  );
}

function isMissingCustomerSnapshotColumnError(error: unknown) {
  const message = String((error as { message?: string } | null)?.message || '')
    .trim()
    .toLowerCase();

  return (
    (message.includes('customer_name_snapshot') || message.includes('customer_phone_snapshot')) &&
    message.includes('appointments') &&
    (message.includes('schema cache') || message.includes('column'))
  );
}

function resolveSourceChannel(value: unknown, notes: unknown) {
  const normalized = String(value || '')
    .trim()
    .toUpperCase();
  if (normalized) {
    return normalized;
  }

  const noteText = String(notes || '');
  const matched = noteText.match(/\bCanal:\s*(WEB|WALK_IN|ADMIN_CREATED|WHATSAPP|INSTAGRAM|PHONE)\b/i);
  return matched?.[1]?.toUpperCase() || 'WEB';
}

function sourceChannelLabel(channel: string) {
  const normalized = channel.trim().toUpperCase();

  if (normalized === 'WALK_IN') {
    return 'Presencial';
  }

  if (normalized === 'ADMIN_CREATED') {
    return 'Carga manual';
  }

  if (normalized === 'WHATSAPP') {
    return 'WhatsApp';
  }

  if (normalized === 'INSTAGRAM') {
    return 'Instagram';
  }

  if (normalized === 'PHONE') {
    return 'Telefono';
  }

  return 'Web';
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const appointmentStatusSortRank: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  done: 2,
  no_show: 3,
  cancelled: 4,
};

const paymentStatusSortRank: Record<string, number> = {
  pending: 0,
  processing: 1,
  approved: 2,
  refunded: 3,
  rejected: 4,
  cancelled: 5,
  expired: 6,
  none: 7,
};

function compareText(a: string, b: string) {
  return a.localeCompare(b, 'es-UY', { sensitivity: 'base', numeric: true });
}

function sortAppointmentRows(
  rows: AppointmentRow[],
  sortBy: AdminAppointmentsSortField,
  sortDir: AdminAppointmentsSortDir,
) {
  const direction = sortDir === 'asc' ? 1 : -1;

  return [...rows].sort((left, right) => {
    let comparison = 0;

    switch (sortBy) {
      case 'customer':
        comparison = compareText(left.customerName, right.customerName);
        break;
      case 'service':
        comparison = compareText(left.serviceName, right.serviceName);
        break;
      case 'staff':
        comparison = compareText(left.staffName, right.staffName);
        break;
      case 'channel':
        comparison = compareText(left.sourceChannelLabel, right.sourceChannelLabel);
        break;
      case 'status':
        comparison =
          (appointmentStatusSortRank[left.status] ?? 99) - (appointmentStatusSortRank[right.status] ?? 99);
        break;
      case 'payment':
        comparison =
          (paymentStatusSortRank[left.paymentStatus || 'none'] ?? 99) -
          (paymentStatusSortRank[right.paymentStatus || 'none'] ?? 99);
        break;
      case 'price':
        comparison = left.priceCents - right.priceCents;
        break;
      case 'start_at':
      default:
        comparison = compareText(left.startAtValue, right.startAtValue);
        break;
    }

    if (comparison !== 0) {
      return comparison * direction;
    }

    return compareText(left.id, right.id) * direction;
  });
}

export default async function AppointmentsPage({ searchParams }: AppointmentsPageProps) {
  const params = await searchParams;
  const ctx = await requireAdmin({ shopSlug: params.shop });
  const viewMode = params.view === 'cards' ? 'cards' : 'table';
  const supabase = await createSupabaseServerClient();
  const shopTimeZone = ctx.shopTimezone;

  const now = new Date();
  const defaultFrom = formatDateInput(now, shopTimeZone);
  const defaultToDate = new Date(now);
  defaultToDate.setDate(defaultToDate.getDate() + 28);
  const defaultTo = formatDateInput(defaultToDate, shopTimeZone);

  const selectedStaffId =
    params.staff_id && params.staff_id !== 'all' ? params.staff_id : undefined;
  const selectedStatus = params.status && params.status !== 'all' ? params.status : undefined;
  const from = params.from || defaultFrom;
  const to = params.to || (params.from ? params.from : defaultTo);
  const requestedSortBy = isAdminAppointmentsSortField(params.sort_by)
    ? params.sort_by
    : ADMIN_APPOINTMENTS_DEFAULT_SORT_BY;
  const requestedSortDir = isAdminAppointmentsSortDir(params.sort_dir)
    ? params.sort_dir
    : ADMIN_APPOINTMENTS_DEFAULT_SORT_DIR;
  const requestedPageSize = parsePositiveInt(params.page_size, ADMIN_APPOINTMENTS_DEFAULT_PAGE_SIZE);
  const pageSize = ADMIN_APPOINTMENTS_PAGE_SIZE_OPTIONS.includes(
    requestedPageSize as (typeof ADMIN_APPOINTMENTS_PAGE_SIZE_OPTIONS)[number],
  )
    ? requestedPageSize
    : ADMIN_APPOINTMENTS_DEFAULT_PAGE_SIZE;

  const appointmentSelectWithSource =
    'id, staff_id, start_at, end_at, status, payment_intent_id, source_channel, price_cents, notes, customer_name_snapshot, customer_phone_snapshot, customers(name, phone), services(name), staff(name)';
  const appointmentSelectWithoutSource =
    'id, staff_id, start_at, end_at, status, payment_intent_id, price_cents, notes, customer_name_snapshot, customer_phone_snapshot, customers(name, phone), services(name), staff(name)';
  const appointmentSelectWithoutPaymentIntent =
    'id, staff_id, start_at, end_at, status, source_channel, price_cents, notes, customer_name_snapshot, customer_phone_snapshot, customers(name, phone), services(name), staff(name)';
  const appointmentSelectFallback =
    'id, staff_id, start_at, end_at, status, price_cents, notes, customers(name, phone), services(name), staff(name)';

  const [{ data: staff }, { data: services }, appointmentsResult] = await Promise.all([
    supabase
      .from('staff')
      .select('id, name')
      .eq('shop_id', ctx.shopId)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('services')
      .select('id, name')
      .eq('shop_id', ctx.shopId)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('appointments')
      .select(appointmentSelectWithSource)
      .eq('shop_id', ctx.shopId)
      .gte('start_at', `${from}T00:00:00.000Z`)
      .lte('start_at', `${to}T23:59:59.999Z`)
      .order('start_at'),
  ]);

  let appointments = (appointmentsResult.data || []) as AppointmentListItem[];
  let canReadPaymentIntentColumn = true;
  if (appointmentsResult.error) {
    const missingSourceColumn = isMissingSourceChannelColumnError(appointmentsResult.error);
    const missingPaymentColumn = isMissingPaymentIntentColumnError(appointmentsResult.error);
    const missingCustomerSnapshotColumn = isMissingCustomerSnapshotColumnError(appointmentsResult.error);

    if (!missingSourceColumn && !missingPaymentColumn && !missingCustomerSnapshotColumn) {
      throw new Error(appointmentsResult.error.message || 'No se pudieron cargar las citas.');
    }

    canReadPaymentIntentColumn = !missingPaymentColumn;
    const fallbackSelect = missingCustomerSnapshotColumn
      ? missingSourceColumn
        ? missingPaymentColumn
          ? appointmentSelectFallback
          : 'id, staff_id, start_at, end_at, status, payment_intent_id, price_cents, notes, customers(name, phone), services(name), staff(name)'
        : missingPaymentColumn
          ? 'id, staff_id, start_at, end_at, status, source_channel, price_cents, notes, customers(name, phone), services(name), staff(name)'
          : 'id, staff_id, start_at, end_at, status, payment_intent_id, source_channel, price_cents, notes, customers(name, phone), services(name), staff(name)'
      : missingSourceColumn
        ? missingPaymentColumn
          ? appointmentSelectFallback
          : appointmentSelectWithoutSource
        : appointmentSelectWithoutPaymentIntent;

    const fallbackResult = await supabase
      .from('appointments')
      .select(fallbackSelect)
      .eq('shop_id', ctx.shopId)
      .gte('start_at', `${from}T00:00:00.000Z`)
      .lte('start_at', `${to}T23:59:59.999Z`)
      .order('start_at');

    if (fallbackResult.error) {
      throw new Error(fallbackResult.error.message || 'No se pudieron cargar las citas.');
    }

    appointments = ((fallbackResult.data || []) as unknown) as AppointmentListItem[];
  }

  if (selectedStaffId) {
    appointments = appointments.filter((item) => String(item.staff_id || '') === selectedStaffId);
  }

  if (selectedStatus) {
    appointments = appointments.filter((item) => item.status === selectedStatus);
  }

  const paymentIntentIds = canReadPaymentIntentColumn
    ? Array.from(
        new Set(
          appointments
            .map((item) => String(item.payment_intent_id || '').trim())
            .filter(Boolean),
        ),
      )
    : [];
  const paymentStatusByIntentId = new Map<string, string>();

  if (paymentIntentIds.length) {
    const { data: paymentIntents } = await supabase
      .from('payment_intents')
      .select('id, status')
      .in('id', paymentIntentIds);

    (paymentIntents || []).forEach((item) => {
      const row = item as PaymentIntentStatusItem;
      const intentId = String(row.id || '').trim();
      const status = String(row.status || '').trim().toLowerCase();
      if (intentId && status) {
        paymentStatusByIntentId.set(intentId, status);
      }
    });
  }

  const pendingCount = appointments.filter((item) => item.status === 'pending').length;
  const doneCount = appointments.filter((item) => item.status === 'done').length;
  const hasManualBookingOptions = Boolean((staff || []).length && (services || []).length);
  const defaultManualStartAt = `${from}T09:00`;
  const allAppointmentRows: AppointmentRow[] = appointments.map((item) => ({
    paymentStatus: canReadPaymentIntentColumn
      ? paymentStatusByIntentId.get(String(item.payment_intent_id || '').trim()) || null
      : null,
    id: String(item.id),
    startAtValue: String(item.start_at || ''),
    startAtLabel: new Date(String(item.start_at)).toLocaleString('es-UY', {
      timeZone: shopTimeZone,
    }),
    customerName: String(
      (item as { customer_name_snapshot?: string | null }).customer_name_snapshot ||
        (item.customers as { name?: string } | null)?.name ||
        'Sin nombre',
    ),
    customerPhone: String(
      (item as { customer_phone_snapshot?: string | null }).customer_phone_snapshot ||
        (item.customers as { phone?: string } | null)?.phone ||
        '',
    ),
    serviceName: String((item.services as { name?: string } | null)?.name || 'Servicio'),
    staffName: String((item.staff as { name?: string } | null)?.name || 'Barbero'),
    sourceChannelLabel: sourceChannelLabel(
      resolveSourceChannel(
        (item as { source_channel?: string | null }).source_channel || null,
        item.notes,
      ),
    ),
    status: String(item.status),
    priceCents: Number(item.price_cents || 0),
    priceLabel: formatCurrency(Number(item.price_cents || 0)),
  }));
  const sortedAppointmentRows = sortAppointmentRows(
    allAppointmentRows,
    requestedSortBy,
    requestedSortDir,
  );
  const totalAppointments = sortedAppointmentRows.length;
  const totalPages = Math.max(1, Math.ceil(totalAppointments / pageSize));
  const currentPage = Math.min(parsePositiveInt(params.page, 1), totalPages);
  const currentQueryState: AdminAppointmentsQueryState = {
    shopSlug: ctx.shopSlug,
    from,
    to,
    selectedView: viewMode,
    ...(selectedStaffId ? { selectedStaffId } : {}),
    ...(selectedStatus ? { selectedStatus } : {}),
    page: currentPage,
    pageSize,
    sortBy: requestedSortBy,
    sortDir: requestedSortDir,
  };
  const paginatedAppointmentRows = sortedAppointmentRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const pageStart = totalAppointments === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = totalAppointments === 0 ? 0 : Math.min(currentPage * pageSize, totalAppointments);

  return (
    <section className="space-y-5">
      <div className="section-hero px-6 py-7 md:px-8 md:py-9">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="hero-eyebrow">Citas</p>
            <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold text-ink md:text-[2.3rem] dark:text-slate-100">
              Control de reservas y estados
            </h1>
            <p className="mt-3 text-sm text-slate/80 dark:text-slate-300">
              Filtra reservas y actualiza estados. Por defecto se muestran las proximas 4 semanas.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Total
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
                {appointments.length}
              </p>
            </div>
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Pendientes
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
                {pendingCount}
              </p>
            </div>
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Realizadas
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
                {doneCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <AdminAppointmentsFilters
        shopSlug={ctx.shopSlug}
        from={from}
        to={to}
        selectedView={viewMode}
        selectedStaffId={selectedStaffId}
        selectedStatus={selectedStatus}
        selectedPageSize={pageSize}
        selectedSortBy={requestedSortBy}
        selectedSortDir={requestedSortDir}
        staff={(staff || []).map((item) => ({
          id: String(item.id),
          name: String(item.name),
        }))}
      />

      <Card className="spotlight-card soft-panel rounded-[1.8rem] border-0 shadow-none">
        <CardBody className="p-5">
          <h3 className="text-xl font-semibold text-ink dark:text-slate-100">
            Registrar reserva manual
          </h3>
          <p className="text-sm text-slate/80 dark:text-slate-300">
            Crea turnos de clientes presenciales o cargados desde el panel.
          </p>

          {!hasManualBookingOptions ? (
            <p className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Necesitas al menos un barbero activo y un servicio activo para registrar reservas.
            </p>
          ) : null}

          <form action={createManualAppointmentAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <input type="hidden" name="shop_id" value={ctx.shopId} />
            <select
              name="source_channel"
              required
              defaultValue="WALK_IN"
              disabled={!hasManualBookingOptions}
              className="rounded-2xl border border-white/55 bg-white/55 px-4 py-3 text-sm text-ink outline-none transition focus:border-sky-400 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
            >
              <option value="WALK_IN">Presencial</option>
              <option value="ADMIN_CREATED">Carga manual</option>
            </select>

            <select
              name="service_id"
              required
              disabled={!hasManualBookingOptions}
              defaultValue=""
              className="rounded-2xl border border-white/55 bg-white/55 px-4 py-3 text-sm text-ink outline-none transition focus:border-sky-400 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
            >
              <option value="" disabled>
                Servicio
              </option>
              {(services || []).map((item) => (
                <option key={String(item.id)} value={String(item.id)}>
                  {String(item.name)}
                </option>
              ))}
            </select>

            <select
              name="staff_id"
              required
              disabled={!hasManualBookingOptions}
              defaultValue=""
              className="rounded-2xl border border-white/55 bg-white/55 px-4 py-3 text-sm text-ink outline-none transition focus:border-sky-400 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
            >
              <option value="" disabled>
                Barbero
              </option>
              {(staff || []).map((item) => (
                <option key={String(item.id)} value={String(item.id)}>
                  {String(item.name)}
                </option>
              ))}
            </select>

            <input
              name="start_at"
              type="datetime-local"
              required
              defaultValue={defaultManualStartAt}
              disabled={!hasManualBookingOptions}
              className="rounded-2xl border border-white/55 bg-white/55 px-4 py-3 text-sm text-ink outline-none transition focus:border-sky-400 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
            />
            <input
              name="customer_name"
              type="text"
              required
              placeholder="Nombre del cliente"
              disabled={!hasManualBookingOptions}
              className="rounded-2xl border border-white/55 bg-white/55 px-4 py-3 text-sm text-ink outline-none transition focus:border-sky-400 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
            />
            <input
              name="customer_phone"
              type="tel"
              required
              placeholder="Telefono"
              disabled={!hasManualBookingOptions}
              className="rounded-2xl border border-white/55 bg-white/55 px-4 py-3 text-sm text-ink outline-none transition focus:border-sky-400 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
            />
            <input
              name="customer_email"
              type="email"
              placeholder="Email (opcional)"
              disabled={!hasManualBookingOptions}
              className="rounded-2xl border border-white/55 bg-white/55 px-4 py-3 text-sm text-ink outline-none transition focus:border-sky-400 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
            />
            <input
              name="notes"
              type="text"
              placeholder="Notas (opcional)"
              disabled={!hasManualBookingOptions}
              className="rounded-2xl border border-white/55 bg-white/55 px-4 py-3 text-sm text-ink outline-none transition focus:border-sky-400 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 md:col-span-2 xl:col-span-1"
            />
            <div className="md:col-span-2 xl:col-span-3">
              <button
                type="submit"
                disabled={!hasManualBookingOptions}
                className="action-primary inline-flex rounded-full px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                Guardar reserva manual
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      <AdminAppointmentsViewSwitcher
        shopId={ctx.shopId}
        appointments={paginatedAppointmentRows}
        initialView={viewMode}
        queryState={currentQueryState}
      />

      <AdminAppointmentsPagination
        totalItems={totalAppointments}
        page={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        pageStart={pageStart}
        pageEnd={pageEnd}
        queryState={currentQueryState}
      />
    </section>
  );
}
