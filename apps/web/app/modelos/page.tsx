import Link from 'next/link';
import { formatCurrency } from '@navaja/shared';
import { listMarketplaceOpenModelCalls } from '@/lib/modelos';
import { buildShopHref } from '@/lib/shop-links';

export default async function ModelosLandingPage() {
  const openCalls = await listMarketplaceOpenModelCalls();

  return (
    <section className="space-y-6">
      <div className="section-hero px-6 py-7 md:px-8 md:py-9">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="hero-eyebrow">Modelos marketplace</p>
            <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold text-ink md:text-[2.35rem] dark:text-slate-100">
              Postulate a convocatorias abiertas de distintas barberias
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate/80 dark:text-slate-300">
              Puedes revisar sesiones activas por curso y registrarte una sola vez para futuras oportunidades.
            </p>
            <div className="mt-5">
              <Link href="/modelos/registro" className="action-primary inline-flex px-6 py-2 text-sm font-semibold">
                Crear mi perfil de modelo
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Convocatorias
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">{openCalls.length}</p>
            </div>
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Modo
              </p>
              <p className="mt-2 text-sm font-semibold text-ink dark:text-slate-100">Marketplace</p>
            </div>
          </div>
        </div>
      </div>

      {openCalls.length === 0 ? (
        <div className="soft-panel rounded-[1.8rem] p-6">
          <p className="text-sm text-slate/80 dark:text-slate-300">
            Todavia no hay convocatorias abiertas. Igual puedes crear tu perfil y quedar listo para futuras sesiones.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {openCalls.map((call) => (
          <article key={call.session_id} className="soft-panel rounded-[1.8rem] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                  {call.shop_name}
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-semibold text-ink dark:text-slate-100">
                  {call.course_title}
                </h2>
                <p className="mt-2 text-sm text-slate/80 dark:text-slate-300">
                  {new Date(call.start_at).toLocaleString('es-UY')} - {call.location}
                </p>
              </div>

              <div className="surface-card min-w-[220px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                  Compensacion
                </p>
                <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
                  {call.compensation_type === 'gratis'
                    ? 'Gratis'
                    : call.compensation_value_cents
                      ? formatCurrency(call.compensation_value_cents)
                      : call.compensation_type}
                </p>
                <p className="mt-1 text-xs text-slate/75 dark:text-slate-400">
                  Cupos: {call.models_needed || 'Sin definir'}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate/80 dark:text-slate-300">
              {call.notes_public || 'Sin notas publicas.'}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/modelos/registro?session_id=${encodeURIComponent(call.session_id)}`}
                className="action-primary rounded-2xl px-4 py-2 text-sm font-semibold"
              >
                Postularme
              </Link>
              <Link
                href={buildShopHref(call.shop_slug, 'modelos')}
                className="action-secondary rounded-2xl px-4 py-2 text-sm font-semibold"
              >
                Ver barberia
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
