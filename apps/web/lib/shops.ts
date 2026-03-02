import 'server-only';

import { cache } from 'react';
import { normalizeShopSlug } from '@/lib/shop-links';
import { mockMarketplaceShops } from '@/lib/test-fixtures/shops';
import { isMockRuntime } from '@/lib/test-runtime';

interface ShopRow {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  description: string | null;
  phone: string | null;
  is_verified: boolean | null;
  logo_url: string | null;
  cover_image_url: string | null;
  status: string;
}

interface ShopLocationRow {
  shop_id: string;
  label: string | null;
  city: string | null;
  region: string | null;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface ShopReviewRow {
  shop_id: string;
  rating: number | null;
}

interface ShopServiceRow {
  shop_id: string;
  price_cents: number | null;
}

export interface MarketplaceShop {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  description: string | null;
  phone: string | null;
  isVerified: boolean;
  logoUrl: string | null;
  coverImageUrl: string | null;
  locationLabel: string | null;
  city: string | null;
  region: string | null;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
  reviewCount: number;
  averageRating: number | null;
  activeServiceCount: number;
  minServicePriceCents: number | null;
}

function buildMarketplaceShop(
  shop: ShopRow,
  location: ShopLocationRow | undefined,
  reviews: ShopReviewRow[],
  services: ShopServiceRow[],
): MarketplaceShop {
  const validRatings = reviews
    .map((item) => Number(item.rating))
    .filter((item) => Number.isFinite(item) && item >= 1 && item <= 5);
  const reviewCount = validRatings.length;
  const ratingTotal = validRatings.reduce((sum, current) => sum + current, 0);
  const validPrices = services
    .map((item) => Number(item.price_cents))
    .filter((item) => Number.isFinite(item) && item >= 0);

  return {
    id: shop.id,
    name: shop.name,
    slug: shop.slug,
    timezone: shop.timezone,
    description: shop.description,
    phone: shop.phone,
    isVerified: Boolean(shop.is_verified),
    logoUrl: shop.logo_url,
    coverImageUrl: shop.cover_image_url,
    locationLabel: location?.label || null,
    city: location?.city || null,
    region: location?.region || null,
    countryCode: location?.country_code || null,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    reviewCount,
    averageRating: reviewCount > 0 ? ratingTotal / reviewCount : null,
    activeServiceCount: validPrices.length,
    minServicePriceCents: validPrices.length > 0 ? Math.min(...validPrices) : null,
  };
}

export const listMarketplaceShops = cache(async (): Promise<MarketplaceShop[]> => {
  if (isMockRuntime()) {
    return mockMarketplaceShops;
  }

  const { createSupabaseAdminClient } = await import('@/lib/supabase/admin');
  const supabase = createSupabaseAdminClient();
  const { data: shops, error: shopsError } = await supabase
    .from('shops')
    .select(
      'id, name, slug, timezone, description, phone, is_verified, logo_url, cover_image_url, status',
    )
    .eq('status', 'active')
    .order('is_verified', { ascending: false })
    .order('published_at', { ascending: false })
    .order('name');

  if (shopsError || !shops?.length) {
    return [];
  }

  const shopIds = shops.map((item) => String(item.id));
  const [{ data: locations }, { data: reviews }, { data: services }] = await Promise.all([
    supabase
      .from('shop_locations')
      .select('shop_id, label, city, region, country_code, latitude, longitude')
      .in('shop_id', shopIds)
      .eq('is_public', true),
    supabase
      .from('appointment_reviews')
      .select('shop_id, rating')
      .in('shop_id', shopIds)
      .eq('status', 'published')
      .eq('is_verified', true),
    supabase
      .from('services')
      .select('shop_id, price_cents')
      .in('shop_id', shopIds)
      .eq('is_active', true),
  ]);

  const locationsByShopId = new Map(
    ((locations || []) as ShopLocationRow[]).map((item) => [String(item.shop_id), item]),
  );
  const reviewsByShopId = new Map<string, ShopReviewRow[]>();
  const servicesByShopId = new Map<string, ShopServiceRow[]>();

  ((reviews || []) as ShopReviewRow[]).forEach((item) => {
    const shopId = String(item.shop_id);
    const current = reviewsByShopId.get(shopId) || [];
    current.push(item);
    reviewsByShopId.set(shopId, current);
  });

  ((services || []) as ShopServiceRow[]).forEach((item) => {
    const shopId = String(item.shop_id);
    const current = servicesByShopId.get(shopId) || [];
    current.push(item);
    servicesByShopId.set(shopId, current);
  });

  return (shops as ShopRow[]).map((shop) =>
    buildMarketplaceShop(
      shop,
      locationsByShopId.get(shop.id),
      reviewsByShopId.get(shop.id) || [],
      servicesByShopId.get(shop.id) || [],
    ),
  );
});

export const getMarketplaceShopBySlug = cache(
  async (slug: string): Promise<MarketplaceShop | null> => {
    const normalized = normalizeShopSlug(slug);
    if (!normalized) {
      return null;
    }

    const shops = await listMarketplaceShops();
    return shops.find((item) => item.slug === normalized) || null;
  },
);

export const getDefaultMarketplaceShop = cache(async (): Promise<MarketplaceShop | null> => {
  const shops = await listMarketplaceShops();
  return shops[0] || null;
});
