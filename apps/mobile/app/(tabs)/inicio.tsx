import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import {
  ActionButton,
  Card,
  Chip,
  ErrorText,
  Field,
  HeroPanel,
  MutedText,
  Screen,
  StatTile,
  SurfaceCard,
} from '../../components/ui/primitives';
import { AppRole, getAuthContext } from '../../lib/auth';
import { envValidation } from '../../lib/env';
import { formatCurrency } from '../../lib/format';
import {
  type GeoPoint,
  getDistanceKm,
  getMapTheme,
  getPointRegion,
  getShopRegion,
  openDirectionsToShop,
  openShopInGoogleMaps,
  requestCurrentDeviceLocation,
  URUGUAY_REGION,
} from '../../lib/maps';
import {
  formatMarketplaceLocation,
  listMarketplaceShops,
  resolvePreferredMarketplaceShopId,
  saveMarketplaceShopId,
  type MarketplaceShop,
} from '../../lib/marketplace';
import { useNavajaTheme } from '../../lib/theme';

const roleLabel: Record<AppRole, string> = {
  guest: 'Invitado',
  user: 'Cliente',
  staff: 'Staff',
  admin: 'Admin',
};

const roleTone: Record<AppRole, 'neutral' | 'success' | 'warning' | 'danger'> = {
  guest: 'neutral',
  user: 'neutral',
  staff: 'warning',
  admin: 'success',
};

export default function InicioScreen() {
  const { colors } = useNavajaTheme();
  const mapRef = useRef<MapView | null>(null);
  const [shops, setShops] = useState<MarketplaceShop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [role, setRole] = useState<AppRole>('guest');
  const [displayName, setDisplayName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void (async () => {
        setLoading(true);
        setError(null);

        const [ctx, marketplaceShops] = await Promise.all([getAuthContext(), listMarketplaceShops()]);

        if (!active) {
          return;
        }

        setRole(ctx.role);
        setDisplayName(ctx.staffName || ctx.email || '');
        setShops(marketplaceShops);

        const preferredShopId = await resolvePreferredMarketplaceShopId(marketplaceShops);
        if (!active) {
          return;
        }

        setSelectedShopId(preferredShopId);
        setLoading(false);
      })().catch(() => {
        if (!active) {
          return;
        }

        setLoading(false);
        setError('No se pudo cargar el marketplace.');
      });

      return () => {
        active = false;
      };
    }, []),
  );

  const filteredShops = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const searchFiltered = normalizedQuery
      ? shops.filter((shop) =>
          [shop.name, shop.description, shop.city, shop.region, shop.locationLabel]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
        )
      : shops;

    const withDistance = searchFiltered.map((shop) => {
      const distanceKm =
        userLocation && shop.latitude != null && shop.longitude != null
          ? getDistanceKm(userLocation.latitude, userLocation.longitude, shop.latitude, shop.longitude)
          : null;

      return { shop, distanceKm };
    });

    return withDistance.sort((left, right) => {
      if (left.distanceKm != null && right.distanceKm != null) {
        return left.distanceKm - right.distanceKm;
      }

      if (left.distanceKm != null) {
        return -1;
      }

      if (right.distanceKm != null) {
        return 1;
      }

      const leftScore = (left.shop.averageRating || 0) * 100 + left.shop.reviewCount;
      const rightScore = (right.shop.averageRating || 0) * 100 + right.shop.reviewCount;
      return rightScore - leftScore;
    });
  }, [searchQuery, shops, userLocation]);

  const visibleShops = useMemo(() => filteredShops.map((entry) => entry.shop), [filteredShops]);
  const selectedShop = useMemo(
    () =>
      visibleShops.find((shop) => shop.id === selectedShopId) ||
      shops.find((shop) => shop.id === selectedShopId) ||
      visibleShops[0] ||
      shops[0] ||
      null,
    [selectedShopId, shops, visibleShops],
  );
  const mappableShops = useMemo(
    () => visibleShops.filter((shop) => shop.latitude != null && shop.longitude != null),
    [visibleShops],
  );
  const totalServices = useMemo(() => shops.reduce((sum, shop) => sum + shop.activeServiceCount, 0), [shops]);
  const ratedShops = useMemo(() => shops.filter((shop) => shop.averageRating != null), [shops]);
  const averageRating = useMemo(() => {
    if (!ratedShops.length) {
      return null;
    }

    const total = ratedShops.reduce((sum, shop) => sum + Number(shop.averageRating || 0), 0);
    return total / ratedShops.length;
  }, [ratedShops]);
  const initialMapRegion = useMemo(() => {
    if (selectedShop?.latitude != null && selectedShop.longitude != null) {
      return getShopRegion(selectedShop);
    }

    if (userLocation) {
      return getPointRegion(userLocation);
    }

    return URUGUAY_REGION;
  }, [selectedShop, userLocation]);
  const platformMapThemeProps = useMemo(
    () => (Platform.OS === 'ios' ? { userInterfaceStyle: colors.mode as 'light' | 'dark' } : {}),
    [colors.mode],
  );

  useEffect(() => {
    if (!visibleShops.length) {
      return;
    }

    const firstVisibleShop = visibleShops[0];
    if (!firstVisibleShop) {
      return;
    }

    const hasActiveShop = visibleShops.some((shop) => shop.id === selectedShopId);
    if (!hasActiveShop) {
      setSelectedShopId(firstVisibleShop.id);
    }
  }, [selectedShopId, visibleShops]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (selectedShop?.latitude != null && selectedShop.longitude != null) {
      mapRef.current.animateToRegion(getShopRegion(selectedShop), 300);
      return;
    }

    if (userLocation) {
      mapRef.current.animateToRegion(getPointRegion(userLocation), 300);
    }
  }, [selectedShop, userLocation]);

  async function selectShop(shopId: string) {
    setSelectedShopId(shopId);
    await saveMarketplaceShopId(shopId);
  }

  async function locateNearbyShops() {
    setLocating(true);
    setLocationError(null);

    try {
      const result = await requestCurrentDeviceLocation();

      if (result.error || !result.coords) {
        setLocationError(result.error || 'No se pudo obtener tu ubicacion actual.');
        return;
      }

      setUserLocation(result.coords);
    } catch {
      setLocationError('No se pudo obtener tu ubicacion actual.');
    } finally {
      setLocating(false);
    }
  }

  return (
    <Screen
      eyebrow="Marketplace"
      title="Explora barberias con el mismo mapa y contexto visual de la web"
      subtitle="Busqueda, cercania, mapa y acciones hacia Google Maps viven ahora dentro de la experiencia nativa."
    >
      {!envValidation.isValid ? (
        <Card
          style={{
            borderColor: 'rgba(245, 158, 11, 0.28)',
            backgroundColor:
              colors.mode === 'dark' ? 'rgba(120, 53, 15, 0.22)' : 'rgba(255, 251, 235, 0.92)',
          }}
        >
          <Text style={[styles.warningTitle, { color: colors.mode === 'dark' ? '#fde68a' : '#92400e' }]}>
            Configura apps/mobile/.env
          </Text>
          <Text style={[styles.warningText, { color: colors.mode === 'dark' ? '#fde68a' : '#78350f' }]}>
            Faltan variables base: {envValidation.invalidKeys.join(', ')}.
          </Text>
        </Card>
      ) : null}

      <HeroPanel
        eyebrow="Tu contexto activo"
        title={selectedShop ? selectedShop.name : 'Selecciona una barberia'}
        description={
          selectedShop
            ? selectedShop.description || formatMarketplaceLocation(selectedShop)
            : 'Elige una barberia para mantener el mismo contexto en toda la app.'
        }
      >
        <View style={styles.metaRow}>
          <Chip label={roleLabel[role]} tone={roleTone[role]} />
          {displayName ? <Text style={[styles.metaText, { color: colors.textMuted }]}>{displayName}</Text> : null}
        </View>

        <View style={styles.statsRow}>
          <StatTile label="Barberias" value={String(shops.length)} />
          <StatTile label="Servicios" value={String(totalServices)} />
          <StatTile label="Rating" value={averageRating ? averageRating.toFixed(1) : 'Sin data'} />
        </View>

        <View style={styles.quickGrid}>
          <QuickAction title="Reservas" subtitle="Agenda en 4 pasos" onPress={() => router.push('/(tabs)/reservas')} />
          <QuickAction title="Cursos" subtitle="Catalogo global" onPress={() => router.push('/(tabs)/cursos')} />
          <QuickAction title="Modelos" subtitle="Convocatorias" onPress={() => router.push('/(tabs)/modelos')} />
          <QuickAction title="Empleo" subtitle="CV por shop o red" onPress={() => router.push('/(tabs)/empleo')} />
        </View>
      </HeroPanel>

      <ErrorText message={error} />

      <Card elevated>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mapa marketplace</Text>
        <Text style={[styles.sectionCopy, { color: colors.textMuted }]}>
          Replica la vista mobile de la web: puedes filtrar, ubicarte, tocar una barberia y saltar directo a Google Maps.
        </Text>

        <Field
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por barrio, ciudad o nombre"
          autoCapitalize="none"
        />

        <View style={styles.inlineButtons}>
          <ActionButton
            label={locating ? 'Buscando...' : 'Cerca de mi'}
            variant="secondary"
            onPress={locateNearbyShops}
            disabled={locating}
            style={styles.flexButton}
          />
          <ActionButton
            label="Abrir Google Maps"
            variant="secondary"
            onPress={() => {
              if (selectedShop) {
                void openShopInGoogleMaps(selectedShop);
              }
            }}
            disabled={!selectedShop}
            style={styles.flexButton}
          />
        </View>

        {locationError ? <Text style={[styles.locationError, { color: colors.danger }]}>{locationError}</Text> : null}

        <View
          style={[
            styles.mapShell,
            {
              borderColor: colors.border,
              backgroundColor: colors.panelStrong,
            },
          ]}
        >
          {mappableShops.length ? (
            <>
              <MapView
                key={`market-map-${colors.mode}`}
                ref={mapRef}
                style={styles.map}
                initialRegion={initialMapRegion}
                customMapStyle={getMapTheme(colors.mode)}
                {...platformMapThemeProps}
                showsCompass={false}
                toolbarEnabled={false}
              >
                {mappableShops.map((shop) => {
                  const isActive = shop.id === selectedShop?.id;

                  return (
                    <Marker
                      key={shop.id}
                      coordinate={{
                        latitude: Number(shop.latitude),
                        longitude: Number(shop.longitude),
                      }}
                      title={shop.name}
                      description={formatMarketplaceLocation(shop)}
                      pinColor={
                        isActive
                          ? '#ef4444'
                          : colors.mode === 'dark'
                            ? '#e2e8f0'
                            : '#1e293b'
                      }
                      onPress={() => {
                        void selectShop(shop.id);
                      }}
                    />
                  );
                })}
                {userLocation ? (
                  <Marker
                    coordinate={{
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                    }}
                    title="Tu ubicacion"
                    pinColor="#38bdf8"
                  />
                ) : null}
              </MapView>

              <View
                style={[
                  styles.mapChip,
                  {
                    backgroundColor: colors.panelStrong,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.mapChipText, { color: colors.textMuted }]}>
                  Marketplace Uruguay · {mappableShops.length} pins
                </Text>
              </View>

              {selectedShop ? (
                <SurfaceCard active style={styles.mapOverlay}>
                  <Text style={[styles.mapOverlayTitle, { color: colors.text }]}>{selectedShop.name}</Text>
                  <Text style={[styles.mapOverlayMeta, { color: colors.textMuted }]}>
                    {formatMarketplaceLocation(selectedShop)}
                  </Text>
                  <View style={styles.mapOverlayActions}>
                    <ActionButton
                      label="Abrir mapa"
                      variant="secondary"
                      onPress={() => {
                        void openShopInGoogleMaps(selectedShop);
                      }}
                      style={styles.overlayButton}
                    />
                    <ActionButton
                      label="Como llegar"
                      onPress={() => {
                        void openDirectionsToShop(selectedShop, userLocation);
                      }}
                      style={styles.overlayButton}
                    />
                  </View>
                </SurfaceCard>
              ) : null}
            </>
          ) : (
            <View style={styles.mapEmpty}>
              <MutedText>No hay barberias con coordenadas para ese filtro.</MutedText>
            </View>
          )}
        </View>
      </Card>

      <Card elevated>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Barberias activas</Text>
        <Text style={[styles.sectionCopy, { color: colors.textMuted }]}>
          La seleccion que hagas aqui se usa como preferencia por defecto en los otros tabs.
        </Text>

        {loading ? <MutedText>Cargando barberias...</MutedText> : null}
        {!loading && !filteredShops.length ? <MutedText>No hay resultados para ese filtro.</MutedText> : null}

        <View style={styles.shopList}>
          {filteredShops.map(({ shop, distanceKm }) => {
            const active = shop.id === (selectedShop?.id || '');

            return (
              <SurfaceCard
                key={shop.id}
                active={active}
                onPress={() => {
                  void selectShop(shop.id);
                }}
                style={styles.shopCard}
              >
                <View style={styles.shopHeader}>
                  <View style={styles.shopTitleBlock}>
                    <Text style={[styles.shopTitle, { color: colors.text }]}>{shop.name}</Text>
                    <Text style={[styles.shopMeta, { color: colors.textMuted }]}>
                      {formatMarketplaceLocation(shop)}
                    </Text>
                  </View>
                  <Chip label={active ? 'Activa' : 'Seleccionar'} tone={active ? 'success' : 'neutral'} />
                </View>

                <Text style={[styles.shopDescription, { color: colors.textSoft }]} numberOfLines={3}>
                  {shop.description || 'Marketplace multi-tenant con perfil publico, mapa y reserva.'}
                </Text>

                <View style={styles.shopFacts}>
                  <Text style={[styles.shopFact, { color: colors.text }]}>Servicios: {shop.activeServiceCount}</Text>
                  <Text style={[styles.shopFact, { color: colors.text }]}>
                    Desde: {shop.minServicePriceCents != null ? formatCurrency(shop.minServicePriceCents) : 'Sin precios'}
                  </Text>
                  <Text style={[styles.shopFact, { color: colors.text }]}>
                    Rating: {shop.averageRating ? shop.averageRating.toFixed(1) : 'Sin resenas'}
                  </Text>
                  {distanceKm != null ? (
                    <Text style={[styles.shopFact, { color: colors.text }]}>Distancia: {distanceKm.toFixed(1)} km</Text>
                  ) : null}
                </View>
              </SurfaceCard>
            );
          })}
        </View>
      </Card>
    </Screen>
  );
}

function QuickAction({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors } = useNavajaTheme();

  return (
    <SurfaceCard
      style={styles.quickAction}
      onPress={onPress}
    >
      <Text style={[styles.quickTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.quickSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  warningTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  warningText: {
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickGrid: {
    gap: 8,
  },
  quickAction: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  quickSubtitle: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sectionCopy: {
    fontSize: 13,
    lineHeight: 18,
  },
  inlineButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  flexButton: {
    flex: 1,
  },
  locationError: {
    fontSize: 12,
  },
  mapShell: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 24,
    minHeight: 320,
  },
  map: {
    height: 320,
    width: '100%',
  },
  mapChip: {
    position: 'absolute',
    left: 12,
    top: 12,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  mapChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  mapOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  mapOverlayTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  mapOverlayMeta: {
    fontSize: 12,
  },
  mapOverlayActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  overlayButton: {
    flex: 1,
    minHeight: 42,
  },
  mapEmpty: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  shopList: {
    gap: 10,
  },
  shopCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 13,
    gap: 8,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  shopTitleBlock: {
    flex: 1,
    gap: 2,
  },
  shopTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  shopMeta: {
    fontSize: 12,
  },
  shopDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  shopFacts: {
    gap: 3,
  },
  shopFact: {
    fontSize: 12,
    fontWeight: '600',
  },
});
