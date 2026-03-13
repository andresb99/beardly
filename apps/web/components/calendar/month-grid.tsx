'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import type { CalendarEvent } from './calendar';
import { MobileMonthGrid } from './mobile-month-grid';
import {
  CALENDAR_EVENT_TONE_MONTH_CLASSNAME,
  resolveCalendarEventTone,
} from './event-tone';

interface MonthGridProps {
  referenceDate: Date;
  events: CalendarEvent[];
  locale: string;
  isMobile?: boolean;
  onEventClick?: ((event: CalendarEvent) => void) | undefined;
}

const DAYS_IN_WEEK = 7;
const WEEK_STARTS_ON = 1;
const MAX_EVENTS_PER_DAY = 3;

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function startOfWeek(date: Date) {
  const normalized = startOfDay(date);
  const diff = (normalized.getDay() - WEEK_STARTS_ON + DAYS_IN_WEEK) % DAYS_IN_WEEK;
  normalized.setDate(normalized.getDate() - diff);
  return normalized;
}

function startOfMonth(date: Date) {
  const normalized = startOfDay(date);
  normalized.setDate(1);
  return normalized;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function formatWeekday(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date).replace('.', '');
}

function formatTime(value: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value);
}

function eventOverlapsDay(event: CalendarEvent, day: Date) {
  const dayStart = startOfDay(day);
  const dayEndExclusive = addDays(dayStart, 1);

  return event.end.getTime() > dayStart.getTime() && event.start.getTime() < dayEndExclusive.getTime();
}

function buildMonthEventLabel(event: CalendarEvent, locale: string) {
  const baseLabel = event.clientName?.trim() || event.title;
  return `${formatTime(event.start, locale)} ${baseLabel}`;
}

export function MonthGrid({
  referenceDate,
  events,
  locale,
  isMobile = false,
  onEventClick,
}: MonthGridProps) {
  const today = new Date();
  const monthStart = useMemo(() => startOfMonth(referenceDate), [referenceDate]);
  const monthEndExclusive = useMemo(() => startOfMonth(addMonths(monthStart, 1)), [monthStart]);
  const firstGridDay = useMemo(() => startOfWeek(monthStart), [monthStart]);
  const lastGridDay = useMemo(
    () => addDays(startOfWeek(addDays(monthEndExclusive, -1)), DAYS_IN_WEEK - 1),
    [monthEndExclusive],
  );

  const gridDays = useMemo(() => {
    const days: Date[] = [];
    let cursor = firstGridDay;

    while (cursor.getTime() <= lastGridDay.getTime()) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }

    return days;
  }, [firstGridDay, lastGridDay]);

  const weeks = useMemo(() => {
    const items: Date[][] = [];

    for (let index = 0; index < gridDays.length; index += DAYS_IN_WEEK) {
      items.push(gridDays.slice(index, index + DAYS_IN_WEEK));
    }

    return items;
  }, [gridDays]);

  if (isMobile) {
    return (
      <MobileMonthGrid
        referenceDate={referenceDate}
        events={events}
        locale={locale}
        onEventClick={onEventClick}
      />
    );
  }

  return (
    <div className="relative hidden overflow-hidden rounded-[1.9rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.62),rgba(248,250,255,0.4))] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.64),0_28px_56px_-38px_rgba(15,23,42,0.14)] dark:bg-[linear-gradient(180deg,rgba(18,11,30,0.92),rgba(7,4,15,0.98))] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_32px_56px_-36px_rgba(0,0,0,0.72)] md:block">
      <div className="pointer-events-none absolute inset-x-4 top-0 h-24 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.68),transparent_72%)] blur-3xl dark:bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.18),transparent_68%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-64 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_76%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.12),transparent_72%)]" />

      <div className="relative overflow-auto rounded-[1.55rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.6),rgba(248,250,255,0.48))] dark:bg-[linear-gradient(180deg,rgba(13,8,24,0.96),rgba(7,4,15,0.98))]">
        <div className="min-w-[58rem]">
          <div className="grid grid-cols-7 border-b border-white/14 backdrop-blur-xl dark:border-white/[0.05]">
            {Array.from({ length: DAYS_IN_WEEK }, (_, index) => {
              const date = addDays(startOfWeek(today), index);

              return (
                <div
                  key={date.toISOString()}
                  className="border-r border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(248,250,255,0.68))] px-4 py-3 last:border-r-0 dark:border-white/[0.05] dark:bg-[linear-gradient(180deg,rgba(22,13,35,0.9),rgba(11,7,20,0.82))]"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate/54 dark:text-slate-300/56">
                    {formatWeekday(date, locale)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7" style={{ gridAutoRows: 'minmax(8.8rem, 1fr)' }}>
            {weeks.flat().map((day) => {
              const dayEvents = events
                .filter((event) => eventOverlapsDay(event, day))
                .sort((left, right) => left.start.getTime() - right.start.getTime());
              const isToday = isSameDay(day, today);
              const isCurrentMonth = isSameMonth(day, monthStart);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'relative flex min-h-[8.8rem] flex-col gap-3 border-r border-t border-white/12 p-3.5 last:border-r-0 dark:border-white/[0.05]',
                    isCurrentMonth
                      ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.54),rgba(248,250,255,0.42))] dark:bg-[linear-gradient(180deg,rgba(18,11,29,0.74),rgba(8,5,16,0.78))]'
                      : 'bg-white/18 opacity-78 dark:bg-white/[0.015] dark:opacity-70',
                    isToday &&
                      'bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(244,240,255,0.58))] dark:bg-[linear-gradient(180deg,rgba(139,92,246,0.16),rgba(76,29,149,0.08),rgba(17,10,29,0.12))]',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-transparent px-3 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.64)]',
                          isToday
                            ? 'bg-white/84 text-ink dark:bg-violet-500/[0.18] dark:text-violet-50'
                            : 'bg-white/84 text-ink dark:bg-white/[0.045] dark:text-slate-100',
                        )}
                      >
                        {day.getDate()}
                      </span>
                      {isToday ? (
                        <span className="rounded-full bg-white/78 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-violet-700 dark:bg-fuchsia-500/[0.12] dark:text-violet-100">
                          Hoy
                        </span>
                      ) : null}
                    </div>

                    {dayEvents.length > 0 ? (
                      <span className="meta-chip border-white/70 bg-white/62 text-slate/78 dark:border-white/8 dark:bg-white/[0.04] dark:text-violet-100/84">
                        {dayEvents.length}
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    {dayEvents.slice(0, MAX_EVENTS_PER_DAY).map((event) => {
                      const resolvedTone = resolveCalendarEventTone(event);

                      return (
                        <button
                          key={event.id}
                          type="button"
                          data-event-tone={resolvedTone}
                          title={event.resourceName ? `${buildMonthEventLabel(event, locale)} - ${event.resourceName}` : buildMonthEventLabel(event, locale)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-[0.95rem] border px-2.5 py-2 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/25',
                            CALENDAR_EVENT_TONE_MONTH_CLASSNAME[resolvedTone],
                            onEventClick ? 'cursor-pointer md:hover:-translate-y-0.5 md:hover:shadow-[0_16px_26px_-22px_rgba(15,23,42,0.14)] dark:md:hover:shadow-[0_16px_24px_-20px_rgba(0,0,0,0.44)]' : 'cursor-default',
                          )}
                          onClick={() => onEventClick?.(event)}
                        >
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-75" />
                          <span className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.08em]">
                            {buildMonthEventLabel(event, locale)}
                          </span>
                        </button>
                      );
                    })}

                    {dayEvents.length > MAX_EVENTS_PER_DAY ? (
                      <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/56 dark:text-slate-300/58">
                        +{dayEvents.length - MAX_EVENTS_PER_DAY} mas
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthGrid;
