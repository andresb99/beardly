'use client';

import type { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { formatCurrency } from '@navaja/shared';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import type { StaffPerformanceMetric } from '@/lib/metrics';

const ApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] animate-pulse rounded-[1.4rem] bg-white/45 dark:bg-white/[0.04]" />
  ),
});

interface StaffPerformanceVisualsProps {
  staff: StaffPerformanceMetric[];
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatHours(minutes: number) {
  return Number((minutes / 60).toFixed(1));
}

function formatCompactCurrency(cents: number) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

function shortenStaffName(value: unknown) {
  const trimmed = String(value ?? '').trim();

  if (!trimmed) {
    return 'Sin nombre';
  }

  if (trimmed.length <= 12) {
    return trimmed;
  }

  const parts = trimmed.split(/\s+/);
  const secondPart = parts[1];

  if (parts.length >= 2 && secondPart) {
    return `${parts[0]} ${secondPart.charAt(0)}.`;
  }

  return `${trimmed.slice(0, 12)}...`;
}

function useDarkThemeState() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    const syncTheme = () => {
      setIsDarkTheme(root.classList.contains('dark'));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return isDarkTheme;
}

function createBaseChartOptions(isDarkTheme: boolean): ApexOptions {
  return {
    chart: {
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      animations: {
        enabled: true,
        speed: 360,
      },
      foreColor: isDarkTheme ? '#cbd5e1' : '#475569',
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    grid: {
      borderColor: isDarkTheme ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.22)',
    },
    legend: {
      labels: {
        colors: isDarkTheme ? '#cbd5e1' : '#475569',
      },
    },
    tooltip: {
      theme: isDarkTheme ? 'dark' : 'light',
    },
    xaxis: {
      labels: {
        style: {
          colors: isDarkTheme ? '#cbd5e1' : '#475569',
          fontSize: '11px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: isDarkTheme ? '#cbd5e1' : '#475569',
          fontSize: '11px',
        },
      },
    },
  };
}

function ChartShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="surface-card rounded-[1.8rem] p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
            Vista
          </p>
          <h3 className="mt-2 font-[family-name:var(--font-heading)] text-xl font-semibold text-ink dark:text-slate-100">
            {title}
          </h3>
        </div>
        <p className="max-w-sm text-right text-xs text-slate/75 dark:text-slate-300">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function StaffPerformanceVisuals({ staff }: StaffPerformanceVisualsProps) {
  const isDarkTheme = useDarkThemeState();
  const baseOptions = useMemo(() => createBaseChartOptions(isDarkTheme), [isDarkTheme]);

  const chartStaff = useMemo(
    () =>
      [...staff]
        .sort((left, right) => right.totalRevenueCents - left.totalRevenueCents)
        .slice(0, 6),
    [staff],
  );

  const topPerHour = useMemo(
    () =>
      [...staff].sort(
        (left, right) => right.revenuePerAvailableHourCents - left.revenuePerAvailableHourCents,
      )[0] || null,
    [staff],
  );

  const bestOccupancy = useMemo(
    () => [...staff].sort((left, right) => right.occupancyRatio - left.occupancyRatio)[0] || null,
    [staff],
  );

  const categories = useMemo(() => chartStaff.map((item) => item.staffName), [chartStaff]);

  const revenueSeries = useMemo(
    () => [
      {
        name: 'Facturacion',
        data: chartStaff.map((item) => item.totalRevenueCents),
      },
    ],
    [chartStaff],
  );

  const revenueOptions = useMemo<ApexOptions>(
    () => ({
      ...baseOptions,
      chart: {
        ...baseOptions.chart,
        type: 'bar',
      },
      colors: ['#8b5cf6'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0.6,
          opacityFrom: 0.95,
          opacityTo: 0.72,
          stops: [0, 90, 100],
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 12,
          columnWidth: '46%',
        },
      },
      xaxis: {
        ...baseOptions.xaxis,
        categories,
        labels: {
          ...baseOptions.xaxis?.labels,
          formatter: (value: string) => shortenStaffName(value),
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: isDarkTheme ? '#cbd5e1' : '#475569',
            fontSize: '11px',
          },
          formatter: (value: string | number) => formatCompactCurrency(Number(value)),
        },
        title: {
          text: 'Facturacion',
        },
      },
      tooltip: {
        ...baseOptions.tooltip,
        y: {
          formatter: (value: string | number) => formatCurrency(Number(value)),
        },
      },
    }),
    [baseOptions, categories, isDarkTheme],
  );

  const qualitySeries = useMemo(
    () => [
      {
        name: 'Ocupacion',
        data: chartStaff.map((item) => Math.round(item.occupancyRatio * 100)),
      },
      {
        name: 'Retencion',
        data: chartStaff.map((item) => Math.round(item.repeatClientRate * 100)),
      },
      {
        name: 'Resena x20',
        data: chartStaff.map((item) => Number((item.trustedRating * 20).toFixed(1))),
      },
    ],
    [chartStaff],
  );

  const qualityOptions = useMemo<ApexOptions>(
    () => ({
      ...baseOptions,
      chart: {
        ...baseOptions.chart,
        type: 'line',
      },
      colors: ['#8b5cf6', '#d946ef', '#f59e0b'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0.5,
          opacityFrom: 0.24,
          opacityTo: 0.05,
          stops: [0, 100],
        },
      },
      markers: {
        size: 4,
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      xaxis: {
        ...baseOptions.xaxis,
        categories,
        labels: {
          ...baseOptions.xaxis?.labels,
          formatter: (value: string) => shortenStaffName(value),
        },
      },
      yaxis: {
        ...baseOptions.yaxis,
        min: 0,
        max: 100,
        tickAmount: 5,
        title: {
          text: 'Nivel',
        },
      },
      tooltip: {
        ...baseOptions.tooltip,
        y: {
          formatter: (value: string | number) => `${Number(value).toFixed(0)}`,
        },
      },
    }),
    [baseOptions, categories],
  );

  const availabilitySeries = useMemo(
    () => [
      {
        name: 'Reservadas',
        data: chartStaff.map((item) => formatHours(item.bookedMinutes)),
      },
      {
        name: 'Libres',
        data: chartStaff.map((item) =>
          Math.max(0, formatHours(item.availableMinutes) - formatHours(item.bookedMinutes)),
        ),
      },
    ],
    [chartStaff],
  );

  const availabilityOptions = useMemo<ApexOptions>(
    () => ({
      ...baseOptions,
      chart: {
        ...baseOptions.chart,
        type: 'bar',
        stacked: true,
      },
      colors: ['#0f172a', '#cbd5e1'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0.55,
          opacityFrom: 0.92,
          opacityTo: 0.68,
          stops: [0, 90, 100],
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 10,
          barHeight: '58%',
        },
      },
      xaxis: {
        ...baseOptions.xaxis,
        labels: {
          ...baseOptions.xaxis?.labels,
          formatter: (value: string | number) => `${Number(value).toFixed(0)} h`,
        },
      },
      yaxis: {
        categories,
        labels: {
          style: {
            colors: isDarkTheme ? '#cbd5e1' : '#475569',
            fontSize: '11px',
          },
          formatter: (value: string | number) => shortenStaffName(String(value)),
        },
      },
      legend: {
        ...baseOptions.legend,
        position: 'top',
      },
      tooltip: {
        ...baseOptions.tooltip,
        y: {
          formatter: (value: string | number) => `${Number(value).toFixed(1)} h`,
        },
      },
    }),
    [baseOptions, categories, isDarkTheme],
  );

  if (!chartStaff.length) {
    return null;
  }

  return (
    <section className="soft-panel rounded-[2rem] p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="hero-eyebrow dark:border-white/10 dark:bg-white/[0.04] dark:text-white/82">
            Analitica visual
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-semibold text-ink dark:text-slate-100 md:text-[2rem]">
            Dashboard grafico del equipo
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate/80 dark:text-slate-300">
            Graficos con ApexCharts integrados al lenguaje visual actual del panel para lectura
            rapida y comparaciones claras.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="data-card w-full sm:min-w-[220px] rounded-[1.5rem] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
              Mejor por hora
            </p>
            <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
              {topPerHour?.staffName || 'Sin datos'}
            </p>
            <p className="mt-1 text-xs text-slate/70 dark:text-slate-400">
              {topPerHour ? formatCurrency(topPerHour.revenuePerAvailableHourCents) : 'Sin lectura'}
            </p>
          </div>
          <div className="data-card w-full sm:min-w-[220px] rounded-[1.5rem] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
              Mayor ocupacion
            </p>
            <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
              {bestOccupancy?.staffName || 'Sin datos'}
            </p>
            <p className="mt-1 text-xs text-slate/70 dark:text-slate-400">
              {bestOccupancy ? formatPercent(bestOccupancy.occupancyRatio) : 'Sin lectura'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <ChartShell
          title="Facturacion por barbero"
          subtitle="Ranking de ingresos totales del periodo. El eje vertical usa moneda compacta."
        >
          <div className="h-[320px]">
            <ApexChart options={revenueOptions} series={revenueSeries} type="bar" height={320} />
          </div>
        </ChartShell>

        <ChartShell
          title="Pulso de fidelizacion"
          subtitle="Ocupacion y retencion en porcentaje; la resena se normaliza sobre 100 para comparar."
        >
          <div className="h-[320px]">
            <ApexChart options={qualityOptions} series={qualitySeries} type="line" height={320} />
          </div>
        </ChartShell>
      </div>

      <div className="mt-4">
        <ChartShell
          title="Capacidad reservada vs libre"
          subtitle="Horas disponibles del periodo divididas entre tiempo vendido y capacidad aun libre."
        >
          <div className="h-[360px]">
            <ApexChart
              options={availabilityOptions}
              series={availabilitySeries}
              type="bar"
              height={360}
            />
          </div>
        </ChartShell>
      </div>
    </section>
  );
}
