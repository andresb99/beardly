import Link from 'next/link';
import { Card, CardFooter, CardHeader } from '@heroui/react';
import { formatCurrency } from '@navaja/shared';
import { ArrowUpRight } from 'lucide-react';
import { MediaShowcase } from '@/components/public/media-showcase';
import { PublicSectionEmptyState } from '@/components/public/public-section-empty-state';
import { listMarketplaceShops } from '@/lib/shops';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

interface CourseRow {
  id: string;
  shop_id: string;
  title: string;
  description: string;
  price_cents: number;
  duration_hours: number;
  level: string;
  image_url: string | null;
}

export default async function CoursesPage() {
  const shops = await listMarketplaceShops();

  if (!shops.length) {
    return (
      <PublicSectionEmptyState
        eyebrow="Cursos"
        title="Aqui deberia vivir el catalogo global de formacion"
        description="En vez de redirigir a una barberia, esta ruta ahora lista todos los cursos activos del marketplace."
      />
    );
  }

  const supabase = createSupabaseAdminClient();
  const shopIds = shops.map((shop) => shop.id);
  const { data: courses } = await supabase
    .from('courses')
    .select('id, shop_id, title, description, price_cents, duration_hours, level, image_url')
    .in('shop_id', shopIds)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const shopsById = new Map(shops.map((shop) => [shop.id, shop]));
  const items = ((courses || []) as CourseRow[])
    .map((course) => {
      const shop = shopsById.get(String(course.shop_id));
      if (!shop) {
        return null;
      }

      return {
        course,
        shop,
      };
    })
    .filter((item): item is { course: CourseRow; shop: (typeof shops)[number] } => item !== null);

  return (
    <section className="space-y-6">
      <div className="section-hero px-6 py-7 md:px-8 md:py-9">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="hero-eyebrow">Academia marketplace</p>
            <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold text-ink md:text-[2.35rem] dark:text-slate-100">
              Todos los cursos activos en un solo catalogo
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate/80 dark:text-slate-300">
              Aqui comparas oferta educativa entre barberias y luego entras al detalle del tenant que publica el curso.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Cursos
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">{items.length}</p>
            </div>
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
              <p className="mt-2 text-sm font-semibold text-ink dark:text-slate-100">Catalogo global</p>
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="soft-panel rounded-[1.8rem] p-6">
          <p className="text-sm text-slate/80 dark:text-slate-300">
            Todavia no hay cursos activos publicados.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map(({ course, shop }) => (
          <Card
            key={course.id}
            isFooterBlurred
            className="data-card h-[24rem] overflow-hidden rounded-[1.9rem] border-0 p-0 shadow-none"
          >
            <CardHeader className="absolute inset-x-0 top-0 z-10 flex-col items-start gap-2 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/68">{shop.name}</p>
              <h2 className="line-clamp-2 font-[family-name:var(--font-heading)] text-2xl font-semibold text-white">
                {course.title}
              </h2>
            </CardHeader>

            <MediaShowcase
              alt={`Portada del curso ${course.title}`}
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
                <p className="line-clamp-2 text-sm text-white/72">{course.description}</p>

                <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-white/72">
                  <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1">{course.level}</span>
                  <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1">
                    {course.duration_hours}h
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1">
                    {formatCurrency(course.price_cents)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/shops/${shop.slug}/courses/${course.id}`}
                    className="action-primary inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    Ver curso
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/shops/${shop.slug}/courses`}
                    className="action-secondary rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    Ver academia
                  </Link>
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
