'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Building, Filter, LayoutGrid, LayoutList, ArrowRight, X } from 'lucide-react';
import { Button } from '@heroui/react';
import { cn } from '@/lib/cn';
import { buildShopHref } from '@/lib/shop-links';
import {
  SectionTitle,
  FilterSectionLabel,
  filterPillClass,
  drawerOverlayClass,
  drawerPanelClass,
  DrawerStyles,
  ctaButtonClass,
} from '@/components/ui/primitives';

interface ShopData {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  region: string | null;
  description: string | null;
}

interface MarketplaceJobsListProps {
  shops: ShopData[];
}

export function MarketplaceJobsList({ shops }: MarketplaceJobsListProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFilterClosing, setIsFilterClosing] = useState(false);
  const closingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeLocation, setActiveLocation] = useState('Todas');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const closeFilter = useCallback(() => {
    if (isFilterClosing) return;
    setIsFilterClosing(true);
    closingTimer.current = setTimeout(() => {
      setIsFilterOpen(false);
      setIsFilterClosing(false);
    }, 200);
  }, [isFilterClosing]);

  const locationOptions = useMemo(() => {
    const locations = new Set<string>();
    shops.forEach((shop) => {
      if (shop.region) locations.add(shop.region.trim());
      else if (shop.city) locations.add(shop.city.trim());
    });
    return Array.from(locations).sort();
  }, [shops]);

  const filteredShops = useMemo(() => {
    if (activeLocation === 'Todas') return shops;
    return shops.filter((shop) => shop.region === activeLocation || shop.city === activeLocation);
  }, [shops, activeLocation]);

  const resetFilters = () => {
    setActiveLocation('Todas');
  };

  return (
    <div>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-white md:text-4xl">
            ACTIVE STUDIOS
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Estudios élite buscando talento excepcional actualmente.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsFilterOpen(true)}
            aria-label="Filtrar" 
            className="flex h-10 w-10 relative items-center justify-center rounded-full bg-white/[0.04] border border-white/5 text-white transition-colors hover:bg-white/[0.08]"
          >
            <Filter className="h-4 w-4" />
            {activeLocation !== 'Todas' && (
              <span className="absolute top-0 right-0 h-2.5 w-2.5 translate-x-1/4 -translate-y-1/4 rounded-full bg-[#c49cff] border border-[#141218]"></span>
            )}
          </button>
          <button 
            onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
            aria-label="Alternar vista" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] border border-white/5 text-white transition-colors hover:bg-white/[0.08]"
          >
            {viewMode === 'grid' ? <LayoutList className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className={cn(
        "gap-6",
        viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"
      )}>
        {filteredShops.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">No se encontraron barberías en esta ubicación.</p>
          </div>
        ) : (
          filteredShops.map((shop, idx) => {
            const location = [shop.city, shop.region].filter(Boolean).join(' - ') || 'En tu zona';
            const isUrgent = idx % 4 === 1; // mock info
            return (
              <div key={shop.id} className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/5 bg-[#141218] p-6 transition-all hover:border-white/10 hover:bg-[#1a1820]">
                <div>
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-[#c5b4ff]">
                      <Building className="h-6 w-6" />
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold tracking-[0.1em] uppercase ${isUrgent ? 'bg-amber-400/10 text-amber-400' : 'bg-teal-400/10 text-teal-400'}`}>
                      {isUrgent ? 'Urgente' : 'Activo'}
                    </span>
                  </div>

                  <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-white mb-2">
                    {shop.name}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                    Ubicación: {location}. {shop.description || 'Barbería de alto nivel enfocada en cortes clásicos y rituales premium.'}
                  </p>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-5">
                  <span className="text-[10px] font-bold tracking-[0.1em] text-slate-500 uppercase">
                    {(idx % 3) + 1} Vacantes
                  </span>
                  <Link
                    href={buildShopHref(shop.slug, 'jobs')}
                    className="group/link flex items-center gap-2 text-sm font-semibold tracking-wide text-[#c5b4ff] hover:text-[#e0d4ff]"
                  >
                    Enviar CV 
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })
        )}

        <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-dashed border-white/10 bg-transparent p-6 text-center transition-all hover:bg-white/[0.02] min-h-[250px]">
           <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-400 mb-4 cursor-pointer">
              <span className="text-xl">+</span>
           </div>
           <h4 className="font-bold text-slate-300 uppercase tracking-widest text-sm mb-2">¿ERES DUEÑO?</h4>
           <p className="text-xs text-slate-500">Publica tu estudio y encuentra la élite.</p>
           <Link href="/onboarding/barbershop" className="absolute inset-0 z-10 block">
             <span className="sr-only">Crear estudio</span>
           </Link>
        </div>
      </div>

      {isFilterOpen ? createPortal(
        <>
          <div
            className={drawerOverlayClass(isFilterClosing)}
            onClick={closeFilter}
          />
          <aside className={drawerPanelClass(isFilterClosing)}>
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-baseline gap-2">
                <SectionTitle>FILTROS</SectionTitle>
                <span className="text-[10px] font-black text-[#c49cff]">{filteredShops.length}</span>
              </div>
              <button onClick={closeFilter} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-12 pb-10">
              <section>
                <FilterSectionLabel>UBICACIÓN</FilterSectionLabel>
                <div className="flex flex-wrap gap-2">
                  {['Todas', ...locationOptions].map((loc) => {
                    const isActive = activeLocation === loc;
                    return (
                      <button
                        key={loc}
                        onClick={() => setActiveLocation(loc)}
                        className={filterPillClass(isActive)}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="pt-8 mt-auto border-t border-white/5 space-y-4">
              <Button onPress={closeFilter} className={ctaButtonClass({ size: 'lg', hasShadow: false })}>
                VER ESTUDIOS
              </Button>
              <button onClick={resetFilters} className="w-full mt-4 text-[10px] font-black tracking-[0.2em] text-white/20 hover:text-white/40 transition-colors uppercase">
                RESETEAR
              </button>
            </div>
          </aside>
        </>,
        document.body
      ) : null}

      <DrawerStyles />
    </div>
  );
}
