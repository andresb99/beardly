import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';
import { env } from './env';
import { formatMarketplaceLocation, type MarketplaceShop } from './marketplace';

type NativeMapStyle = Array<{
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, string>>;
}>;

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

interface AreaRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDeltaFromZoom(zoom: number) {
  const normalizedZoom = clamp(zoom, 1, 20);
  const latitudeDelta = 360 / Math.pow(2, normalizedZoom);
  return clamp(latitudeDelta, 0.003, 40);
}

export const URUGUAY_REGION = {
  latitude: -32.5228,
  longitude: -55.7658,
  latitudeDelta: 7.2,
  longitudeDelta: 6.2,
} as const;

export const URUGUAY_BOUNDS = {
  north: -30.05,
  south: -35.25,
  west: -58.55,
  east: -53.05,
} as const;

export const lightMapStyles: NativeMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#eef4ff' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#314256' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#eef4ff' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#b7c6db' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#95abc8' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#e9f1ff' }],
  },
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#dde7f5' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#c9daf2' }],
  },
  {
    featureType: 'transit',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#cad8ea' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#54697f' }],
  },
];

export const darkMapStyles: NativeMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#070b12' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a8b3c7' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#070b12' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#364152' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#546173' }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#3b4756' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#05080d' }],
  },
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#182230' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#1d2a3a' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#243245' }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [{ color: '#131a26' }],
  },
  {
    featureType: 'transit',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#1e2a36' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#90a1ba' }],
  },
];

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function getDistanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
) {
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(toLatitude - fromLatitude);
  const deltaLongitude = toRadians(toLongitude - fromLongitude);
  const latitudeA = toRadians(fromLatitude);
  const latitudeB = toRadians(toLatitude);

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(latitudeA) *
      Math.cos(latitudeB) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function getMapTheme(mode: 'light' | 'dark') {
  return mode === 'dark' ? darkMapStyles : lightMapStyles;
}

export function getShopRegion(shop: MarketplaceShop) {
  if (shop.latitude == null || shop.longitude == null) {
    return URUGUAY_REGION;
  }

  return {
    latitude: Number(shop.latitude),
    longitude: Number(shop.longitude),
    latitudeDelta: getDeltaFromZoom(15),
    longitudeDelta: getDeltaFromZoom(15),
  };
}

export function getPointRegion(point: GeoPoint) {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    latitudeDelta: 0.95,
    longitudeDelta: 0.95,
  };
}

interface GoogleGeocodeResult {
  types?: string[];
  address_components?: Array<{
    types?: string[];
  }>;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
    viewport?: {
      northeast?: {
        lat?: number;
        lng?: number;
      };
      southwest?: {
        lat?: number;
        lng?: number;
      };
    };
    location_type?: string;
  };
}

interface GoogleGeocodeResponse {
  status?: string;
  results?: GoogleGeocodeResult[];
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('timeout'));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

const PRECISE_GEOCODER_TYPES = new Set([
  'street_address',
  'premise',
  'subpremise',
  'intersection',
  'establishment',
  'point_of_interest',
]);

const AREA_GEOCODER_TYPES = new Set([
  'locality',
  'neighborhood',
  'sublocality',
  'sublocality_level_1',
  'administrative_area_level_1',
  'administrative_area_level_2',
  'administrative_area_level_3',
  'postal_code',
  'country',
]);

function normalizeSearchTerm(value: string | null | undefined) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getAreaDelta(
  query: string,
  options?: {
    locationType?: string;
    resultTypes?: string[];
    componentTypes?: string[];
  },
) {
  const normalizedQuery = normalizeSearchTerm(query);
  const looksLikeSpecificAddress =
    /\d/.test(query) ||
    /[&/]/.test(query) ||
    /\b(esquina|interseccion|calle|av|avenida|ruta)\b/i.test(query) ||
    options?.locationType === 'ROOFTOP' ||
    options?.locationType === 'RANGE_INTERPOLATED';
  const hasStreetNumber = (options?.componentTypes || []).includes('street_number');
  const hasRoute = (options?.componentTypes || []).includes('route');
  const hasPreciseType = (options?.resultTypes || []).some((type) => PRECISE_GEOCODER_TYPES.has(type));
  const hasAreaType = (options?.resultTypes || []).some((type) => AREA_GEOCODER_TYPES.has(type));

  if (hasStreetNumber || hasPreciseType || (hasRoute && looksLikeSpecificAddress)) {
    return 0.025;
  }

  if (hasAreaType) {
    return 0.2;
  }

  if (looksLikeSpecificAddress) {
    return normalizedQuery.length >= 22 ? 0.03 : 0.05;
  }

  return 0.45;
}

function getRegionFromGoogleViewport(
  latitude: number,
  longitude: number,
  viewport?: {
    northeast?: { lat?: number; lng?: number };
    southwest?: { lat?: number; lng?: number };
  },
): AreaRegion | null {
  const north = viewport?.northeast?.lat;
  const east = viewport?.northeast?.lng;
  const south = viewport?.southwest?.lat;
  const west = viewport?.southwest?.lng;

  if (
    typeof north !== 'number' ||
    typeof east !== 'number' ||
    typeof south !== 'number' ||
    typeof west !== 'number' ||
    !Number.isFinite(north) ||
    !Number.isFinite(east) ||
    !Number.isFinite(south) ||
    !Number.isFinite(west)
  ) {
    return null;
  }

  const latitudeDelta = clamp(Math.abs(north - south) * 1.15, 0.008, 6);
  const longitudeDelta = clamp(Math.abs(east - west) * 1.15, 0.008, 6);

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
}

async function geocodeAreaWithGoogleMaps(query: string): Promise<AreaRegion | null> {
  const googleMapsApiKey = env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!googleMapsApiKey) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 2000);

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', query);
    url.searchParams.set('region', 'uy');
    url.searchParams.set('language', 'es');
    url.searchParams.set('key', googleMapsApiKey);

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as GoogleGeocodeResponse;
    if (payload.status !== 'OK') {
      return null;
    }

    const first = payload.results?.[0];
    const latitude = first?.geometry?.location?.lat;
    const longitude = first?.geometry?.location?.lng;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return null;
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const resultTypes = (first?.types || []).map((type) => String(type || '').toLowerCase());
    const componentTypes = (first?.address_components || [])
      .flatMap((component) => component.types || [])
      .map((type) => String(type || '').toLowerCase());
    const viewportRegion = getRegionFromGoogleViewport(latitude, longitude, first?.geometry?.viewport);
    if (viewportRegion) {
      return viewportRegion;
    }

    const delta = getAreaDelta(query, {
      resultTypes,
      componentTypes,
      ...(first?.geometry?.location_type ? { locationType: first.geometry.location_type } : {}),
    });

    return {
      latitude,
      longitude,
      latitudeDelta: delta,
      longitudeDelta: delta,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function geocodeMarketplaceArea(query: string): Promise<AreaRegion | null> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return null;
  }

  const googleResult = await geocodeAreaWithGoogleMaps(trimmedQuery);
  if (googleResult) {
    return googleResult;
  }

  try {
    const fallbackQuery = /uruguay/i.test(trimmedQuery) ? trimmedQuery : `${trimmedQuery}, Uruguay`;
    const results = await withTimeout(Location.geocodeAsync(fallbackQuery), 2000);
    const first = results[0];
    if (!first) {
      return null;
    }

    const delta = getAreaDelta(trimmedQuery);

    return {
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: delta,
      longitudeDelta: delta,
    };
  } catch {
    return null;
  }
}

export async function requestCurrentDeviceLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    return {
      error: 'Debes habilitar ubicacion para ordenar barberias cercanas.',
      coords: null,
    };
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    error: null,
    coords: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    } satisfies GeoPoint,
  };
}

function buildMapsQuery(shop: MarketplaceShop) {
  if (shop.latitude != null && shop.longitude != null) {
    return `${Number(shop.latitude)},${Number(shop.longitude)}`;
  }

  return `${shop.name}, ${formatMarketplaceLocation(shop)}`;
}

async function openFirstSupportedUrl(urls: string[]) {
  for (const url of urls) {
    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        continue;
      }

      await Linking.openURL(url);
      return true;
    } catch {
      continue;
    }
  }

  return false;
}

export async function openShopInGoogleMaps(shop: MarketplaceShop) {
  const query = encodeURIComponent(buildMapsQuery(shop));
  const appleMapsUrl =
    shop.latitude != null && shop.longitude != null
      ? `http://maps.apple.com/?ll=${encodeURIComponent(
          `${Number(shop.latitude)},${Number(shop.longitude)}`,
        )}&q=${encodeURIComponent(shop.name)}`
      : `http://maps.apple.com/?q=${query}`;
  const geoUrl = `geo:0,0?q=${query}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  const urls =
    Platform.OS === 'ios'
      ? [appleMapsUrl, googleMapsUrl]
      : [geoUrl, googleMapsUrl];

  return openFirstSupportedUrl(urls);
}

export async function openDirectionsToShop(shop: MarketplaceShop, origin?: GeoPoint | null) {
  const destinationRaw = buildMapsQuery(shop);
  const destination = encodeURIComponent(destinationRaw);
  const originQuery =
    origin && Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude)
      ? `&origin=${encodeURIComponent(`${origin.latitude},${origin.longitude}`)}`
      : '';
  const appleDestination =
    shop.latitude != null && shop.longitude != null
      ? `${Number(shop.latitude)},${Number(shop.longitude)}`
      : destinationRaw;
  const appleOrigin =
    origin && Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude)
      ? `&saddr=${encodeURIComponent(`${origin.latitude},${origin.longitude}`)}`
      : '';
  const appleMapsUrl = `http://maps.apple.com/?daddr=${encodeURIComponent(
    appleDestination,
  )}${appleOrigin}&dirflg=d`;
  const googleNavigationUrl = `google.navigation:q=${destination}`;
  const geoUrl = `geo:0,0?q=${destination}`;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}${originQuery}`;

  const urls =
    Platform.OS === 'ios'
      ? [appleMapsUrl, googleMapsUrl]
      : [googleNavigationUrl, geoUrl, googleMapsUrl];

  return openFirstSupportedUrl(urls);
}

export async function openShopMapOrThrow(shop: MarketplaceShop) {
  const opened = await openShopInGoogleMaps(shop);

  if (!opened) {
    throw new Error('No se pudo abrir una app de mapas en este dispositivo.');
  }
}

export async function openShopDirectionsOrThrow(shop: MarketplaceShop, origin?: GeoPoint | null) {
  const opened = await openDirectionsToShop(shop, origin);

  if (!opened) {
    throw new Error('No se pudo abrir una app de mapas para iniciar la ruta.');
  }
}
