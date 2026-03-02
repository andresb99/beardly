import { mockMarketplaceShops } from '@/lib/test-fixtures/shops';

describe('shops in mock runtime', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns deterministic marketplace fixtures', async () => {
    vi.stubEnv('NAVAJA_TEST_MODE', 'mock');

    const { getDefaultMarketplaceShop, getMarketplaceShopBySlug, listMarketplaceShops } =
      await import('@/lib/shops');

    await expect(listMarketplaceShops()).resolves.toEqual(mockMarketplaceShops);
    await expect(getMarketplaceShopBySlug('Navaja Centro')).resolves.toEqual(
      mockMarketplaceShops[0],
    );
    await expect(getDefaultMarketplaceShop()).resolves.toEqual(mockMarketplaceShops[0]);
  });
});
