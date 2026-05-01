import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JobsForm } from '@/components/public/jobs-form';
import { getPublicTenantRouteContext } from '@/lib/public-tenant-context';
import { getMarketplaceShopBySlug } from '@/lib/shops';
import { buildTenantPageMetadata } from '@/lib/tenant-public-metadata';
import { ShopJobsView } from '@/components/public/shop-jobs-view';

interface ShopJobsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ShopJobsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getMarketplaceShopBySlug(slug);

  if (!shop) {
    return {};
  }

  return buildTenantPageMetadata({
    shop,
    title: `Empleo | ${shop.name}`,
    description: `Postulaciones y vacantes abiertas en ${shop.name}. Inicia tu legado aquí.`,
    section: 'jobs',
  });
}

export default async function ShopJobsPage({ params }: ShopJobsPageProps) {
  const { slug } = await params;
  const shop = await getMarketplaceShopBySlug(slug);

  if (!shop) {
    notFound();
  }

  return <ShopJobsView shop={shop} />;
}
