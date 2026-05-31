'use client';

import type { ReactNode } from 'react';
import { Button } from '@heroui/button';
import { cn } from '@/lib/cn';
import type { CalendarView } from './calendar';

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
  isCurrentPeriod: boolean;
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
    todayLabel: string;
  }
> = {
  day: {
    eyebrow: 'Vista diaria',
    previousLabel: 'Dia anterior',
    nextLabel: 'Dia siguiente',
    todayLabel: 'Hoy',
  },
  week: {
    eyebrow: 'Vista semanal',
    previousLabel: 'Semana anterior',
    nextLabel: 'Semana siguiente',
    todayLabel: 'Esta semana',
  },
  month: {
    eyebrow: 'Vista mensual',
    previousLabel: 'Mes anterior',
    nextLabel: 'Mes siguiente',
    todayLabel: 'Mes actual',
  },
};

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

export function CalendarHeader({
  title,
  description,
  view,
  rangeLabel,
  supplementaryContent,
  canNavigatePrevious,
  canNavigateNext,
  isCurrentPeriod,
  onViewChange,
  onPreviousPeriod,
  onCurrentPeriod,
  onNextPeriod,
}: CalendarHeaderProps) {
  const currentViewCopy = VIEW_COPY[view];
  const todayLabel = isCurrentPeriod ? currentViewCopy.todayLabel : `Ir a ${currentViewCopy.todayLabel.toLowerCase()}`;

  return (
    <div className="relative overflow-hidden px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6">
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black uppercase tracking-wide text-slate-100 md:text-2xl">
            {title}
          </h2>
          <div className="mt-1 flex items-center text-sm text-slate-400">
            <span className="font-medium">{description}</span>
            <span className="mx-2 opacity-50">•</span>
            <span>{rangeLabel}</span>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-4 lg:w-auto lg:items-end lg:flex-none">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
                radius="sm"
                className="h-9 bg-white/5 px-3 sm:px-4 text-xs font-semibold text-slate-200 hover:bg-white/10"
                startContent={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path></svg>}
             >
                <span className="hidden sm:inline">Add Blockout Time</span>
             </Button>

            <div className="inline-flex items-center gap-1 rounded-sm bg-white/5 p-1">
              {VIEW_OPTIONS.map((option) => {
                const isActiveView = option.id === view;
                return (
                  <Button
                    key={option.id}
                    size="sm"
                    radius="sm"
                    variant={isActiveView ? 'flat' : 'light'}
                    className={cn(
                      'h-7 px-3 text-[10px] font-bold uppercase tracking-wider',
                      isActiveView ? 'bg-white/10 text-slate-100' : 'text-slate-400',
                    )}
                    onClick={() => onViewChange(option.id)}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>

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
                {todayLabel}
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
      {supplementaryContent && <div className="mt-6">{supplementaryContent}</div>}
    </div>
  );
}

export default CalendarHeader;
