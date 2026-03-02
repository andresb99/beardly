'use client';

import { Button } from '@heroui/button';
import { Input, Textarea } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { upsertCourseAction } from '@/app/admin/actions';

interface AdminCourseFormProps {
  shopId: string;
  shopSlug: string;
}

const courseLevelOptions = ['Inicial', 'Intermedio', 'Avanzado', 'Masterclass'] as const;

const adminSelectClassNames = {
  trigger:
    'min-h-14 rounded-2xl border border-white/8 bg-white/[0.03] shadow-none data-[hover=true]:border-white/12 data-[hover=true]:bg-white/[0.05] data-[focus=true]:border-white/12 data-[focus=true]:bg-white/[0.05] data-[open=true]:border-white/12 data-[open=true]:bg-white/[0.05]',
  label: 'text-[11px] font-semibold text-slate-400',
  value: 'text-sm font-medium text-slate-100',
  selectorIcon: 'text-slate-400',
  popoverContent: 'rounded-2xl border border-white/10 bg-[#091120]/92 p-1',
} as const;

export function AdminCourseForm({ shopId, shopSlug }: AdminCourseFormProps) {
  return (
    <form action={upsertCourseAction} className="mt-4 grid gap-3">
      <input type="hidden" name="shop_id" value={shopId} />
      <input type="hidden" name="shop_slug" value={shopSlug} />
      <Input
        name="title"
        label="Titulo del curso"
        labelPlacement="inside"
        minLength={3}
        required
      />
      <Textarea
        name="description"
        rows={4}
        label="Descripcion"
        labelPlacement="inside"
        description="Resumen breve para el marketplace. Minimo 6 caracteres."
        minLength={6}
        placeholder="Ej: Tecnicas de fade, visagismo y terminacion profesional."
        required
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Input
          name="price_cents"
          type="number"
          label="Precio (centavos)"
          labelPlacement="inside"
          min={0}
          step={1}
          required
        />
        <Input
          name="duration_hours"
          type="number"
          label="Horas"
          labelPlacement="inside"
          min={1}
          step={1}
          required
        />
        <Select
          name="level"
          aria-label="Nivel del curso"
          label="Nivel"
          labelPlacement="inside"
          classNames={adminSelectClassNames}
          defaultSelectedKeys={['Inicial']}
          disallowEmptySelection
          isRequired
        >
          {courseLevelOptions.map((level) => (
            <SelectItem key={level}>{level}</SelectItem>
          ))}
        </Select>
      </div>
      <Input name="image_url" label="URL de imagen (opcional)" labelPlacement="inside" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked /> Activo
      </label>
      <Button type="submit" className="action-primary w-fit px-5 text-sm font-semibold">
        Guardar curso
      </Button>
    </form>
  );
}
