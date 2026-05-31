import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingPanel, marketingCtaClassNames } from '@/components/public/marketing';
import { listMarketplaceOpenModelCalls } from '@/lib/modelos';
import { getPublicTenantRouteContext } from '@/lib/public-tenant-context';
import { buildSitePageMetadata } from '@/lib/site-metadata';
import { buildTenantModelRegistrationHref } from '@/lib/shop-links';
import { buildTenantCanonicalHref } from '@/lib/tenant-public-urls';
import { formatCurrency } from '@navaja/shared';
import ShopModelosPage, {
  generateMetadata as generateShopModelosMetadata,
} from '@/app/modelos/[slug]/page';

export async function generateMetadata(): Promise<Metadata> {
  const routeContext = await getPublicTenantRouteContext();
  if (routeContext.mode !== 'path' && routeContext.shopSlug) {
    return generateShopModelosMetadata({
      params: Promise.resolve({ slug: routeContext.shopSlug }),
    });
  }

  return buildSitePageMetadata({
    title: 'Convocatorias para modelos',
    description:
      'Revisa convocatorias abiertas para modelos y sesiones academicas publicadas por barberias del marketplace.',
    path: '/modelos',
  });
}

function formatCompensation(type: string, valueCents: number | null): string {
  if (type === 'gratis') return 'Gratis';
  if (type === 'pago' && valueCents != null) return formatCurrency(valueCents);
  return type;
}

export default async function ModelosLandingPage() {
  const routeContext = await getPublicTenantRouteContext();
  if (routeContext.mode !== 'path' && routeContext.shopSlug) {
    return ShopModelosPage({
      params: Promise.resolve({ slug: routeContext.shopSlug }),
    });
  }

  const openCalls = await listMarketplaceOpenModelCalls();

  return (
    <section className="space-y-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-black/5 pb-5 dark:border-white/[0.06]">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-brass">
            Modelos
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-ink dark:text-white md:text-3xl">
            Postulate a convocatorias abiertas de distintas barberias
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {openCalls.length > 0 ? (
            <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-slate/70 dark:bg-white/5 dark:text-white/50">
              {openCalls.length}
            </span>
          ) : null}
          <Link href="/modelos/registro" className="action-primary inline-flex px-6 py-2 text-sm font-semibold">
            Crear mi perfil de modelo
          </Link>
        </div>
      </div>

      {openCalls.length === 0 ? (
        <MarketingPanel className="p-6">
          <p className="text-sm text-slate/80 dark:text-slate-300">
            Todavia no hay convocatorias abiertas. Igual puedes crear tu perfil y quedar listo para
            futuras sesiones.
          </p>
          <div className="mt-4">
            <Link href="/modelos/registro" className={marketingCtaClassNames.panelPrimary}>
              Crear mi perfil
            </Link>
          </div>
        </MarketingPanel>
      ) : null}

      {openCalls.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {openCalls.map((call) => {
            const categories: string[] = Array.isArray(call.model_categories)
              ? (call.model_categories as string[]).filter(Boolean)
              : [];
            const cuposLabel =
              call.models_needed > 0
                ? `Cupos: ${call.models_needed}`
                : 'Cupos: Sin definir';
            const compensationLabel = formatCompensation(
              call.compensation_type,
              call.compensation_value_cents,
            );
            const postularHref = buildTenantModelRegistrationHref(
              call.shop_slug,
              'path',
              call.session_id,
            );
            const verBarberiaHref = buildTenantCanonicalHref(
              { slug: call.shop_slug },
              'profile',
            );

            return (
              <MarketingPanel
                key={call.session_id}
                eyebrow={call.shop_name}
                eyebrowClassName="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400"
                title={call.course_title}
                titleClassName="mt-2 font-[family-name:var(--font-heading)] text-xl font-semibold text-ink dark:text-slate-100"
              >
                <div className="mt-2 space-y-1 text-sm text-slate/70 dark:text-slate-400">
                  <p>{compensationLabel}</p>
                  <p>{cuposLabel}</p>
                  {categories.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {categories.map((cat) => (
                        <span key={cat} className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/5">
                          {cat}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p>{call.notes_public ?? 'Sin notas publicas.'}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={postularHref}
                    className={marketingCtaClassNames.panelPrimary}
                  >
                    Postularme
                  </Link>
                  <Link
                    href={verBarberiaHref}
                    className={marketingCtaClassNames.panelSecondary}
                  >
                    Ver barberia
                  </Link>
                </div>
              </MarketingPanel>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
