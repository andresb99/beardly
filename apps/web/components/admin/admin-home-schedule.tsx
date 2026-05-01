'use client';

import { useMemo, useState } from 'react';
import { Button } from '@heroui/button';
import { Select, SelectItem, Input, Textarea, Avatar } from '@heroui/react';
import { Calendar, type CalendarEvent } from '@/components/calendar/calendar';
import { formatCurrency } from '@navaja/shared';

export interface AdminHomeScheduleStaffItem {
  id: string;
  name: string;
}

export interface AdminHomeScheduleServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
}

export interface AdminHomeScheduleEvent extends CalendarEvent {
  resourceId: string;
  resourceName?: string | undefined;
  serviceId?: string;
  customerName?: string;
}

interface AdminHomeScheduleProps {
  staff: AdminHomeScheduleStaffItem[];
  services: AdminHomeScheduleServiceItem[];
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
  services,
  events,
  startHour,
  endHour,
  initialDate,
  availableRangeStart,
  availableRangeEndExclusive,
}: AdminHomeScheduleProps) {
  const [draftEvent, setDraftEvent] = useState<AdminHomeScheduleEvent | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

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

  const finalVisibleEvents = useMemo(() => {
    if (draftEvent && (selectedStaffId === ALL_STAFF_ID || draftEvent.resourceId === selectedStaffId)) {
      return [...visibleEvents, draftEvent];
    }
    return visibleEvents;
  }, [visibleEvents, draftEvent, selectedStaffId]);

  const activeTitle = 'AGENDA DIARIA';
  const activeDescription =
    selectedStaffId === ALL_STAFF_ID
      ? 'Equipo completo'
      : selectedStaff?.name || 'Profesional';
  const visibleStaffCount = selectedStaffId === ALL_STAFF_ID ? staff.length : 1;

  const renderPopover = (event: CalendarEvent, onClose: () => void) => {
    const isDraft = event.id.startsWith('draft-');
    const adminEvent = finalVisibleEvents.find(e => e.id === event.id);

    return (
      <div className="bg-[#1f1f23] border border-white/10 shadow-2xl rounded-2xl w-[calc(100vw-2rem)] md:w-[420px] overflow-hidden">
        <div className="px-4 py-5 md:px-5 md:py-6 space-y-4 md:space-y-5">
          {/* Header with status types */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Button size="sm" radius="full" className="bg-violet-500/20 text-violet-300 px-4 h-7 text-[11px] font-bold border border-violet-500/20">TURNO</Button>
            <Button size="sm" radius="full" variant="light" className="text-slate-400 hover:bg-white/5 px-4 h-7 text-[11px] font-medium">AUSENCIA</Button>
            <Button size="sm" radius="full" variant="light" className="text-slate-400 hover:bg-white/5 px-4 h-7 text-[11px] font-medium">BLOQUEO</Button>
          </div>

          {/* Client Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">Cliente</label>
            <Input
              placeholder="Buscar o agregar cliente..."
              variant="flat"
              defaultValue={adminEvent?.customerName || ""}
              classNames={{
                inputWrapper: "bg-white/5 border border-white/5 hover:bg-white/10 focus-within:!bg-white/10 transition-colors h-12 rounded-xl",
                input: "text-[15px] text-white placeholder:text-slate-500",
              }}
              startContent={
                <div className="text-slate-400 mr-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
              }
            />
          </div>

          {/* Service and Staff Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">Servicio</label>
              <Select
                placeholder="Elegir servicio"
                variant="flat"
                classNames={{
                  trigger: "bg-white/5 border border-white/5 hover:bg-white/10 transition-colors h-12 rounded-xl",
                  value: "text-[14px] text-white",
                  popoverContent: "bg-[#1f1f23] border border-white/10",
                }}
                defaultSelectedKeys={adminEvent?.serviceId ? [adminEvent.serviceId] : []}
              >
                {services.map((service) => (
                  <SelectItem key={service.id} textValue={service.name}>
                    <div className="flex flex-col">
                      <span className="text-sm text-white font-medium">{service.name}</span>
                      <span className="text-xs text-slate-500">{service.durationMinutes} min • {formatCurrency(service.priceCents)}</span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">Barbero</label>
              <Select
                placeholder="Asignar barbero"
                variant="flat"
                classNames={{
                  trigger: "bg-white/5 border border-white/5 hover:bg-white/10 transition-colors h-12 rounded-xl",
                  value: "text-[14px] text-white",
                  popoverContent: "bg-[#1f1f23] border border-white/10",
                }}
                defaultSelectedKeys={adminEvent?.resourceId ? [adminEvent.resourceId] : [staff[0].id]}
              >
                {staff.map((s) => (
                  <SelectItem key={s.id} textValue={s.name}>
                    <div className="flex items-center gap-2">
                      <Avatar name={s.name} size="sm" className="w-5 h-5 text-[10px]" />
                      <span className="text-sm text-white font-medium">{s.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>

          {/* Time and Date */}
          <div className="flex items-center gap-4 py-1 text-slate-300">
            <div className="w-5 flex justify-center text-slate-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div>
              <p className="text-[14px] text-slate-200 font-medium">
                {(() => {
                  const formatter = new Intl.DateTimeFormat('es-UY', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
                  const endFormatter = new Intl.DateTimeFormat('es-UY', { hour: 'numeric', minute: '2-digit' });
                  return `${formatter.format(event.start)} – ${endFormatter.format(event.end)}`;
                })()}
              </p>
              <p className="text-[12px] text-slate-500 mt-0.5">Zona horaria de Montevideo (GMT-3)</p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">Notas internas</label>
            <Textarea
              placeholder="Ej: El cliente prefiere degradado con navaja..."
              variant="flat"
              minRows={2}
              classNames={{
                inputWrapper: "bg-white/5 border border-white/5 hover:bg-white/10 focus-within:!bg-white/10 transition-colors rounded-xl",
                input: "text-[14px] text-white placeholder:text-slate-500",
              }}
            />
          </div>
        </div>
        
        {/* Footer actions */}
        <div className="px-5 py-4 bg-white/[0.03] border-t border-white/10 flex justify-between items-center">
          {!isDraft ? (
             <Button 
               radius="full" 
               size="sm"
               variant="light" 
               className="text-red-400 font-semibold px-4 hover:bg-red-500/10 h-9"
               onPress={onClose}
             >
               Cancelar turno
             </Button>
          ) : (
             <Button 
                radius="full" 
                size="sm"
                variant="light" 
                className="text-slate-400 font-semibold px-4 hover:bg-white/5 h-9"
                onPress={onClose}
              >
                Descartar
              </Button>
          )}
          <div className="flex gap-2">
             <Button 
               radius="full" 
               size="sm"
               variant="flat" 
               className="bg-white/5 text-slate-300 font-semibold px-4 hover:bg-white/10 h-9 border border-white/5"
               onPress={onClose}
             >
               Más opciones
             </Button>
             <Button 
               radius="full" 
               size="sm"
               className="bg-[#c084fc] text-[#1a1130] font-bold px-6 h-9 shadow-lg shadow-violet-500/30 hover:scale-[1.02] transition-transform"
               onPress={onClose}
             >
               Guardar Reserva
             </Button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <Calendar
      events={finalVisibleEvents}
      startHour={startHour}
      endHour={endHour}
      initialDate={initialDate}
      initialView="day"
      locale="es-UY"
      title={activeTitle}
      description={activeDescription}
      availableRangeStart={availableRangeStart}
      availableRangeEndExclusive={availableRangeEndExclusive}
      selectedEventId={selectedEventId}
      renderEventPopover={renderPopover}
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
      onEventClick={(event) => {
        setDraftEvent(null);
        setSelectedEventId(event.id);
      }}
      onEventClose={() => {
        setSelectedEventId(null);
        setDraftEvent(null);
      }}
      onSlotClick={(date) => {
        const resourceId = selectedStaffId === ALL_STAFF_ID ? staff[0].id : selectedStaffId;
        const newDraftId = `draft-${Date.now()}`;
        
        const newDraft: AdminHomeScheduleEvent = {
          id: newDraftId,
          title: '(Nueva reserva)',
          start: date,
          end: new Date(date.getTime() + 30 * 60000),
          resourceId,
          resourceName: staff.find(s => s.id === resourceId)?.name,
          status: 'pending',
          tone: 'neutral',
        };
        
        setDraftEvent(newDraft);
        setSelectedEventId(newDraftId);
      }}
    />
  );
}
