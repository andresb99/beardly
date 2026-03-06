'use client';

import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { formatCurrency } from '@navaja/shared';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import type { StaffPerformanceMetric } from '@/lib/metrics';

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

function shortenStaffName(value: string) {
  const trimmed = value.trim();

  if (trimmed.length <= 12) {
    return trimmed;
  }

  const parts = trimmed.split(/\s+/);
  const secondPart = parts[1];

  if (parts.length >= 2 && secondPart) {
    return `${parts[0]} ${secondPart.charAt(0)}.`;
  }

  return `${trimmed.slice(0, 12)}…`;
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

function createChartTheme(isDarkTheme: boolean) {
  return {
    background: 'transparent',
    text: {
      fill: isDarkTheme ? '#cbd5e1' : '#475569',
      fontSize: 12,
    },
    axis: {
      domain: {
        line: {
          stroke: isDarkTheme ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.28)',
          strokeWidth: 1,
        },
      },
      ticks: {
        line: {
          stroke: isDarkTheme ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.26)',
          strokeWidth: 1,
        },
        text: {
          fill: isDarkTheme ? '#cbd5e1' : '#475569',
          fontSize: 11,
        },
      },
      legend: {
        text: {
          fill: isDarkTheme ? '#e2e8f0' : '#1e293b',
          fontSize: 12,
        },
      },
    },
    grid: {
      line: {
        stroke: isDarkTheme ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.18)',
        strokeWidth: 1,
      },
    },
    crosshair: {
      line: {
        stroke: isDarkTheme ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.22)',
        strokeWidth: 1,
        strokeOpacity: 1,
      },
    },
    tooltip: {
      container: {
        background: isDarkTheme ? 'rgba(7, 12, 24, 0.94)' : 'rgba(255, 255, 255, 0.96)',
        color: isDarkTheme ? '#f8fafc' : '#0f172a',
        fontSize: '12px',
        borderRadius: '16px',
        border: isDarkTheme ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.82)',
        boxShadow: isDarkTheme
          ? '0 24px 48px -30px rgba(2, 6, 23, 0.85)'
          : '0 24px 42px -28px rgba(15, 23, 42, 0.18)',
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
  const chartTheme = useMemo(() => createChartTheme(isDarkTheme), [isDarkTheme]);

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

  const revenueData = useMemo(
    () =>
      chartStaff.map((item) => ({
        staff: item.staffName,
        revenue: item.totalRevenueCents,
      })),
    [chartStaff],
  );

  const availabilityData = useMemo(
    () =>
      chartStaff.map((item) => ({
        staff: item.staffName,
        Reservadas: formatHours(item.bookedMinutes),
        Libres: Math.max(0, formatHours(item.availableMinutes) - formatHours(item.bookedMinutes)),
      })),
    [chartStaff],
  );

  const qualitySeries = useMemo(
    () => [
      {
        id: 'Ocupacion',
        data: chartStaff.map((item) => ({
          x: item.staffName,
          y: Math.round(item.occupancyRatio * 100),
        })),
      },
      {
        id: 'Retencion',
        data: chartStaff.map((item) => ({
          x: item.staffName,
          y: Math.round(item.repeatClientRate * 100),
        })),
      },
      {
        id: 'Resena x20',
        data: chartStaff.map((item) => ({
          x: item.staffName,
          y: Number((item.trustedRating * 20).toFixed(1)),
        })),
      },
    ],
    [chartStaff],
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
            Visualizaciones con Nivo, integradas al mismo lenguaje glass y de gradientes del panel.
            Priorizan lectura rapida y comparaciones claras.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="data-card min-w-[220px] rounded-[1.5rem] p-4">
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
          <div className="data-card min-w-[220px] rounded-[1.5rem] p-4">
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
            <ResponsiveBar
              data={revenueData}
              keys={['revenue']}
              indexBy="staff"
              margin={{ top: 10, right: 12, bottom: 72, left: 74 }}
              padding={0.34}
              borderRadius={14}
              colors={['#0ea5e9']}
              borderColor={{ from: 'color', modifiers: [['darker', 0.24]] }}
              enableLabel={false}
              theme={chartTheme}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 0,
                tickPadding: 14,
                legend: 'Equipo',
                legendOffset: 58,
                legendPosition: 'middle',
                format: (value) => shortenStaffName(String(value)),
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 10,
                legend: 'Facturacion',
                legendOffset: -58,
                legendPosition: 'middle',
                format: (value) => formatCompactCurrency(Number(value)),
              }}
              gridYValues={5}
              animate
              role="application"
              ariaLabel="Grafico de facturacion por barbero"
              tooltip={({ indexValue, value, color }) => (
                <div className="rounded-2xl px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {String(indexValue)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <p className="text-sm font-semibold">{formatCurrency(Number(value))}</p>
                  </div>
                </div>
              )}
            />
          </div>
        </ChartShell>

        <ChartShell
          title="Pulso de fidelizacion"
          subtitle="Ocupacion y retencion en porcentaje; la resena se normaliza sobre 100 para comparar."
        >
          <div className="h-[320px]">
            <ResponsiveLine
              data={qualitySeries}
              margin={{ top: 16, right: 18, bottom: 72, left: 56 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 0, max: 100, stacked: false, reverse: false }}
              curve="monotoneX"
              colors={['#0ea5e9', '#f43f5e', '#f59e0b']}
              lineWidth={3}
              pointSize={9}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointColor={isDarkTheme ? '#020617' : '#ffffff'}
              pointLabelYOffset={-12}
              enableArea
              areaOpacity={0.07}
              enableGridX={false}
              useMesh
              theme={chartTheme}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 0,
                tickPadding: 14,
                legend: 'Equipo',
                legendOffset: 58,
                legendPosition: 'middle',
                format: (value) => shortenStaffName(String(value)),
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 10,
                legend: 'Nivel',
                legendOffset: -44,
                legendPosition: 'middle',
              }}
              legends={[
                {
                  anchor: 'top-left',
                  direction: 'row',
                  justify: false,
                  translateX: 0,
                  translateY: -8,
                  itemsSpacing: 12,
                  itemWidth: 90,
                  itemHeight: 18,
                  symbolSize: 10,
                  symbolShape: 'circle',
                },
              ]}
              tooltip={({ point }) => (
                <div className="rounded-2xl px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {String(point.data.x)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: point.seriesColor }}
                    />
                    <p className="text-sm font-semibold">
                      {String(point.seriesId)}: {Number(point.data.yFormatted).toFixed(0)}
                    </p>
                  </div>
                </div>
              )}
            />
          </div>
        </ChartShell>
      </div>

      <div className="mt-4">
        <ChartShell
          title="Capacidad reservada vs libre"
          subtitle="Horas disponibles del periodo divididas entre tiempo vendido y capacidad aun libre."
        >
          <div className="h-[360px]">
            <ResponsiveBar
              data={availabilityData}
              keys={['Reservadas', 'Libres']}
              indexBy="staff"
              layout="horizontal"
              groupMode="stacked"
              margin={{ top: 8, right: 16, bottom: 36, left: 108 }}
              padding={0.32}
              innerPadding={3}
              borderRadius={14}
              colors={['#0f172a', '#cbd5e1']}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              enableLabel={false}
              theme={chartTheme}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 0,
                tickPadding: 10,
                legend: 'Horas',
                legendOffset: 30,
                legendPosition: 'middle',
                format: (value) => `${Number(value).toFixed(0)} h`,
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 12,
                format: (value) => shortenStaffName(String(value)),
              }}
              enableGridY={false}
              animate
              role="application"
              ariaLabel="Grafico de capacidad reservada y libre"
              tooltip={({ id, value, color, indexValue }) => (
                <div className="rounded-2xl px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {String(indexValue)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <p className="text-sm font-semibold">
                      {String(id)}: {Number(value).toFixed(1)} h
                    </p>
                  </div>
                </div>
              )}
            />
          </div>
        </ChartShell>
      </div>
    </section>
  );
}
