import { render, screen } from '@testing-library/react';
import { mockMarketplaceShops } from '@/lib/test-fixtures/shops';

describe('ShopsMarketplacePage', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('renders marketplace stats and the map shell when shops exist', async () => {
    vi.doMock('@/lib/shops', () => ({
      listMarketplaceShops: vi.fn().mockResolvedValue(mockMarketplaceShops),
    }));
    vi.doMock('@/components/public/shops-map-marketplace', () => ({
      ShopsMapMarketplace: ({ shops }: { shops: Array<{ name: string }> }) => (
        <div data-testid="shops-map-marketplace">{shops.map((shop) => shop.name).join(', ')}</div>
      ),
    }));

    const { default: ShopsMarketplacePage } = await import('@/app/shops/page');
    render(await ShopsMarketplacePage());

    expect(
      screen.getByRole('heading', {
        name: /Descubre barberias, compara perfiles/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(String(mockMarketplaceShops.length))).toBeInTheDocument();
    expect(screen.getByTestId('shops-map-marketplace')).toHaveTextContent(
      'Navaja Centro, Navaja Pocitos',
    );
  });

  it('renders the onboarding empty state when there are no shops', async () => {
    vi.doMock('@/lib/shops', () => ({
      listMarketplaceShops: vi.fn().mockResolvedValue([]),
    }));
    vi.doMock('@/components/public/shops-map-marketplace', () => ({
      ShopsMapMarketplace: () => <div data-testid="shops-map-marketplace" />,
    }));

    const { default: ShopsMarketplacePage } = await import('@/app/shops/page');
    render(await ShopsMarketplacePage());

    expect(
      screen.getByText('Aun no hay barberias publicadas. Crea la primera desde el onboarding.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('shops-map-marketplace')).toBeEmptyDOMElement();
  });
});
