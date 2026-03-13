import { METRIC_RANGES, type MetricRangeKey } from '@/lib/constants';

export const STAFF_NAV_ITEMS = [
  { href: '/staff', label: 'Resumen', key: 'overview' },
  { href: '/staff/citas', label: 'Citas', key: 'appointments' },
  { href: '/staff/metricas', label: 'Metricas', key: 'metrics' },
  { href: '/staff/ausencias', label: 'Ausencias', key: 'time-off' },
] as const;

export const STAFF_METRIC_RANGE_OPTIONS: Array<{
  key: MetricRangeKey;
  label: string;
}> = [
  { key: METRIC_RANGES.today, label: 'Hoy' },
  { key: METRIC_RANGES.last7, label: 'Ultimos 7 dias' },
  { key: METRIC_RANGES.month, label: 'Mes' },
];

export const STAFF_WEEKDAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miercoles',
  'Jueves',
  'Viernes',
  'Sabado',
] as const;
