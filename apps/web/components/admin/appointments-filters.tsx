'use client';

import type { FormEvent } from 'react';
import { useCallback, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import {
  ADMIN_APPOINTMENTS_PAGE_SIZE_OPTIONS,
  ADMIN_APPOINTMENTS_SORT_OPTIONS,
  buildAdminAppointmentsQueryString,
  type AdminAppointmentsQueryState,
  type AdminAppointmentsSortDir,
  type AdminAppointmentsSortField,
} from '@/lib/admin-appointments';

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
  const staffOptions = [{ id: 'all', name: 'Todo el equipo' }, ...staff];
  const statusOptions = [
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Pendiente' },
    { id: 'confirmed', label: 'Confirmada' },
    { id: 'cancelled', label: 'Cancelada' },
    { id: 'no_show', label: 'No asistio' },
    { id: 'done', label: 'Realizada' },
  ];
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
        pageSize: Number.parseInt(String(formData.get('page_size') || selectedPageSize), 10) || selectedPageSize,
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
      className="spotlight-card soft-panel grid gap-3 rounded-[1.8rem] border-0 p-4 md:grid-cols-2 xl:grid-cols-4"
      method="get"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="shop" value={shopSlug} />
      <input type="hidden" name="page" value="1" />
      {selectedView === 'cards' ? <input type="hidden" name="view" value="cards" /> : null}
      <Input
        id="from"
        name="from"
        type="date"
        label="Desde"
        labelPlacement="inside"
        defaultValue={from}
        classNames={{
          input: 'temporal-placeholder-hidden',
        }}
      />

      <Input
        id="to"
        name="to"
        type="date"
        label="Hasta"
        labelPlacement="inside"
        defaultValue={to}
        classNames={{
          input: 'temporal-placeholder-hidden',
        }}
      />

      <Select
        id="staff"
        name="staff_id"
        aria-label="Filtrar por equipo"
        label="Equipo"
        labelPlacement="inside"
        defaultSelectedKeys={[selectedStaffId || 'all']}
      >
        {staffOptions.map((item) => (
          <SelectItem key={item.id}>{item.name}</SelectItem>
        ))}
      </Select>

      <Select
        id="status"
        name="status"
        aria-label="Filtrar por estado"
        label="Estado"
        labelPlacement="inside"
        defaultSelectedKeys={[selectedStatus || 'all']}
      >
        {statusOptions.map((item) => (
          <SelectItem key={item.id}>{item.label}</SelectItem>
        ))}
      </Select>

      <Select
        id="sort_by"
        name="sort_by"
        aria-label="Ordenar por"
        label="Ordenar por"
        labelPlacement="inside"
        defaultSelectedKeys={[selectedSortBy]}
      >
        {ADMIN_APPOINTMENTS_SORT_OPTIONS.map((item) => (
          <SelectItem key={item.id}>{item.label}</SelectItem>
        ))}
      </Select>

      <Select
        id="sort_dir"
        name="sort_dir"
        aria-label="Direccion del orden"
        label="Direccion"
        labelPlacement="inside"
        defaultSelectedKeys={[selectedSortDir]}
      >
        <SelectItem key="asc">Menor a mayor</SelectItem>
        <SelectItem key="desc">Mayor a menor</SelectItem>
      </Select>

      <Select
        id="page_size"
        name="page_size"
        aria-label="Cantidad por pagina"
        label="Por pagina"
        labelPlacement="inside"
        defaultSelectedKeys={[String(selectedPageSize)]}
      >
        {ADMIN_APPOINTMENTS_PAGE_SIZE_OPTIONS.map((value) => (
          <SelectItem key={String(value)}>{`${value} por pagina`}</SelectItem>
        ))}
      </Select>

      <div className="flex items-end">
        <Button
          type="submit"
          isLoading={isPending}
          className="action-primary h-14 min-h-[56px] w-full px-4 text-sm font-semibold leading-none"
        >
          Aplicar filtros
        </Button>
      </div>
    </form>
  );
}
