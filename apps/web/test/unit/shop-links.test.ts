import {
  buildPlatformUrl,
  buildShopHref,
  buildTenantCourseHref,
  buildTenantModelRegistrationHref,
  buildTenantPublicHref,
  buildTenantRootHref,
  normalizeShopSlug,
} from '@/lib/shop-links';

describe('shop links', () => {
  it('normalizes arbitrary shop names into slugs', () => {
    expect(normalizeShopSlug('  Navaja & Barber  ')).toBe('navaja-barber');
  });

  it('builds shop links with optional sections', () => {
    expect(buildShopHref('Navaja Centro')).toBe('/shops/navaja-centro');
    // book, jobs, modelos are top-level clean URLs after the URL structure refactor
    expect(buildShopHref('Navaja Centro', 'book')).toBe('/book/navaja-centro');
    expect(buildShopHref('Navaja Centro', 'jobs')).toBe('/jobs/navaja-centro');
    expect(buildShopHref('Navaja Centro', 'modelos')).toBe('/modelos/navaja-centro');
    // courses remain scoped under /shops/[slug]/courses
    expect(buildShopHref('Navaja Centro', 'courses')).toBe('/shops/navaja-centro/courses');
  });

  it('builds host-scoped tenant links when the request already resolved the shop by host', () => {
    expect(buildTenantPublicHref('navaja-centro', 'custom_domain')).toBe('/');
    expect(buildTenantPublicHref('navaja-centro', 'platform_subdomain', 'jobs')).toBe('/jobs');
    // Course IDs are globally unique — /courses/[id] works in all routing modes
    expect(buildTenantCourseHref('navaja-centro', 'course-1', 'path')).toBe('/courses/course-1');
    expect(buildTenantCourseHref('navaja-centro', 'course-1', 'custom_domain')).toBe(
      '/courses/course-1',
    );
    // Empty course ID falls back to the courses listing for the shop
    expect(buildTenantCourseHref('navaja-centro', '', 'path')).toBe('/shops/navaja-centro/courses');
  });

  describe('buildTenantRootHref', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('falls back to platform path when root domain is not configured', () => {
      vi.stubEnv('NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN', '');
      expect(buildTenantRootHref('Navaja Centro')).toBe('/shops/navaja-centro');
    });

    it('appends section to the platform path fallback', () => {
      vi.stubEnv('NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN', '');
      expect(buildTenantRootHref('Navaja Centro', 'courses')).toBe('/shops/navaja-centro/courses');
    });

    it('builds a localhost subdomain URL in dev mode', () => {
      vi.stubEnv('NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN', 'localhost');
      expect(buildTenantRootHref('navaja-centro')).toBe('http://navaja-centro.localhost:3000');
    });

    it('appends section to the localhost subdomain URL', () => {
      vi.stubEnv('NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN', 'localhost');
      expect(buildTenantRootHref('navaja-centro', 'book')).toBe(
        'http://navaja-centro.localhost:3000/book',
      );
    });

    it('builds a production subdomain URL', () => {
      vi.stubEnv('NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN', 'beardly.com');
      expect(buildTenantRootHref('navaja-centro')).toBe('https://navaja-centro.beardly.com');
    });

    it('appends section to the production subdomain URL', () => {
      vi.stubEnv('NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN', 'beardly.com');
      expect(buildTenantRootHref('Navaja Centro', 'modelos')).toBe(
        'https://navaja-centro.beardly.com/modelos',
      );
    });

    it('normalizes the slug before building the URL', () => {
      vi.stubEnv('NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN', 'beardly.com');
      expect(buildTenantRootHref('  Navaja & Barber  ')).toBe(
        'https://navaja-barber.beardly.com',
      );
    });
  });

  describe('buildPlatformUrl', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('builds an absolute platform URL using NEXT_PUBLIC_APP_URL', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
      expect(buildPlatformUrl('/book')).toBe('http://localhost:3000/book');
    });

    it('falls back to a relative path when NEXT_PUBLIC_APP_URL is empty', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
      expect(buildPlatformUrl('/book')).toBe('/book');
    });

    it('defaults to root path when no path argument is provided', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
      expect(buildPlatformUrl()).toBe('http://localhost:3000/');
    });

    it('returns a relative path when NEXT_PUBLIC_APP_URL is unset', () => {
      const previous = process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;
      try {
        expect(buildPlatformUrl('/book')).toBe('/book');
      } finally {
        process.env.NEXT_PUBLIC_APP_URL = previous;
      }
    });
  });

  it('builds model registration links with and without session ids', () => {
    // path mode: /modelos/[slug]/registro (top-level clean URL after refactor)
    expect(buildTenantModelRegistrationHref('Navaja Centro', 'path')).toBe(
      '/modelos/navaja-centro/registro',
    );
    expect(
      buildTenantModelRegistrationHref('Navaja Centro', 'custom_domain', ' session 1/2 '),
    ).toBe('/modelos/registro?session_id=session%201%2F2');
  });
});
