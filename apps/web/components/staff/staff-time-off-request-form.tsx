import { Button } from '@heroui/button';
import { createStaffTimeOffRequestAction } from '@/app/admin/actions';
import { SurfaceDateTimePicker, SurfaceInput } from '@/components/heroui/surface-field';

interface StaffTimeOffRequestFormProps {
  shopId: string;
}

export function StaffTimeOffRequestForm({ shopId }: StaffTimeOffRequestFormProps) {
  return (
    <form action={createStaffTimeOffRequestAction} className="grid gap-3">
      <input type="hidden" name="shop_id" value={shopId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <SurfaceDateTimePicker
          id="staff-time-off-start-at"
          name="start_at"
          label="Inicio"
          labelPlacement="inside"
          isRequired
        />
        <SurfaceDateTimePicker
          id="staff-time-off-end-at"
          name="end_at"
          label="Fin"
          labelPlacement="inside"
          isRequired
        />
      </div>

      <SurfaceInput
        name="reason"
        type="text"
        label="Motivo"
        labelPlacement="inside"
        placeholder="Motivo de la ausencia"
      />

      <Button
        type="submit"
        className="action-primary inline-flex w-fit rounded-full px-5 py-2.5 text-sm font-semibold"
      >
        Enviar solicitud
      </Button>
    </form>
  );
}
