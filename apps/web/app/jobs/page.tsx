import type { Metadata } from 'next';
import { MarketplaceJobsForm } from '@/components/public/marketplace-jobs-form';
import { PublicSectionEmptyState } from '@/components/public/public-section-empty-state';
import { getPublicTenantRouteContext } from '@/lib/public-tenant-context';
import { buildSitePageMetadata } from '@/lib/site-metadata';
import { listMarketplaceShops, getMarketplaceShopBySlug } from '@/lib/shops';
import { ShopJobsView } from '@/components/public/shop-jobs-view';
import { MarketplaceJobsList } from '@/components/public/marketplace-jobs-list';
import { JobsHeroAvatars } from '@/components/public/jobs-hero-avatars';

export async function generateMetadata(): Promise<Metadata> {
  const routeContext = await getPublicTenantRouteContext();
  if (routeContext.mode !== 'path' && routeContext.shopSlug) {
    const shop = await getMarketplaceShopBySlug(routeContext.shopSlug);
    if (shop) {
      return buildSitePageMetadata({
        title: `Empleo | ${shop.name}`,
        description: `Postulaciones y vacantes abiertas en ${shop.name}. Inicia tu legado aquí.`,
        path: `/jobs`,
      });
    }
  }

  return buildSitePageMetadata({
    title: 'Trabajo en barberias',
    description:
      'Encuentra barberias activas para enviar tu CV directo o dejar tu perfil en la bolsa general del marketplace.',
    path: '/jobs',
  });
}

export default async function JobsPage() {
  const routeContext = await getPublicTenantRouteContext();
  if (routeContext.mode !== 'path' && routeContext.shopSlug) {
    const shop = await getMarketplaceShopBySlug(routeContext.shopSlug);
    if (shop) {
      return <ShopJobsView shop={shop} />;
    }
  }

  const shops = await listMarketplaceShops();

  if (!shops.length) {
    return (
      <PublicSectionEmptyState
        eyebrow="Empleo"
        title="Esta ruta deberia centralizar postulaciones del marketplace"
        description="Aqui se listan barberias activas para enviar un CV directo o dejarlo en una bolsa general."
      />
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-10 md:py-20 space-y-24">
        
        {/* Hero Section */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">
              The Nocturnal Elite
            </div>
            
            <h1 className="font-[family-name:var(--font-heading)] text-6xl font-bold leading-[0.9] md:text-8xl md:leading-[0.85] text-white tracking-tight">
              JOIN THE <br/>
              <span className="text-[#c5b4ff]">ELITE</span>
            </h1>
            
            <p className="mt-8 text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-md">
              Estamos redefiniendo el estándar del grooming masculino. Si eres un artista del corte, el escenario está listo para tu maestría.
            </p>

            <JobsHeroAvatars />
          </div>

          <div>
             <MarketplaceJobsForm
                shops={shops.map((shop) => ({
                  id: shop.id,
                  name: shop.name,
                  city: shop.city,
                  region: shop.region,
                }))}
              />
          </div>
        </div>

        {/* Active Studios Section */}
        <MarketplaceJobsList shops={shops.map(shop => ({
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          city: shop.city,
          region: shop.region,
          description: shop.description
        }))} />
      </div>
    </div>
  );
}
