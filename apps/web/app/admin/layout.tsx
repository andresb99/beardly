import type { Metadata } from 'next';
import { PRIVATE_SECTION_METADATA } from '@/lib/site-metadata';
import { cn } from '@/lib/cn';
import { requireAdmin } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminMobileNavController } from '@/components/admin/admin-mobile-nav-controller';
import { AdminLayoutEffects } from '@/components/admin/admin-layout-effects';
import { getSiteHeaderInitialState } from '@/lib/site-header-state.server';

export const metadata: Metadata = PRIVATE_SECTION_METADATA;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [ctx, headerState] = await Promise.all([
    requireAdmin(),
    getSiteHeaderInitialState(),
  ]);

  const commonProps = {
    workspaceName: ctx.shopName,
    workspacePlan: "Plan Pro - Centro",
    userProfileName: headerState.profileName,
    userEmail: headerState.userEmail,
    userAvatarUrl: headerState.profileAvatarUrl,
    unreadNotifications: headerState.pendingNotificationCount,
    role: headerState.role,
    activeWorkspaceSlug: headerState.selectedWorkspaceSlug,
    isPlatformAdmin: headerState.isPlatformAdmin,
  };

  return (
    <div className={cn("admin-layout-root flex h-screen w-full flex-col overflow-hidden bg-[#121016] lg:flex-row")}>
      <AdminLayoutEffects />
      <AdminMobileNavController {...commonProps} />
      <AdminSidebar {...commonProps} />
      
      <main className="flex-1 overflow-y-auto bg-[#121016]">
        <div className="px-4 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
