describe('Marketplace page generateMetadata', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe('BookPage.generateMetadata', () => {
    it('delegates to shop metadata when in tenant mode', async () => {
      vi.doMock('@/lib/public-tenant-context', () => ({
        getPublicTenantRouteContext: vi.fn().mockResolvedValue({
          shopId: '11111111-1111-1111-1111-111111111111',
          shopSlug: 'navaja-centro',
          mode: 'platform_subdomain',
        }),
      }));
      vi.doMock('@/app/book/[slug]/page', () => ({
        default: vi.fn(),
        generateMetadata: vi.fn().mockResolvedValue({ title: 'Tenant book meta' }),
      }));

      const { generateMetadata } = await import('@/app/book/page');
      const meta = await generateMetadata();

      expect(meta).toEqual({ title: 'Tenant book meta' });
    });

    it('returns marketplace metadata in path mode', async () => {
      vi.doMock('@/lib/public-tenant-context', () => ({
        getPublicTenantRouteContext: vi.fn().mockResolvedValue({
          shopId: null,
          shopSlug: null,
          mode: 'path',
        }),
      }));
      vi.doMock('@/app/book/[slug]/page', () => ({
        default: vi.fn(),
        generateMetadata: vi.fn(),
      }));

      const { generateMetadata } = await import('@/app/book/page');
      const meta = await generateMetadata();

      expect((meta as { title?: string }).title).toContain('barberias');
    });
  });

  describe('CoursesPage.generateMetadata', () => {
    it('delegates to shop courses metadata when in tenant mode', async () => {
      vi.doMock('@/lib/public-tenant-context', () => ({
        getPublicTenantRouteContext: vi.fn().mockResolvedValue({
          shopId: '11111111-1111-1111-1111-111111111111',
          shopSlug: 'navaja-centro',
          mode: 'platform_subdomain',
        }),
      }));
      vi.doMock('@/app/shops/[slug]/courses/page', () => ({
        default: vi.fn(),
        generateMetadata: vi.fn().mockResolvedValue({ title: 'Tenant courses meta' }),
      }));

      const { generateMetadata } = await import('@/app/courses/page');
      const meta = await generateMetadata();

      expect(meta).toEqual({ title: 'Tenant courses meta' });
    });

    it('returns marketplace metadata in path mode', async () => {
      vi.doMock('@/lib/public-tenant-context', () => ({
        getPublicTenantRouteContext: vi.fn().mockResolvedValue({
          shopId: null,
          shopSlug: null,
          mode: 'path',
        }),
      }));
      vi.doMock('@/app/shops/[slug]/courses/page', () => ({
        default: vi.fn(),
        generateMetadata: vi.fn(),
      }));

      const { generateMetadata } = await import('@/app/courses/page');
      const meta = await generateMetadata();

      expect((meta as { title?: string }).title).toContain('barberia');
    });
  });

  describe('JobsPage.generateMetadata', () => {
    it('delegates to shop jobs metadata when in tenant mode', async () => {
      vi.doMock('@/lib/public-tenant-context', () => ({
        getPublicTenantRouteContext: vi.fn().mockResolvedValue({
          shopId: '11111111-1111-1111-1111-111111111111',
          shopSlug: 'navaja-centro',
          mode: 'platform_subdomain',
        }),
      }));
      vi.doMock('@/app/jobs/[slug]/page', () => ({
        default: vi.fn(),
        generateMetadata: vi.fn().mockResolvedValue({ title: 'Tenant jobs meta' }),
      }));

      const { generateMetadata } = await import('@/app/jobs/page');
      const meta = await generateMetadata();

      expect(meta).toEqual({ title: 'Tenant jobs meta' });
    });

    it('returns marketplace metadata in path mode', async () => {
      vi.doMock('@/lib/public-tenant-context', () => ({
        getPublicTenantRouteContext: vi.fn().mockResolvedValue({
          shopId: null,
          shopSlug: null,
          mode: 'path',
        }),
      }));
      vi.doMock('@/app/jobs/[slug]/page', () => ({
        default: vi.fn(),
        generateMetadata: vi.fn(),
      }));

      const { generateMetadata } = await import('@/app/jobs/page');
      const meta = await generateMetadata();

      expect((meta as { title?: string }).title).toContain('barberias');
    });
  });

  describe('ModelosLandingPage.generateMetadata', () => {
    it('delegates to shop modelos metadata when in tenant mode', async () => {
      vi.doMock('@/lib/public-tenant-context', () => ({
        getPublicTenantRouteContext: vi.fn().mockResolvedValue({
          shopId: '11111111-1111-1111-1111-111111111111',
          shopSlug: 'navaja-centro',
          mode: 'platform_subdomain',
        }),
      }));
      vi.doMock('@/app/modelos/[slug]/page', () => ({
        default: vi.fn(),
        generateMetadata: vi.fn().mockResolvedValue({ title: 'Tenant modelos meta' }),
      }));

      const { generateMetadata } = await import('@/app/modelos/page');
      const meta = await generateMetadata();

      expect(meta).toEqual({ title: 'Tenant modelos meta' });
    });

    it('returns marketplace metadata in path mode', async () => {
      vi.doMock('@/lib/public-tenant-context', () => ({
        getPublicTenantRouteContext: vi.fn().mockResolvedValue({
          shopId: null,
          shopSlug: null,
          mode: 'path',
        }),
      }));
      vi.doMock('@/app/modelos/[slug]/page', () => ({
        default: vi.fn(),
        generateMetadata: vi.fn(),
      }));

      const { generateMetadata } = await import('@/app/modelos/page');
      const meta = await generateMetadata();

      expect((meta as { title?: string }).title).toContain('modelos');
    });
  });
});
