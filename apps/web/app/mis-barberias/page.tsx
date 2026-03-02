import Link from 'next/link';
import { Card, CardBody } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { requireAuthenticated } from '@/lib/auth';
import { buildAdminHref, buildStaffHref } from '@/lib/workspace-routes';
import {
  getAccessibleWorkspacesForCurrentUser,
  getSelectedWorkspaceForCurrentUser,
} from '@/lib/workspaces';

interface MyBarbershopsPageProps {
  searchParams: Promise<{ error?: string }>;
}

const accessRoleLabel = {
  owner: 'Owner',
  admin: 'Admin',
  staff: 'Staff',
} as const;

const shopStatusLabel = {
  draft: 'Borrador',
  setup_in_progress: 'Configurando',
  active: 'Activa',
  suspended: 'Suspendida',
} as const;

const primaryLinkClassName =
  'action-primary inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold no-underline';

const secondaryLinkClassName =
  'action-secondary inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold no-underline';

export default async function MyBarbershopsPage({ searchParams }: MyBarbershopsPageProps) {
  await requireAuthenticated('/mis-barberias');
  const [{ error }, catalog, selectedWorkspace] = await Promise.all([
    searchParams,
    getAccessibleWorkspacesForCurrentUser(),
    getSelectedWorkspaceForCurrentUser(),
  ]);

  const workspaces = catalog?.workspaces || [];

  return (
    <section className="space-y-6">
      <div className="section-hero px-6 py-7 md:px-8 md:py-9">
        <div className="relative z-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="hero-eyebrow">Mis barberias</p>
            <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold text-ink md:text-[2.3rem] dark:text-slate-100">
              Seleccion de workspace
            </h1>
            <p className="mt-3 text-sm text-slate/80 dark:text-slate-300">
              Elige la barberia que quieres gestionar. El panel conserva esa seleccion en la URL y
              solo opera sobre ese workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Accesos
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
                {workspaces.length}
              </p>
            </div>
            <div className="stat-tile">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                Workspace activo
              </p>
              <p className="mt-2 text-sm font-semibold text-ink dark:text-slate-100">
                {selectedWorkspace?.shopName || 'Sin seleccionar'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error ? <p className="status-banner error">{error}</p> : null}

      {workspaces.length === 0 ? (
        <Card className="soft-panel rounded-[1.9rem] border-0 shadow-none">
          <CardBody className="space-y-4 p-5">
            <div>
              <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
                Aun no tienes barberias vinculadas
              </h2>
              <p className="mt-2 text-sm text-slate/80 dark:text-slate-300">
                Crea tu primera barberia o espera una invitacion de un owner para entrar como staff.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/onboarding/barbershop" className={primaryLinkClassName}>
                Crear barberia
              </Link>
              <Link href="/shops" className={secondaryLinkClassName}>
                Volver al marketplace
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {workspaces.map((workspace) => {
            const isActive = selectedWorkspace?.shopId === workspace.shopId;
            const statusLabel =
              shopStatusLabel[workspace.shopStatus as keyof typeof shopStatusLabel] ||
              workspace.shopStatus;

            return (
              <Card
                key={workspace.shopId}
                className="soft-panel rounded-[1.9rem] border-0 shadow-none"
              >
                <CardBody className="space-y-5 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
                        {workspace.shopSlug}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-ink dark:text-slate-100">
                        {workspace.shopName}
                      </h2>
                      <p className="mt-2 text-sm text-slate/80 dark:text-slate-300">
                        Zona horaria: {workspace.shopTimezone}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isActive ? (
                        <Chip size="sm" radius="full" variant="flat" color="success">
                          Activa
                        </Chip>
                      ) : null}
                      <Chip size="sm" radius="full" variant="flat" color="default">
                        {accessRoleLabel[workspace.accessRole]}
                      </Chip>
                      <Chip size="sm" radius="full" variant="flat" color="default">
                        {statusLabel}
                      </Chip>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/45 bg-white/40 px-4 py-3 text-sm text-slate/80 dark:border-white/8 dark:bg-white/[0.03] dark:text-slate-300">
                    {workspace.accessRole === 'staff'
                      ? 'Entraras a la agenda del staff para esta barberia.'
                      : 'Entraras al panel administrativo de esta barberia.'}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={
                        workspace.accessRole === 'staff'
                          ? buildStaffHref('/staff', workspace.shopSlug)
                          : buildAdminHref('/admin', workspace.shopSlug)
                      }
                      className={primaryLinkClassName}
                    >
                      {workspace.accessRole === 'staff' ? 'Abrir panel staff' : 'Abrir panel admin'}
                    </a>

                    {workspace.staffId && workspace.accessRole !== 'staff' ? (
                      <a
                        href={buildStaffHref('/staff', workspace.shopSlug)}
                        className={secondaryLinkClassName}
                      >
                        Ver agenda staff
                      </a>
                    ) : null}

                    <Link
                      href={`/shops/${workspace.shopSlug}`}
                      className={secondaryLinkClassName}
                    >
                      Ver perfil publico
                    </Link>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
