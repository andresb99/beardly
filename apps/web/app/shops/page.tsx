import Link from 'next/link';
import { ShopsMapMarketplace } from '@/components/public/shops-map-marketplace';
import { listMarketplaceShops } from '@/lib/shops';

export default async function ShopsMarketplacePage() {
  const shops = await listMarketplaceShops();

  return (
    <section className="space-y-6">
      <div className="section-hero px-6 py-7 md:px-8 md:py-9">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="hero-eyebrow">Marketplace multi-tenant</p>
            <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold text-ink md:text-[2.45rem] dark:text-slate-100">
              Descubre barberias, compara perfiles y reserva dentro de un solo sistema
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate/80 dark:text-slate-300">
              Cada barbershop vive como un workspace aislado con su propio perfil publico, equipo,
              servicios y flujos de reserva.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Shops activas
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
                {shops.length}
              </p>
            </div>
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Tenant-safe
              </p>
              <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">RLS</p>
            </div>
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Onboarding
              </p>
              <Link
                href="/onboarding/barbershop"
                className="mt-2 inline-flex text-sm font-semibold text-ink underline underline-offset-4 dark:text-slate-100"
              >
                Crear barbershop
              </Link>
            </div>
          </div>
        </div>
      </div>

      {shops.length === 0 ? (
        <div className="soft-panel rounded-[1.8rem] p-6">
          <p className="text-sm text-slate/80 dark:text-slate-300">
            Aun no hay barberias publicadas. Crea la primera desde el onboarding.
          </p>
        </div>
      ) : null}

      <ShopsMapMarketplace shops={shops} />
    </section>
  );
}
