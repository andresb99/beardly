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
    'border-white/10 bg-white/5 text-white dark:border-white/10 dark:bg-white/5 dark:text-white',
  pending:
    'border-white/10 bg-white/5 text-white dark:border-white/10 dark:bg-white/5 dark:text-white',
  cancelled:
    'border-white/10 bg-white/5 text-white dark:border-white/10 dark:bg-white/5 dark:text-white',
  absence:
    'border-white/10 bg-white/5 text-white dark:border-white/10 dark:bg-white/5 dark:text-white',
};

export const CALENDAR_EVENT_TONE_SURFACE_CLASSNAME: Record<CalendarEventTone, string> = {
  confirmed:
    'border-l-4 border-l-[#a855f7] border-y-transparent border-r-transparent bg-[#1e1a24] text-white dark:bg-[#1e1a24]',
  pending:
    'border-l-4 border-l-[#a855f7] border-y-transparent border-r-transparent bg-[#1e1a24] text-white dark:bg-[#1e1a24]',
  cancelled:
    'border-l-4 border-l-rose-500 border-y-transparent border-r-transparent bg-[#1e1a24] text-white dark:bg-[#1e1a24]',
  absence:
    'border-transparent bg-transparent text-slate-400 dark:bg-transparent dark:text-slate-400',
};

export const CALENDAR_EVENT_TONE_MONTH_CLASSNAME: Record<CalendarEventTone, string> = {
  confirmed: 'border-transparent bg-[#a855f7]/20 text-[#a855f7] dark:bg-[#a855f7]/20 dark:text-[#a855f7]',
  pending: 'border-transparent bg-[#a855f7]/20 text-[#a855f7] dark:bg-[#a855f7]/20 dark:text-[#a855f7]',
  cancelled: 'border-transparent bg-rose-500/20 text-rose-400 dark:bg-rose-500/20 dark:text-rose-400',
  absence: 'border-transparent bg-transparent text-slate-400 dark:bg-transparent dark:text-slate-400',
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
