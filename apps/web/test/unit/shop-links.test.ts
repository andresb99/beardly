import { buildShopHref, normalizeShopSlug } from '@/lib/shop-links';

describe('shop links', () => {
  it('normalizes arbitrary shop names into slugs', () => {
    expect(normalizeShopSlug('  Navaja & Barber  ')).toBe('navaja-barber');
  });

  it('builds shop links with optional sections', () => {
    expect(buildShopHref('Navaja Centro')).toBe('/shops/navaja-centro');
    expect(buildShopHref('Navaja Centro', 'book')).toBe('/shops/navaja-centro/book');
  });
});
