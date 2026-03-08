import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { WORKSPACE_COOKIE_NAME, WORKSPACE_FAVORITE_COOKIE_NAME } from '@/lib/workspace-cookie';

type WorkspaceAccessRole = 'owner' | 'admin' | 'staff';

interface MembershipRow {
  shop_id: string | null;
  role: WorkspaceAccessRole | null;
}

interface StaffRow {
  id: string | null;
  shop_id: string | null;
  role: 'admin' | 'staff' | null;
}

interface ShopRow {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  status: string;
}

export interface WorkspaceSummary {
  shopId: string;
  shopName: string;
  shopSlug: string;
  shopTimezone: string;
  shopStatus: string;
  accessRole: WorkspaceAccessRole;
  staffId: string | null;
}

export interface AccessibleWorkspaceCatalog {
  userId: string;
  email: string | null;
  workspaces: WorkspaceSummary[];
}

function getRolePriority(role: WorkspaceAccessRole) {
  if (role === 'owner') {
    return 3;
  }

  if (role === 'admin') {
    return 2;
  }

  return 1;
}

function toWorkspaceAccessRole(input: WorkspaceAccessRole | 'admin' | 'staff' | null | undefined) {
  if (input === 'owner' || input === 'admin' || input === 'staff') {
    return input;
  }

  return null;
}

function mergeWorkspaceAccess(
  current: WorkspaceSummary | undefined,
  next: Pick<WorkspaceSummary, 'accessRole' | 'staffId'>,
) {
  if (!current) {
    return next;
  }

  const currentPriority = getRolePriority(current.accessRole);
  const nextPriority = getRolePriority(next.accessRole);

  if (nextPriority > currentPriority) {
    return {
      accessRole: next.accessRole,
      staffId: next.staffId || current.staffId,
    };
  }

  return {
    accessRole: current.accessRole,
    staffId: current.staffId || next.staffId,
  };
}

export const getAccessibleWorkspacesForCurrentUser = cache(
  async (): Promise<AccessibleWorkspaceCatalog | null> => {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const admin = createSupabaseAdminClient();
    const [membershipResult, staffResult] = await Promise.all([
      admin
        .from('shop_memberships')
        .select('shop_id, role')
        .eq('user_id', user.id)
        .eq('membership_status', 'active'),
      admin
        .from('staff')
        .select('id, shop_id, role')
        .eq('auth_user_id', user.id)
        .eq('is_active', true),
    ]);

    const memberships = (membershipResult.data || []) as MembershipRow[];
    const staffRows = (staffResult.data || []) as StaffRow[];
    const shopIds = Array.from(
      new Set(
        [...memberships.map((item) => String(item.shop_id || '')), ...staffRows.map((item) => String(item.shop_id || ''))]
          .filter(Boolean),
      ),
    );

    if (!shopIds.length) {
      return {
        userId: user.id,
        email: user.email ?? null,
        workspaces: [],
      };
    }

    const { data: shops } = await admin
      .from('shops')
      .select('id, name, slug, timezone, status')
      .in('id', shopIds);

    const shopsById = new Map<string, ShopRow>();
    for (const shop of (shops || []) as ShopRow[]) {
      shopsById.set(String(shop.id), shop);
    }

    const workspaceMap = new Map<string, WorkspaceSummary>();

    for (const membership of memberships) {
      const shopId = String(membership.shop_id || '');
      const shop = shopsById.get(shopId);
      const accessRole = toWorkspaceAccessRole(membership.role);
      if (!shopId || !shop || !accessRole) {
        continue;
      }

      const existing = workspaceMap.get(shopId);
      const merged = mergeWorkspaceAccess(existing, {
        accessRole,
        staffId: existing?.staffId || null,
      });

      workspaceMap.set(shopId, {
        shopId,
        shopName: String(shop.name),
        shopSlug: String(shop.slug),
        shopTimezone: String(shop.timezone || 'UTC'),
        shopStatus: String(shop.status || 'active'),
        accessRole: merged.accessRole,
        staffId: merged.staffId,
      });
    }

    for (const staffMember of staffRows) {
      const shopId = String(staffMember.shop_id || '');
      const shop = shopsById.get(shopId);
      const accessRole = toWorkspaceAccessRole(staffMember.role);
      if (!shopId || !shop || !accessRole) {
        continue;
      }

      const existing = workspaceMap.get(shopId);
      const merged = mergeWorkspaceAccess(existing, {
        accessRole,
        staffId: staffMember.id ? String(staffMember.id) : null,
      });

      workspaceMap.set(shopId, {
        shopId,
        shopName: String(shop.name),
        shopSlug: String(shop.slug),
        shopTimezone: String(shop.timezone || 'UTC'),
        shopStatus: String(shop.status || 'active'),
        accessRole: merged.accessRole,
        staffId: merged.staffId,
      });
    }

    const workspaces = [...workspaceMap.values()].sort((left, right) => {
      const priorityDiff = getRolePriority(right.accessRole) - getRolePriority(left.accessRole);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return left.shopName.localeCompare(right.shopName, 'es-UY');
    });

    return {
      userId: user.id,
      email: user.email ?? null,
      workspaces,
    };
  },
);

export async function getSelectedWorkspaceForCurrentUser(): Promise<WorkspaceSummary | null> {
  const catalog = await getAccessibleWorkspacesForCurrentUser();
  if (!catalog?.workspaces.length) {
    return null;
  }

  const cookieStore = await cookies();
  const requestedWorkspaceId = cookieStore.get(WORKSPACE_COOKIE_NAME)?.value;
  return (
    catalog.workspaces.find((workspace) => workspace.shopId === requestedWorkspaceId) ||
    catalog.workspaces[0] ||
    null
  );
}

export async function getFavoriteWorkspaceForCurrentUser(): Promise<WorkspaceSummary | null> {
  const catalog = await getAccessibleWorkspacesForCurrentUser();
  if (!catalog?.workspaces.length) {
    return null;
  }

  const cookieStore = await cookies();
  const favoriteWorkspaceId = cookieStore.get(WORKSPACE_FAVORITE_COOKIE_NAME)?.value;
  if (!favoriteWorkspaceId) {
    return null;
  }

  return catalog.workspaces.find((workspace) => workspace.shopId === favoriteWorkspaceId) || null;
}

export function getLegacyWorkspaceFallback() {
  return {
    shopId: env.NEXT_PUBLIC_SHOP_ID,
    shopName: 'Barbershop',
    shopSlug: 'default',
    shopTimezone: 'UTC',
    shopStatus: 'active',
    accessRole: 'admin' as const,
    staffId: null,
  };
}
