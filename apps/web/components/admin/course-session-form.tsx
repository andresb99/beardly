'use client';

import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { upsertCourseSessionAction } from '@/app/admin/actions';

interface CourseOption {
  id: string;
  title: string;
}

const adminSelectClassNames = {
  trigger:
    'min-h-14 rounded-2xl border border-white/8 bg-white/[0.03] shadow-none data-[hover=true]:border-white/12 data-[hover=true]:bg-white/[0.05] data-[focus=true]:border-white/12 data-[focus=true]:bg-white/[0.05] data-[open=true]:border-white/12 data-[open=true]:bg-white/[0.05]',
  label: 'text-[11px] font-semibold text-slate-400',
  value: 'text-sm font-medium text-slate-100',
  selectorIcon: 'text-slate-400',
  popoverContent: 'rounded-2xl border border-white/10 bg-[#091120]/92 p-1',
} as const;

export function AdminCourseSessionForm({ courses }: { courses: CourseOption[] }) {
  return (
    <form action={upsertCourseSessionAction} className="mt-4 grid gap-3">
      <Select
        name="course_id"
        aria-label="Curso"
        label="Curso"
        labelPlacement="inside"
        placeholder="Selecciona curso"
        classNames={adminSelectClassNames}
        isRequired
      >
        {courses.map((item) => (
          <SelectItem key={String(item.id)}>{String(item.title)}</SelectItem>
        ))}
      </Select>
      <Input
        id="course-session-start-at"
        name="start_at"
        type="datetime-local"
        label="Inicio"
        labelPlacement="inside"
        classNames={{
          input: 'temporal-placeholder-hidden',
        }}
        required
      />
      <Input
        name="capacity"
        type="number"
        label="Capacidad"
        labelPlacement="inside"
        defaultValue="10"
        required
      />
      <Input name="location" label="Lugar" labelPlacement="inside" required />
      <Select
        name="status"
        aria-label="Estado de sesion"
        label="Estado"
        labelPlacement="inside"
        classNames={adminSelectClassNames}
        defaultSelectedKeys={['scheduled']}
      >
        <SelectItem key="scheduled">Programada</SelectItem>
        <SelectItem key="cancelled">Cancelada</SelectItem>
        <SelectItem key="completed">Finalizada</SelectItem>
      </Select>
      <Button type="submit" className="action-primary w-fit px-5 text-sm font-semibold">
        Guardar sesion
      </Button>
    </form>
  );
}
