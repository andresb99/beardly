import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from './env';
import { supabase } from './supabase';

const MARKETPLACE_SHOP_KEY = '@navaja/marketplace-shop-id';

type ShopRow = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  description: string | null;
  phone: string | null;
  is_verified: boolean | null;
  logo_url: string | null;
  cover_image_url: string | null;
};

type ShopLocationRow = {
  shop_id: string;
  label: string | null;
  city: string | null;
  region: string | null;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
};

type ShopReviewRow = {
  shop_id: string;
  rating: number | null;
};

type ShopServiceRow = {
  shop_id: string;
  price_cents: number | null;
};

type CourseRow = {
  id: string;
  shop_id: string;
  title: string;
  description: string | null;
  price_cents: number | null;
  duration_hours: number | null;
  level: string | null;
};

type SessionRow = {
  id: string;
  course_id: string;
  start_at: string;
  location: string | null;
};

type ModelRequirementRow = {
  session_id: string;
  requirements: Record<string, unknown> | null;
  compensation_type: 'gratis' | 'descuento' | 'pago';
  compensation_value_cents: number | null;
  notes_public: string | null;
};

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

export interface MarketplaceCourse {
  id: string;
  shopId: string;
  shopName: string;
  shopSlug: string;
  title: string;
  description: string;
  priceCents: number;
  durationHours: number;
  level: string;
}

export interface MarketplaceService {
  id: string;
  shopId: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
}

export interface MarketplaceOpenModelCall {
  sessionId: string;
  shopId: string;
  shopName: string;
  shopSlug: string;
  courseTitle: string;
  startAt: string;
  location: string;
  compensationType: 'gratis' | 'descuento' | 'pago';
  compensationValueCents: number | null;
  notesPublic: string | null;
  modelsNeeded: number;
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

function getModelsNeededFromRequirements(input: unknown) {
  if (!input || typeof input !== 'object') {
    return 0;
  }

  const rawValue = (input as Record<string, unknown>).models_needed;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.trunc(parsed);
}

export function formatMarketplaceLocation(shop: {
  locationLabel?: string | null;
  city?: string | null;
  region?: string | null;
}) {
  return [shop.locationLabel, shop.city, shop.region].filter(Boolean).join(' - ') || 'Uruguay';
}

export async function getSavedMarketplaceShopId() {
  return (await AsyncStorage.getItem(MARKETPLACE_SHOP_KEY)) || '';
}

export async function saveMarketplaceShopId(shopId: string) {
  if (!shopId) {
    await AsyncStorage.removeItem(MARKETPLACE_SHOP_KEY);
    return;
  }

  await AsyncStorage.setItem(MARKETPLACE_SHOP_KEY, shopId);
}

export async function resolvePreferredMarketplaceShopId(shops: Array<{ id: string }>) {
  if (!shops.length) {
    return '';
  }

  const validIds = new Set(shops.map((shop) => shop.id));
  const saved = await getSavedMarketplaceShopId();

  if (saved && validIds.has(saved)) {
    return saved;
  }

  if (env.EXPO_PUBLIC_SHOP_ID && validIds.has(env.EXPO_PUBLIC_SHOP_ID)) {
    return env.EXPO_PUBLIC_SHOP_ID;
  }

  return shops[0]?.id || '';
}

export async function listMarketplaceShops() {
  const { data: shopRows, error: shopsError } = await supabase
    .from('shops')
    .select(
      'id, name, slug, timezone, description, phone, is_verified, logo_url, cover_image_url',
    )
    .eq('status', 'active')
    .order('is_verified', { ascending: false })
    .order('name');

  if (shopsError || !shopRows?.length) {
    return [];
  }

  const shopIds = shopRows.map((item) => String(item.id));
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

  return (shopRows as ShopRow[]).map((shop) =>
    buildMarketplaceShop(
      shop,
      locationsByShopId.get(shop.id),
      reviewsByShopId.get(shop.id) || [],
      servicesByShopId.get(shop.id) || [],
    ),
  );
}

export async function listMarketplaceCourses(shopId?: string) {
  let query = supabase
    .from('courses')
    .select('id, shop_id, title, description, price_cents, duration_hours, level')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (shopId) {
    query = query.eq('shop_id', shopId);
  }

  const { data: courseRows, error: coursesError } = await query;
  if (coursesError || !courseRows?.length) {
    return [];
  }

  const shopIds = [...new Set((courseRows as CourseRow[]).map((item) => String(item.shop_id)))];
  const { data: shopRows } = await supabase
    .from('shops')
    .select('id, name, slug')
    .in('id', shopIds)
    .eq('status', 'active');

  const shopsById = new Map(
    ((shopRows || []) as Array<{ id: string; name: string; slug: string }>).map((item) => [
      String(item.id),
      item,
    ]),
  );

  return (courseRows as CourseRow[])
    .map((course) => {
      const shop = shopsById.get(String(course.shop_id));
      if (!shop) {
        return null;
      }

      return {
        id: String(course.id),
        shopId: String(course.shop_id),
        shopName: String(shop.name),
        shopSlug: String(shop.slug),
        title: String(course.title),
        description: String(course.description || ''),
        priceCents: Number(course.price_cents || 0),
        durationHours: Number(course.duration_hours || 0),
        level: String(course.level || ''),
      } satisfies MarketplaceCourse;
    })
    .filter((item): item is MarketplaceCourse => item !== null);
}

export async function listMarketplaceServices(shopId: string) {
  if (!shopId) {
    return [];
  }

  const { data, error } = await supabase
    .from('services')
    .select('id, shop_id, name, price_cents, duration_minutes')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('name');

  if (error || !data?.length) {
    return [];
  }

  return (data as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id),
    shopId: String(item.shop_id),
    name: String(item.name),
    priceCents: Number(item.price_cents || 0),
    durationMinutes: Number(item.duration_minutes || 0),
  }));
}

export async function listMarketplaceOpenModelCalls(shopId?: string) {
  const { data: requirementRows, error: requirementsError } = await supabase
    .from('model_requirements')
    .select('session_id, requirements, compensation_type, compensation_value_cents, notes_public')
    .eq('is_open', true);

  if (requirementsError || !requirementRows?.length) {
    return [];
  }

  const sessionIds = (requirementRows as ModelRequirementRow[]).map((row) => String(row.session_id));
  const { data: sessionRows, error: sessionsError } = await supabase
    .from('course_sessions')
    .select('id, course_id, start_at, location')
    .in('id', sessionIds)
    .eq('status', 'scheduled');

  if (sessionsError || !sessionRows?.length) {
    return [];
  }

  const courseIds = (sessionRows as SessionRow[]).map((row) => String(row.course_id));
  const { data: courseRows, error: coursesError } = await supabase
    .from('courses')
    .select('id, shop_id, title')
    .in('id', courseIds)
    .eq('is_active', true);

  if (coursesError || !courseRows?.length) {
    return [];
  }

  const shopIds = [...new Set((courseRows as Array<{ shop_id: string }>).map((row) => String(row.shop_id)))];
  const { data: shopRows } = await supabase
    .from('shops')
    .select('id, name, slug')
    .in('id', shopIds)
    .eq('status', 'active');

  const sessionsById = new Map(
    (sessionRows as SessionRow[]).map((row) => [String(row.id), row]),
  );
  const coursesById = new Map(
    ((courseRows || []) as Array<{ id: string; shop_id: string; title: string }>).map((row) => [
      String(row.id),
      row,
    ]),
  );
  const shopsById = new Map(
    ((shopRows || []) as Array<{ id: string; name: string; slug: string }>).map((row) => [
      String(row.id),
      row,
    ]),
  );

  return (requirementRows as ModelRequirementRow[])
    .map((row) => {
      const session = sessionsById.get(String(row.session_id));
      if (!session) {
        return null;
      }

      const course = coursesById.get(String(session.course_id));
      if (!course) {
        return null;
      }

      const shop = shopsById.get(String(course.shop_id));
      if (!shop) {
        return null;
      }

      return {
        sessionId: String(row.session_id),
        shopId: String(course.shop_id),
        shopName: String(shop.name),
        shopSlug: String(shop.slug),
        courseTitle: String(course.title),
        startAt: String(session.start_at),
        location: String(session.location || ''),
        compensationType: row.compensation_type,
        compensationValueCents:
          row.compensation_value_cents == null ? null : Number(row.compensation_value_cents || 0),
        notesPublic: row.notes_public ? String(row.notes_public) : null,
        modelsNeeded: getModelsNeededFromRequirements(row.requirements),
      } satisfies MarketplaceOpenModelCall;
    })
    .filter((item): item is MarketplaceOpenModelCall => {
      if (!item) {
        return false;
      }

      if (!shopId) {
        return true;
      }

      return item.shopId === shopId;
    })
    .sort((a, b) => (a.startAt < b.startAt ? -1 : 1));
}
