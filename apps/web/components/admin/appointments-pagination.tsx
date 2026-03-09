'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Pagination } from '@heroui/react';
import {
  buildAdminAppointmentsQueryString,
  type AdminAppointmentsQueryState,
} from '@/lib/admin-appointments';

interface AdminAppointmentsPaginationProps {
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pageStart: number;
  pageEnd: number;
  queryState: AdminAppointmentsQueryState;
}

export function AdminAppointmentsPagination({
  totalItems,
  page,
  pageSize,
  totalPages,
  pageStart,
  pageEnd,
  queryState,
}: AdminAppointmentsPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (!totalItems) {
    return null;
  }

  const handlePageChange = useCallback(
    (nextPage: number) => {
      router.push(
        `${pathname}?${buildAdminAppointmentsQueryString(queryState, {
          page: nextPage,
        })}`,
      );
    },
    [pathname, queryState, router],
  );

  return (
    <div className="flex flex-col gap-3 rounded-[1.6rem] border border-slate-900/10 bg-white/75 px-4 py-3 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-white/[0.03] md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-slate-700 dark:text-zinc-300">
        Mostrando <span className="font-semibold text-slate-950 dark:text-zinc-100">{pageStart}</span>-
        <span className="font-semibold text-slate-950 dark:text-zinc-100">{pageEnd}</span> de{' '}
        <span className="font-semibold text-slate-950 dark:text-zinc-100">{totalItems}</span> citas ·{' '}
        <span className="font-semibold text-slate-950 dark:text-zinc-100">{pageSize}</span> por pagina
      </p>

      <Pagination
        total={totalPages}
        page={page}
        onChange={handlePageChange}
        showControls
        siblings={1}
        boundaries={1}
        radius="full"
        size="sm"
        variant="flat"
        classNames={{
          wrapper: 'gap-1',
          item: 'text-slate-700 dark:text-zinc-200',
          cursor: 'bg-sky-500 text-white shadow-none',
          prev: 'text-slate-700 dark:text-zinc-200',
          next: 'text-slate-700 dark:text-zinc-200',
        }}
      />
    </div>
  );
}
