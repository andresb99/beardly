import {
  buildAdminHref,
  buildAppHref,
  buildStaffHref,
  buildTenantAdminHref,
  buildTenantStaffHref,
  buildTenantWorkspaceHref,
  buildWorkspaceHref,
} from '@/lib/workspace-routes';

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

  it('falls back to app href when shopSlug is null or empty', () => {
    expect(buildTenantWorkspaceHref('/admin', null)).toBe('/admin');
    expect(buildTenantWorkspaceHref('/admin', '')).toBe('/admin');
  });

  it('falls back to workspace href when tenant origin cannot be resolved', () => {
    const previousRootDomain = process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN;
    const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    try {
      process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN = '';
      process.env.NEXT_PUBLIC_APP_URL = '';

      expect(buildTenantWorkspaceHref('/admin', 'navaja-centro')).toBe(
        '/admin?shop=navaja-centro',
      );
    } finally {
      process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN = previousRootDomain;
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    }
  });

  it('builds a tenant workspace origin without a port when the request origin has none', () => {
    const previousRootDomain = process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN;
    const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    try {
      process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN = 'beardly.app';
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.beardly.app';

      expect(
        buildTenantWorkspaceHref('/admin', 'navaja-centro', undefined, {
          requestOrigin: 'https://app.beardly.app',
        }),
      ).toBe('https://navaja-centro.beardly.app/admin');
    } finally {
      process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN = previousRootDomain;
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    }
  });

  it('rewrites a 0.0.0.0 request origin host to localhost', () => {
    const previousRootDomain = process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN;
    const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    try {
      process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN = 'localhost';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

      expect(
        buildTenantWorkspaceHref('/admin', 'navaja-centro', undefined, {
          requestOrigin: 'http://0.0.0.0:3000',
        }),
      ).toBe('http://navaja-centro.localhost:3000/admin');
    } finally {
      process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN = previousRootDomain;
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    }
  });

  it('falls back to workspace href when the request origin is not a valid URL', () => {
    const previousRootDomain = process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN;
    try {
      process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN = 'localhost';

      expect(
        buildTenantWorkspaceHref('/admin', 'navaja-centro', undefined, {
          requestOrigin: 'not a valid url',
        }),
      ).toBe('/admin?shop=navaja-centro');
    } finally {
      process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN = previousRootDomain;
    }
  });

  it('builds tenant workspace links on the shop subdomain when an origin is available', () => {
    const previousRootDomain = process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN;
    const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    try {
      process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN = 'localhost';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

      expect(
        buildTenantAdminHref('/admin/appointments', 'navaja-centro', undefined, {
          requestOrigin: 'http://localhost:3000',
        }),
      ).toBe('http://navaja-centro.localhost:3000/admin/appointments');
      expect(
        buildTenantStaffHref('/staff', 'navaja-centro', { view: 'today' }, {
          requestOrigin: 'http://localhost:3000',
        }),
      ).toBe('http://navaja-centro.localhost:3000/staff?view=today');
    } finally {
      process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN = previousRootDomain;
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    }
  });
});
