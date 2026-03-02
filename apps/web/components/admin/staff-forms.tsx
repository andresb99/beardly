'use client';

import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import {
  createTimeOffAction,
  upsertStaffAction,
  upsertWorkingHoursAction,
} from '@/app/admin/actions';

interface StaffOption {
  id: string;
  name: string;
}

interface AdminStaffFormsProps {
  shopId: string;
  shopSlug: string;
  staff: StaffOption[];
  weekdays: string[];
}

const adminSelectClassNames = {
  trigger:
    'min-h-14 rounded-2xl border border-transparent bg-white/[0.03] shadow-none data-[hover=true]:border-transparent data-[hover=true]:bg-white/[0.08] data-[focus=true]:border-transparent data-[focus=true]:bg-white/[0.08] data-[open=true]:border-transparent data-[open=true]:bg-white/[0.08]',
  label: 'text-[11px] font-semibold text-slate-400',
  value: 'text-sm font-medium text-slate-100',
  selectorIcon: 'text-slate-400',
  popoverContent: 'rounded-2xl border border-transparent bg-[#0b1527] p-1',
} as const;

export function AdminStaffForms({ shopId, shopSlug, staff, weekdays }: AdminStaffFormsProps) {
  const hasStaff = staff.length > 0;
  const defaultStaffKeys = staff[0]?.id ? [staff[0].id] : [];

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="spotlight-card soft-panel rounded-[1.8rem] border-0 shadow-none">
          <CardBody className="p-5">
            <h3 className="text-xl font-semibold text-ink dark:text-slate-100">
              Alta o edicion de personal
            </h3>
            <p className="text-sm text-slate/80 dark:text-slate-300">
              Alta de personal con una base mas clara para operar el equipo.
            </p>
            <form action={upsertStaffAction} className="mt-4 grid gap-3">
              <input type="hidden" name="shop_id" value={shopId} />
              <input type="hidden" name="shop_slug" value={shopSlug} />
              <Input name="name" label="Nombre" labelPlacement="inside" required />
              <Input name="phone" label="Telefono" labelPlacement="inside" required />
              <Input
                name="auth_user_id"
                label="ID de usuario en Supabase (opcional)"
                labelPlacement="inside"
              />
              <Select
                name="role"
                aria-label="Rol de personal"
                label="Rol"
                labelPlacement="inside"
                classNames={adminSelectClassNames}
                defaultSelectedKeys={['staff']}
              >
                <SelectItem key="staff">Personal</SelectItem>
                <SelectItem key="admin">Administrador</SelectItem>
              </Select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_active" defaultChecked /> Activo
              </label>
              <Button type="submit" className="action-primary w-fit px-5 text-sm font-semibold">
                Guardar personal
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card className="spotlight-card soft-panel rounded-[1.8rem] border-0 shadow-none">
          <CardBody className="p-5">
            <h3 className="text-xl font-semibold text-ink dark:text-slate-100">
              Horarios laborales
            </h3>
            <p className="text-sm text-slate/80 dark:text-slate-300">
              Define disponibilidad semanal sin depender de tablas largas.
            </p>
            {!hasStaff ? (
              <p className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Primero crea al menos un miembro del equipo para asignarle horarios.
              </p>
            ) : null}
            <form action={upsertWorkingHoursAction} className="mt-4 grid gap-3">
              <input type="hidden" name="shop_id" value={shopId} />
              <input type="hidden" name="shop_slug" value={shopSlug} />
              <Select
                name="staff_id"
                aria-label="Selecciona personal"
                label="Personal"
                labelPlacement="inside"
                placeholder="Selecciona personal"
                classNames={adminSelectClassNames}
                defaultSelectedKeys={defaultStaffKeys}
                disallowEmptySelection
                isDisabled={!hasStaff}
                isRequired
              >
                {staff.map((item) => (
                  <SelectItem key={item.id}>{item.name}</SelectItem>
                ))}
              </Select>
              <Select
                name="day_of_week"
                aria-label="Dia de la semana"
                label="Dia"
                labelPlacement="inside"
                classNames={adminSelectClassNames}
                disallowEmptySelection
                isDisabled={!hasStaff}
                isRequired
                defaultSelectedKeys={['1']}
              >
                {weekdays.map((day, index) => (
                  <SelectItem key={String(index)}>{day}</SelectItem>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="working-hours-start-time"
                  name="start_time"
                  type="time"
                  label="Desde"
                  labelPlacement="inside"
                  defaultValue="09:00"
                  classNames={{
                    input: 'temporal-placeholder-hidden',
                  }}
                  isDisabled={!hasStaff}
                  required
                />
                <Input
                  id="working-hours-end-time"
                  name="end_time"
                  type="time"
                  label="Hasta"
                  labelPlacement="inside"
                  defaultValue="17:00"
                  classNames={{
                    input: 'temporal-placeholder-hidden',
                  }}
                  isDisabled={!hasStaff}
                  required
                />
              </div>
              <Button
                type="submit"
                isDisabled={!hasStaff}
                className="action-primary w-fit px-5 text-sm font-semibold"
              >
                Guardar horario
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>

      <Card className="spotlight-card soft-panel rounded-[1.8rem] border-0 shadow-none">
        <CardBody className="p-5">
          <h3 className="text-xl font-semibold text-ink dark:text-slate-100">
            Agregar tiempo no disponible
          </h3>
          <p className="text-sm text-slate/80 dark:text-slate-300">
            Registra bloqueos y excepciones sin romper la lectura del calendario.
          </p>
          {!hasStaff ? (
            <p className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Primero crea al menos un miembro del equipo para registrar bloqueos.
            </p>
          ) : null}
          <form action={createTimeOffAction} className="mt-4 grid gap-3 md:grid-cols-4">
            <input type="hidden" name="shop_id" value={shopId} />
            <input type="hidden" name="shop_slug" value={shopSlug} />
            <Select
              name="staff_id"
              aria-label="Selecciona personal"
              label="Personal"
              labelPlacement="inside"
              placeholder="Selecciona personal"
              classNames={adminSelectClassNames}
              defaultSelectedKeys={defaultStaffKeys}
              disallowEmptySelection
              isDisabled={!hasStaff}
              isRequired
            >
              {staff.map((item) => (
                <SelectItem key={item.id}>{item.name}</SelectItem>
              ))}
            </Select>
            <Input
              id="time-off-start-at"
              name="start_at"
              type="datetime-local"
              label="Inicio"
              labelPlacement="inside"
              classNames={{
                input: 'temporal-placeholder-hidden',
              }}
              isDisabled={!hasStaff}
              required
            />
            <Input
              id="time-off-end-at"
              name="end_at"
              type="datetime-local"
              label="Fin"
              labelPlacement="inside"
              classNames={{
                input: 'temporal-placeholder-hidden',
              }}
              isDisabled={!hasStaff}
              required
            />
            <Input name="reason" label="Motivo" labelPlacement="inside" isDisabled={!hasStaff} />
            <div className="md:col-span-4">
              <Button
                type="submit"
                isDisabled={!hasStaff}
                className="action-primary px-5 text-sm font-semibold"
              >
                Agregar bloqueo
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
}
