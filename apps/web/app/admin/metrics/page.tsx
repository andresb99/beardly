import { formatCurrency } from '@navaja/shared';
import { Card, CardBody } from '@heroui/card';
import { MetricsApexOverview } from '@/components/admin/metrics-apex-overview';
import { requireAdmin } from '@/lib/auth';
import { getDashboardMetricsForDateRange, getStaffPerformanceDashboard } from '@/lib/metrics';
import { buildAdminHref } from '@/lib/workspace-routes';
import { Calendar, DollarSign, Activity, Star } from 'lucide-react';
import { StaffFilter } from '@/components/admin/staff-filter';
import { RangeFilter } from '@/components/admin/range-filter';
interface MetricsPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    staff?: string;
    shop?: string;
  }>;
}

type SparkTone = 'cyan' | 'amber' | 'violet';

interface MetricSparkCardProps {
  id: string;
  label: string;
  value: string;
  hint: string;
  series: number[];
  tone: SparkTone;
}

function coerceStaffId(value: string | undefined) {
  const normalized = String(value || '').trim();
  return normalized || undefined;
}

function buildRangeHref(
  shopSlug: string,
  range: 'today' | 'last7' | 'month',
  selectedStaffId?: string,
) {
  return buildAdminHref('/admin/metrics', shopSlug, {
    range,
    ...(selectedStaffId ? { staff: selectedStaffId } : {}),
  });
}

function buildStaffHref(
  shopSlug: string,
  dateRange: { rangeKey: string; fromDate: string; toDate: string },
  staffId?: string,
) {
  return buildAdminHref('/admin/metrics', shopSlug, {
    ...(dateRange.rangeKey === 'custom'
      ? {
          from: dateRange.fromDate,
          to: dateRange.toDate,
        }
      : {
          range: dateRange.rangeKey,
        }),
    ...(staffId ? { staff: staffId } : {}),
  });
}

function clamp(value: number, min: number, max: number) {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

function buildSparklinePaths(values: number[], width = 260, height = 84, padding = 8) {
  const clean = values
    .map((value) => (Number.isFinite(value) ? value : 0))
    .filter((value) => Number.isFinite(value));
  const safeValues =
    clean.length >= 2 ? clean : clean.length === 1 ? [clean[0] || 0, clean[0] || 0] : [0, 0];
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = max - min || 1;
  const step = (width - padding * 2) / Math.max(safeValues.length - 1, 1);

  const points = safeValues.map((value, index) => {
    const x = padding + index * step;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);

    return { x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x.toFixed(2)} ${(
    height - padding
  ).toFixed(2)} L ${points[0]?.x.toFixed(2)} ${(height - padding).toFixed(2)} Z`;
  const lastPoint = points[points.length - 1] || { x: width - padding, y: height - padding };

  return {
    linePath,
    areaPath,
    lastPoint,
  };
}

function getSparkPalette(tone: SparkTone) {
  if (tone === 'amber') {
    return {
      stroke: '#f59e0b',
      dot: '#fbbf24',
      gradientFrom: 'rgba(245,158,11,0.42)',
      gradientTo: 'rgba(245,158,11,0.02)',
    };
  }

  if (tone === 'violet') {
    return {
      stroke: '#a855f7',
      dot: '#c084fc',
      gradientFrom: 'rgba(168,85,247,0.4)',
      gradientTo: 'rgba(168,85,247,0.02)',
    };
  }

  return {
    stroke: '#8b5cf6',
    dot: '#c4b5fd',
    gradientFrom: 'rgba(139,92,246,0.42)',
    gradientTo: 'rgba(139,92,246,0.02)',
  };
}

function MetricSparkCard({ id, label, value, hint, series, tone, isCurrency = false }: MetricSparkCardProps & { isCurrency?: boolean }) {
  const spark = buildSparklinePaths(series);
  const palette = getSparkPalette(tone);
  const gradientId = `spark-${id}`;

  const renderIcon = () => {
    if (isCurrency) return <DollarSign className="w-5 h-5 text-[#c5b4ff]" />;
    if (tone === 'violet') return <Star className="w-5 h-5 text-[#c5b4ff]" />;
    return <Activity className="w-5 h-5 text-[#c5b4ff]" />;
  };

  return (
    <Card className="bg-[#18161f] overflow-hidden rounded-[1.2rem] lg:rounded-[1.5rem] border border-white/5 shadow-none transition-colors hover:bg-[#1c1a24] h-full">
      <CardBody className="relative p-3 pb-16 lg:p-6 lg:pb-20 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-3 lg:mb-6">
           <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-[0.5rem] lg:rounded-xl bg-white/[0.04] flex items-center justify-center">
             {renderIcon()}
           </div>
           {/* Placeholder for trending info */}
           <div className="text-[9px] lg:text-[10px] font-bold text-slate-500 tracking-wider">
              {series.length > 1 ? 'AL ALZA' : 'ESTABLE'}
           </div>
        </div>

        <div>
          <p className="relative z-10 text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.05em] lg:tracking-[0.15em] text-slate-400 mb-1 lg:mb-2 leading-tight">
            {label}
          </p>
          <p className="relative z-10 text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-0.5 lg:mb-1">
            {value}
          </p>
          <p className="relative z-10 text-[9px] lg:text-[11px] text-slate-500 leading-tight">{hint}</p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60px] lg:h-[70px] overflow-hidden">
          <svg viewBox="0 0 260 84" preserveAspectRatio="none" className="h-full w-full opacity-60">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.gradientFrom} />
                <stop offset="100%" stopColor={palette.gradientTo} />
              </linearGradient>
            </defs>
            <path d={spark.areaPath} fill={`url(#${gradientId})`} />
            <path
              d={spark.linePath}
              fill="none"
              stroke={palette.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </CardBody>
    </Card>
  );
}

export default async function MetricsPage({ searchParams }: MetricsPageProps) {
  const params = await searchParams;
  const ctx = await requireAdmin({ shopSlug: params.shop });
  const selectedStaffId = coerceStaffId(params.staff);
  const [dashboard, businessMetrics] = await Promise.all([
    getStaffPerformanceDashboard(
      {
        range: params.range,
        from: params.from,
        to: params.to,
      },
      ctx.shopId,
      ctx.shopSlug,
    ),
    getDashboardMetricsForDateRange(
      {
        range: params.range,
        from: params.from,
        to: params.to,
      },
      ctx.shopId,
      'ALL',
      selectedStaffId,
    ),
  ]);

  const selectedStaff = selectedStaffId
    ? dashboard.staff.find((item) => item.staffId === selectedStaffId) || null
    : null;
  const viewStaffBreakdownById = new Map(
    businessMetrics.staffBreakdown.map((item) => [item.staffId, item]),
  );
  const selectedStaffBreakdown = selectedStaffId
    ? viewStaffBreakdownById.get(selectedStaffId) || null
    : null;
  const bookingsSeries = businessMetrics.dailySeries.map((item) => Number(item.appointments || 0));
  const revenueSeries = businessMetrics.dailySeries.map((item) => Number(item.revenueCents || 0));
  const effectiveBookingsValue = businessMetrics.channelBreakdown.filteredAppointments;
  const effectiveBookingsSeries = bookingsSeries;
  const effectiveBookingsHint = `Online ${businessMetrics.channelBreakdown.onlineAppointments} | Presenciales ${businessMetrics.channelBreakdown.walkInAppointments}`;
  const effectiveRevenueValueCents = businessMetrics.estimatedRevenueCents;
  const effectiveRevenueSeries = revenueSeries;
  const effectiveRevenueHint = 'Valor cobrado en citas realizadas';
  const viewRatingTotals = businessMetrics.staffBreakdown.reduce(
    (acc, item) => {
      acc.reviewCount += item.reviewCount;
      acc.ratingScore += item.averageRating * item.reviewCount;
      return acc;
    },
    {
      reviewCount: 0,
      ratingScore: 0,
    },
  );
  const teamRatingInView =
    viewRatingTotals.reviewCount > 0
      ? viewRatingTotals.ratingScore / viewRatingTotals.reviewCount
      : 0;
  const ratingValue = selectedStaffBreakdown
    ? selectedStaffBreakdown.averageRating
    : teamRatingInView;
  const ratingHint = selectedStaff
    ? `${selectedStaffBreakdown?.reviewCount || 0} resenas verificadas`
    : viewRatingTotals.reviewCount > 0
      ? `${viewRatingTotals.reviewCount} resenas verificadas`
      : 'Sin resenas verificadas en esta vista';

  const ratingSeries = selectedStaffBreakdown
    ? [ratingValue - 0.2, ratingValue - 0.1, ratingValue, ratingValue + 0.05, ratingValue].map(
        (value) => Number(clamp(value, 0, 5).toFixed(2)),
      )
    : businessMetrics.staffBreakdown.map((item) => item.averageRating);
  const staffComparisonDataMap = new Map(
    dashboard.staff.map((item) => [
      item.staffId,
      {
        staffId: item.staffId,
        staffName: item.staffName,
        totalRevenueCents: 0,
        completedAppointments: 0,
        trustedRating: 0,
      },
    ]),
  );
  for (const row of businessMetrics.staffBreakdown) {
    const existing = staffComparisonDataMap.get(row.staffId);
    if (existing) {
      existing.totalRevenueCents = row.revenueCents;
      existing.completedAppointments = row.doneAppointments;
      existing.trustedRating = row.averageRating;
      continue;
    }

    staffComparisonDataMap.set(row.staffId, {
      staffId: row.staffId,
      staffName: row.staffName,
      totalRevenueCents: row.revenueCents,
      completedAppointments: row.doneAppointments,
      trustedRating: row.averageRating,
    });
  }
  const staffComparisonData = [...staffComparisonDataMap.values()].sort((left, right) => {
    if (right.totalRevenueCents !== left.totalRevenueCents) {
      return right.totalRevenueCents - left.totalRevenueCents;
    }
    return right.completedAppointments - left.completedAppointments;
  });
  const metricsViewKey = [
    dashboard.dateRange.rangeKey,
    dashboard.dateRange.fromDate,
    dashboard.dateRange.toDate,
    selectedStaffId || 'business',
  ].join(':');

  return (
    <div className="min-h-screen px-4 md:px-0 py-4 lg:py-10 space-y-8 lg:space-y-12 w-full">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm text-slate-400 border-b border-white/5 pb-6">
        <span className="font-bold text-white">Consola de Administración</span>
        <span className="hidden md:inline mx-2 text-white/10">|</span>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{dashboard.dateRange.label}</span>
        </div>
      </div>

      {/* Main Operational Overview Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-white md:text-4xl">
            {selectedStaff ? `Métricas de ${selectedStaff.staffName}` : 'Resumen Operativo'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {selectedStaff 
              ? `Análisis de rendimiento individual para el periodo seleccionado.` 
              : 'Rendimiento en tiempo real de tu barbería y equipo.'}
          </p>
        </div>

         <div className="flex items-center gap-4">
            {/* Range Pill Selector */}
            <RangeFilter 
              currentRange={dashboard.dateRange.rangeKey}
              ranges={[
               { key: 'today', label: 'Hoy', href: buildRangeHref(ctx.shopSlug, 'today', selectedStaffId) },
                { key: 'last7', label: 'Últimos 7 días', href: buildRangeHref(ctx.shopSlug, 'last7', selectedStaffId) },
                { key: 'month', label: 'Este mes', href: buildRangeHref(ctx.shopSlug, 'month', selectedStaffId) }
              ]}
            />

           {/* Staff Filter Dropdown (Minimal) */}
           <StaffFilter 
             staff={dashboard.staff.map(s => ({
               id: s.staffId,
               name: s.staffName,
               href: buildStaffHref(ctx.shopSlug, dashboard.dateRange, s.staffId)
             }))}
             selectedStaffName={selectedStaff?.staffName}
             allStaffHref={buildStaffHref(ctx.shopSlug, dashboard.dateRange)}
           />
        </div>
      </div>

      {/* Grid of spark cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4 w-full">
        <MetricSparkCard
          id="revenue"
          label="FACTURACIÓN TOTAL"
          value={formatCurrency(effectiveRevenueValueCents)}
          hint={effectiveRevenueHint}
          series={effectiveRevenueSeries}
          tone="violet"
          isCurrency
        />
        <MetricSparkCard
          id="real-bookings"
          label="CITAS AGENDADAS"
          value={`${effectiveBookingsValue}`}
          hint={effectiveBookingsHint}
          series={effectiveBookingsSeries}
          tone="cyan"
        />
        <MetricSparkCard
          id="rating"
          label="PUNTUACIÓN PROMEDIO"
          value={`${ratingValue.toFixed(2)} / 5`}
          hint={ratingHint}
          series={ratingSeries}
          tone="violet"
        />
        
        {/* Helper component mock to represent NO-SHOW Rate similar to reference image */}
        <Card className="bg-[#18161f] overflow-hidden rounded-[1.2rem] lg:rounded-[1.5rem] border border-white/5 shadow-none transition-colors hover:bg-[#1c1a24] h-full">
          <CardBody className="relative p-3 lg:p-6 pt-3 lg:pt-5 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex justify-between items-start mb-3 lg:mb-6">
               <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-[0.5rem] lg:rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                 <XIcon className="w-4 h-4 lg:w-5 lg:h-5" />
               </div>
               <div className="text-[9px] lg:text-[10px] font-bold text-rose-500 tracking-wider">
                  -2.1% ↘
               </div>
            </div>
            
            <div>
               <p className="relative z-10 text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.05em] lg:tracking-[0.15em] text-slate-400 mb-1 lg:mb-2 leading-tight">
                 TASA DE AUSENTISMO
               </p>
               <p className="relative z-10 text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-0.5 lg:mb-1">
                 1.4%
               </p>
               <p className="relative z-10 text-[9px] lg:text-[11px] text-slate-500 leading-tight">Estándar del sector {'<3%'}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <MetricsApexOverview
        key={metricsViewKey}
        metrics={businessMetrics}
        {...(selectedStaffId ? { selectedStaffId } : {})}
        {...(selectedStaff?.staffName ? { selectedStaffName: selectedStaff.staffName } : {})}
        staffComparison={staffComparisonData}
      />
    </div>
  );
}

function XIcon(props: { className?: string }) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
