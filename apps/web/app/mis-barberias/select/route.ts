import { NextRequest, NextResponse } from 'next/server';
import {
  getAccessibleWorkspacesForCurrentUser,
  type WorkspaceSummary,
} from '@/lib/workspaces';
import {
  WORKSPACE_COOKIE_MAX_AGE_SECONDS,
  WORKSPACE_COOKIE_NAME,
} from '@/lib/workspace-cookie';
import { buildAdminHref, buildStaffHref } from '@/lib/workspace-routes';

function resolveDestination(workspace: WorkspaceSummary, requestedTarget: string | null) {
  if (requestedTarget === 'staff') {
    return workspace.staffId
      ? buildStaffHref('/staff', workspace.shopSlug)
      : '/mis-barberias?error=Ese%20workspace%20no%20tiene%20vista%20de%20staff.';
  }

  if (requestedTarget === 'admin') {
    if (workspace.accessRole === 'staff') {
      return '/mis-barberias?error=Ese%20workspace%20solo%20tiene%20acceso%20de%20staff.';
    }

    return buildAdminHref('/admin', workspace.shopSlug);
  }

  return workspace.accessRole === 'staff'
    ? buildStaffHref('/staff', workspace.shopSlug)
    : buildAdminHref('/admin', workspace.shopSlug);
}

function buildRedirectUrl(request: NextRequest, destination: string) {
  const normalizedDestination = destination.startsWith('/') ? destination : `/${destination}`;
  const destinationUrl = new URL(normalizedDestination, 'http://localhost');
  const protocol =
    request.headers.get('x-forwarded-proto') ||
    request.nextUrl.protocol.replace(/:$/, '') ||
    'http';
  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    request.nextUrl.host ||
    'localhost:3000';

  return new URL(
    `${protocol}://${host}${destinationUrl.pathname}${destinationUrl.search}${destinationUrl.hash}`,
  );
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const shopId = url.searchParams.get('shop')?.trim() || '';
  const target = url.searchParams.get('target');
  const catalog = await getAccessibleWorkspacesForCurrentUser();

  if (!catalog) {
    return NextResponse.redirect(new URL('/login?next=/mis-barberias', request.url));
  }

  const workspace = catalog.workspaces.find((item) => item.shopId === shopId);
  if (!workspace) {
    return NextResponse.redirect(new URL('/mis-barberias?error=No%20pudimos%20seleccionar%20esa%20barberia.', request.url));
  }

  const destination = resolveDestination(workspace, target);
  const response = NextResponse.redirect(buildRedirectUrl(request, destination));
  response.cookies.set(WORKSPACE_COOKIE_NAME, workspace.shopId, {
    path: '/',
    sameSite: 'lax',
    maxAge: WORKSPACE_COOKIE_MAX_AGE_SECONDS,
  });

  return response;
}
