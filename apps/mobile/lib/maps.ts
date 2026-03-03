import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';
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

export const URUGUAY_REGION = {
  latitude: -32.5228,
  longitude: -55.7658,
  latitudeDelta: 7.2,
  longitudeDelta: 6.2,
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
    latitudeDelta: 0.65,
    longitudeDelta: 0.65,
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
