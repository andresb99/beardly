import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { navajaTheme, navajaUiModes, type NavajaUiModeTokens } from '@navaja/shared';

const THEME_STORAGE_KEY = '@navaja/theme-preference';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedThemeMode = 'light' | 'dark';

export type MobilePalette = NavajaUiModeTokens & {
  bg: string;
  mode: ResolvedThemeMode;
  primary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  focus: string;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
};

function resolveSystemMode(systemScheme: 'light' | 'dark' | null | undefined): ResolvedThemeMode {
  return systemScheme === 'dark' ? 'dark' : 'light';
}

function createPalette(mode: ResolvedThemeMode): MobilePalette {
  const base = navajaUiModes[mode];
  return {
    ...base,
    bg: base.background,
    mode,
    primary: mode === 'dark' ? '#f8fafc' : navajaTheme.hex.ink,
    accent: navajaTheme.hex.brass,
    success: navajaTheme.hex.success,
    warning: navajaTheme.hex.warning,
    danger: navajaTheme.hex.danger,
    focus: mode === 'dark' ? navajaTheme.hex.focusDark : navajaTheme.hex.focusLight,
    radiusSm: navajaTheme.radius.sm,
    radiusMd: navajaTheme.radius.md,
    radiusLg: navajaTheme.radius.lg,
  };
}

const initialResolvedMode = resolveSystemMode(Appearance.getColorScheme());
let mutablePalette = createPalette(initialResolvedMode);

export const palette = mutablePalette;

function syncLegacyPalette(mode: ResolvedThemeMode) {
  mutablePalette = createPalette(mode);
  Object.assign(palette, mutablePalette);
}

type ThemeContextValue = {
  preference: ThemePreference;
  mode: ResolvedThemeMode;
  colors: MobilePalette;
  isDark: boolean;
  isReady: boolean;
  setPreference: (next: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  mode: initialResolvedMode,
  colors: palette,
  isDark: initialResolvedMode === 'dark',
  isReady: false,
  setPreference: async () => {},
  toggleTheme: async () => {},
});

export function NavajaThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    void AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((storedValue) => {
        if (!active) {
          return;
        }

        if (
          storedValue === 'light' ||
          storedValue === 'dark' ||
          storedValue === 'system'
        ) {
          setPreferenceState(storedValue);
        }
      })
      .finally(() => {
        if (active) {
          setIsReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const mode = useMemo<ResolvedThemeMode>(() => {
    if (preference === 'system') {
      return resolveSystemMode(systemScheme);
    }

    return preference;
  }, [preference, systemScheme]);

  const colors = useMemo(() => createPalette(mode), [mode]);

  useEffect(() => {
    syncLegacyPalette(mode);
  }, [mode]);

  async function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  }

  async function toggleTheme() {
    const next: ThemePreference = mode === 'dark' ? 'light' : 'dark';
    await setPreference(next);
  }

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      mode,
      colors,
      isDark: mode === 'dark',
      isReady,
      setPreference,
      toggleTheme,
    }),
    [colors, isReady, mode, preference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useNavajaTheme() {
  return useContext(ThemeContext);
}
