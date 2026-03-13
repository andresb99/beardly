'use client';

import { useMemo, useState } from 'react';
import { Button } from '@heroui/button';
import { Calendar, type CalendarEvent } from '@/components/calendar/calendar';

export interface AdminHomeScheduleStaffItem {
  id: string;
  name: string;
}

export interface AdminHomeScheduleEvent extends CalendarEvent {
  resourceId: string;
  resourceName?: string | undefined;
}

interface AdminHomeScheduleProps {
  staff: AdminHomeScheduleStaffItem[];
  events: AdminHomeScheduleEvent[];
  startHour: number;
  endHour: number;
  initialDate: Date;
  availableRangeStart?: Date;
  availableRangeEndExclusive?: Date;
}

const ALL_STAFF_ID = 'all';

export function AdminHomeSchedule({
  staff,
  events,
  startHour,
  endHour,
  initialDate,
  availableRangeStart,
  availableRangeEndExclusive,
}: AdminHomeScheduleProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    staff.length > 1 ? ALL_STAFF_ID : (staff[0]?.id || ALL_STAFF_ID),
  );

  const selectedStaff = useMemo(
    () => staff.find((item) => item.id === selectedStaffId) || null,
    [selectedStaffId, staff],
  );
  const filteredEvents = useMemo(
    () =>
      events.filter((event) => selectedStaffId === ALL_STAFF_ID || event.resourceId === selectedStaffId),
    [events, selectedStaffId],
  );
  const visibleEvents = useMemo(
    () =>
      filteredEvents.map((event) =>
        selectedStaffId === ALL_STAFF_ID
          ? event
          : {
              ...event,
              resourceName: undefined,
            },
      ),
    [filteredEvents, selectedStaffId],
  );
  const activeTitle =
    selectedStaffId === ALL_STAFF_ID
      ? 'Agenda operativa del equipo'
      : `Agenda de ${selectedStaff?.name || 'este barbero'}`;
  const activeDescription =
    selectedStaffId === ALL_STAFF_ID
      ? 'Mira toda la semana en un solo plano o filtra por barbero para leer la carga individual.'
      : 'Filtrado individual para revisar reservas, huecos y ausencias del profesional seleccionado.';
  const visibleStaffCount = selectedStaffId === ALL_STAFF_ID ? staff.length : 1;

  return (
    <Calendar
      events={visibleEvents}
      startHour={startHour}
      endHour={endHour}
      initialDate={initialDate}
      locale="es-UY"
      title={activeTitle}
      description={activeDescription}
      availableRangeStart={availableRangeStart}
      availableRangeEndExclusive={availableRangeEndExclusive}
      headerAddon={
        <div className="rounded-[1.4rem] bg-white/[0.035] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] dark:bg-white/[0.02] dark:shadow-none md:rounded-[1.55rem] md:p-3.5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="meta-chip border-transparent bg-white/8 text-slate/76 dark:bg-white/[0.03] dark:text-violet-100/82">
                  {visibleStaffCount} barberos visibles
                </span>
              </div>
              <p className="hidden text-xs text-slate/74 dark:text-slate-300/78 md:block">
                Filtra sin salir del resumen para leer la agenda completa o la carga individual de cada profesional.
              </p>
            </div>

            <div className="-mx-1 overflow-x-auto px-1 pb-1 md:mx-0 md:overflow-visible md:px-0 md:pb-0">
              <div className="inline-flex min-w-max flex-nowrap gap-2 rounded-[1.2rem] bg-white/[0.04] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:bg-white/[0.018] dark:shadow-none md:flex-wrap md:rounded-[1.25rem]">
                {staff.length > 1 ? (
                  <Button
                    radius="full"
                    size="sm"
                    variant="flat"
                    className={`h-10 border px-4 text-xs font-semibold uppercase tracking-[0.12em] ${
                      selectedStaffId === ALL_STAFF_ID
                        ? 'border-transparent bg-white/14 text-ink shadow-[0_12px_20px_-18px_rgba(15,23,42,0.14)] dark:bg-violet-500/[0.16] dark:text-violet-50'
                        : 'border-transparent bg-transparent text-slate/76 dark:text-slate-200/78'
                    }`}
                    onPress={() => setSelectedStaffId(ALL_STAFF_ID)}
                  >
                    Todos
                  </Button>
                ) : null}

                {staff.map((item) => (
                  <Button
                    key={item.id}
                    radius="full"
                    size="sm"
                    variant="flat"
                    className={`h-10 border px-4 text-xs font-semibold ${
                      selectedStaffId === item.id
                        ? 'border-transparent bg-white/14 text-ink shadow-[0_12px_20px_-18px_rgba(15,23,42,0.14)] dark:bg-violet-500/[0.16] dark:text-violet-50'
                        : 'border-transparent bg-transparent text-slate/76 dark:text-slate-200/78'
                    }`}
                    onPress={() => setSelectedStaffId(item.id)}
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
