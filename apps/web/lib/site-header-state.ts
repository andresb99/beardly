export type HeaderRole = 'guest' | 'user' | 'staff' | 'admin';

export interface AccessibleWorkspaceMeta {
  id: string;
  slug: string;
  name: string;
}

export interface SiteHeaderInitialState {
  role: HeaderRole;
  profileName: string | null;
  profileAvatarUrl: string | null;
  userEmail: string | null;
  pendingNotificationCount: number;
  hasWorkspaceAccess: boolean;
  workspaceDirectory: AccessibleWorkspaceMeta[];
  isPlatformAdmin: boolean;
  publicTenantSlug: string | null;
  publicTenantMode: 'path' | 'custom_domain' | 'platform_subdomain';
  selectedWorkspaceId?: string | null;
  selectedWorkspaceSlug?: string | null;
  selectedWorkspaceName?: string | null;
}

export const DEFAULT_SITE_HEADER_STATE: SiteHeaderInitialState = {
  role: 'guest',
  profileName: null,
  profileAvatarUrl: null,
  userEmail: null,
  pendingNotificationCount: 0,
  hasWorkspaceAccess: false,
  workspaceDirectory: [],
  isPlatformAdmin: false,
  publicTenantSlug: null,
  publicTenantMode: 'path',
  selectedWorkspaceId: null,
  selectedWorkspaceSlug: null,
  selectedWorkspaceName: null,
};
