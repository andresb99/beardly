import type { ExpoConfig } from 'expo/config';

const appJson = require('./app.json') as { expo?: ExpoConfig };

function getGoogleMapsApiKey() {
  const rawValue =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!rawValue) {
    return undefined;
  }

  const trimmedValue = rawValue.trim().replace(/^['"]|['"]$/g, '');
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

export default (): ExpoConfig => {
  const baseConfig = appJson.expo ?? {};
  const googleMapsApiKey = getGoogleMapsApiKey();

  return {
    ...baseConfig,
    ios: {
      ...baseConfig.ios,
      config: {
        ...(baseConfig.ios?.config as Record<string, unknown> | undefined),
        ...(googleMapsApiKey ? { googleMapsApiKey } : {}),
      },
    },
    android: {
      ...baseConfig.android,
      config: {
        ...(baseConfig.android?.config as Record<string, unknown> | undefined),
        googleMaps: {
          ...(
            (baseConfig.android?.config as { googleMaps?: Record<string, unknown> } | undefined)
              ?.googleMaps
          ),
          ...(googleMapsApiKey ? { apiKey: googleMapsApiKey } : {}),
        },
      },
    },
  };
};
