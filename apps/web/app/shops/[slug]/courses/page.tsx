import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardFooter, CardHeader } from '@heroui/react';
import { formatCurrency } from '@navaja/shared';
import { ArrowUpRight } from 'lucide-react';
import { MediaShowcase } from '@/components/public/media-showcase';
import { getMarketplaceShopBySlug } from '@/lib/shops';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

interface ShopCoursesPageProps {
  params: Promise<{ slug: string }>;
}

interface ShopCourseRow {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  duration_hours: number;
  level: string;
  image_url: string | null;
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
    .select('id, title, description, price_cents, duration_hours, level, image_url')
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

        {((courses || []) as ShopCourseRow[]).map((course) => (
          <Card
            key={String(course.id)}
            isFooterBlurred
            className="data-card h-[24rem] overflow-hidden rounded-[1.9rem] border-0 p-0 shadow-none"
          >
            <CardHeader className="absolute inset-x-0 top-0 z-10 flex-col items-start gap-2 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/68">
                {String(course.level)}
              </p>
              <h2 className="line-clamp-2 font-[family-name:var(--font-heading)] text-2xl font-semibold text-white">
                {String(course.title)}
              </h2>
            </CardHeader>

            <MediaShowcase
              alt={`Portada del curso ${String(course.title)}`}
              images={[course.image_url, ...shop.imageUrls]}
              className="h-full w-full"
              fallback={
                <div
                  className="h-full w-full bg-[linear-gradient(135deg,rgba(14,165,233,0.9),rgba(15,23,42,0.96))]"
                />
              }
            />

            <div className="absolute inset-0 z-[1] bg-gradient-to-t from-slate-950/88 via-slate-950/26 to-slate-950/8" />

            <CardFooter className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-black/40 px-4 py-4 backdrop-blur-md">
              <div className="flex w-full flex-col gap-3">
                <p className="line-clamp-3 text-sm text-white/72">{String(course.description)}</p>

                <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-white/72">
                  <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1">
                    {String(course.duration_hours)} horas
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1">
                    {formatCurrency(Number(course.price_cents || 0))}
                  </span>
                </div>

                <Link
                  href={`/shops/${shop.slug}/courses/${course.id}`}
                  className="action-primary inline-flex w-fit items-center gap-1 rounded-full px-5 py-2 text-sm font-semibold"
                >
                  Ver detalle
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
