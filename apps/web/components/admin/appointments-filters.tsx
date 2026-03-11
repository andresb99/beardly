'use client';

import type { FormEvent } from 'react';
import { useCallback, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import {
  ADMIN_APPOINTMENTS_PAGE_SIZE_OPTIONS,
  ADMIN_APPOINTMENTS_SORT_OPTIONS,
  buildAdminAppointmentsQueryString,
  type AdminAppointmentsQueryState,
  type AdminAppointmentsSortDir,
  type AdminAppointmentsSortField,
} from '@/lib/admin-appointments';
import { AdminSelect } from '@/components/heroui/admin-select';
import { SurfaceInput } from '@/components/heroui/surface-field';

interface StaffOption {
  id: string;
  name: string;
}

interface AdminAppointmentsFiltersProps {
  shopSlug: string;
  from: string;
  to: string;
  selectedView?: 'table' | 'cards';
  selectedStaffId?: string | undefined;
  selectedStatus?: string | undefined;
  selectedPageSize: number;
  selectedSortBy: AdminAppointmentsSortField;
  selectedSortDir: AdminAppointmentsSortDir;
  staff: StaffOption[];
}

export function AdminAppointmentsFilters({
  shopSlug,
  from,
  to,
  selectedView,
  selectedStaffId,
  selectedStatus,
  selectedPageSize,
  selectedSortBy,
  selectedSortDir,
  staff,
}: AdminAppointmentsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const staffOptions = [
    { key: 'all', label: 'Todo el equipo' },
    ...staff.map((item) => ({ key: item.id, label: item.name })),
  ];
  const statusOptions = [
    { key: 'all', label: 'Todos' },
    { key: 'pending', label: 'Pendiente' },
    { key: 'confirmed', label: 'Confirmada' },
    { key: 'cancelled', label: 'Cancelada' },
    { key: 'no_show', label: 'No asistio' },
    { key: 'done', label: 'Realizada' },
  ];
  const sortOptions = ADMIN_APPOINTMENTS_SORT_OPTIONS.map((item) => ({
    key: item.id,
    label: item.label,
  }));
  const pageSizeOptions = ADMIN_APPOINTMENTS_PAGE_SIZE_OPTIONS.map((value) => ({
    key: String(value),
    label: `${value} por pagina`,
  }));
  const formKey = [
    shopSlug,
    from,
    to,
    selectedView || 'table',
    selectedStaffId || 'all',
    selectedStatus || 'all',
    selectedPageSize,
    selectedSortBy,
    selectedSortDir,
  ].join('|');
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const staffIdValue = String(formData.get('staff_id') || 'all');
      const statusValue = String(formData.get('status') || 'all');
      const nextQueryState: AdminAppointmentsQueryState = {
        shopSlug,
        from: String(formData.get('from') || from),
        to: String(formData.get('to') || to),
        selectedView:
          String(formData.get('view') || selectedView || 'table') === 'cards' ? 'cards' : 'table',
        page: 1,
        pageSize:
          Number.parseInt(String(formData.get('page_size') || selectedPageSize), 10) ||
          selectedPageSize,
        sortBy: String(formData.get('sort_by') || selectedSortBy) as AdminAppointmentsSortField,
        sortDir: String(formData.get('sort_dir') || selectedSortDir) as AdminAppointmentsSortDir,
        ...(staffIdValue !== 'all' ? { selectedStaffId: staffIdValue } : {}),
        ...(statusValue !== 'all' ? { selectedStatus: statusValue } : {}),
      };

      startTransition(() => {
        router.replace(`${pathname}?${buildAdminAppointmentsQueryString(nextQueryState)}`, {
          scroll: false,
        });
      });
    },
    [
      from,
      pathname,
      router,
      selectedPageSize,
      selectedSortBy,
      selectedSortDir,
      selectedStatus,
      selectedStaffId,
      selectedView,
      shopSlug,
      to,
    ],
  );

  return (
    <form
      key={formKey}
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
      method="get"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="shop" value={shopSlug} />
      <input type="hidden" name="page" value="1" />
      {selectedView === 'cards' ? <input type="hidden" name="view" value="cards" /> : null}
      <SurfaceInput
        id="from"
        name="from"
        type="date"
        label="Desde"
        labelPlacement="inside"
        defaultValue={from}
        uiVariant="temporal"
      />

      <SurfaceInput
        id="to"
        name="to"
        type="date"
        label="Hasta"
        labelPlacement="inside"
        defaultValue={to}
        uiVariant="temporal"
      />

      <AdminSelect
        id="staff"
        name="staff_id"
        aria-label="Filtrar por equipo"
        label="Equipo"
        labelPlacement="inside"
        defaultSelectedKeys={[selectedStaffId || 'all']}
        options={staffOptions}
      />

      <AdminSelect
        id="status"
        name="status"
        aria-label="Filtrar por estado"
        label="Estado"
        labelPlacement="inside"
        defaultSelectedKeys={[selectedStatus || 'all']}
        options={statusOptions}
      />

      <AdminSelect
        id="sort_by"
        name="sort_by"
        aria-label="Ordenar por"
        label="Ordenar por"
        labelPlacement="inside"
        defaultSelectedKeys={[selectedSortBy]}
        options={sortOptions}
      />

      <AdminSelect
        id="sort_dir"
        name="sort_dir"
        aria-label="Direccion del orden"
        label="Direccion"
        labelPlacement="inside"
        defaultSelectedKeys={[selectedSortDir]}
        options={[
          { key: 'asc', label: 'Menor a mayor' },
          { key: 'desc', label: 'Mayor a menor' },
        ]}
      />

      <AdminSelect
        id="page_size"
        name="page_size"
        aria-label="Cantidad por pagina"
        label="Por pagina"
        labelPlacement="inside"
        defaultSelectedKeys={[String(selectedPageSize)]}
        options={pageSizeOptions}
      />

      <div className="flex items-end md:col-span-2 xl:col-span-4 xl:justify-end">
        <Button
          type="submit"
          isLoading={isPending}
          className="action-primary h-12 min-h-[48px] w-full px-4 text-sm font-semibold leading-none sm:w-auto sm:min-w-[12rem]"
        >
          Aplicar filtros
        </Button>
      </div>
    </form>
  );
}
