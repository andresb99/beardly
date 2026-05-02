'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { Popover, PopoverTrigger, PopoverContent } from '@heroui/react';
import type { CalendarEvent } from './calendar';
import { EventCard } from './event-card';

interface DayColumnProps {
  date: Date;
  events: CalendarEvent[];
  startHour: number;
  endHour: number;
  pixelsPerMinute: number;
  slotMinutes: number;
  locale: string;
  isToday?: boolean;
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

function createDayBoundary(date: Date, hour = 0) {
  const next = new Date(date);
  next.setHours(hour, 0, 0, 0);
  return next;
}

export function DayColumn({
  date,
  events,
  startHour,
  endHour,
  pixelsPerMinute,
  slotMinutes,
  locale,
  isToday = false,
  onEventClick,
  onEventClose,
  onSlotClick,
  selectedEventId,
  renderEventPopover,
}: DayColumnProps) {
  const totalMinutes = (endHour - startHour) * 60;
  const gridHeight = totalMinutes * pixelsPerMinute;
  const [liveNow, setLiveNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateNow = () => setLiveNow(new Date());

    updateNow();
    const intervalId = window.setInterval(updateNow, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const dayStart = useMemo(() => createDayBoundary(date), [date]);
  const dayEnd = useMemo(() => createDayBoundary(date, 24), [date]);
  const calendarStart = useMemo(() => createDayBoundary(date, startHour), [date, startHour]);
  const calendarEnd = useMemo(() => createDayBoundary(date, endHour), [date, endHour]);

  const slotOffsets = useMemo(
    () =>
      Array.from(
        { length: Math.floor(totalMinutes / slotMinutes) + 1 },
        (_, index) => index * slotMinutes,
      ),
    [slotMinutes, totalMinutes],
  );

  const hourOffsets = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, index) => index * 60),
    [endHour, startHour],
  );

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
    if (!isToday || !liveNow) {
      return null;
    }

    if (liveNow.getTime() <= calendarStart.getTime() || liveNow.getTime() >= calendarEnd.getTime()) {
      return null;
    }

    return ((liveNow.getTime() - calendarStart.getTime()) / 60000) * pixelsPerMinute;
  }, [calendarEnd, calendarStart, isToday, liveNow, pixelsPerMinute]);

  return (
    <div
      className="relative border-r border-white/10 last:border-r-0 dark:border-white/[0.04]"
      onClick={(e) => {
        if (!onSlotClick || e.target !== e.currentTarget) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const totalMinutesFromStart = y / pixelsPerMinute;
        const hour = startHour + Math.floor(totalMinutesFromStart / 60);
        const minute = Math.floor((totalMinutesFromStart % 60) / slotMinutes) * slotMinutes;
        
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);
        onSlotClick(slotDate);
      }}
    >
      <div className="relative pointer-events-none" style={{ height: gridHeight }}>

        {hourOffsets.map((offset, index) => (
          <div
            key={`hour-band-${offset}`}
            className={cn(
              'pointer-events-none absolute inset-x-0',
              index % 2 === 0
                ? 'bg-slate-900/[0.008] dark:bg-white/[0.02]'
                : 'bg-transparent',
            )}
            style={{
              top: offset * pixelsPerMinute,
              height: 60 * pixelsPerMinute,
            }}
          />
        ))}

        {slotOffsets.map((offset) => (
          <div
            key={`slot-line-${offset}`}
            className={cn(
              'pointer-events-none absolute inset-x-0 border-t',
              offset % 60 === 0
                ? 'border-slate-900/[0.045] dark:border-white/[0.05]'
                : 'border-slate-900/[0.022] dark:border-white/[0.025]',
            )}
            style={{ top: offset * pixelsPerMinute }}
          />
        ))}

        {nowPosition !== null ? (
          <div
            className="pointer-events-none absolute inset-x-0 z-20"
            style={{ top: nowPosition }}
          >
            <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-white/10 dark:bg-white/20" />
            <div className="absolute left-0 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-400 shadow-[0_0_0_6px_rgba(255,255,255,0.04)] dark:border-[rgba(12,7,22,0.96)] dark:bg-slate-300" />
            <div className="h-px bg-white/40 dark:bg-white/60" />
          </div>
        ) : null}

        {positionedSegments.map((segment) => {
          const top =
            ((segment.renderStart.getTime() - calendarStart.getTime()) / 60000) * pixelsPerMinute;
          const height =
            ((segment.renderEnd.getTime() - segment.renderStart.getTime()) / 60000) *
            pixelsPerMinute;
          
          // Consistent spacing: 4px from each side (0.25rem)
          const gap = 0.25; // rem
          const leftPadding = 0.25; // rem
          
          const width =
            segment.columnCount > 1
              ? `calc(${100 / segment.columnCount}% - ${gap * 2}rem)`
              : `calc(100% - ${gap * 2}rem)`;
          
          const left =
            segment.columnCount > 1
              ? `calc(${(segment.columnIndex * 100) / segment.columnCount}% + ${leftPadding}rem)`
              : `${leftPadding}rem`;

          const isSelected = selectedEventId === segment.event.id;

          return (
            <div
              key={`${segment.event.id}-${segment.renderStart.toISOString()}`}
              className="absolute pointer-events-auto"
              style={{ 
                top: `${top}px`, 
                height: `${height}px`, 
                left, 
                width,
                zIndex: isSelected ? 40 : 10 
              }}
            >
              {renderEventPopover ? (
                <Popover 
                  isOpen={isSelected} 
                  placement="right-start"
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
  );
}
