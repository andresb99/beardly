'use client';

import { type Key, useCallback } from 'react';
import { Chip, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import {
  ADMIN_DARK_TABLE_CELL,
  ADMIN_DARK_TABLE_HEAD,
  ADMIN_DARK_TABLE_LAYOUT,
  ADMIN_DARK_TABLE_ROW,
  ADMIN_DARK_TABLE_SHELL_BASE,
} from '@/lib/ui/admin-table-tokens';

interface CourseEnrollmentRow {
  id: string;
  studentName: string;
  courseTitle: string;
  email: string;
  phone: string;
  status: string;
  sessionStartLabel: string;
  sessionLocation: string;
  createdAtLabel: string;
}

interface AdminCourseEnrollmentsTableProps {
  rows: CourseEnrollmentRow[];
  className?: string;
}

const enrollmentStatusTone: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'danger',
};

const enrollmentStatusLabel: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
};

type ColumnKey = 'student' | 'contact' | 'status' | 'session' | 'createdAt';

export function AdminCourseEnrollmentsTable({ rows, className }: AdminCourseEnrollmentsTableProps) {
  const renderCell = useCallback((row: CourseEnrollmentRow, columnKey: Key) => {
    const key = String(columnKey) as ColumnKey;

    switch (key) {
      case 'student':
        return (
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{row.studentName}</p>
            <p className="text-xs text-slate-600 dark:text-zinc-400">{row.courseTitle}</p>
          </div>
        );
      case 'contact':
        return (
          <div className="flex flex-col">
            <p className="text-sm text-slate-800 dark:text-zinc-200">{row.email}</p>
            <p className="text-xs text-slate-600 dark:text-zinc-400">{row.phone}</p>
          </div>
        );
      case 'status':
        return (
          <Chip
            size="sm"
            radius="full"
            variant="flat"
            color={enrollmentStatusTone[row.status] || 'default'}
            className="capitalize"
          >
            {enrollmentStatusLabel[row.status] || row.status}
          </Chip>
        );
      case 'session':
        return (
          <div className="flex flex-col">
            <p className="text-sm text-slate-800 dark:text-zinc-200">{row.sessionStartLabel}</p>
            <p className="text-xs text-slate-600 dark:text-zinc-400">{row.sessionLocation}</p>
          </div>
        );
      case 'createdAt':
        return <p className="text-sm text-slate-700 dark:text-zinc-300">{row.createdAtLabel}</p>;
      default:
        return null;
    }
  }, []);

  return (
    <div
      className={`${ADMIN_DARK_TABLE_SHELL_BASE} admin-course-enrollments-table overflow-y-visible rounded-[1.8rem] shadow-[0_30px_65px_-42px_rgba(2,6,23,0.95)] ${className || ''}`.trim()}
    >
      <Table
        removeWrapper
        aria-label="Tabla de inscripciones de cursos"
        classNames={{
          table: `min-w-[840px] ${ADMIN_DARK_TABLE_LAYOUT}`,
          th: ADMIN_DARK_TABLE_HEAD,
          td: ADMIN_DARK_TABLE_CELL,
        }}
      >
        <TableHeader>
          <TableColumn key="student">ALUMNO</TableColumn>
          <TableColumn key="contact">CONTACTO</TableColumn>
          <TableColumn key="status">ESTADO</TableColumn>
          <TableColumn key="session">SESION</TableColumn>
          <TableColumn key="createdAt">INSCRIPCION</TableColumn>
        </TableHeader>
        <TableBody items={rows} emptyContent="Todavia no hay inscripciones.">
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
