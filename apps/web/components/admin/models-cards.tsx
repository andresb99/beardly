'use client';

import { memo } from 'react';
import { Avatar, Button, Chip, Divider } from '@heroui/react';

interface ModelCardRow {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  instagram: string;
  preferences: string;
  notesInternal: string;
  marketingOptIn: boolean;
  createdAtLabel: string;
  href: string;
  isSelected: boolean;
}

interface AdminModelsCardsProps {
  rows: ModelCardRow[];
  className?: string;
}

export const AdminModelsCards = memo(function AdminModelsCards({ rows, className }: AdminModelsCardsProps) {
  if (!rows.length) {
    return (
      <div
        className={`rounded-[1.6rem] border border-slate-900/10 bg-white/80 p-5 text-sm text-slate-700 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 ${className || ''}`.trim()}
      >
        No hay modelos para los filtros actuales.
      </div>
    );
  }

  return (
    <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 ${className || ''}`.trim()}>
      {rows.map((row) => (
        <article
          key={row.id}
          className={`rounded-[1.6rem] border bg-white/80 p-4 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.45)] dark:bg-white/[0.03] ${
            row.isSelected
              ? 'border-violet-400/60 dark:border-violet-400/40'
              : 'border-slate-900/10 dark:border-white/10'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                name={row.fullName}
                size="sm"
                className="h-10 w-10 shrink-0 bg-slate-900/85 text-white dark:bg-zinc-800 dark:text-zinc-100"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  {row.fullName}
                </p>
                <p className="text-xs text-slate-600 dark:text-zinc-400">{row.instagram}</p>
              </div>
            </div>

            <Chip
              size="sm"
              radius="full"
              variant="flat"
              color={row.marketingOptIn ? 'success' : 'default'}
            >
              {row.marketingOptIn ? 'Marketing' : 'Sin marketing'}
            </Chip>
          </div>

          <Divider className="my-3 bg-slate-900/10 dark:bg-white/10" />

          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500">
                Contacto
              </dt>
              <dd className="text-slate-800 dark:text-zinc-200">{row.phone}</dd>
              <dd className="text-slate-700 dark:text-zinc-300">{row.email}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500">
                Preferencias
              </dt>
              <dd className="text-slate-700 dark:text-zinc-300">{row.preferences}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500">
                Notas internas
              </dt>
              <dd className="line-clamp-2 text-slate-700 dark:text-zinc-300">{row.notesInternal}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500">
                Registro
              </dt>
              <dd className="text-slate-700 dark:text-zinc-300">{row.createdAtLabel}</dd>
            </div>
          </dl>

          <div className="mt-4 flex justify-end">
            <Button
              as="a"
              href={row.href}
              size="sm"
              variant={row.isSelected ? 'solid' : 'flat'}
              color={row.isSelected ? 'primary' : 'default'}
              className={row.isSelected ? '' : 'text-slate-700 dark:text-zinc-200'}
            >
              Ver ficha
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}, (prevProps, nextProps) =>
  prevProps.className === nextProps.className &&
  prevProps.rows === nextProps.rows,
);
