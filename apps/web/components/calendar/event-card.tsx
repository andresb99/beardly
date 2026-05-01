'use client';

import { Chip, Tooltip } from '@heroui/react';
import { cn } from '@/lib/cn';
import type { CalendarEvent } from './calendar';
import {
  CALENDAR_EVENT_TONE_CHIP_CLASSNAME,
  CALENDAR_EVENT_TONE_SURFACE_CLASSNAME,
  resolveCalendarEventStatusLabel,
  resolveCalendarEventTone,
} from './event-tone';

interface EventCardProps {
  event: CalendarEvent;
  locale: string;
  height: number;
  compact?: boolean;
  onClick?: ((event: CalendarEvent) => void) | undefined;
}

function formatTimeRange(start: Date, end: Date, locale: string) {
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function buildAriaLabel(event: CalendarEvent, locale: string) {
  const headline = event.clientName?.trim() || event.title;
  return `${headline}, ${formatTimeRange(event.start, event.end, locale)}`;
}

export function EventCard({ event, locale, height, compact = false, onClick }: EventCardProps) {
  const resolvedTone = resolveCalendarEventTone(event);
  const statusLabel = resolveCalendarEventStatusLabel(event);
  const clientLabel = event.clientName?.trim() || event.title;
  const titleLabel = event.clientName?.trim() ? event.title : 'Bloque en agenda';
  const resourceLabel = event.resourceName?.trim() || null;
  const detailLabel = resourceLabel || (!event.clientName?.trim() ? titleLabel : null);
  const timeRange = formatTimeRange(event.start, event.end, locale);
  const isCompact = compact || height < 92;
  const isDense = compact || height < 76;
  const isTiny = height < 58;

  return (
    <Tooltip
      placement="right-start"
      showArrow
      delay={280}
      classNames={{
        content:
          'rounded-[1.15rem] border border-slate-200 bg-white px-3.5 py-3.5 text-left shadow-[0_28px_48px_-30px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#0c0816] dark:shadow-[0_28px_48px_-28px_rgba(0,0,0,0.64)]',
      }}
      content={
        <div className="max-w-[14rem] space-y-2.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate/45 dark:text-slate-300/52">
              Detalle
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {clientLabel}
            </p>
          </div>
          <div className="grid gap-2">
            <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/8 dark:bg-slate-950">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/45 dark:text-slate-300/52">
                Horario
              </p>
              <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{timeRange}</p>
            </div>
            <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/8 dark:bg-slate-950">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/45 dark:text-slate-300/52">
                Servicio
              </p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{event.title}</p>
            </div>
            {resourceLabel ? (
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/8 dark:bg-slate-950">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/45 dark:text-slate-300/52">
                  Barbero
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{resourceLabel}</p>
              </div>
            ) : null}
          </div>
          <div className="flex justify-end">
            <Chip
              size="sm"
              radius="full"
              variant="solid"
              className={cn(
                'h-6 border px-2 text-[10px] font-semibold uppercase tracking-[0.08em]',
                CALENDAR_EVENT_TONE_CHIP_CLASSNAME[resolvedTone],
              )}
            >
              {statusLabel}
            </Chip>
          </div>
        </div>
      }
    >
      <button
        type="button"
        aria-label={buildAriaLabel(event, locale)}
        data-event-tone={resolvedTone}
        className={cn(
          'group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-xl text-left transition duration-150',
          isTiny ? 'px-2 py-1' : isDense ? 'px-3 py-2' : 'px-4 py-3',
          CALENDAR_EVENT_TONE_SURFACE_CLASSNAME[resolvedTone],
          onClick ? 'cursor-pointer hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0e13]' : 'cursor-default',
        )}
        onClick={() => onClick?.(event)}
      >
        {resolvedTone === 'absence' ? (
          <div className="flex h-full items-center justify-center opacity-40">
             <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                <span className={cn('font-bold uppercase tracking-[0.1em]', isTiny ? 'text-[9px]' : 'text-[11px]')}>{event.title}</span>
             </div>
          </div>
        ) : (
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 pr-1">
                <p className={cn('truncate font-bold text-white', isTiny ? 'text-[11px] leading-tight' : 'text-sm')}>
                  {event.title}
                </p>
                {clientLabel !== event.title && !isDense ? (
                  <p className="truncate text-xs font-medium text-slate-400 mt-0.5">
                    {clientLabel}
                  </p>
                ) : null}
              </div>

              {!isTiny && (
                <Chip
                  size="sm"
                  radius="full"
                  variant="solid"
                  className={cn(
                    'h-6 shrink-0 border-0 px-2 text-[9px] font-bold uppercase tracking-[0.08em]',
                    CALENDAR_EVENT_TONE_CHIP_CLASSNAME[resolvedTone],
                  )}
                >
                  {statusLabel}
                </Chip>
              )}
            </div>

            <div className={cn('mt-auto flex items-center gap-3', isTiny ? 'mt-0' : 'mt-auto')}>
              <p className={cn('flex items-center font-medium text-slate-400', isTiny ? 'text-[9px]' : 'text-xs')}>
                <svg className={cn('mr-1 h-3 w-3', isTiny ? 'h-2.5 w-2.5' : 'h-3 w-3')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                {timeRange}
              </p>
            </div>
          </div>
        )}
      </button>
    </Tooltip>
  );
}
