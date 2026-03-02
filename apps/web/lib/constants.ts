export const APP_NAME = 'Beardly';

export const METRIC_RANGES = {
  today: 'today',
  last7: 'last7',
  month: 'month',
} as const;

export type MetricRangeKey = (typeof METRIC_RANGES)[keyof typeof METRIC_RANGES];
