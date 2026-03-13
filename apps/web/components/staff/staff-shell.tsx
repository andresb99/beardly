'use client';

import NextLink from 'next/link';
import { useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Container } from '@/components/heroui/container';
import { cn } from '@/lib/cn';
import { STAFF_NAV_ITEMS } from '@/lib/staff-navigation';
import type { AccessibleWorkspaceMeta } from '@/lib/site-header-state';
import { buildStaffHref } from '@/lib/workspace-routes';

interface StaffShellProps {
  children: React.ReactNode;
  initialShopSlug: string | null;
  initialShopName: string | null;
  workspaceDirectory: AccessibleWorkspaceMeta[];
}

function isActiveStaffPath(pathname: string, href: string) {
  const targetPath = new URL(href, 'http://localhost').pathname;

  if (targetPath === '/staff') {
    return pathname === '/staff';
  }

  return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
}

export function StaffShell({
  children,
  initialShopSlug,
  initialShopName,
  workspaceDirectory,
}: StaffShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeShopSlug = useMemo(
    () => searchParams.get('shop')?.trim() || initialShopSlug || null,
    [initialShopSlug, searchParams],
  );
  const activeWorkspace = useMemo(() => {
    const normalizedSlug = activeShopSlug?.trim().toLowerCase();
    if (!normalizedSlug) {
      return null;
    }

    return (
      workspaceDirectory.find((workspace) => workspace.slug.toLowerCase() === normalizedSlug) ||
      null
    );
  }, [activeShopSlug, workspaceDirectory]);
  const activeWorkspaceLabel = activeWorkspace?.name || initialShopName || activeShopSlug || 'Mi espacio';

  return (
    <div className="space-y-6">
      <Container variant="pageHeader" className="px-6 py-7 md:px-8 md:py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate/55 dark:text-slate-400">
              Portal staff
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold text-ink md:text-[2.1rem] dark:text-slate-100">
              Flujo personal sin ruido operativo
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate/80 dark:text-slate-300">
              Agenda propia, metricas individuales y ausencias en un solo lugar. Sin configuracion
              global del local ni accesos que no le corresponden al staff.
            </p>
          </div>

          <div className="flex flex-col items-start gap-1 rounded-[1.35rem] border border-white/60 bg-white/50 px-4 py-3 shadow-[0_20px_32px_-28px_rgba(15,23,42,0.34)] dark:border-white/10 dark:bg-white/[0.04]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/55 dark:text-slate-400">
              Barberia activa
            </span>
            <span className="text-sm font-semibold text-ink dark:text-slate-100">
              {activeWorkspaceLabel}
            </span>
          </div>
        </div>

        <nav aria-label="Navegacion staff" className="mt-5 flex flex-wrap gap-2">
          {STAFF_NAV_ITEMS.map((item) => {
            const href = buildStaffHref(item.href, activeShopSlug);
            const isActive = isActiveStaffPath(pathname, href);

            return (
              <NextLink
                key={item.key}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn('nav-link-pill no-underline', isActive && 'shadow-[0_16px_24px_-18px_rgba(15,23,42,0.28)]')}
                data-active={String(isActive)}
              >
                {item.label}
              </NextLink>
            );
          })}
        </nav>
      </Container>

      {children}
    </div>
  );
}
