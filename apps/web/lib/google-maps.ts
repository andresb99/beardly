const GOOGLE_MAPS_SCRIPT_ID = 'navaja-google-maps-sdk';

type GoogleMapStyle = {
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, string>>;
};

export interface GoogleLatLng {
  lat: number;
  lng: number;
}

export interface GoogleMap {
  setOptions(options: unknown): void;
  setCenter(center: GoogleLatLng): void;
  setZoom(zoom: number): void;
  panTo(position: GoogleLatLng): void;
  fitBounds(bounds: GoogleLatLngBounds, padding?: number): void;
}

export interface GoogleMarker {
  addListener(eventName: string, handler: () => void): void;
  setIcon(icon: unknown): void;
  setMap(map: GoogleMap | null): void;
  setPosition(position: GoogleLatLng): void;
  setTitle(title: string): void;
  setZIndex(zIndex: number): void;
}

export interface GoogleAutocompleteService {
  getPlacePredictions(
    request: {
      input: string;
      componentRestrictions?: { country: string };
      sessionToken?: object | null;
    },
    callback: (results: Array<Record<string, unknown>> | null, status: string) => void,
  ): void;
}

export interface GoogleGeocoderLocation {
  lat(): number;
  lng(): number;
}

export interface GoogleGeocoderResult {
  address_components?: Array<{ long_name?: string; short_name?: string; types?: string[] }>;
  geometry?: { location?: GoogleGeocoderLocation };
  formatted_address?: string;
}

export interface GoogleGeocoder {
  geocode(
    request: { placeId: string },
    callback: (results: GoogleGeocoderResult[] | null, status: string) => void,
  ): void;
}

export interface GoogleLatLngBounds {
  extend(position: GoogleLatLng): void;
}

export interface GoogleMapsLibrary {
  Map: new (element: Element, options: Record<string, unknown>) => GoogleMap;
  Marker: new (options: Record<string, unknown>) => GoogleMarker;
  Geocoder: new () => GoogleGeocoder;
  Size: new (width: number, height: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  LatLngBounds: new () => GoogleLatLngBounds;
  SymbolPath: { CIRCLE: unknown };
  places?: {
    AutocompleteService: new () => GoogleAutocompleteService;
    AutocompleteSessionToken?: new () => object;
  };
}

export interface GoogleMapsApi {
  maps?: GoogleMapsLibrary;
}

export const URUGUAY_CENTER = { lat: -32.5228, lng: -55.7658 };
export const URUGUAY_ZOOM = 6;
export const URUGUAY_BOUNDS = {
  north: -30.05,
  south: -35.25,
  west: -58.55,
  east: -53.05,
} as const;

export const GOOGLE_LIGHT_MAP_STYLES: GoogleMapStyle[] = [
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

export const GOOGLE_DARK_MAP_STYLES: GoogleMapStyle[] = [
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

export function getGoogleMapThemeOptions(isDarkTheme: boolean) {
  return {
    backgroundColor: isDarkTheme ? '#070b12' : '#eef4ff',
    styles: isDarkTheme ? GOOGLE_DARK_MAP_STYLES : GOOGLE_LIGHT_MAP_STYLES,
  };
}

type GoogleMapsWindow = Window & {
  google?: GoogleMapsApi;
};

let googleMapsLoader: Promise<GoogleMapsApi | undefined> | null = null;

export function loadGoogleMapsPlacesApi(apiKey: string) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps solo se puede cargar en el navegador.'));
  }

  const normalizedKey = apiKey.trim();
  if (!normalizedKey) {
    return Promise.reject(new Error('Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.'));
  }

  const browserWindow = window as GoogleMapsWindow;
  if (browserWindow.google?.maps?.places) {
    return Promise.resolve(browserWindow.google);
  }

  if (googleMapsLoader) {
    return googleMapsLoader;
  }

  googleMapsLoader = new Promise((resolve, reject) => {
    const handleLoad = () => {
      if ((window as GoogleMapsWindow).google?.maps?.places) {
        resolve((window as GoogleMapsWindow).google);
        return;
      }

      googleMapsLoader = null;
      reject(new Error('Google Maps cargo sin la libreria de Places.'));
    };

    const handleError = () => {
      googleMapsLoader = null;
      reject(new Error('No se pudo cargar Google Maps.'));
    };

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(normalizedKey)}` +
      '&libraries=places&language=es&region=UY&v=weekly';
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.head.append(script);
  });

  return googleMapsLoader;
}
