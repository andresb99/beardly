'use client';

import {
  Avatar,
  Button,
  Chip,
  Divider,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@heroui/react';
import { Download, Pencil } from 'lucide-react';
import { ApplicantUpdateForm } from '@/components/admin/applicant-update-form';
import {
  ADMIN_DARK_TABLE_POPOVER_CONTENT,
  ADMIN_DARK_TABLE_POPOVER_TITLE,
} from '@/lib/ui/admin-table-tokens';

interface ApplicantCardRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  instagram: string;
  experienceYearsLabel: string;
  availability: string;
  status: string;
  notes: string;
  createdAtLabel: string;
  cvUrl: string | null;
}

interface AdminApplicantsCardsProps {
  rows: ApplicantCardRow[];
  shopId: string;
  className?: string;
}

const statusTone: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  new: 'warning',
  contacted: 'default',
  interview: 'default',
  rejected: 'danger',
  hired: 'success',
};

const statusLabel: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  interview: 'Entrevista',
  rejected: 'Rechazado',
  hired: 'Contratado',
};

export function AdminApplicantsCards({ rows, shopId, className }: AdminApplicantsCardsProps) {
  if (!rows.length) {
    return (
      <div
        className={`rounded-[1.6rem] border border-slate-900/10 bg-white/80 p-5 text-sm text-slate-700 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 ${className || ''}`.trim()}
      >
        No hay postulantes para este local.
      </div>
    );
  }

  return (
    <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 ${className || ''}`.trim()}>
      {rows.map((row) => (
        <article
          key={row.id}
          className="rounded-[1.6rem] border border-slate-900/10 bg-white/80 p-4 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/[0.03]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                name={row.name}
                size="sm"
                className="h-10 w-10 shrink-0 bg-slate-900/85 text-white dark:bg-zinc-800 dark:text-zinc-100"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  {row.name}
                </p>
                <p className="text-xs text-slate-600 dark:text-zinc-400">{row.experienceYearsLabel}</p>
              </div>
            </div>

            <Chip
              size="sm"
              radius="full"
              variant="flat"
              color={statusTone[row.status] || 'default'}
              className="capitalize"
            >
              {statusLabel[row.status] || row.status}
            </Chip>
          </div>

          <Divider className="my-3 bg-slate-900/10 dark:bg-white/10" />

          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500">
                Contacto
              </dt>
              <dd className="text-slate-800 dark:text-zinc-200">{row.email}</dd>
              <dd className="text-xs text-slate-600 dark:text-zinc-400">{row.phone}</dd>
              <dd className="text-xs text-slate-600 dark:text-zinc-400">{row.instagram}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500">
                Disponibilidad
              </dt>
              <dd className="text-slate-800 dark:text-zinc-200">{row.availability}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500">
                Postulacion
              </dt>
              <dd className="text-slate-700 dark:text-zinc-300">{row.createdAtLabel}</dd>
            </div>
          </dl>

          <div className="mt-4 flex items-center gap-2">
            {row.cvUrl ? (
              <Button
                as="a"
                href={row.cvUrl}
                target="_blank"
                rel="noreferrer"
                size="sm"
                variant="flat"
                startContent={<Download className="h-4 w-4" />}
                className="text-slate-700 dark:text-zinc-200"
              >
                CV
              </Button>
            ) : (
              <Button size="sm" variant="flat" isDisabled>
                Sin CV
              </Button>
            )}

            <Popover placement="bottom-end" showArrow offset={12}>
              <PopoverTrigger>
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<Pencil className="h-4 w-4" />}
                  className="text-slate-700 dark:text-zinc-200"
                >
                  Editar
                </Button>
              </PopoverTrigger>
              <PopoverContent className={ADMIN_DARK_TABLE_POPOVER_CONTENT}>
                <p className={ADMIN_DARK_TABLE_POPOVER_TITLE}>Actualizar postulacion</p>
                <ApplicantUpdateForm
                  applicationId={row.id}
                  shopId={shopId}
                  status={row.status}
                  notes={row.notes}
                />
              </PopoverContent>
            </Popover>
          </div>
        </article>
      ))}
    </div>
  );
}

