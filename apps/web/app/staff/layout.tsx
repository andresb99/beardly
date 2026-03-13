import type { Metadata } from 'next';
import { StaffShell } from '@/components/staff/staff-shell';
import { getCurrentAuthContext } from '@/lib/auth';
import { PRIVATE_SECTION_METADATA } from '@/lib/site-metadata';

export const metadata: Metadata = PRIVATE_SECTION_METADATA;

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentAuthContext();

  if (
    (ctx.selectedWorkspaceRole !== 'staff' && ctx.selectedWorkspaceRole !== 'admin') ||
    !ctx.staffId
  ) {
    return children;
  }

  return (
    <StaffShell
      initialShopSlug={ctx.shopSlug}
      initialShopName={ctx.shopName}
      workspaceDirectory={ctx.availableWorkspaces.map((workspace) => ({
        id: workspace.shopId,
        slug: workspace.shopSlug,
        name: workspace.shopName,
      }))}
    >
      {children}
    </StaffShell>
  );
}
