'use client'

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

interface RangeFilterProps {
  currentRange: string;
  ranges: Array<{
    key: string;
    label: string;
    href: string;
  }>;
}

export function RangeFilter({ currentRange, ranges }: RangeFilterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRangeClick = (href: string) => {
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <div className={clsx(
      "flex items-center bg-[#18161f] p-1 rounded-xl border border-white/5 transition-opacity",
      isPending && "opacity-60 pointer-events-none"
    )}>
      {ranges.map((range) => {
        const isActive = currentRange === range.key;
        return (
          <button
            key={range.key}
            onClick={() => handleRangeClick(range.href)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
              isActive 
                ? "bg-white/10 text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}
