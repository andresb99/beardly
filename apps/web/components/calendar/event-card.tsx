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
          'group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[1.2rem] border px-3 py-2.5 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/25',
          CALENDAR_EVENT_TONE_SURFACE_CLASSNAME[resolvedTone],
          onClick
            ? 'cursor-pointer md:hover:-translate-y-0.5 md:hover:shadow-[0_20px_34px_-24px_rgba(15,23,42,0.18)] dark:md:hover:shadow-[0_20px_34px_-18px_rgba(0,0,0,0.54)]'
            : 'cursor-default',
        )}
        onClick={() => onClick?.(event)}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 pr-1">
              {resourceLabel && !isDense ? (
                <p className="truncate text-[9px] font-semibold uppercase tracking-[0.16em] opacity-70">
                  {resourceLabel}
                </p>
              ) : null}
              <p
                className={cn(
                  'truncate font-semibold',
                  isTiny ? 'text-[10px] leading-4' : 'text-[11px] leading-4',
                  resourceLabel && !isDense && 'mt-1',
                )}
              >
                {clientLabel}
              </p>
            </div>

            <Chip
              size="sm"
              radius="full"
              variant="solid"
              className={cn(
                'h-5 shrink-0 border px-1.5 text-[9px] font-semibold uppercase tracking-[0.08em]',
                CALENDAR_EVENT_TONE_CHIP_CLASSNAME[resolvedTone],
              )}
            >
              {statusLabel}
            </Chip>
          </div>

          <div className={cn('mt-auto', isCompact ? 'space-y-1.5' : 'space-y-2')}>
            <p
              className={cn(
                'inline-flex w-fit items-center rounded-full border border-black/10 bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-800 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100',
                isDense && 'px-1.5 py-0.5 text-[8px]',
              )}
            >
              {timeRange}
            </p>

            <div className="space-y-1">
              <p
                className={cn(
                  isDense ? 'text-[10px] font-semibold leading-4' : 'text-[11px] font-semibold leading-5',
                )}
              >
                {event.title}
              </p>
              {!isTiny && detailLabel ? (
                <p
                  className={cn(
                    'opacity-78',
                    isDense ? 'text-[9px] leading-4' : 'text-[10px] leading-4',
                  )}
                >
                  {detailLabel}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </button>
    </Tooltip>
  );
}
