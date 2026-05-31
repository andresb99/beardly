'use client';

import { Button } from '@heroui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import type { CalendarEvent } from './calendar';
import { EventCard } from './event-card';

interface MobileTimeGridProps {
  days: Date[];
  events: CalendarEvent[];
  startHour: number;
  endHour: number;
  locale: string;
  onEventClick?: ((event: CalendarEvent) => void) | undefined;
  onEventClose?: (() => void) | undefined;
  onSlotClick?: ((date: Date) => void) | undefined;
  selectedEventId?: string | null | undefined;
  renderEventPopover?: ((event: CalendarEvent, onClose: () => void) => React.ReactNode) | undefined;
}

interface DayEventSegment {
  event: CalendarEvent;
  renderStart: Date;
  renderEnd: Date;
}

interface DayEventLayoutSegment extends DayEventSegment {
  columnIndex: number;
  columnCount: number;
}

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function createDayBoundary(date: Date, hour = 0) {
  const next = new Date(date);
  next.setHours(hour, 0, 0, 0);
  return next;
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatWeekday(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date).replace('.', '');
}

function formatDayNumber(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(date);
}

function formatTimeLabel(totalMinutes: number, locale: string) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = new Date(2026, 0, 1, hours, minutes, 0, 0);

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value);
}

function eventOverlapsDay(event: CalendarEvent, day: Date) {
  const dayStart = startOfDay(day);
  const dayEndExclusive = createDayBoundary(day, 24);

  return event.end.getTime() > dayStart.getTime() && event.start.getTime() < dayEndExclusive.getTime();
}

function resolveInitialSelectedDate(days: Date[]) {
  const today = new Date();
  const todayMatch = days.find((day) => isSameDay(day, today));
  return startOfDay(todayMatch ?? days[0] ?? today);
}

export function MobileTimeGrid({
  days,
  events,
  startHour,
  endHour,
  locale,
  onEventClick,
  onEventClose,
  onSlotClick,
  selectedEventId,
  renderEventPopover,
}: MobileTimeGridProps) {
  const PIXELS_PER_MINUTE = 1.45; // Sincronizado para mostrar mas detalle
  const SLOT_MINUTES = 30;
  const totalMinutes = (endHour - startHour) * 60;
  const gridHeight = totalMinutes * PIXELS_PER_MINUTE;
  const initialSelectedDate = useMemo(() => resolveInitialSelectedDate(days), [days]);
  const initialSelectedKey = useMemo(() => initialSelectedDate.toISOString(), [initialSelectedDate]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(initialSelectedKey));
  const [liveNow, setLiveNow] = useState<Date | null>(null);
  const isWeekly = days.length > 1;

  useEffect(() => {
    setSelectedDate(new Date(initialSelectedKey));
  }, [initialSelectedKey]);

  useEffect(() => {
    const updateNow = () => setLiveNow(new Date());
    updateNow();
    const intervalId = window.setInterval(updateNow, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const eventCountByDay = useMemo(
    () =>
      new Map(
        days.map((day) => [
          startOfDay(day).toISOString(),
          events.filter((event) => eventOverlapsDay(event, day)).length,
        ]),
      ),
    [days, events],
  );

  const slotOffsets = useMemo(
    () =>
      Array.from(
        { length: Math.floor(totalMinutes / SLOT_MINUTES) + 1 },
        (_, index) => index * SLOT_MINUTES,
      ),
    [totalMinutes],
  );

  const hourOffsets = useMemo(
    () => slotOffsets.filter((offset) => offset % 60 === 0),
    [slotOffsets],
  );

  const dayStart = useMemo(() => createDayBoundary(selectedDate), [selectedDate]);
  const dayEnd = useMemo(() => createDayBoundary(selectedDate, 24), [selectedDate]);
  const calendarStart = useMemo(() => createDayBoundary(selectedDate, startHour), [selectedDate, startHour]);
  const calendarEnd = useMemo(() => createDayBoundary(selectedDate, endHour), [selectedDate, endHour]);

  const visibleSegments = useMemo<DayEventSegment[]>(
    () =>
      events
        .filter(
          (event) =>
            event.end.getTime() > dayStart.getTime() && event.start.getTime() < dayEnd.getTime(),
        )
        .map((event) => {
          const renderStart = new Date(
            Math.max(event.start.getTime(), calendarStart.getTime(), dayStart.getTime()),
          );
          const renderEnd = new Date(
            Math.min(event.end.getTime(), calendarEnd.getTime(), dayEnd.getTime()),
          );

          if (renderEnd.getTime() <= renderStart.getTime()) {
            return null;
          }

          return {
            event,
            renderStart,
            renderEnd,
          };
        })
        .filter((item): item is DayEventSegment => item !== null)
        .sort((left, right) => left.renderStart.getTime() - right.renderStart.getTime()),
    [calendarEnd, calendarStart, dayEnd, dayStart, events],
  );

  const positionedSegments = useMemo<DayEventLayoutSegment[]>(() => {
    const segments = visibleSegments.map((segment) => ({
      ...segment,
      columnIndex: 0,
      columnCount: 1,
    }));
    let active: DayEventLayoutSegment[] = [];
    let cluster: DayEventLayoutSegment[] = [];
    let clusterMaxColumns = 1;

    const finalizeCluster = () => {
      const resolvedColumns = Math.max(1, clusterMaxColumns);
      cluster.forEach((segment) => {
        segment.columnCount = resolvedColumns;
      });
      cluster = [];
      clusterMaxColumns = 1;
    };

    segments.forEach((segment) => {
      active = active.filter(
        (activeSegment) => activeSegment.renderEnd.getTime() > segment.renderStart.getTime(),
      );

      if (active.length === 0 && cluster.length > 0) {
        finalizeCluster();
      }

      const occupiedColumns = new Set(active.map((activeSegment) => activeSegment.columnIndex));
      let nextColumnIndex = 0;
      while (occupiedColumns.has(nextColumnIndex)) {
        nextColumnIndex += 1;
      }

      segment.columnIndex = nextColumnIndex;
      active.push(segment);
      cluster.push(segment);
      clusterMaxColumns = Math.max(clusterMaxColumns, active.length, nextColumnIndex + 1);
    });

    if (cluster.length > 0) {
      finalizeCluster();
    }

    return segments;
  }, [visibleSegments]);

  const nowPosition = useMemo(() => {
    if (!liveNow) return null;
    if (!isSameDay(selectedDate, liveNow)) return null;
    if (liveNow.getTime() <= calendarStart.getTime() || liveNow.getTime() >= calendarEnd.getTime()) return null;
    return ((liveNow.getTime() - calendarStart.getTime()) / 60000) * PIXELS_PER_MINUTE;
  }, [calendarEnd, calendarStart, liveNow, selectedDate, PIXELS_PER_MINUTE]);

  return (
    <div
      data-mobile-time-grid={isWeekly ? 'week' : 'day'}
      className="relative flex flex-col gap-4 md:hidden"
    >
      {/* Selector de dias solo si es vista semanal */}
      {isWeekly && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
          {days.map((day) => {
            const normalizedDay = startOfDay(day);
            const isActive = isSameDay(day, selectedDate);
            const eventCount = eventCountByDay.get(normalizedDay.toISOString()) ?? 0;

            return (
              <Button
                key={normalizedDay.toISOString()}
                radius="lg"
                variant="flat"
                className={cn(
                  'h-auto min-w-[4.4rem] shrink-0 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-center transition-all',
                  isActive
                    ? 'bg-violet-500/[0.18] text-violet-50 shadow-[0_8px_16px_-6px_rgba(139,92,246,0.3)]'
                    : 'bg-white/[0.03] text-slate-400',
                )}
                onPress={() => setSelectedDate(normalizedDay)}
              >
                <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">
                  {formatWeekday(day, locale)}
                </span>
                <span className="text-base font-bold leading-none">{formatDayNumber(day, locale)}</span>
                <div className={cn("mt-1.5 h-1 w-1 rounded-full", eventCount > 0 ? "bg-violet-400" : "bg-transparent")} />
              </Button>
            );
          })}
        </div>
      )}

      {/* Grid de tiempo limpio */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.015] border border-white/5 dark:bg-[rgba(13,8,24,0.4)]">
        <div className="max-h-[36rem] overflow-auto scrollbar-hide">
          <div className="grid grid-cols-[3.4rem_minmax(0,1fr)]">
            {/* Columna de horas */}
            <div className="relative border-r border-white/5 bg-white/[0.02]">
              <div className="relative" style={{ height: gridHeight }}>
                {hourOffsets.map((offset) => {
                  const top = offset * PIXELS_PER_MINUTE;
                  return (
                    <div
                      key={`mobile-time-${offset}`}
                      className="pointer-events-none absolute inset-x-0 px-2 text-right"
                      style={{ top: Math.max(top - 7, 0) }}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500/60">
                        {formatTimeLabel(startHour * 60 + offset, locale)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Columna de slots y eventos */}
            <div 
              className="relative"
              onClick={(e) => {
                if (!onSlotClick || e.target !== e.currentTarget) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const totalMinutesFromStart = y / PIXELS_PER_MINUTE;
                const hour = startHour + Math.floor(totalMinutesFromStart / 60);
                const minute = Math.floor((totalMinutesFromStart % 60) / SLOT_MINUTES) * SLOT_MINUTES;
                const slotDate = new Date(selectedDate);
                slotDate.setHours(hour, minute, 0, 0);
                onSlotClick(slotDate);
              }}
            >
              <div className="relative" style={{ height: gridHeight }}>
                {/* Bandas de horas */}
                {hourOffsets.map((offset, index) => (
                  <div
                    key={`mobile-hour-band-${offset}`}
                    className={cn(
                      'pointer-events-none absolute inset-x-0',
                      index % 2 === 0 ? 'bg-white/[0.015]' : 'bg-transparent',
                    )}
                    style={{
                      top: offset * PIXELS_PER_MINUTE,
                      height: 60 * PIXELS_PER_MINUTE,
                    }}
                  />
                ))}

                {/* Lineas de slots */}
                {slotOffsets.map((offset) => (
                  <div
                    key={`mobile-slot-line-${offset}`}
                    className={cn(
                      'pointer-events-none absolute inset-x-0 border-t',
                      offset % 60 === 0 ? 'border-white/10' : 'border-white/[0.03]',
                    )}
                    style={{ top: offset * PIXELS_PER_MINUTE }}
                  />
                ))}

                {/* Indicador de "Ahora" */}
                {nowPosition !== null ? (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-20"
                    style={{ top: nowPosition }}
                  >
                    <div className="absolute inset-x-3 h-px bg-violet-400/30" />
                    <div className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#121016] bg-violet-400 shadow-[0_0_0_4px_rgba(139,92,246,0.15)]" />
                  </div>
                ) : null}

                {/* Segmentos de eventos */}
                {positionedSegments.map((segment) => {
                  const top = ((segment.renderStart.getTime() - calendarStart.getTime()) / 60000) * PIXELS_PER_MINUTE;
                  const height = ((segment.renderEnd.getTime() - segment.renderStart.getTime()) / 60000) * PIXELS_PER_MINUTE;
                  
                  // Sincronizado con DayColumn: 0.25rem gap
                  const gap = 0.25; // rem
                  const leftPadding = 0.25; // rem
                  
                  const width = segment.columnCount > 1
                    ? `calc(${100 / segment.columnCount}% - ${gap * 2}rem)`
                    : `calc(100% - ${gap * 2}rem)`;
                  
                  const left = segment.columnCount > 1
                    ? `calc(${(segment.columnIndex * 100) / segment.columnCount}% + ${leftPadding}rem)`
                    : `${leftPadding}rem`;

                  const isSelected = selectedEventId === segment.event.id;

                  return (
                    <div
                      key={`${segment.event.id}-${segment.renderStart.toISOString()}`}
                      className="absolute pointer-events-auto"
                      style={{ top, height, left, width, zIndex: isSelected ? 40 : 10 }}
                    >
                      {renderEventPopover ? (
                        <Popover 
                          isOpen={isSelected} 
                          placement="bottom"
                          offset={10}
                          onOpenChange={(isOpen) => {
                             if (!isOpen) onEventClose?.();
                          }}
                        >
                          <PopoverTrigger>
                            <div className="h-full w-full outline-none">
                              <EventCard
                                event={segment.event}
                                locale={locale}
                                height={height}
                                compact={segment.columnCount > 1}
                                onClick={onEventClick}
                              />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 bg-transparent border-0 shadow-none outline-none">
                            {renderEventPopover(segment.event, () => onEventClose?.())}
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <EventCard
                          event={segment.event}
                          locale={locale}
                          height={height}
                          compact={segment.columnCount > 1}
                          onClick={onEventClick}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {visibleSegments.length === 0 && (
        <div className="rounded-xl bg-white/[0.02] border border-white/5 px-4 py-3 text-xs text-slate-500 text-center">
          No hay reservas para este día.
        </div>
      )}
    </div>
  );
}

export default MobileTimeGrid;
