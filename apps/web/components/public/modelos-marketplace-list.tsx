'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { formatCurrency } from '@navaja/shared';
import type { MarketplaceOpenModelCall } from '@/lib/modelos';
import { buildShopHref } from '@/lib/shop-links';

interface ModelosMarketplaceListProps {
  calls: MarketplaceOpenModelCall[];
}

function normalizeFilterValue(value: string | null | undefined) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getLocationLabel(call: MarketplaceOpenModelCall) {
  return call.location || 'Sin ubicacion definida';
}

export function ModelosMarketplaceList({ calls }: ModelosMarketplaceListProps) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const normalizedCategoryFilter = useMemo(() => normalizeFilterValue(categoryFilter), [categoryFilter]);
  const normalizedLocationFilter = useMemo(() => normalizeFilterValue(locationFilter), [locationFilter]);

  const preparedCalls = useMemo(() => {
    return calls.map((call) => {
      const modelCategories = Array.isArray(call.model_categories)
        ? call.model_categories.map((category) => String(category || '').trim()).filter(Boolean)
        : [];
      const locationLabel = getLocationLabel(call);

      return {
        ...call,
        modelCategories,
        normalizedModelCategories: modelCategories.map((category) => normalizeFilterValue(category)),
        locationLabel,
        normalizedLocationLabel: normalizeFilterValue(locationLabel),
      };
    });
  }, [calls]);

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    for (const call of preparedCalls) {
      for (const category of call.modelCategories) {
        categories.add(category);
      }
    }

    return Array.from(categories).sort((a, b) => a.localeCompare(b, 'es'));
  }, [preparedCalls]);

  const locationOptions = useMemo(() => {
    const locations = new Set<string>();
    for (const call of preparedCalls) {
      locations.add(call.locationLabel);
    }

    return Array.from(locations).sort((a, b) => a.localeCompare(b, 'es'));
  }, [preparedCalls]);

  const filteredCalls = useMemo(() => {
    return preparedCalls.filter((call) => {
      if (categoryFilter !== 'all') {
        const hasCategory = call.normalizedModelCategories.some(
          (category) => category === normalizedCategoryFilter,
        );
        if (!hasCategory) {
          return false;
        }
      }

      if (locationFilter !== 'all') {
        if (call.normalizedLocationLabel !== normalizedLocationFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    categoryFilter,
    locationFilter,
    normalizedCategoryFilter,
    normalizedLocationFilter,
    preparedCalls,
  ]);

  const renderedCalls = useMemo(
    () =>
      filteredCalls.map((call) => {
        const modelCategories = call.modelCategories;

        return (
          <article key={call.session_id} className="soft-panel rounded-[1.8rem] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                  {call.shop_name}
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-semibold text-ink dark:text-slate-100">
                  {call.course_title}
                </h2>
                <p className="mt-2 text-sm text-slate/80 dark:text-slate-300">
                  {new Date(call.start_at).toLocaleString('es-UY')} - {call.location}
                </p>
              </div>

              <div className="surface-card min-w-[220px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                  Compensacion
                </p>
                <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                  {call.compensation_type === 'gratis'
                    ? 'Gratis'
                    : call.compensation_value_cents
                      ? formatCurrency(call.compensation_value_cents)
                      : call.compensation_type}
                </p>
                <p className="mt-1 text-xs text-slate/75 dark:text-slate-400">
                  Cupos: {call.models_needed || 'Sin definir'}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate/80 dark:text-slate-300">
              {call.notes_public || 'Sin notas publicas.'}
            </p>
            {modelCategories.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {modelCategories.map((category) => (
                  <span
                    key={`${call.session_id}-${category}`}
                    className="meta-chip border-cyan-400/24 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200"
                  >
                    {category}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/modelos/registro?session_id=${encodeURIComponent(call.session_id)}`}
                className="action-primary rounded-2xl px-4 py-2 text-sm font-semibold"
              >
                Postularme
              </Link>
              <Link
                href={buildShopHref(call.shop_slug, 'modelos')}
                className="action-secondary rounded-2xl px-4 py-2 text-sm font-semibold"
              >
                Ver barberia
              </Link>
            </div>
          </article>
        );
      }),
    [filteredCalls],
  );

  const clearFilters = useCallback(() => {
    setCategoryFilter('all');
    setLocationFilter('all');
  }, []);

  return (
    <>
      <div className="soft-panel rounded-[1.8rem] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="hero-eyebrow">Filtros</p>
          <button
            type="button"
            onClick={clearFilters}
            className="meta-chip transition hover:bg-white/80 dark:hover:bg-white/[0.08]"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
            Categoria
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2 text-sm font-medium text-ink dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
            >
              <option value="all">Todas</option>
              {categoryOptions.map((category) => (
                <option key={`model-category-${category}`} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
            Ubicacion
            <select
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2 text-sm font-medium text-ink dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
            >
              <option value="all">Todas</option>
              {locationOptions.map((location) => (
                <option key={`model-location-${location}`} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filteredCalls.length === 0 ? (
        <div className="soft-panel rounded-[1.8rem] p-6">
          <p className="text-sm text-slate/80 dark:text-slate-300">
            No encontramos convocatorias para esos filtros. Prueba con otra combinacion.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {renderedCalls}
      </div>
    </>
  );
}
