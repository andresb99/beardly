export type AdminAppointmentsViewMode = 'table' | 'cards';
export type AdminAppointmentsSortField =
  | 'start_at'
  | 'customer'
  | 'service'
  | 'staff'
  | 'channel'
  | 'status'
  | 'payment'
  | 'price';
export type AdminAppointmentsSortDir = 'asc' | 'desc';

export interface AdminAppointmentsQueryState {
  shopSlug: string;
  from: string;
  to: string;
  selectedView?: AdminAppointmentsViewMode;
  selectedStaffId?: string;
  selectedStatus?: string;
  page: number;
  pageSize: number;
  sortBy: AdminAppointmentsSortField;
  sortDir: AdminAppointmentsSortDir;
}

export const ADMIN_APPOINTMENTS_DEFAULT_SORT_BY: AdminAppointmentsSortField = 'start_at';
export const ADMIN_APPOINTMENTS_DEFAULT_SORT_DIR: AdminAppointmentsSortDir = 'asc';
export const ADMIN_APPOINTMENTS_DEFAULT_PAGE_SIZE = 25;
export const ADMIN_APPOINTMENTS_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const ADMIN_APPOINTMENTS_SORT_OPTIONS: Array<{
  id: AdminAppointmentsSortField;
  label: string;
}> = [
  { id: 'start_at', label: 'Fecha de la cita' },
  { id: 'customer', label: 'Cliente' },
  { id: 'service', label: 'Servicio' },
  { id: 'staff', label: 'Barbero' },
  { id: 'channel', label: 'Canal' },
  { id: 'status', label: 'Estado' },
  { id: 'payment', label: 'Pago' },
  { id: 'price', label: 'Precio' },
];

export function buildAdminAppointmentsQueryString(
  state: AdminAppointmentsQueryState,
  overrides?: Partial<AdminAppointmentsQueryState>,
) {
  const merged = {
    ...state,
    ...overrides,
  };
  const params = new URLSearchParams();

  params.set('shop', merged.shopSlug);
  params.set('from', merged.from);
  params.set('to', merged.to);
  params.set('page', String(Math.max(1, Number(merged.page) || 1)));
  params.set(
    'page_size',
    String(Math.max(1, Number(merged.pageSize) || ADMIN_APPOINTMENTS_DEFAULT_PAGE_SIZE)),
  );
  params.set('sort_by', merged.sortBy);
  params.set('sort_dir', merged.sortDir);

  if (merged.selectedView === 'cards') {
    params.set('view', 'cards');
  }

  if (merged.selectedStaffId) {
    params.set('staff_id', merged.selectedStaffId);
  }

  if (merged.selectedStatus) {
    params.set('status', merged.selectedStatus);
  }

  return params.toString();
}

export function isAdminAppointmentsSortField(value: unknown): value is AdminAppointmentsSortField {
  return ADMIN_APPOINTMENTS_SORT_OPTIONS.some((option) => option.id === value);
}

export function isAdminAppointmentsSortDir(value: unknown): value is AdminAppointmentsSortDir {
  return value === 'asc' || value === 'desc';
}
