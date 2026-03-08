'use client';

import type { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { Card, CardBody } from '@heroui/card';
import { formatCurrency } from '@navaja/shared';
import { useEffect, useMemo, useState } from 'react';
import type { BookingMetricsChannelView, DashboardMetrics } from '@/lib/metrics';

const ApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] animate-pulse rounded-[1.4rem] bg-white/45 dark:bg-white/[0.04]" />
  ),
});

interface MetricsApexOverviewProps {
  metrics: DashboardMetrics;
  selectedChannel: BookingMetricsChannelView;
}

type AreaMetricKey = 'appointments' | 'done' | 'online' | 'walkIn';
type PieMetricKey = 'status' | 'channel';
type PieItem = {
  label: string;
  color: string;
  value: number;
  share?: number;
};

const AREA_METRICS: Array<{
  key: AreaMetricKey;
  label: string;
  color: string;
  resolve: (dailySeries: DashboardMetrics['dailySeries']) => number[];
}> = [
  {
    key: 'appointments',
    label: 'Reservas',
    color: '#38bdf8',
    resolve: (dailySeries) => dailySeries.map((item) => item.appointments),
  },
  {
    key: 'done',
    label: 'Realizadas',
    color: '#22c55e',
    resolve: (dailySeries) => dailySeries.map((item) => item.doneAppointments),
  },
  {
    key: 'online',
    label: 'Online',
    color: '#0ea5e9',
    resolve: (dailySeries) => dailySeries.map((item) => item.onlineAppointments),
  },
  {
    key: 'walkIn',
    label: 'Presenciales',
    color: '#14b8a6',
    resolve: (dailySeries) => dailySeries.map((item) => item.walkInAppointments),
  },
];

const STATUS_DEFINITIONS: Array<{ key: string; label: string; color: string }> = [
  { key: 'done', label: 'Realizadas', color: '#22c55e' },
  { key: 'confirmed', label: 'Confirmadas', color: '#0ea5e9' },
  { key: 'pending', label: 'Pendientes', color: '#6366f1' },
  { key: 'cancelled', label: 'Canceladas', color: '#f43f5e' },
  { key: 'no_show', label: 'No show', color: '#f59e0b' },
];

const CHANNEL_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#f43f5e', '#6366f1', '#14b8a6'];
const MOCK_DAILY_SERIES: DashboardMetrics['dailySeries'] = [
  {
    date: '2026-03-02',
    label: 'Lun',
    appointments: 8,
    doneAppointments: 7,
    revenueCents: 168000,
    onlineAppointments: 5,
    walkInAppointments: 3,
  },
  {
    date: '2026-03-03',
    label: 'Mar',
    appointments: 11,
    doneAppointments: 9,
    revenueCents: 232000,
    onlineAppointments: 6,
    walkInAppointments: 5,
  },
  {
    date: '2026-03-04',
    label: 'Mie',
    appointments: 9,
    doneAppointments: 8,
    revenueCents: 201000,
    onlineAppointments: 4,
    walkInAppointments: 5,
  },
  {
    date: '2026-03-05',
    label: 'Jue',
    appointments: 13,
    doneAppointments: 11,
    revenueCents: 279000,
    onlineAppointments: 7,
    walkInAppointments: 6,
  },
  {
    date: '2026-03-06',
    label: 'Vie',
    appointments: 15,
    doneAppointments: 13,
    revenueCents: 314000,
    onlineAppointments: 8,
    walkInAppointments: 7,
  },
  {
    date: '2026-03-07',
    label: 'Sab',
    appointments: 12,
    doneAppointments: 10,
    revenueCents: 256000,
    onlineAppointments: 6,
    walkInAppointments: 6,
  },
  {
    date: '2026-03-08',
    label: 'Dom',
    appointments: 7,
    doneAppointments: 6,
    revenueCents: 142000,
    onlineAppointments: 4,
    walkInAppointments: 3,
  },
];
const MOCK_STATUS_BREAKDOWN: PieItem[] = [
  { label: 'Realizadas', color: '#22c55e', value: 48 },
  { label: 'Confirmadas', color: '#0ea5e9', value: 14 },
  { label: 'Pendientes', color: '#6366f1', value: 9 },
  { label: 'Canceladas', color: '#f43f5e', value: 6 },
  { label: 'No show', color: '#f59e0b', value: 4 },
];
const MOCK_CHANNEL_BREAKDOWN: PieItem[] = [
  { label: 'Web', color: '#0ea5e9', value: 43, share: 0.56 },
  { label: 'Walk-in', color: '#22c55e', value: 21, share: 0.27 },
  { label: 'Admin', color: '#f59e0b', value: 13, share: 0.17 },
];

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatCompactCurrency(cents: number) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

function getChannelViewLabel(channelView: BookingMetricsChannelView) {
  if (channelView === 'ONLINE_ONLY') {
    return 'Solo online';
  }
  if (channelView === 'WALK_INS_ONLY') {
    return 'Solo presenciales';
  }
  return 'Todos los canales';
}

function getPillClassName(isActive: boolean) {
  if (isActive) {
    return 'border-white/70 bg-white/78 text-ink shadow-[0_14px_24px_-22px_rgba(56,189,248,0.34)] dark:border-transparent dark:bg-white/[0.06] dark:text-white';
  }

  return 'border-white/55 bg-white/40 text-slate/80 hover:bg-white/58 dark:border-transparent dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.05]';
}

function useDarkThemeState() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDarkTheme(root.classList.contains('dark'));

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return isDarkTheme;
}

function createBaseOptions(isDarkTheme: boolean): ApexOptions {
  const axisColor = isDarkTheme ? '#cbd5e1' : '#475569';
  return {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      foreColor: axisColor,
      animations: {
        enabled: true,
        speed: 380,
      },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: isDarkTheme ? 'rgba(148,163,184,0.14)' : 'rgba(148,163,184,0.22)',
      strokeDashArray: 3,
    },
    legend: {
      labels: { colors: axisColor },
    },
    tooltip: {
      theme: isDarkTheme ? 'dark' : 'light',
    },
  };
}

export function MetricsApexOverview({ metrics, selectedChannel }: MetricsApexOverviewProps) {
  const isDarkTheme = useDarkThemeState();
  const baseOptions = useMemo(() => createBaseOptions(isDarkTheme), [isDarkTheme]);
  const axisColor = isDarkTheme ? '#cbd5e1' : '#475569';
  const hasMeaningfulAreaRealData = useMemo(
    () =>
      metrics.dailySeries.length >= 2 &&
      metrics.dailySeries.some(
        (item) =>
          item.appointments > 0 ||
          item.doneAppointments > 0 ||
          item.onlineAppointments > 0 ||
          item.walkInAppointments > 0,
      ),
    [metrics.dailySeries],
  );
  const effectiveDailySeries = hasMeaningfulAreaRealData ? metrics.dailySeries : MOCK_DAILY_SERIES;
  const usingAreaMock = !hasMeaningfulAreaRealData;
  const [selectedAreaMetrics, setSelectedAreaMetrics] = useState<AreaMetricKey[]>([
    'appointments',
    'done',
  ]);
  const [selectedPieMetric, setSelectedPieMetric] = useState<PieMetricKey>('status');

  const areaMetricMap = useMemo(
    () => new Map(AREA_METRICS.map((item) => [item.key, item])),
    [],
  );

  useEffect(() => {
    setSelectedAreaMetrics((current) => {
      const valid = current.filter((key) => areaMetricMap.has(key));
      return valid.length > 0 ? valid : ['appointments'];
    });
  }, [areaMetricMap]);

  const areaSeries = useMemo(() => {
    return selectedAreaMetrics
      .map((key) => {
        const metric = areaMetricMap.get(key);
        if (!metric) {
          return null;
        }

        return {
          name: metric.label,
          data: metric.resolve(effectiveDailySeries),
        };
      })
      .filter((item): item is { name: string; data: number[] } => item !== null);
  }, [areaMetricMap, effectiveDailySeries, selectedAreaMetrics]);

  const safeAreaSeries = useMemo(() => {
    if (areaSeries.length > 0) {
      return areaSeries;
    }

    return [
      {
        name: 'Reservas',
        data: effectiveDailySeries.map((item) => item.appointments),
      },
    ];
  }, [areaSeries, effectiveDailySeries]);

  const areaOptions = useMemo<ApexOptions>(() => {
    const colors = selectedAreaMetrics
      .map((key) => areaMetricMap.get(key)?.color)
      .filter((value): value is string => Boolean(value));

    return {
      ...baseOptions,
      chart: {
        ...baseOptions.chart,
        type: 'area',
      },
      colors,
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0.45,
          opacityFrom: 0.45,
          opacityTo: 0.07,
          stops: [0, 100],
        },
      },
      legend: {
        ...baseOptions.legend,
        position: 'top',
      },
      markers: {
        size: 3,
        strokeWidth: 0,
      },
      xaxis: {
        categories: effectiveDailySeries.map((item) => item.label),
        labels: {
          style: {
            colors: axisColor,
            fontSize: '11px',
          },
          rotate: -20,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: axisColor,
            fontSize: '11px',
          },
        },
      },
      tooltip: {
        ...baseOptions.tooltip,
        y: {
          formatter: (value: string | number) => `${Number(value) || 0} reservas`,
        },
      },
    };
  }, [areaMetricMap, axisColor, baseOptions, effectiveDailySeries, selectedAreaMetrics]);

  const statusBreakdown = useMemo<PieItem[]>(() => {
    const real = STATUS_DEFINITIONS.map((item) => ({
      label: item.label,
      color: item.color,
      value: Number(metrics.countsByStatus[item.key] || 0),
    })).filter((item) => item.value > 0);

    return real.length > 0 ? real : MOCK_STATUS_BREAKDOWN;
  }, [metrics.countsByStatus]);
  const usingStatusMock = statusBreakdown === MOCK_STATUS_BREAKDOWN;

  const channelBreakdown = useMemo<PieItem[]>(() => {
    const real = metrics.channelMix
      .map((item, index) => ({
        label: item.label,
        color: CHANNEL_COLORS[index % CHANNEL_COLORS.length] || '#0ea5e9',
        value: item.appointments,
        share: item.share,
      }))
      .filter((item) => item.value > 0);

    return real.length > 0 ? real : MOCK_CHANNEL_BREAKDOWN;
  }, [metrics.channelMix]);
  const usingChannelMock = channelBreakdown === MOCK_CHANNEL_BREAKDOWN;

  const pieItems = selectedPieMetric === 'status' ? statusBreakdown : channelBreakdown;
  const pieSeries = pieItems.map((item) => item.value);
  const pieTotal = pieSeries.reduce((sum, value) => sum + value, 0);
  const usingPieMock = selectedPieMetric === 'status' ? usingStatusMock : usingChannelMock;

  const pieOptions = useMemo<ApexOptions>(() => {
    return {
      ...baseOptions,
      chart: {
        ...baseOptions.chart,
        type: 'donut',
      },
      labels: pieItems.map((item) => item.label),
      colors: pieItems.map((item) => item.color),
      stroke: {
        width: 0,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0.5,
          opacityFrom: 0.95,
          opacityTo: 0.72,
          stops: [0, 90, 100],
        },
      },
      legend: {
        ...baseOptions.legend,
        position: 'bottom',
      },
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              value: {
                show: true,
                color: axisColor,
                formatter: (value: string) => `${Math.round(Number(value) || 0)}`,
              },
              total: {
                show: true,
                label: selectedPieMetric === 'status' ? 'Vista' : 'Total',
                color: axisColor,
                formatter: () => `${pieTotal}`,
              },
            },
          },
        },
      },
      tooltip: {
        ...baseOptions.tooltip,
        y: {
          formatter: (value: string | number, opts: { seriesIndex: number }) => {
            const row = pieItems[opts.seriesIndex];
            const numericValue = Number(value) || 0;
            if (!row) {
              return `${numericValue}`;
            }
            const share = pieTotal > 0 ? numericValue / pieTotal : 0;
            const resolvedShare =
              selectedPieMetric === 'channel' && typeof row.share === 'number' ? row.share : share;
            return `${numericValue} reservas (${formatPercent(resolvedShare)})`;
          },
        },
      },
    };
  }, [axisColor, baseOptions, pieItems, pieTotal, selectedPieMetric]);

  const hasAreaData = effectiveDailySeries.length > 0;
  const hasPieData = pieSeries.length > 0;

  if (!hasAreaData && !hasPieData) {
    return (
      <Card className="spotlight-card soft-panel rounded-[1.9rem] border-0 shadow-none">
        <CardBody className="space-y-3 p-6">
          <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-ink dark:text-slate-100">
            Sin datos suficientes para analitica visual
          </h2>
          <p className="text-sm text-slate/80 dark:text-slate-300">
            No hay reservas en la vista actual ({getChannelViewLabel(selectedChannel)}). Cambia el rango
            o el canal para ver tendencia y distribucion.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="spotlight-card soft-panel rounded-[1.9rem] border-0 shadow-none">
        <CardBody className="space-y-4 p-5">
          <div className="space-y-2">
            <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-ink dark:text-slate-100">
              Ritmo diario
            </h2>
            <p className="text-sm text-slate/80 dark:text-slate-300">
              Toca los pills para agregar o quitar parametros del area.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {AREA_METRICS.map((metric) => {
              const isActive = selectedAreaMetrics.includes(metric.key);

              return (
                <button
                  key={metric.key}
                  type="button"
                  className={`rounded-2xl border px-4 py-2 text-xs font-semibold transition ${getPillClassName(
                    isActive,
                  )}`}
                  onClick={() => {
                    setSelectedAreaMetrics((current) => {
                      if (current.includes(metric.key)) {
                        return current.length > 1 ? current.filter((item) => item !== metric.key) : current;
                      }

                      return [...current, metric.key];
                    });
                  }}
                >
                  {metric.label}
                </button>
              );
            })}
          </div>

          {hasAreaData ? (
            <>
              <ApexChart options={areaOptions} series={safeAreaSeries} type="area" height={310} />
              {usingAreaMock ? (
                <p className="text-xs text-slate/70 dark:text-slate-400">
                  Mostrando datos demo temporales para previsualizar el grafico.
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-slate/70 dark:text-slate-400">Sin datos para este rango.</p>
          )}
        </CardBody>
      </Card>

      <Card className="spotlight-card soft-panel rounded-[1.9rem] border-0 shadow-none">
        <CardBody className="space-y-4 p-5">
          <div className="space-y-2">
            <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-ink dark:text-slate-100">
              Distribucion
            </h2>
            <p className="text-sm text-slate/80 dark:text-slate-300">
              Alterna entre estado de reservas y captacion por canal.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-2xl border px-4 py-2 text-xs font-semibold transition ${getPillClassName(
                selectedPieMetric === 'status',
              )}`}
              onClick={() => setSelectedPieMetric('status')}
            >
              Estados
            </button>
            <button
              type="button"
              className={`rounded-2xl border px-4 py-2 text-xs font-semibold transition ${getPillClassName(
                selectedPieMetric === 'channel',
              )}`}
              onClick={() => setSelectedPieMetric('channel')}
            >
              Canales
            </button>
          </div>

          {hasPieData ? (
            <>
              <ApexChart options={pieOptions} series={pieSeries} type="donut" height={310} />
              <p className="text-xs text-slate/70 dark:text-slate-400">
                Total: {pieTotal} reservas | Facturacion: {formatCompactCurrency(metrics.estimatedRevenueCents)}{' '}
                ({formatCurrency(metrics.estimatedRevenueCents)})
              </p>
              {usingPieMock ? (
                <p className="text-xs text-slate/70 dark:text-slate-400">
                  Mostrando datos demo temporales para previsualizar el grafico.
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-slate/70 dark:text-slate-400">Sin datos para esta vista.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
