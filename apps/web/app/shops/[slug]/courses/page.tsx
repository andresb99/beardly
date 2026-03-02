import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatCurrency } from '@navaja/shared';
import { getMarketplaceShopBySlug } from '@/lib/shops';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

interface ShopCoursesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShopCoursesPage({ params }: ShopCoursesPageProps) {
  const { slug } = await params;
  const shop = await getMarketplaceShopBySlug(slug);

  if (!shop) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, description, price_cents, duration_hours, level')
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .order('title');

  return (
    <section className="space-y-6">
      <div className="section-hero px-6 py-7 md:px-8 md:py-9">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="hero-eyebrow">Academia</p>
            <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold text-ink md:text-[2.35rem] dark:text-slate-100">
              Cursos ofrecidos por {shop.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate/80 dark:text-slate-300">
              Cada tenant publica sus propios workshops y sesiones sin mezclarlos con otra tienda.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Oferta
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
                {(courses || []).length}
              </p>
            </div>
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Perfil
              </p>
              <p className="mt-2 text-sm font-semibold text-ink dark:text-slate-100">
                {shop.slug}
              </p>
            </div>
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Modalidad
              </p>
              <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">Sesiones</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(courses || []).length === 0 ? (
          <div className="soft-panel rounded-[1.8rem] p-5">
            <p className="text-sm text-slate/80 dark:text-slate-300">
              Esta barberia aun no publico cursos activos.
            </p>
          </div>
        ) : null}

        {(courses || []).map((course) => (
          <article key={String(course.id)} className="soft-panel rounded-[1.8rem] p-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                  {String(course.level)}
                </p>
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-ink dark:text-slate-100">
                  {String(course.title)}
                </h2>
                <p className="line-clamp-3 text-sm text-slate/80 dark:text-slate-300">
                  {String(course.description)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="surface-card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                    Duracion
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                    {String(course.duration_hours)} horas
                  </p>
                </div>
                <div className="surface-card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                    Inversion
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                    {formatCurrency(Number(course.price_cents || 0))}
                  </p>
                </div>
              </div>

              <Link
                href={`/shops/${shop.slug}/courses/${course.id}`}
                className="action-primary inline-flex px-5 py-2 text-sm font-semibold"
              >
                Ver detalle
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
