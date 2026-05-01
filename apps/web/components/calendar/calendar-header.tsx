'use client';

import type { ReactNode } from 'react';
import { Button } from '@heroui/button';
import { cn } from '@/lib/cn';
import type { CalendarView } from './calendar';
import { CALENDAR_EVENT_TONE_LEGEND } from './event-tone';

interface CalendarHeaderProps {
  title: string;
  description: string;
  view: CalendarView;
  rangeLabel: string;
  visibleDayLabel: string;
  visibleEventCount: number;
  supplementaryContent?: ReactNode;
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  onViewChange: (view: CalendarView) => void;
  onPreviousPeriod: () => void;
  onCurrentPeriod: () => void;
  onNextPeriod: () => void;
}

const VIEW_OPTIONS: Array<{ id: CalendarView; label: string }> = [
  { id: 'day', label: 'Dia' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

const VIEW_COPY: Record<
  CalendarView,
  {
    eyebrow: string;
    previousLabel: string;
    nextLabel: string;
  }
> = {
  day: {
    eyebrow: 'Vista diaria',
    previousLabel: 'Dia anterior',
    nextLabel: 'Dia siguiente',
  },
  week: {
    eyebrow: 'Vista semanal',
    previousLabel: 'Semana anterior',
    nextLabel: 'Semana siguiente',
  },
  month: {
    eyebrow: 'Vista mensual',
    previousLabel: 'Mes anterior',
    nextLabel: 'Mes siguiente',
  },
};

function CalendarGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[1.15rem] w-[1.15rem]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.75" y="5.25" width="16.5" height="14.5" rx="3.2" />
      <path d="M8 3.75v3" />
      <path d="M16 3.75v3" />
      <path d="M3.75 9.5h16.5" />
      <path d="M8.5 13h.01" />
      <path d="M12 13h.01" />
      <path d="M15.5 13h.01" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === 'left' ? <path d="M9.75 3.5 5.25 8l4.5 4.5" /> : <path d="M6.25 3.5 10.75 8l-4.5 4.5" />}
    </svg>
  );
}

function LegendPill({
  label,
  dotClassName,
}: {
  label: string;
  dotClassName: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:bg-white/[0.03] dark:shadow-none">
      <span className={cn('h-2 w-2 rounded-full ring-2 ring-white/55 dark:ring-white/10', dotClassName)} />
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate/72 dark:text-slate-200/78">
        {label}
      </span>
    </div>
  );
}

export function CalendarHeader({
  title,
  description,
  view,
  rangeLabel,
  visibleDayLabel,
  visibleEventCount,
  supplementaryContent,
  canNavigatePrevious,
  canNavigateNext,
  onViewChange,
  onPreviousPeriod,
  onCurrentPeriod,
  onNextPeriod,
}: CalendarHeaderProps) {
  const currentViewCopy = VIEW_COPY[view];

  return (
    <div className="relative overflow-hidden px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6">
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black uppercase tracking-wide text-[#c084fc] md:text-2xl">
            {title}
          </h2>
          <div className="mt-1 flex items-center text-sm text-slate-400">
            <span className="font-medium">{description}</span>
            <span className="mx-2 opacity-50">•</span>
            <span>{rangeLabel}</span>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-3 xl:w-auto xl:min-w-[21rem] xl:flex-none xl:items-end">
          <div className="flex items-center gap-3">
             <div className="hidden items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 md:flex">
               <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sync with device</span>
               <div className="h-4 w-7 rounded-full bg-white/10 p-0.5">
                  <div className="h-3 w-3 rounded-full bg-violet-400 translate-x-3"></div>
               </div>
             </div>

             <Button
                radius="sm"
                className="h-9 bg-white/5 px-4 text-xs font-semibold text-slate-200 hover:bg-white/10"
                startContent={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path></svg>}
             >
                Add Blockout Time
             </Button>

            <div className="inline-flex items-center gap-1 rounded-sm bg-white/5 p-1">
              <Button
                isIconOnly
                size="sm"
                radius="sm"
                variant="light"
                aria-label={currentViewCopy.previousLabel}
                isDisabled={!canNavigatePrevious}
                className="h-7 w-7 text-slate-400 disabled:opacity-45"
                onClick={onPreviousPeriod}
              >
                <ChevronIcon direction="left" />
              </Button>
              <Button
                size="sm"
                radius="sm"
                variant="flat"
                className="h-7 bg-white/10 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-200"
                onClick={onCurrentPeriod}
              >
                Hoy
              </Button>
              <Button
                isIconOnly
                size="sm"
                radius="sm"
                variant="light"
                aria-label={currentViewCopy.nextLabel}
                isDisabled={!canNavigateNext}
                className="h-7 w-7 text-slate-400 disabled:opacity-45"
                onClick={onNextPeriod}
              >
                <ChevronIcon direction="right" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarHeader;
