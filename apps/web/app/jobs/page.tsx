import type { Metadata } from 'next';
import { MarketplaceJobsForm } from '@/components/public/marketplace-jobs-form';
import { PublicSectionEmptyState } from '@/components/public/public-section-empty-state';
import { getPublicTenantRouteContext } from '@/lib/public-tenant-context';
import { buildSitePageMetadata } from '@/lib/site-metadata';
import { listMarketplaceShops } from '@/lib/shops';
import ShopJobsPage, { generateMetadata as generateShopJobsMetadata } from '@/app/jobs/[slug]/page';
import { Avatar, AvatarGroup } from '@heroui/react';
import { MarketplaceJobsList } from '@/components/public/marketplace-jobs-list';

export async function generateMetadata(): Promise<Metadata> {
  const routeContext = await getPublicTenantRouteContext();
  if (routeContext.mode !== 'path' && routeContext.shopSlug) {
    return generateShopJobsMetadata({
      params: Promise.resolve({ slug: routeContext.shopSlug }),
    });
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
    return ShopJobsPage({
      params: Promise.resolve({ slug: routeContext.shopSlug }),
    });
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

            <div className="mt-10 flex items-center gap-4">
              <AvatarGroup isBordered max={3} className="justify-start">
                <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026024d" className="border-[#0b090c]" />
                <Avatar src="https://i.pravatar.cc/150?u=a04258a2462d826712d" className="border-[#0b090c]" />
                <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026704d" className="border-[#0b090c]" />
              </AvatarGroup>
              <span className="text-[10px] font-bold tracking-[0.15em] text-slate-500 max-w-[120px] leading-tight">
                +40 BARBEROS YA SE UNIERON ESTE MES
              </span>
            </div>
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
