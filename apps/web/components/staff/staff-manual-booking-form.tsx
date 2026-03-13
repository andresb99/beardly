import { Button } from '@heroui/button';
import { createManualAppointmentAction } from '@/app/admin/actions';
import { AdminSelect } from '@/components/heroui/admin-select';
import { SurfaceDateTimePicker, SurfaceInput } from '@/components/heroui/surface-field';
import type { StaffServiceOption } from '@/lib/staff-portal';

interface StaffManualBookingFormProps {
  shopId: string;
  staffId: string;
  defaultStartAt: string;
  serviceOptions: StaffServiceOption[];
}

export function StaffManualBookingForm({
  shopId,
  staffId,
  defaultStartAt,
  serviceOptions,
}: StaffManualBookingFormProps) {
  const hasServices = serviceOptions.length > 0;

  return (
    <form action={createManualAppointmentAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <input type="hidden" name="shop_id" value={shopId} />
      <input type="hidden" name="staff_id" value={staffId} />
      <input type="hidden" name="source_channel" value="WALK_IN" />

      <AdminSelect
        name="service_id"
        aria-label="Servicio"
        label="Servicio"
        labelPlacement="inside"
        placeholder="Servicio"
        isDisabled={!hasServices}
        isRequired
        options={serviceOptions.map((item) => ({
          key: item.id,
          label: item.name,
        }))}
      />

      <SurfaceDateTimePicker
        name="start_at"
        label="Inicio"
        labelPlacement="inside"
        defaultValue={defaultStartAt}
        isDisabled={!hasServices}
        isRequired
      />
      <SurfaceInput
        name="customer_name"
        type="text"
        label="Cliente"
        labelPlacement="inside"
        placeholder="Nombre del cliente"
        isDisabled={!hasServices}
        isRequired
      />
      <SurfaceInput
        name="customer_phone"
        type="tel"
        label="Telefono"
        labelPlacement="inside"
        placeholder="Telefono"
        isDisabled={!hasServices}
        isRequired
      />
      <SurfaceInput
        name="customer_email"
        type="email"
        label="Email"
        labelPlacement="inside"
        placeholder="Email (opcional)"
        isDisabled={!hasServices}
      />
      <SurfaceInput
        name="notes"
        type="text"
        label="Notas"
        labelPlacement="inside"
        placeholder="Notas (opcional)"
        isDisabled={!hasServices}
        className="xl:col-span-2"
      />

      <div className="md:col-span-2 xl:col-span-4">
        <Button
          type="submit"
          isDisabled={!hasServices}
          className="action-primary inline-flex w-fit rounded-full px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          Guardar walk-in
        </Button>
      </div>
    </form>
  );
}
