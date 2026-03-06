'use client';

import NextLink from 'next/link';
import { Button, Chip, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import {
  ADMIN_DARK_TABLE_CELL,
  ADMIN_DARK_TABLE_HEAD,
  ADMIN_DARK_TABLE_LAYOUT,
  ADMIN_DARK_TABLE_ROW,
  ADMIN_DARK_TABLE_SHELL_BASE,
} from '@/lib/ui/admin-table-tokens';

interface ModelTableRow {
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

interface AdminModelsTableProps {
  rows: ModelTableRow[];
  className?: string;
}

export function AdminModelsTable({ rows, className }: AdminModelsTableProps) {
  return (
    <div
      className={`${ADMIN_DARK_TABLE_SHELL_BASE} admin-models-table overflow-y-visible rounded-[1.8rem] shadow-[0_30px_65px_-42px_rgba(2,6,23,0.95)] ${className || ''}`.trim()}
    >
      <Table
        removeWrapper
        aria-label="Tabla de modelos"
        classNames={{
          table: `min-w-[1160px] ${ADMIN_DARK_TABLE_LAYOUT}`,
          th: ADMIN_DARK_TABLE_HEAD,
          td: ADMIN_DARK_TABLE_CELL,
        }}
      >
        <TableHeader>
          <TableColumn key="name">NOMBRE</TableColumn>
          <TableColumn key="phone">TELEFONO</TableColumn>
          <TableColumn key="email">EMAIL</TableColumn>
          <TableColumn key="instagram">INSTAGRAM</TableColumn>
          <TableColumn key="preferences">PREFERENCIAS</TableColumn>
          <TableColumn key="marketing">MARKETING</TableColumn>
          <TableColumn key="notes">NOTAS INTERNAS</TableColumn>
          <TableColumn key="createdAt">REGISTRO</TableColumn>
          <TableColumn key="actions" align="end">
            ACCIONES
          </TableColumn>
        </TableHeader>
        <TableBody items={rows} emptyContent="No hay modelos para los filtros actuales.">
          {(row) => (
            <TableRow key={row.id} className={ADMIN_DARK_TABLE_ROW}>
              <TableCell>
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">{row.fullName}</p>
              </TableCell>
              <TableCell>
                <p className="text-sm text-slate-800 dark:text-zinc-200">{row.phone}</p>
              </TableCell>
              <TableCell className="text-sm text-slate-800 dark:text-zinc-200">{row.email}</TableCell>
              <TableCell className="text-sm text-slate-700 dark:text-zinc-300">{row.instagram}</TableCell>
              <TableCell>
                <Chip size="sm" radius="full" variant="flat" color="default">
                  {row.preferences}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip size="sm" radius="full" variant="flat" color={row.marketingOptIn ? 'success' : 'default'}>
                  {row.marketingOptIn ? 'Activo' : 'No'}
                </Chip>
              </TableCell>
              <TableCell className="max-w-[22rem]">
                <p className="truncate text-sm text-slate-700 dark:text-zinc-300">{row.notesInternal}</p>
              </TableCell>
              <TableCell className="text-slate-700 dark:text-zinc-300">{row.createdAtLabel}</TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button
                    as={NextLink}
                    href={row.href}
                    size="sm"
                    variant={row.isSelected ? 'solid' : 'flat'}
                    color={row.isSelected ? 'primary' : 'default'}
                    className={row.isSelected ? '' : 'text-slate-700 dark:text-zinc-200'}
                  >
                    Ver ficha
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
