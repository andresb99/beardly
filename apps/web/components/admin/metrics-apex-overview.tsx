'use client';

import type { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { formatCurrency } from '@navaja/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DashboardMetrics } from '@/lib/metrics';
import { Star, CheckCircle2, Clock, XCircle, UserX, Globe, type LucideIcon } from 'lucide-react';

const ApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] animate-pulse rounded-[1.4rem] bg-white/45 dark:bg-white/[0.04]" />
  ),
});

interface MetricsApexOverviewProps {
  metrics: DashboardMetrics;
  selectedStaffId?: string;
  selectedStaffName?: string;
  staffComparison: Array<{
    staffId: string;
    staffName: string;
    totalRevenueCents: number;
    completedAppointments: number;
    trustedRating: number;
  }>;
}

type AreaViewKey =
  | 'REVENUE'
  | 'TOTAL_BOOKINGS'
  | 'ONLINE_BOOKINGS'
  | 'WALK_IN_BOOKINGS'
  | 'STAFF_REVENUE'
  | 'STAFF_RATING'
  | 'SHOP_RATING';
type PieViewKey = 'STATUS' | 'CHANNEL';

const AREA_VIEW_OPTIONS: Array<{ key: AreaViewKey; label: string }> = [
  { key: 'REVENUE', label: 'Facturacion' },
  { key: 'SHOP_RATING', label: 'Calificacion general' },
  { key: 'TOTAL_BOOKINGS', label: 'Reservas' },
  { key: 'ONLINE_BOOKINGS', label: 'Solo web' },
  { key: 'WALK_IN_BOOKINGS', label: 'Solo presencial' },
  { key: 'STAFF_REVENUE', label: 'Barberos' },
  { key: 'STAFF_RATING', label: 'Calificacion barberos' },
];
const AREA_VIEW_OPTIONS_STAFF_FOCUS: Array<{ key: AreaViewKey; label: string }> = [
  { key: 'REVENUE', label: 'Facturacion' },
  { key: 'SHOP_RATING', label: 'Calificacion' },
  { key: 'TOTAL_BOOKINGS', label: 'Reservas' },
  { key: 'ONLINE_BOOKINGS', label: 'Solo web' },
  { key: 'WALK_IN_BOOKINGS', label: 'Solo presencial' },
];

const STATUS_DEFINITIONS: Array<{ key: string; label: string; color: string; icon: LucideIcon; subtitle: string }> = [
  { key: 'done', label: 'Realizadas', color: '#22c55e', icon: CheckCircle2, subtitle: 'reservas completadas' },
  { key: 'confirmed', label: 'Confirmadas', color: '#8b5cf6', icon: CheckCircle2, subtitle: 'reservas confirmadas' },
  { key: 'pending', label: 'Pendientes', color: '#6366f1', icon: Clock, subtitle: 'reservas en espera' },
  { key: 'cancelled', label: 'Canceladas', color: '#f43f5e', icon: XCircle, subtitle: 'reservas anuladas' },
  { key: 'no_show', label: 'No asistió', color: '#f59e0b', icon: UserX, subtitle: 'ausencias registradas' },
];

const CHANNEL_COLORS = ['#8b5cf6', '#22c55e', '#f59e0b', '#f43f5e', '#6366f1', '#d946ef'];
const COMPACT_CURRENCY_FORMATTER = new Intl.NumberFormat('es-UY', {
  style: 'currency',
  currency: 'UYU',
  notation: 'compact',
  maximumFractionDigits: 1,
});

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatCompactCurrency(cents: number) {
  return COMPACT_CURRENCY_FORMATTER.format(cents / 100);
}

function sanitizePositiveNumber(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, numeric);
}

function getPillClassName(isActive: boolean) {
  if (isActive) {
    return 'border-white/70 bg-white/78 text-ink shadow-[0_14px_24px_-22px_rgba(139,92,246,0.34)] dark:border-transparent dark:bg-white/[0.06] dark:text-white';
  }

  return 'border-white/55 bg-white/40 text-slate/80 hover:bg-white/58 dark:border-transparent dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.05]';
}

function shortenStaffName(value: string) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return 'Sin nombre';
  }

  if (trimmed.length <= 12) {
    return trimmed;
  }

  return `${trimmed.slice(0, 12)}...`;
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

export function MetricsApexOverview({
  metrics,
  selectedStaffId,
  selectedStaffName,
  staffComparison,
}: MetricsApexOverviewProps) {
  const isDarkTheme = useDarkThemeState();
  const baseOptions = useMemo(() => createBaseOptions(isDarkTheme), [isDarkTheme]);
  const axisColor = isDarkTheme ? '#cbd5e1' : '#475569';
  const [areaView, setAreaView] = useState<AreaViewKey>('REVENUE');
  const [pieView, setPieView] = useState<PieViewKey>('STATUS');
  const isStaffFocused = Boolean(selectedStaffId);
  const areaViewOptions = useMemo(
    () => (isStaffFocused ? AREA_VIEW_OPTIONS_STAFF_FOCUS : AREA_VIEW_OPTIONS),
    [isStaffFocused],
  );
  const normalizedStaffComparison = useMemo(
    () =>
      staffComparison.map((item) => ({
        staffId: String(item.staffId || '').trim(),
        staffName: String(item.staffName || '').trim() || 'Sin nombre',
        totalRevenueCents: Number.isFinite(item.totalRevenueCents)
          ? Math.max(0, Math.round(item.totalRevenueCents))
          : 0,
        completedAppointments: Number.isFinite(item.completedAppointments)
          ? Math.max(0, Math.round(item.completedAppointments))
          : 0,
        trustedRating: Number.isFinite(item.trustedRating)
          ? Math.min(5, Math.max(0, Number(item.trustedRating.toFixed(2))))
          : 0,
      })),
    [staffComparison],
  );
  const effectiveStaffRevenueComparison = normalizedStaffComparison;
  const effectiveStaffRatingComparison = normalizedStaffComparison;
  const dailyAreaSeries = useMemo(() => {
    const resolve = (selector: (item: DashboardMetrics['dailySeries'][number]) => number) => {
      const realData = metrics.dailySeries.map((item) => Number(selector(item) || 0));
      return {
        categories: metrics.dailySeries.map((item) => item.label),
        data: realData,
        usingMock: false,
      };
    };

    return {
      revenue: resolve((item) => item.revenueCents),
      totalBookings: resolve((item) => item.appointments),
      onlineBookings: resolve((item) => item.onlineAppointments),
      walkInBookings: resolve((item) => item.walkInAppointments),
    };
  }, [metrics.dailySeries]);
  const ratingAreaSeries = useMemo(() => {
    const realData = metrics.dailyRatingSeries.map((item) => Number(item.averageRating.toFixed(2)));
    return {
      categories: metrics.dailyRatingSeries.map((item) => item.label),
      data: realData,
      usingMock: false,
    };
  }, [metrics.dailyRatingSeries]);
  const handleAreaViewChange = useCallback((nextView: AreaViewKey) => {
    setAreaView((currentView) => (currentView === nextView ? currentView : nextView));
  }, []);
  const handlePieViewChange = useCallback((nextView: PieViewKey) => {
    setPieView((currentView) => (currentView === nextView ? currentView : nextView));
  }, []);

  useEffect(() => {
    if (!isStaffFocused) {
      return;
    }

    if (areaView === 'STAFF_REVENUE' || areaView === 'STAFF_RATING') {
      setAreaView('REVENUE');
    }
  }, [areaView, isStaffFocused]);

  const areaDefinition = useMemo(() => {
    if (areaView === 'SHOP_RATING') {
      return {
        title: isStaffFocused ? 'Calificacion del barbero' : 'Calificacion general',
        subtitle: isStaffFocused
          ? `Promedio diario de rating de ${selectedStaffName || 'este barbero'}.`
          : 'Promedio diario de rating de la barberia.',
        chartType: 'area' as const,
        categories: ratingAreaSeries.categories,
        seriesName: isStaffFocused ? 'Calificacion del barbero' : 'Calificacion general',
        data: ratingAreaSeries.data,
        color: '#8b5cf6',
        usingMock: ratingAreaSeries.usingMock,
        valueFormatter: (value: number) => `${Number(value || 0).toFixed(1)} puntos`,
        axisFormatter: (value: number) => `${Number(value || 0).toFixed(1)}`,
      };
    }

    if (areaView === 'STAFF_RATING') {
      return {
        title: 'Calificacion por barbero',
        subtitle: 'Comparacion visual de rating entre barberos.',
        chartType: 'bar' as const,
        categories: effectiveStaffRatingComparison.map((item) => shortenStaffName(item.staffName)),
        seriesName: 'Calificacion',
        data: effectiveStaffRatingComparison.map((item) => Number(item.trustedRating.toFixed(2))),
        color: '#8b5cf6',
        usingMock: false,
        valueFormatter: (value: number) => `${Number(value || 0).toFixed(1)} puntos`,
        axisFormatter: (value: number) => `${Number(value || 0).toFixed(1)}`,
      };
    }

    if (areaView === 'STAFF_REVENUE') {
      return {
        title: 'Comparacion de barberos',
        subtitle: 'Rendimiento por facturacion de cada barbero en el periodo.',
        chartType: 'bar' as const,
        categories: effectiveStaffRevenueComparison.map((item) => shortenStaffName(item.staffName)),
        seriesName: 'Facturacion por barbero',
        data: effectiveStaffRevenueComparison.map((item) => item.totalRevenueCents),
        color: '#d946ef',
        usingMock: false,
        valueFormatter: (value: number) => formatCurrency(value),
        axisFormatter: (value: number) => formatCompactCurrency(value),
      };
    }

    if (areaView === 'TOTAL_BOOKINGS') {
      return {
        title: 'Reservas reales',
        subtitle: 'Total combinado de web + presencial por fecha.',
        chartType: 'area' as const,
        categories: dailyAreaSeries.totalBookings.categories,
        seriesName: 'Reservas',
        data: dailyAreaSeries.totalBookings.data,
        color: '#c4b5fd',
        usingMock: dailyAreaSeries.totalBookings.usingMock,
        valueFormatter: (value: number) => `${Math.round(value)} reservas`,
        axisFormatter: (value: number) => `${Math.round(value)}`,
      };
    }

    if (areaView === 'ONLINE_BOOKINGS') {
      return {
        title: 'Reservas online',
        subtitle: 'Canal web por fecha.',
        chartType: 'area' as const,
        categories: dailyAreaSeries.onlineBookings.categories,
        seriesName: 'Solo web',
        data: dailyAreaSeries.onlineBookings.data,
        color: '#8b5cf6',
        usingMock: dailyAreaSeries.onlineBookings.usingMock,
        valueFormatter: (value: number) => `${Math.round(value)} reservas`,
        axisFormatter: (value: number) => `${Math.round(value)}`,
      };
    }

    if (areaView === 'WALK_IN_BOOKINGS') {
      return {
        title: 'Reservas presenciales',
        subtitle: 'Walk-ins + carga manual por fecha.',
        chartType: 'area' as const,
        categories: dailyAreaSeries.walkInBookings.categories,
        seriesName: 'Solo presencial',
        data: dailyAreaSeries.walkInBookings.data,
        color: '#14b8a6',
        usingMock: dailyAreaSeries.walkInBookings.usingMock,
        valueFormatter: (value: number) => `${Math.round(value)} reservas`,
        axisFormatter: (value: number) => `${Math.round(value)}`,
      };
    }

    return {
      title: 'Facturacion en el tiempo',
      subtitle: 'Vista principal del negocio para control diario.',
      chartType: 'area' as const,
      categories: dailyAreaSeries.revenue.categories,
      seriesName: 'Facturacion',
      data: dailyAreaSeries.revenue.data,
      color: '#f59e0b',
      usingMock: dailyAreaSeries.revenue.usingMock,
      valueFormatter: (value: number) => formatCurrency(value),
      axisFormatter: (value: number) => formatCompactCurrency(value),
    };
  }, [
    areaView,
    dailyAreaSeries,
    ratingAreaSeries,
    effectiveStaffRevenueComparison,
    effectiveStaffRatingComparison,
    isStaffFocused,
    selectedStaffName,
  ]);

  const normalizedArea = useMemo(() => {
    const categories = [...areaDefinition.categories];
    const data = areaDefinition.data.map((value) => (Number.isFinite(value) ? Number(value) : 0));

    if (data.length === 0) {
      return {
        categories: ['Sin datos', 'Sin datos'],
        data: [0, 0],
      };
    }

    if (data.length === 1) {
      categories.push(categories[0] || 'Actual');
      data.push(data[0] || 0);
    }

    return {
      categories,
      data,
    };
  }, [areaDefinition.categories, areaDefinition.data]);
  const isRatingScale = areaView === 'SHOP_RATING' || areaView === 'STAFF_RATING';
  const flatAreaStats = useMemo(() => {
    if (!normalizedArea.data.length) {
      return {
        isFlat: true,
        flatValue: 0,
      };
    }

    const flatValue = normalizedArea.data[0] || 0;
    const isFlat = normalizedArea.data.every((value) => value === flatValue);

    return {
      isFlat,
      flatValue,
    };
  }, [normalizedArea.data]);
  const hasOnlyZeroAreaValues =
    !isRatingScale && flatAreaStats.isFlat && flatAreaStats.flatValue === 0;
  const shouldShowAreaEmptyState =
    areaDefinition.chartType === 'area' && hasOnlyZeroAreaValues && !areaDefinition.usingMock;
  const chartCategories = useMemo(() => {
    if (areaDefinition.chartType === 'bar') {
      return normalizedArea.categories;
    }

    const total = normalizedArea.categories.length;
    if (total <= 10) {
      return normalizedArea.categories;
    }

    const step = Math.max(1, Math.ceil(total / 7));
    return normalizedArea.categories.map((label, index) =>
      index % step === 0 || index === total - 1 ? label : '',
    );
  }, [areaDefinition.chartType, normalizedArea.categories]);

  const areaOptions = useMemo<ApexOptions>(() => {
    const isBar = areaDefinition.chartType === 'bar';
    const isCurrencyScale = areaView === 'REVENUE' || areaView === 'STAFF_REVENUE';
    const flatPadding = Math.max(Math.abs(flatAreaStats.flatValue) * 0.2, 1);

    return {
      ...baseOptions,
      chart: {
        ...baseOptions.chart,
        type: areaDefinition.chartType,
      },
      colors: [areaDefinition.color],
      stroke: {
        curve: isBar ? 'straight' : 'smooth',
        width: isBar ? 0 : 3,
      },
      ...(isBar
        ? {
            fill: {
              type: 'solid',
              opacity: 0.9,
            },
          }
        : {
            fill: {
              type: 'gradient',
              gradient: {
                shadeIntensity: 0.45,
                opacityFrom: 0.45,
                opacityTo: 0.07,
                stops: [0, 100],
              },
            },
          }),
      legend: {
        ...baseOptions.legend,
        show: false,
      },
      markers: {
        size: isBar ? 0 : 3,
        strokeWidth: 0,
      },
      ...(isBar
        ? {
            plotOptions: {
              bar: {
                borderRadius: 10,
                columnWidth: '52%',
                distributed: false,
              },
            },
          }
        : {}),
      xaxis: {
        categories: chartCategories,
        labels: {
          style: {
            colors: axisColor,
            fontSize: '11px',
          },
          rotate: isBar ? 0 : -20,
        },
      },
      yaxis: {
        ...(isRatingScale
          ? {
              min: 0,
              max: 5,
            }
          : !isBar && flatAreaStats.isFlat
            ? {
                min:
                  flatAreaStats.flatValue === 0
                    ? 0
                    : Math.max(0, flatAreaStats.flatValue - flatPadding),
                max:
                  flatAreaStats.flatValue === 0
                    ? isCurrencyScale
                      ? 100
                      : 1
                    : flatAreaStats.flatValue + flatPadding,
                ...(hasOnlyZeroAreaValues
                  ? {
                      tickAmount: 1,
                    }
                  : {}),
              }
            : {}),
        labels: {
          show: !hasOnlyZeroAreaValues,
          style: {
            colors: axisColor,
            fontSize: '11px',
          },
          formatter: (value: string | number) => areaDefinition.axisFormatter(Number(value) || 0),
        },
      },
      tooltip: {
        ...baseOptions.tooltip,
        y: {
          formatter: (value: string | number) => areaDefinition.valueFormatter(Number(value) || 0),
        },
      },
    };
  }, [
    areaDefinition,
    areaView,
    chartCategories,
    isRatingScale,
    flatAreaStats,
    hasOnlyZeroAreaValues,
    axisColor,
    baseOptions,
  ]);

  const areaSeries = useMemo(
    () => [
      {
        name: areaDefinition.seriesName,
        data: normalizedArea.data,
      },
    ],
    [normalizedArea.data, areaDefinition.seriesName],
  );

  const statusBreakdown = useMemo(() => {
    const real = STATUS_DEFINITIONS.map((item) => ({
      label: item.label,
      color: item.color,
      icon: item.icon,
      subtitle: item.subtitle,
      value: sanitizePositiveNumber(metrics.countsByStatus[item.key]),
    })).filter((item) => item.value > 0);
    return {
      items: real,
      usingMock: false,
    };
  }, [metrics.countsByStatus]);
  const channelBreakdown = useMemo(() => {
    const real = metrics.channelMix
      .map((item, index) => ({
        label: String(item.label || '').trim() || `Canal ${index + 1}`,
        color: CHANNEL_COLORS[index % CHANNEL_COLORS.length] || '#8b5cf6',
        icon: Globe,
        subtitle: 'reservas en este canal',
        value: sanitizePositiveNumber(item.appointments),
      }))
      .filter((item) => item.value > 0);
    return {
      items: real,
      usingMock: false,
    };
  }, [metrics.channelMix]);
  const pieData = useMemo(() => {
    const selectedBreakdown = pieView === 'STATUS' ? statusBreakdown : channelBreakdown;
    const safeItems = selectedBreakdown.items.map((item) => ({
      ...item,
      label: String(item.label || '').trim() || 'Sin etiqueta',
      value: sanitizePositiveNumber(item.value),
    }));
    const pieItems = safeItems.filter((item) => item.value > 0);
    const pieSeries = pieItems.map((item) => sanitizePositiveNumber(item.value));
    const pieTotal = pieSeries.reduce((sum, value) => sum + value, 0);
    const pieWithShare = pieItems.map((item) => ({
      ...item,
      share: pieTotal > 0 ? item.value / pieTotal : 0,
    }));

    return {
      pieItems,
      pieSeries,
      pieTotal,
      pieWithShare,
      usingPieMock: false,
    };
  }, [channelBreakdown, pieView, statusBreakdown]);
  const { pieItems, pieSeries, pieTotal, pieWithShare } = pieData;
  const shouldShowPieEmptyState = pieSeries.length === 0 || pieSeries.every((value) => value <= 0);

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
        show: false,
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              value: {
                show: true,
                color: axisColor,
                formatter: (value: string) => `${Math.round(Number(value) || 0)}`,
              },
              total: {
                show: true,
                label: pieView === 'STATUS' ? 'Vista' : 'Canales',
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
            const row = pieWithShare[opts.seriesIndex];
            const numericValue = Number(value) || 0;

            if (!row) {
              return `${numericValue}`;
            }

            return `${numericValue} reservas (${formatPercent(row.share)})`;
          },
        },
      },
    };
  }, [axisColor, baseOptions, pieItems, pieTotal, pieView, pieWithShare]);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="bg-[#18161f] rounded-[1.5rem] border border-white/5 shadow-none overflow-hidden transition-colors hover:bg-[#1c1a24]">
        <CardBody className="space-y-4 p-6">
          <div className="space-y-2">
            <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-ink dark:text-slate-100">
              {areaDefinition.title}
            </h2>
            <p className="text-sm text-slate/80 dark:text-slate-300">{areaDefinition.subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {areaViewOptions.map((option) => (
              <Button
                key={option.key}
                type="button"
                size="sm"
                radius="lg"
                variant="light"
                className={`rounded-2xl border px-4 py-2 text-xs font-semibold transition ${getPillClassName(
                  areaView === option.key,
                )}`}
                onClick={() => handleAreaViewChange(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {shouldShowAreaEmptyState ? (
            <div className="flex h-[320px] items-center justify-center rounded-[1.3rem] border border-dashed border-white/20 bg-white/[0.01] text-center">
              <div className="px-6">
                <p className="text-sm font-semibold text-slate-200">
                  Sin movimiento en este periodo
                </p>
                <p className="mt-2 text-xs text-slate/70 dark:text-slate-400">
                  Cambia el canal, barbero o rango para ver tendencia en esta vista.
                </p>
              </div>
            </div>
          ) : (
            <ApexChart
              options={areaOptions}
              series={areaSeries}
              type={areaDefinition.chartType}
              height={320}
            />
          )}
        </CardBody>
      </Card>

      <Card className="bg-[#18161f] rounded-[1.5rem] border border-white/5 shadow-none overflow-hidden transition-colors hover:bg-[#1c1a24]">
        <CardBody className="space-y-6 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-ink dark:text-slate-100">
                Distribución
              </h2>
              <p className="text-sm text-slate/80 dark:text-slate-300">
                Estados y origen de reservas dentro del periodo seleccionado.
              </p>
            </div>

            <div className="flex items-center bg-white/[0.03] p-1 rounded-xl border border-white/5 shrink-0">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                  pieView === 'STATUS' ? 'bg-[#c5b4ff]/10 text-[#c5b4ff] shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => handlePieViewChange('STATUS')}
              >
                ESTADOS
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                  pieView === 'CHANNEL' ? 'bg-[#c5b4ff]/10 text-[#c5b4ff] shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => handlePieViewChange('CHANNEL')}
              >
                CANALES
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr] items-center">
            
            <div className="flex justify-center relative">
               {shouldShowPieEmptyState ? (
                  <div className="flex h-[280px] w-full items-center justify-center text-center">
                    <div className="px-6">
                      <p className="text-sm font-semibold text-slate-200">Sin datos en este periodo</p>
                      <p className="mt-2 text-xs text-slate/70 dark:text-slate-400">
                        Ajusta canal, barbero o rango de fechas.
                      </p>
                    </div>
                  </div>
               ) : (
                  <div className="w-full max-w-[260px] md:max-w-[320px] flex items-center justify-center -my-4 md:my-0">
                    <ApexChart options={pieOptions} series={pieSeries} type="donut" width="100%" height={260} /> 
                  </div>
               )}
            </div>
            
            <div className="grid grid-cols-2 md:flex md:flex-col gap-2 md:gap-3 w-full pb-4 md:pb-0">
               {pieWithShare.map((item) => {
                 const Icon = item.icon || CheckCircle2;
                 return (
                   <div key={`card-${item.label}`} className="bg-white/[0.02] rounded-[1rem] md:rounded-[1.2rem] border border-white/5 p-3 md:p-4 transition-all hover:bg-white/[0.04] group relative flex flex-col md:flex-row justify-between h-full min-h-[90px] md:min-h-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 w-full">
                         
                         {/* Mobile Top Row | Desktop Left Wrapper */}
                         <div className="flex items-start md:items-center justify-between w-full md:w-auto">
                            <div className="shrink-0 w-8 h-8 md:w-12 md:h-12 rounded-[0.6rem] md:rounded-[1rem] flex items-center justify-center bg-white/5 transition-transform group-hover:scale-105" style={{boxShadow: `inset 0 0 0 1px ${item.color}40`, color: item.color}}>
                               <Icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                            </div>
                            {/* Mobile Percentage */}
                            <div className="text-xl font-black tracking-tight text-white block md:hidden">
                              {formatPercent(item.share)}
                            </div>
                         </div>
                         
                         {/* Text Section */}
                         <div className="flex-1 md:ml-4 flex flex-col justify-end md:justify-center">
                           <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.12em] md:tracking-[0.16em] text-slate-300 line-clamp-1">{item.label}</p>
                           <p className="text-[9px] md:text-[11px] text-slate-500 mt-0.5 leading-tight">{item.value} <span className="hidden md:inline">{item.subtitle}</span><span className="md:hidden">rsrv.</span></p>
                         </div>
                         
                         {/* Desktop Percentage */}
                         <div className="text-2xl font-black tracking-tight text-white pr-2 hidden md:block">
                           {formatPercent(item.share)}
                         </div>
                         
                      </div>
                   </div>
                 );
               })}
            </div>
            
          </div>
        </CardBody>
      </Card>

      <div className="xl:col-span-2 mt-8">
        <div className="flex items-center justify-between xl:items-end mb-6">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white tracking-tight">
              Ranking de Barberos
            </h2>
            <p className="mt-1 text-sm text-slate-400">Rendimiento individual y aportes al negocio del equipo.</p>
          </div>
          <Button 
            radius="full"
            variant="flat" 
            className="bg-white/5 text-xs text-white font-bold tracking-wide hover:bg-white/10 transition-colors"
          >
            VER INFORMES COMPLETOS
          </Button>
        </div>
        
        <div className="relative rounded-[1.5rem] bg-[#18161f]/60 backdrop-blur-md border border-white/5 overflow-hidden p-2">
          {/* Header row */}
          <div className="hidden lg:grid grid-cols-[2.5fr_1fr_1.5fr_1.5fr_1fr] gap-4 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
             <div>Barbero</div>
             <div>Estado</div>
             <div>Facturación</div>
             <div>Reservas</div>
             <div className="text-right">Puntaje</div>
          </div>
          
          <div className="flex flex-col gap-1">
             {effectiveStaffRevenueComparison.slice(0, 5).map((staff, index) => {
                const isTop = index === 0;
                return (
                  <div 
                    key={staff.staffId} 
                    className={`relative grid grid-cols-[1fr] lg:grid-cols-[2.5fr_1fr_1.5fr_1.5fr_1fr] gap-4 lg:gap-4 p-4 lg:px-6 items-center rounded-2xl transition-all duration-300 hover:bg-white/[0.04] border border-transparent ${isTop ? 'bg-gradient-to-r from-[#c5b4ff]/[0.08] to-transparent border-[#c5b4ff]/10 scale-[1.01] shadow-lg shadow-[#c5b4ff]/5 my-1 lg:my-0' : 'bg-white/[0.01]'}`}
                  >
                     <div className="flex items-center gap-4">
                        <div className="relative">
                          {isTop && (
                            <div className="absolute -top-2 -right-1 z-10 bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 shadow-sm rounded-full w-5 h-5 flex items-center justify-center border border-white/20">
                              <span className="text-[10px] font-extrabold leading-none">1</span>
                            </div>
                          )}
                          <div className={`h-12 w-12 rounded-full overflow-hidden shrink-0 border-2 ${isTop ? 'border-[#c5b4ff]/40' : 'border-white/5'}`}>
                             <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(staff.staffName)}&background=2a2638&color=fff&size=120`} alt={staff.staffName} className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <div>
                           <p className="text-base font-bold text-white group-hover:text-[#c5b4ff] transition-colors">{shortenStaffName(staff.staffName)}</p>
                           <p className="text-[11px] text-slate-400 font-medium">Senior Master</p>
                        </div>
                     </div>
                     <div className="hidden lg:block">
                         <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${staff.completedAppointments > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-400 border border-white/5'}`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${staff.completedAppointments > 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-500'}`} />
                           {staff.completedAppointments > 0 ? 'Activo' : 'Inactivo'}
                         </span>
                     </div>
                     <div className="hidden lg:block text-sm font-bold text-white">
                        {formatCurrency(staff.totalRevenueCents)}
                     </div>
                     <div className="hidden lg:block text-sm font-medium text-slate-300">
                        {staff.completedAppointments} citas
                     </div>
                     <div className="hidden lg:flex text-right items-center justify-end gap-1.5 text-sm font-bold text-[#c5b4ff]">
                        {staff.trustedRating.toFixed(1)} 
                        <Star className={`w-4 h-4 ${isTop ? 'fill-[#c5b4ff]' : 'fill-[#c5b4ff]/40'}`} />
                     </div>
                  </div>
                );
             })}
             {effectiveStaffRevenueComparison.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <Star className="w-6 h-6 text-slate-600" />
                    </div>
                    <h3 className="text-white font-bold mb-1">Sin datos del equipo</h3>
                    <p className="text-sm text-slate-500 max-w-sm">No hay información de rendimiento para el rango de fechas seleccionado actualmente.</p>
                 </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
