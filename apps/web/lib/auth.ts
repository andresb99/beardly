import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from './supabase/server';
import {
  getAccessibleWorkspacesForCurrentUser,
  getLegacyWorkspaceFallback,
  getSelectedWorkspaceForCurrentUser,
  type WorkspaceSummary,
} from './workspaces';
import { buildAdminHref, buildStaffHref } from './workspace-routes';

export type AppRole = 'guest' | 'user' | 'staff' | 'admin';
export type SelectedWorkspaceRole = 'staff' | 'admin' | null;

export interface AuthContext {
  role: AppRole;
  userId: string | null;
  email: string | null;
  staffId: string | null;
  shopId: string | null;
  shopSlug: string | null;
  shopName: string | null;
  shopTimezone: string | null;
  selectedWorkspaceRole: SelectedWorkspaceRole;
  availableWorkspaces: WorkspaceSummary[];
}

export interface AuthStaffContext {
  userId: string;
  staffId: string;
  role: 'admin' | 'staff';
  email: string | null;
  shopId: string;
  shopSlug: string;
  shopName: string;
  shopTimezone: string;
}

interface AuthScopeOptions {
  shopId?: string | null | undefined;
  shopSlug?: string | null | undefined;
}

function hasAdminAccess(workspaces: WorkspaceSummary[]) {
  return workspaces.some((workspace) => workspace.accessRole === 'owner' || workspace.accessRole === 'admin');
}

function hasStaffAccess(workspaces: WorkspaceSummary[]) {
  return workspaces.some((workspace) => workspace.accessRole === 'owner' || workspace.accessRole === 'admin' || workspace.accessRole === 'staff');
}

function resolveSelectedWorkspaceRole(workspace: WorkspaceSummary | null): SelectedWorkspaceRole {
  if (!workspace) {
    return null;
  }

  return workspace.accessRole === 'staff' ? 'staff' : 'admin';
}

function resolveGlobalRole(workspaces: WorkspaceSummary[]): AppRole {
  if (hasAdminAccess(workspaces)) {
    return 'admin';
  }

  if (hasStaffAccess(workspaces)) {
    return 'staff';
  }

  return 'user';
}

function resolveScopedWorkspace(
  workspaces: WorkspaceSummary[],
  options?: AuthScopeOptions,
  fallbackWorkspace?: WorkspaceSummary | null,
) {
  const requestedShopId = options?.shopId?.trim();
  const requestedShopSlug = options?.shopSlug?.trim().toLowerCase();

  if (requestedShopId) {
    return workspaces.find((workspace) => workspace.shopId === requestedShopId) || null;
  }

  if (requestedShopSlug) {
    return (
      workspaces.find((workspace) => workspace.shopSlug.toLowerCase() === requestedShopSlug) || null
    );
  }

  return fallbackWorkspace || null;
}

export async function getCurrentAuthContext(options?: AuthScopeOptions): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      role: 'guest',
      userId: null,
      email: null,
      staffId: null,
      shopId: null,
      shopSlug: null,
      shopName: null,
      shopTimezone: null,
      selectedWorkspaceRole: null,
      availableWorkspaces: [],
    };
  }

  const [catalog, selectedWorkspace] = await Promise.all([
    getAccessibleWorkspacesForCurrentUser(),
    getSelectedWorkspaceForCurrentUser(),
  ]);
  const workspaces = catalog?.workspaces || [];
  const scopedWorkspace = resolveScopedWorkspace(workspaces, options, selectedWorkspace);
  const selectedRole = resolveSelectedWorkspaceRole(scopedWorkspace);

  if (!workspaces.length && !selectedWorkspace) {
    const legacyWorkspace = getLegacyWorkspaceFallback();
    const { data: legacyStaff } = await supabase
      .from('staff')
      .select('id, role')
      .eq('shop_id', legacyWorkspace.shopId)
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (legacyStaff) {
      return {
        role: legacyStaff.role as 'admin' | 'staff',
        userId: user.id,
        email: user.email ?? null,
        staffId: String(legacyStaff.id),
        shopId: legacyWorkspace.shopId,
        shopSlug: legacyWorkspace.shopSlug,
        shopName: legacyWorkspace.shopName,
        shopTimezone: legacyWorkspace.shopTimezone,
        selectedWorkspaceRole: legacyStaff.role as 'admin' | 'staff',
        availableWorkspaces: [],
      };
    }

    return {
      role: 'user',
      userId: user.id,
      email: user.email ?? null,
      staffId: null,
      shopId: null,
      shopSlug: null,
      shopName: null,
      shopTimezone: null,
      selectedWorkspaceRole: null,
      availableWorkspaces: [],
    };
  }

  return {
    role: resolveGlobalRole(workspaces),
    userId: user.id,
    email: user.email ?? null,
    staffId: scopedWorkspace?.staffId || null,
    shopId: scopedWorkspace?.shopId || null,
    shopSlug: scopedWorkspace?.shopSlug || null,
    shopName: scopedWorkspace?.shopName || null,
    shopTimezone: scopedWorkspace?.shopTimezone || null,
    selectedWorkspaceRole: selectedRole,
    availableWorkspaces: workspaces,
  };
}

export async function getCurrentStaff(options?: AuthScopeOptions): Promise<AuthStaffContext | null> {
  const ctx = await getCurrentAuthContext(options);

  if (
    (ctx.selectedWorkspaceRole !== 'admin' && ctx.selectedWorkspaceRole !== 'staff') ||
    !ctx.staffId ||
    !ctx.shopId ||
    !ctx.shopSlug ||
    !ctx.shopName ||
    !ctx.shopTimezone
  ) {
    return null;
  }

  return {
    userId: ctx.userId as string,
    staffId: ctx.staffId,
    role: ctx.selectedWorkspaceRole,
    email: ctx.email,
    shopId: ctx.shopId,
    shopSlug: ctx.shopSlug,
    shopName: ctx.shopName,
    shopTimezone: ctx.shopTimezone,
  };
}

export async function requireAuthenticated(nextPath = '/cuenta') {
  const ctx = await getCurrentAuthContext();

  if (ctx.role === 'guest') {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return ctx;
}

export async function requireAdmin(options?: AuthScopeOptions) {
  const ctx = await getCurrentAuthContext(options);
  const canAdminAnyWorkspace = hasAdminAccess(ctx.availableWorkspaces);

  if (ctx.role === 'guest') {
    redirect('/login?next=/admin');
  }

  if (ctx.selectedWorkspaceRole !== 'admin' || !ctx.shopId || !ctx.shopSlug || !ctx.shopName || !ctx.shopTimezone) {
    if (canAdminAnyWorkspace) {
      redirect('/mis-barberias');
    }

    if (ctx.selectedWorkspaceRole === 'staff' && ctx.staffId) {
      redirect(buildStaffHref('/staff', ctx.shopSlug || undefined));
    }
    redirect('/cuenta');
  }

  return {
    userId: ctx.userId as string,
    staffId: ctx.staffId,
    role: 'admin' as const,
    email: ctx.email,
    shopId: ctx.shopId,
    shopSlug: ctx.shopSlug,
    shopName: ctx.shopName,
    shopTimezone: ctx.shopTimezone,
  };
}

export async function requireStaff(options?: AuthScopeOptions) {
  const ctx = await getCurrentAuthContext(options);
  const canAccessWorkspace = hasStaffAccess(ctx.availableWorkspaces);

  if (ctx.role === 'guest') {
    redirect('/login?next=/staff');
  }

  if (
    (ctx.selectedWorkspaceRole !== 'staff' && ctx.selectedWorkspaceRole !== 'admin') ||
    !ctx.shopId ||
    !ctx.shopSlug ||
    !ctx.shopName ||
    !ctx.shopTimezone
  ) {
    if (canAccessWorkspace) {
      redirect('/mis-barberias');
    }
    redirect('/cuenta');
  }

  if (!ctx.staffId) {
    if (ctx.selectedWorkspaceRole === 'admin') {
      redirect(buildAdminHref('/admin', ctx.shopSlug));
    }
    redirect('/mis-barberias');
  }

  return {
    userId: ctx.userId as string,
    staffId: ctx.staffId,
    role: ctx.selectedWorkspaceRole,
    email: ctx.email,
    shopId: ctx.shopId,
    shopSlug: ctx.shopSlug,
    shopName: ctx.shopName,
    shopTimezone: ctx.shopTimezone,
  };
}
