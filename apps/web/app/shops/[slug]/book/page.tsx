import { notFound } from 'next/navigation';
import { BookingFlow } from '@/components/public/booking-flow';
import { getMarketplaceShopBySlug } from '@/lib/shops';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface ShopBookPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShopBookPage({ params }: ShopBookPageProps) {
  const { slug } = await params;
  const shop = await getMarketplaceShopBySlug(slug);

  if (!shop) {
    notFound();
  }

  const sessionSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionSupabase.auth.getUser();
  const supabase = createSupabaseAdminClient();

  const [{ data: services }, { data: staff }] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, price_cents, duration_minutes')
      .eq('shop_id', shop.id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('staff')
      .select('id, name')
      .eq('shop_id', shop.id)
      .eq('is_active', true)
      .order('name'),
  ]);

  return (
    <section className="space-y-6">
      <div className="section-hero px-6 py-7 md:px-8 md:py-9">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="hero-eyebrow">Reservas online</p>
            <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold text-ink md:text-[2.4rem] dark:text-slate-100">
              Agenda en {shop.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate/80 dark:text-slate-300">
              El flujo queda aislado por tenant: solo veras servicios, staff y horarios de esta
              barbershop.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Servicios
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
                {(services || []).length}
              </p>
            </div>
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Staff
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
                {(staff || []).length}
              </p>
            </div>
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Zona horaria
              </p>
              <p className="mt-2 text-sm font-semibold text-ink dark:text-slate-100">
                {shop.timezone}
              </p>
            </div>
          </div>
        </div>
      </div>

      <BookingFlow
        shopId={shop.id}
        initialCustomerEmail={user?.email || ''}
        services={(services || []).map((item) => ({
          id: item.id as string,
          name: item.name as string,
          price_cents: item.price_cents as number,
          duration_minutes: item.duration_minutes as number,
        }))}
        staff={(staff || []).map((item) => ({
          id: item.id as string,
          name: item.name as string,
        }))}
      />
    </section>
  );
}
