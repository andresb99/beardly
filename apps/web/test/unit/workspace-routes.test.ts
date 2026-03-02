import { buildAdminHref, buildAppHref, buildStaffHref, buildWorkspaceHref } from '@/lib/workspace-routes';

describe('workspace routes', () => {
  it('builds app links and skips empty query values', () => {
    expect(
      buildAppHref('/admin', {
        shop: 'navaja-centro',
        filter: ['today', '', null, 'upcoming'],
        page: 2,
        empty: '   ',
      }),
    ).toBe('/admin?shop=navaja-centro&filter=today&filter=upcoming&page=2');
  });

  it('builds workspace-scoped admin and staff links', () => {
    expect(buildAppHref('/book')).toBe('/book');
    expect(buildAdminHref('/admin/appointments', 'navaja-centro')).toBe(
      '/admin/appointments?shop=navaja-centro',
    );
    expect(buildStaffHref('/staff', null, { view: 'today' })).toBe('/staff?view=today');
    expect(buildWorkspaceHref('/admin', '', { filter: [null, undefined, ''] })).toBe('/admin');
  });
});
