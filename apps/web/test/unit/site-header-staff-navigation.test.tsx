import { render, screen } from '@testing-library/react';
import { SiteHeader } from '@/components/public/site-header';

vi.mock('next/navigation', () => ({
  usePathname: () => '/staff/citas',
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(''),
}));

describe('SiteHeader staff navigation', () => {
  it('falls back to the selected workspace when the route has no shop query', () => {
    render(
      <SiteHeader
        initialState={{
          role: 'staff',
          profileName: 'Matias',
          profileAvatarUrl: null,
          userEmail: 'matias@example.com',
          pendingNotificationCount: 1,
          hasWorkspaceAccess: true,
          workspaceDirectory: [
            {
              id: '11111111-1111-1111-1111-111111111111',
              slug: 'barberandres',
              name: 'Barber Andres',
            },
          ],
          isPlatformAdmin: false,
          publicTenantSlug: null,
          publicTenantMode: 'path',
          selectedWorkspaceId: '11111111-1111-1111-1111-111111111111',
          selectedWorkspaceSlug: 'barberandres',
          selectedWorkspaceName: 'Barber Andres',
        }}
      />,
    );

    expect(
      screen
        .getAllByRole('link', { name: 'Resumen' })
        .some((item) => item.getAttribute('href') === '/staff?shop=barberandres'),
    ).toBe(true);
    expect(
      screen
        .getAllByRole('link', { name: 'Citas' })
        .some((item) => item.getAttribute('href') === '/staff/citas?shop=barberandres'),
    ).toBe(true);
    expect(
      screen
        .getAllByRole('link', { name: 'Metricas' })
        .some((item) => item.getAttribute('href') === '/staff/metricas?shop=barberandres'),
    ).toBe(true);
    expect(
      screen
        .getAllByRole('link', { name: 'Ausencias' })
        .some((item) => item.getAttribute('href') === '/staff/ausencias?shop=barberandres'),
    ).toBe(true);
    expect(
      screen
        .getAllByRole('button', { name: 'Suscripcion' })
        .some((item) => item.getAttribute('href') === '/suscripcion?shop=barberandres'),
    ).toBe(true);
  });
});
