'use client';

import type { CalendarEventStatus } from './calendar';

export type CalendarEventTone = 'confirmed' | 'pending' | 'cancelled' | 'absence';

interface CalendarToneInput {
  tone?: CalendarEventTone | undefined;
  status?: CalendarEventStatus | undefined;
  statusLabel?: string | undefined;
}

export const CALENDAR_EVENT_TONE_LABELS: Record<CalendarEventTone, string> = {
  confirmed: 'Confirmada',
  pending: 'Pendiente',
  cancelled: 'Cancelada',
  absence: 'Ausencia',
};

export const CALENDAR_EVENT_TONE_CHIP_CLASSNAME: Record<CalendarEventTone, string> = {
  confirmed:
    'border-emerald-700 bg-emerald-700 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-emerald-950',
  pending:
    'border-amber-400 bg-amber-400 text-amber-950 dark:border-amber-400 dark:bg-amber-400 dark:text-amber-950',
  cancelled:
    'border-rose-700 bg-rose-700 text-white dark:border-rose-400 dark:bg-rose-400 dark:text-rose-950',
  absence:
    'border-violet-700 bg-violet-700 text-white dark:border-violet-400 dark:bg-violet-400 dark:text-violet-950',
};

export const CALENDAR_EVENT_TONE_SURFACE_CLASSNAME: Record<CalendarEventTone, string> = {
  confirmed:
    'border-emerald-200 bg-emerald-100 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-50',
  pending:
    'border-amber-200 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-50',
  cancelled:
    'border-rose-200 bg-rose-100 text-rose-950 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-50',
  absence:
    'border-violet-200 bg-violet-100 text-violet-950 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-50',
};

export const CALENDAR_EVENT_TONE_MONTH_CLASSNAME: Record<CalendarEventTone, string> = {
  confirmed: 'border-transparent bg-emerald-100 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-50',
  pending: 'border-transparent bg-amber-100 text-amber-950 dark:bg-amber-900 dark:text-amber-50',
  cancelled: 'border-transparent bg-rose-100 text-rose-950 dark:bg-rose-900 dark:text-rose-50',
  absence: 'border-transparent bg-violet-100 text-violet-950 dark:bg-violet-900 dark:text-violet-50',
};

export const CALENDAR_EVENT_TONE_LEGEND = [
  {
    label: 'Confirmadas',
    tone: 'confirmed',
    dotClassName: 'bg-emerald-500',
  },
  {
    label: 'Pendientes',
    tone: 'pending',
    dotClassName: 'bg-amber-400',
  },
  {
    label: 'Canceladas',
    tone: 'cancelled',
    dotClassName: 'bg-rose-500',
  },
  {
    label: 'Ausencias',
    tone: 'absence',
    dotClassName: 'bg-violet-500',
  },
] as const;

export function resolveCalendarEventTone({
  tone,
  status,
}: Pick<CalendarToneInput, 'tone' | 'status'>): CalendarEventTone {
  if (tone === 'absence' || tone === 'pending' || tone === 'cancelled') {
    return tone;
  }

  if (tone === 'confirmed') {
    return tone;
  }

  if (status === 'pending' || status === 'cancelled') {
    return status;
  }

  return 'confirmed';
}

export function resolveCalendarEventStatusLabel({
  tone,
  status,
  statusLabel,
}: CalendarToneInput) {
  const normalizedLabel = statusLabel?.trim();

  if (normalizedLabel) {
    return normalizedLabel;
  }

  return CALENDAR_EVENT_TONE_LABELS[resolveCalendarEventTone({ tone, status })];
}
