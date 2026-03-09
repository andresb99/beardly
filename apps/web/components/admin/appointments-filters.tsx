'use client';

import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import {
  ADMIN_APPOINTMENTS_PAGE_SIZE_OPTIONS,
  ADMIN_APPOINTMENTS_SORT_OPTIONS,
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
  const staffOptions = [{ id: 'all', name: 'Todo el equipo' }, ...staff];
  const statusOptions = [
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Pendiente' },
    { id: 'confirmed', label: 'Confirmada' },
    { id: 'cancelled', label: 'Cancelada' },
    { id: 'no_show', label: 'No asistio' },
    { id: 'done', label: 'Realizada' },
  ];

  return (
    <form
      className="spotlight-card soft-panel grid gap-3 rounded-[1.8rem] border-0 p-4 md:grid-cols-2 xl:grid-cols-4"
      method="get"
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
          className="action-primary h-14 min-h-[56px] w-full px-4 text-sm font-semibold leading-none"
        >
          Aplicar filtros
        </Button>
      </div>
    </form>
  );
}
