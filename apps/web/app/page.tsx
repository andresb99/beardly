import { redirect } from 'next/navigation';
import {
  getAccessibleWorkspacesForCurrentUser,
  getFavoriteWorkspaceForCurrentUser,
  type WorkspaceSummary,
} from '@/lib/workspaces';
import { buildAdminHref, buildStaffHref } from '@/lib/workspace-routes';

function getWorkspaceLandingPath(workspace: WorkspaceSummary) {
  return workspace.accessRole === 'staff'
    ? buildStaffHref('/staff', workspace.shopSlug)
    : buildAdminHref('/admin', workspace.shopSlug);
}

export default async function HomePage() {
  const catalog = await getAccessibleWorkspacesForCurrentUser();

  if (!catalog) {
    redirect('/shops');
  }

  const workspaces = catalog.workspaces || [];

  if (!workspaces.length) {
    redirect('/mis-barberias');
  }

  if (workspaces.length === 1) {
    const firstWorkspace = workspaces[0];
    if (firstWorkspace) {
      redirect(getWorkspaceLandingPath(firstWorkspace));
    }
  }

  const favoriteWorkspace = await getFavoriteWorkspaceForCurrentUser();
  if (favoriteWorkspace) {
    redirect(getWorkspaceLandingPath(favoriteWorkspace));
  }

  redirect('/mis-barberias');
}
