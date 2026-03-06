'use client';

import { type Key, useCallback } from 'react';
import {
  Button,
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from '@heroui/react';
import { Download, Pencil } from 'lucide-react';
import { ApplicantUpdateForm } from '@/components/admin/applicant-update-form';
import {
  ADMIN_DARK_TABLE_ACTION_ICON_BUTTON,
  ADMIN_DARK_TABLE_CELL,
  ADMIN_DARK_TABLE_HEAD,
  ADMIN_DARK_TABLE_LAYOUT,
  ADMIN_DARK_TABLE_POPOVER_CONTENT,
  ADMIN_DARK_TABLE_POPOVER_TITLE,
  ADMIN_DARK_TABLE_ROW,
  ADMIN_DARK_TABLE_SHELL_BASE,
} from '@/lib/ui/admin-table-tokens';

interface ApplicantTableRow {
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

interface AdminApplicantsTableProps {
  rows: ApplicantTableRow[];
  shopId: string;
  className?: string;
}

type ColumnKey = 'candidate' | 'contact' | 'availability' | 'status' | 'createdAt' | 'actions';

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

export function AdminApplicantsTable({ rows, shopId, className }: AdminApplicantsTableProps) {
  const renderCell = useCallback(
    (row: ApplicantTableRow, columnKey: Key) => {
      const key = String(columnKey) as ColumnKey;

      switch (key) {
        case 'candidate':
          return (
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{row.name}</p>
              <p className="text-xs text-slate-600 dark:text-zinc-400">{row.experienceYearsLabel}</p>
            </div>
          );
        case 'contact':
          return (
            <div className="flex flex-col">
              <p className="text-sm text-slate-800 dark:text-zinc-200">{row.email}</p>
              <p className="text-xs text-slate-600 dark:text-zinc-400">{row.phone}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-500">{row.instagram}</p>
            </div>
          );
        case 'availability':
          return <p className="text-sm text-slate-800 dark:text-zinc-200">{row.availability}</p>;
        case 'status':
          return (
            <div className="flex items-center gap-2">
              <Chip
                size="sm"
                radius="full"
                variant="flat"
                color={statusTone[row.status] || 'default'}
                className="capitalize"
              >
                {statusLabel[row.status] || row.status}
              </Chip>
              <Popover placement="bottom-end" showArrow offset={12}>
                <PopoverTrigger>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    aria-label={`Actualizar postulacion de ${row.name}`}
                    className={ADMIN_DARK_TABLE_ACTION_ICON_BUTTON}
                  >
                    <Pencil className="h-4 w-4" />
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
          );
        case 'createdAt':
          return <p className="text-sm text-slate-700 dark:text-zinc-300">{row.createdAtLabel}</p>;
        case 'actions':
          return (
            <div className="flex items-center justify-end">
              {row.cvUrl ? (
                <Tooltip content="Descargar CV" placement="top">
                  <Button
                    as="a"
                    href={row.cvUrl}
                    target="_blank"
                    rel="noreferrer"
                    size="sm"
                    variant="light"
                    aria-label={`Descargar CV de ${row.name}`}
                    isIconOnly
                    className={ADMIN_DARK_TABLE_ACTION_ICON_BUTTON}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </Tooltip>
              ) : null}
            </div>
          );
        default:
          return null;
      }
    },
    [shopId],
  );

  return (
    <div
      className={`${ADMIN_DARK_TABLE_SHELL_BASE} admin-applicants-table overflow-y-visible rounded-[1.8rem] shadow-[0_30px_65px_-42px_rgba(2,6,23,0.95)] ${className || ''}`.trim()}
    >
      <Table
        removeWrapper
        aria-label="Tabla de postulantes"
        classNames={{
          table: `min-w-[960px] ${ADMIN_DARK_TABLE_LAYOUT}`,
          th: ADMIN_DARK_TABLE_HEAD,
          td: ADMIN_DARK_TABLE_CELL,
        }}
      >
        <TableHeader>
          <TableColumn key="candidate">CANDIDATO</TableColumn>
          <TableColumn key="contact">CONTACTO</TableColumn>
          <TableColumn key="availability">DISPONIBILIDAD</TableColumn>
          <TableColumn key="status">ESTADO</TableColumn>
          <TableColumn key="createdAt">POSTULACION</TableColumn>
          <TableColumn key="actions" align="end">
            CV
          </TableColumn>
        </TableHeader>
        <TableBody items={rows} emptyContent="No hay postulantes para este local.">
          {(row) => (
            <TableRow key={row.id} className={ADMIN_DARK_TABLE_ROW}>
              {(columnKey) => <TableCell>{renderCell(row, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
