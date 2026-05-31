'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { BookShopCard } from '@/components/public/book-shop-card';
import type { MarketplaceShop } from '@/lib/shops';
import { filterPillClass } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';

interface BookPageContentProps {
  shops: MarketplaceShop[];
}

function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function BookPageContent({ shops }: BookPageContentProps) {
  const [query, setQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [activeServicesOnly, setActiveServicesOnly] = useState(false);
  const [openNowOnly, setOpenNowOnly] = useState(false);

  const hasFilters = query.trim() !== '' || verifiedOnly || activeServicesOnly || openNowOnly;

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return shops.filter((shop) => {
      if (q) {
        const inName = normalize(shop.name).includes(q);
        const inCity = normalize(shop.city ?? '').includes(q);
        const inRegion = normalize(shop.region ?? '').includes(q);
        const inLabel = normalize(shop.locationLabel ?? '').includes(q);
        if (!inName && !inCity && !inRegion && !inLabel) return false;
      }
      if (verifiedOnly && !shop.isVerified) return false;
      if (activeServicesOnly && shop.activeServiceCount <= 0) return false;
      if (openNowOnly && shop.todayAvailability === 'closed') return false;
      return true;
    });
  }, [shops, query, verifiedOnly, activeServicesOnly, openNowOnly]);

  function clearAll() {
    setQuery('');
    setVerifiedOnly(false);
    setActiveServicesOnly(false);
    setOpenNowOnly(false);
  }

  const resultCount = filtered.length;
  const queryTrimmed = query.trim();

  return (
    <div className="min-h-screen pb-40">
      {/* ── CONTROLS ── */}
      <section className="px-4 md:px-10 max-w-7xl mx-auto pt-10 pb-6">
        {/* Search input */}
        <div className="relative flex items-center mb-4">
          <Search className="absolute left-4 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar barberia..."
            className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-10 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 transition-all"
          />
          {queryTrimmed !== '' && (
            <button
              aria-label="Limpiar busqueda"
              onClick={() => setQuery('')}
              className="absolute right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          )}
        </div>

        {/* Date / availability label */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
            Disponibilidad
          </span>
        </div>

        {/* Quick-filter pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setOpenNowOnly((v) => !v)}
            className={filterPillClass(openNowOnly)}
          >
            Abierto ahora
          </button>
          <button
            onClick={() => setVerifiedOnly((v) => !v)}
            className={filterPillClass(verifiedOnly)}
          >
            Verificadas
          </button>
          <button
            onClick={() => setActiveServicesOnly((v) => !v)}
            className={filterPillClass(activeServicesOnly)}
          >
            Con agenda activa
          </button>
        </div>

        {/* Active filters strip */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {queryTrimmed !== '' && (
              <span className="text-xs bg-white/10 rounded-full px-3 py-1 text-white/70">
                {`"${queryTrimmed}"`}
              </span>
            )}
            {verifiedOnly && (
              <span className="text-xs bg-white/10 rounded-full px-3 py-1 text-white/70">
                Verificadas
              </span>
            )}
            {activeServicesOnly && (
              <span className="text-xs bg-white/10 rounded-full px-3 py-1 text-white/70">
                Con agenda activa
              </span>
            )}
            {openNowOnly && (
              <span className="text-xs bg-white/10 rounded-full px-3 py-1 text-white/70">
                Abierto ahora
              </span>
            )}
            <button
              onClick={clearAll}
              className={cn(
                'text-xs font-semibold text-white/50 hover:text-white transition-colors',
                'ml-1 underline underline-offset-2',
              )}
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Result count */}
        {hasFilters && resultCount > 0 && (
          <p className="text-xs text-white/50 mb-2">
            {resultCount === 1
              ? '1 barberia encontrada'
              : `${resultCount} barberias encontradas`}
          </p>
        )}
        {hasFilters && resultCount === 0 && (
          <p className="text-xs text-white/50 mb-2">Ninguna barberia coincide con tu busqueda</p>
        )}
      </section>

      {/* ── SHOP LIST ── */}
      <section className="px-4 md:px-10 max-w-7xl mx-auto">
        {filtered.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center gap-4">
            <p className="text-lg font-bold text-white/60">Sin resultados</p>
            <p className="text-sm text-white/40">
              Proba con otro termino o ajusta los filtros
            </p>
            <button
              onClick={clearAll}
              className="mt-2 px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.map((shop) => (
              <BookShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
