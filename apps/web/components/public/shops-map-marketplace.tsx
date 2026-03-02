'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { LocateFixed, MapPinned, Search, Sparkles, Star } from 'lucide-react';
import { formatCurrency } from '@navaja/shared';
import type { MarketplaceShop } from '@/lib/shops';
import { buildShopHref } from '@/lib/shop-links';
import {
  type GoogleMap,
  type GoogleMapsApi,
  type GoogleMapsLibrary,
  type GoogleMarker,
  URUGUAY_BOUNDS,
  URUGUAY_CENTER,
  URUGUAY_ZOOM,
  getGoogleMapThemeOptions,
  loadGoogleMapsPlacesApi,
} from '@/lib/google-maps';

interface ShopsMapMarketplaceProps {
  shops: MarketplaceShop[];
}

function formatRating(value: number | null) {
  if (value === null) {
    return 'Nuevo';
  }

  return value.toFixed(1);
}

function getDistanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
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

function getLocationSummary(shop: MarketplaceShop) {
  return [shop.locationLabel, shop.city, shop.region].filter(Boolean).join(' - ') || 'Ubicacion por confirmar';
}

function getInitialSelectedShop(shops: MarketplaceShop[]) {
  return shops.find((shop) => shop.latitude !== null && shop.longitude !== null)?.id || shops[0]?.id || null;
}

function createPinSvg(fillColor: string, shadowColor: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg width="42" height="56" viewBox="0 0 42 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 54C21 54 36 34.6 36 22.5C36 13.387 29.06 6 21 6C12.94 6 6 13.387 6 22.5C6 34.6 21 54 21 54Z" fill="${fillColor}"/>
      <path d="M21 54C21 54 36 34.6 36 22.5C36 13.387 29.06 6 21 6C12.94 6 6 13.387 6 22.5C6 34.6 21 54 21 54Z" stroke="${shadowColor}" stroke-width="2"/>
      <circle cx="21" cy="22" r="6.5" fill="white"/>
    </svg>`,
  )}`;
}

function getShopMarkerIcon(google: GoogleMapsLibrary, isActive: boolean, isDarkTheme: boolean) {
  const fillColor = isActive ? '#ef4444' : isDarkTheme ? '#0f172a' : '#1e293b';
  const shadowColor = isActive ? '#7f1d1d' : isDarkTheme ? '#475569' : '#94a3b8';

  return {
    url: createPinSvg(fillColor, shadowColor),
    scaledSize: new google.Size(34, 46),
    anchor: new google.Point(17, 44),
  };
}

function getUserMarkerIcon(google: GoogleMapsLibrary) {
  return {
    path: google.SymbolPath.CIRCLE,
    scale: 7,
    fillColor: '#38bdf8',
    fillOpacity: 1,
    strokeColor: '#e0f2fe',
    strokeOpacity: 1,
    strokeWeight: 2,
  };
}

export function ShopsMapMarketplace({ shops }: ShopsMapMarketplaceProps) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const googleMapsRef = useRef<GoogleMapsApi | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const markersRef = useRef<Map<string, GoogleMarker>>(new Map());
  const userMarkerRef = useRef<GoogleMarker | null>(null);

  const [selectedShopId, setSelectedShopId] = useState<string | null>(() => getInitialSelectedShop(shops));
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(
    googleMapsApiKey ? null : 'Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para mostrar el mapa.',
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredShops = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    const searchFiltered = normalizedQuery
      ? shops.filter((shop) =>
          [shop.name, shop.description, shop.city, shop.region, shop.locationLabel]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
        )
      : shops;

    const withDistance = searchFiltered.map((shop) => {
      const distanceKm =
        userLocation && shop.latitude !== null && shop.longitude !== null
          ? getDistanceKm(userLocation.latitude, userLocation.longitude, shop.latitude, shop.longitude)
          : null;

      return {
        shop,
        distanceKm,
      };
    });

    return withDistance.sort((left, right) => {
      if (left.distanceKm !== null && right.distanceKm !== null) {
        return left.distanceKm - right.distanceKm;
      }

      if (left.distanceKm !== null) {
        return -1;
      }

      if (right.distanceKm !== null) {
        return 1;
      }

      const leftScore = (left.shop.averageRating || 0) * 100 + left.shop.reviewCount;
      const rightScore = (right.shop.averageRating || 0) * 100 + right.shop.reviewCount;
      return rightScore - leftScore;
    });
  }, [deferredSearchQuery, shops, userLocation]);

  const selectedShop =
    filteredShops.find((entry) => entry.shop.id === selectedShopId)?.shop || filteredShops[0]?.shop || null;
  const mappableShops = filteredShops
    .map((entry) => entry.shop)
    .filter((shop) => shop.latitude !== null && shop.longitude !== null);
  const activePins = mappableShops.length;

  useEffect(() => {
    const root = document.documentElement;

    const syncTheme = () => {
      setIsDarkTheme(root.classList.contains('dark'));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!filteredShops.length) {
      setSelectedShopId(null);
      return;
    }

    const stillExists = filteredShops.some((entry) => entry.shop.id === selectedShopId);
    if (!stillExists) {
      setSelectedShopId(filteredShops[0]?.shop.id || null);
    }
  }, [filteredShops, selectedShopId]);

  useEffect(() => {
    if (!googleMapsApiKey || !mapElementRef.current || mapRef.current) {
      return;
    }

    let isCancelled = false;

    loadGoogleMapsPlacesApi(googleMapsApiKey)
      .then((google) => {
        if (isCancelled || !mapElementRef.current || !google?.maps || mapRef.current) {
          return;
        }

        googleMapsRef.current = google;
        mapRef.current = new google.maps.Map(mapElementRef.current, {
          center: URUGUAY_CENTER,
          zoom: URUGUAY_ZOOM,
          ...getGoogleMapThemeOptions(isDarkTheme),
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          gestureHandling: 'cooperative',
          clickableIcons: false,
          restriction: {
            latLngBounds: URUGUAY_BOUNDS,
            strictBounds: false,
          },
        });

        setMapError(null);
      })
      .catch((loadError) => {
        if (isCancelled) {
          return;
        }

        setMapError(loadError instanceof Error ? loadError.message : 'No se pudo cargar Google Maps.');
      });

    return () => {
      isCancelled = true;
    };
  }, [googleMapsApiKey, isDarkTheme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.setOptions(getGoogleMapThemeOptions(isDarkTheme));
  }, [isDarkTheme]);

  useEffect(() => {
    const google = googleMapsRef.current;
    const map = mapRef.current;
    if (!google?.maps || !map) {
      return;
    }

    const visibleIds = new Set<string>();

    for (const shop of mappableShops) {
      visibleIds.add(shop.id);
      const position = {
        lat: Number(shop.latitude),
        lng: Number(shop.longitude),
      };
      const isActive = shop.id === selectedShop?.id;
      const existingMarker = markersRef.current.get(shop.id);

      if (!existingMarker) {
        const marker = new google.maps.Marker({
          map,
          position,
          title: shop.name,
          icon: getShopMarkerIcon(google.maps, isActive, isDarkTheme),
          zIndex: isActive ? 20 : 10,
        });

        marker.addListener('click', () => {
          setSelectedShopId(shop.id);
        });

        markersRef.current.set(shop.id, marker);
        continue;
      }

      existingMarker.setMap(map);
      existingMarker.setPosition(position);
      existingMarker.setTitle(shop.name);
      existingMarker.setIcon(getShopMarkerIcon(google.maps, isActive, isDarkTheme));
      existingMarker.setZIndex(isActive ? 20 : 10);
    }

    for (const [shopId, marker] of markersRef.current.entries()) {
      if (visibleIds.has(shopId)) {
        continue;
      }

      marker.setMap(null);
    }
  }, [isDarkTheme, mappableShops, selectedShop]);

  useEffect(() => {
    const google = googleMapsRef.current;
    const map = mapRef.current;
    if (!google?.maps || !map) {
      return;
    }

    if (!mappableShops.length) {
      map.setCenter(URUGUAY_CENTER);
      map.setZoom(URUGUAY_ZOOM);
      return;
    }

    if (mappableShops.length === 1) {
      const firstShop = mappableShops[0];
      if (!firstShop) {
        return;
      }

      map.panTo({
        lat: Number(firstShop.latitude),
        lng: Number(firstShop.longitude),
      });
      map.setZoom(12);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    for (const shop of mappableShops) {
      bounds.extend({
        lat: Number(shop.latitude),
        lng: Number(shop.longitude),
      });
    }

    map.fitBounds(bounds, 72);
  }, [mappableShops]);

  useEffect(() => {
    const google = googleMapsRef.current;
    const map = mapRef.current;
    if (!google?.maps || !map) {
      return;
    }

    if (!userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }
      return;
    }

    if (!userMarkerRef.current) {
      userMarkerRef.current = new google.maps.Marker({
        map,
        position: {
          lat: userLocation.latitude,
          lng: userLocation.longitude,
        },
        icon: getUserMarkerIcon(google.maps),
        zIndex: 50,
        title: 'Tu ubicacion',
      });
      return;
    }

    userMarkerRef.current.setMap(map);
    userMarkerRef.current.setPosition({
      lat: userLocation.latitude,
      lng: userLocation.longitude,
    });
  }, [userLocation]);

  useEffect(() => {
    return () => {
      for (const marker of markersRef.current.values()) {
        marker.setMap(null);
      }

      markersRef.current.clear();
      userMarkerRef.current?.setMap(null);
    };
  }, []);

  function focusShop(shop: MarketplaceShop) {
    setSelectedShopId(shop.id);

    if (shop.latitude === null || shop.longitude === null || !mapRef.current) {
      return;
    }

    mapRef.current.panTo({
      lat: Number(shop.latitude),
      lng: Number(shop.longitude),
    });
    mapRef.current.setZoom(13);
  }

  function requestCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalizacion.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setUserLocation(nextLocation);
        setIsLocating(false);

        if (mapRef.current) {
          mapRef.current.panTo({
            lat: nextLocation.latitude,
            lng: nextLocation.longitude,
          });
          mapRef.current.setZoom(11);
        }
      },
      () => {
        setIsLocating(false);
        setLocationError('No se pudo obtener tu ubicacion actual.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(21rem,27rem)_minmax(24rem,44rem)] xl:items-start xl:justify-between">
      <div className="space-y-4 xl:max-h-[38rem] xl:overflow-y-auto xl:pr-2">
        <div className="soft-panel rounded-[1.8rem] p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="hero-eyebrow">
              <Sparkles className="h-3.5 w-3.5" />
              Exploracion estilo Airbnb
            </div>
            <div className="meta-chip" data-tone="success">
              <MapPinned className="h-3.5 w-3.5" />
              {filteredShops.length} resultados
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className="relative block flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate/60 dark:text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por barrio, ciudad o nombre"
                className="w-full pl-10"
              />
            </label>

            <button
              type="button"
              onClick={requestCurrentLocation}
              className="action-secondary inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
              disabled={isLocating}
            >
              <LocateFixed className="h-4 w-4" />
              {isLocating ? 'Buscando...' : 'Cerca de mi'}
            </button>
          </div>

          {locationError ? <p className="status-banner warning mt-3">{locationError}</p> : null}
        </div>

        {filteredShops.map(({ shop, distanceKm }) => {
          const isActive = shop.id === selectedShop?.id;

          return (
            <article
              key={shop.id}
              className="data-card cursor-pointer rounded-[1.8rem] p-4"
              data-active={String(isActive)}
              onMouseEnter={() => focusShop(shop)}
              onClick={() => focusShop(shop)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="meta-chip" data-tone={shop.isVerified ? 'success' : undefined}>
                      {shop.isVerified ? 'Verificada' : 'Activa'}
                    </span>
                    {distanceKm !== null ? <span className="meta-chip">{distanceKm.toFixed(1)} km</span> : null}
                  </div>

                  <div>
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-ink dark:text-slate-100">
                      {shop.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate/80 dark:text-slate-300">
                      {shop.description || 'Reservas, staff y operaciones desde un workspace aislado.'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/70 px-3 py-2 text-right shadow-[0_14px_24px_-22px_rgba(15,23,42,0.24)] dark:bg-white/[0.06]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                    Desde
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink dark:text-slate-100">
                    {shop.minServicePriceCents !== null ? formatCurrency(shop.minServicePriceCents) : 'Sin precio'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="surface-card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                    Ubicacion
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink dark:text-slate-100">
                    {getLocationSummary(shop)}
                  </p>
                </div>

                <div className="surface-card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
                    Reputacion
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink dark:text-slate-100">
                    <Star className="h-4 w-4 fill-current text-amber-500" />
                    {formatRating(shop.averageRating)}
                    <span className="text-xs font-medium text-slate/70 dark:text-slate-400">
                      ({shop.reviewCount || 0} resenas)
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={buildShopHref(shop.slug)}
                  className="action-secondary rounded-2xl px-4 py-2 text-sm font-semibold"
                  onClick={(event) => event.stopPropagation()}
                >
                  Ver perfil
                </Link>
                <Link
                  href={buildShopHref(shop.slug, 'book')}
                  className="action-primary rounded-2xl px-4 py-2 text-sm font-semibold"
                  onClick={(event) => event.stopPropagation()}
                >
                  Reservar
                </Link>
              </div>
            </article>
          );
        })}

        {filteredShops.length === 0 ? (
          <div className="soft-panel rounded-[1.8rem] p-5">
            <p className="text-sm text-slate/80 dark:text-slate-300">
              No encontramos barberias para ese filtro. Prueba con otra ciudad o limpia la busqueda.
            </p>
          </div>
        ) : null}
      </div>

      <div className="xl:sticky xl:top-[6.75rem] xl:self-start xl:w-full">
        <div className="marketplace-map-shell soft-panel relative h-[20rem] overflow-hidden rounded-[2rem] p-2 md:h-[26rem] xl:h-[36rem]">
          {mapError ? (
            <div className="flex h-full items-center justify-center rounded-[1.4rem] border border-white/10 bg-slate-950/20 p-6 text-center text-sm text-slate/80 dark:text-slate-300">
              {mapError}
            </div>
          ) : (
            <div ref={mapElementRef} className="h-full w-full rounded-[1.4rem]" />
          )}

          <div className="map-overlay-chip">
            <span>Marketplace Uruguay</span>
            <span>{activePins} pins</span>
          </div>

          {selectedShop ? (
            <div className="pointer-events-none absolute inset-x-5 bottom-5 z-10 xl:left-5 xl:right-auto xl:max-w-[22rem]">
              <div className="soft-panel pointer-events-auto rounded-[1.6rem] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-ink dark:text-slate-100">{selectedShop.name}</p>
                    <p className="mt-1 text-xs text-slate/75 dark:text-slate-400">
                      {getLocationSummary(selectedShop)}
                    </p>
                  </div>
                  <span className="meta-chip text-[10px]">{formatRating(selectedShop.averageRating)}</span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-sm font-semibold text-ink dark:text-slate-100">
                  <span>
                    {selectedShop.minServicePriceCents !== null
                      ? `Desde ${formatCurrency(selectedShop.minServicePriceCents)}`
                      : 'Precio por definir'}
                  </span>
                  <Link href={buildShopHref(selectedShop.slug, 'book')} className="underline underline-offset-4">
                    Reservar
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
