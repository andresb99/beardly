import Link from 'next/link';
import { formatCurrency } from '@navaja/shared';
import { PublicSectionEmptyState } from '@/components/public/public-section-empty-state';
import { buildShopHref } from '@/lib/shop-links';
import { listMarketplaceShops } from '@/lib/shops';

function getLocationSummary(city: string | null, region: string | null) {
  return [city, region].filter(Boolean).join(' - ') || 'Uruguay';
}

export default async function BookPage() {
  const shops = await listMarketplaceShops();

  if (!shops.length) {
    return (
      <PublicSectionEmptyState
        eyebrow="Reservas"
        title="Elige una barberia antes de agendar"
        description="Esta ruta funciona como hub de reservas del marketplace: aqui deberias comparar barberias y entrar al flujo correcto."
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="section-hero px-6 py-7 md:px-8 md:py-9">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="hero-eyebrow">Reservas marketplace</p>
            <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold text-ink md:text-[2.35rem] dark:text-slate-100">
              Selecciona una barberia y entra a su agenda
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate/80 dark:text-slate-300">
              Cada reserva sigue siendo tenant-safe, pero primero eliges la barberia desde una vista global.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Barberias
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">{shops.length}</p>
            </div>
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Cobertura
              </p>
              <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">Uruguay</p>
            </div>
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Flujo
              </p>
              <p className="mt-2 text-sm font-semibold text-ink dark:text-slate-100">Elegir y reservar</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shops.map((shop) => (
          <article key={shop.id} className="soft-panel rounded-[1.8rem] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                  {getLocationSummary(shop.city, shop.region)}
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-semibold text-ink dark:text-slate-100">
                  {shop.name}
                </h2>
              </div>
              <span className="meta-chip" data-tone={shop.isVerified ? 'success' : undefined}>
                {shop.isVerified ? 'Verificada' : 'Activa'}
              </span>
            </div>

            <p className="mt-3 text-sm text-slate/80 dark:text-slate-300">
              {shop.description || 'Servicios, staff y horarios cargados dentro de su propio workspace.'}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="surface-card">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                  Servicios
                </p>
                <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                  {shop.activeServiceCount}
                </p>
              </div>
              <div className="surface-card">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                  Desde
                </p>
                <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                  {shop.minServicePriceCents !== null ? formatCurrency(shop.minServicePriceCents) : 'Sin precio'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={buildShopHref(shop.slug)} className="action-secondary rounded-2xl px-4 py-2 text-sm font-semibold">
                Ver perfil
              </Link>
              <Link
                href={buildShopHref(shop.slug, 'book')}
                className="action-primary rounded-2xl px-4 py-2 text-sm font-semibold"
              >
                Agendar aqui
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
