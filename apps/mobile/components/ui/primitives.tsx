import { PropsWithChildren, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavajaTheme } from '../../lib/theme';

function getSurfaceGradient(colors: ReturnType<typeof useNavajaTheme>['colors']) {
  return [colors.surfaceGradientStart, colors.surfaceGradientEnd] as const;
}

function getHeroGradient(colors: ReturnType<typeof useNavajaTheme>['colors']) {
  return [colors.heroGradientStart, colors.heroGradientEnd] as const;
}

function getSecondaryGradient(colors: ReturnType<typeof useNavajaTheme>['colors']) {
  return [colors.secondaryGradientStart, colors.secondaryGradientEnd] as const;
}

function getActiveGradient(colors: ReturnType<typeof useNavajaTheme>['colors']) {
  return [colors.activeGradientStart, colors.activeGradientEnd] as const;
}

function getPrimaryGradient(colors: ReturnType<typeof useNavajaTheme>['colors']) {
  return [colors.primaryGradientStart, colors.primaryGradientEnd] as const;
}

function getGlassTint(colors: ReturnType<typeof useNavajaTheme>['colors']) {
  return colors.mode === 'dark'
    ? (['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)'] as const)
    : (['rgba(255,255,255,0.24)', 'rgba(255,255,255,0.08)'] as const);
}

function getSheenGradient(
  colors: ReturnType<typeof useNavajaTheme>['colors'],
  intensity: 'soft' | 'strong' = 'soft',
) {
  if (colors.mode === 'dark') {
    return intensity === 'strong'
      ? ([
          'rgba(255,255,255,0.02)',
          'rgba(255,255,255,0.24)',
          'rgba(255,255,255,0.08)',
          'rgba(255,255,255,0)',
        ] as const)
      : ([
          'rgba(255,255,255,0.01)',
          'rgba(255,255,255,0.16)',
          'rgba(255,255,255,0.05)',
          'rgba(255,255,255,0)',
        ] as const);
  }

  return intensity === 'strong'
    ? ([
        'rgba(255,255,255,0.02)',
        'rgba(255,255,255,0.62)',
        'rgba(255,255,255,0.18)',
        'rgba(255,255,255,0)',
      ] as const)
    : ([
        'rgba(255,255,255,0.02)',
        'rgba(255,255,255,0.34)',
        'rgba(255,255,255,0.1)',
        'rgba(255,255,255,0)',
      ] as const);
}

function getCoolFade(colors: ReturnType<typeof useNavajaTheme>['colors']) {
  return colors.mode === 'dark'
    ? (['rgba(56,189,248,0.12)', 'rgba(56,189,248,0.04)', 'rgba(56,189,248,0)'] as const)
    : (['rgba(14,165,233,0.14)', 'rgba(14,165,233,0.05)', 'rgba(14,165,233,0)'] as const);
}

function getWarmFade(colors: ReturnType<typeof useNavajaTheme>['colors']) {
  return colors.mode === 'dark'
    ? (['rgba(236,72,153,0.12)', 'rgba(236,72,153,0.04)', 'rgba(236,72,153,0)'] as const)
    : (['rgba(244,63,94,0.12)', 'rgba(244,63,94,0.04)', 'rgba(244,63,94,0)'] as const);
}

export function Screen({
  eyebrow,
  title,
  subtitle,
  children,
  contentStyle,
  showThemeToggle = true,
}: PropsWithChildren<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  contentStyle?: StyleProp<ViewStyle>;
  showThemeToggle?: boolean;
}>) {
  const { colors } = useNavajaTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, lift]);

  return (
    <ScrollView
      style={[baseStyles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={baseStyles.scrollViewport}
      showsVerticalScrollIndicator={false}
    >
      <View pointerEvents="none" style={baseStyles.backgroundLayer}>
        <LinearGradient
          colors={[colors.background, colors.backgroundBase]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={getCoolFade(colors)}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.18, y: 0.82 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={getWarmFade(colors)}
          start={{ x: 0, y: 1 }}
          end={{ x: 0.84, y: 0.18 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={getSheenGradient(colors)}
          start={{ x: 0.06, y: 0 }}
          end={{ x: 0.86, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <Animated.View
        style={[
          baseStyles.screenContent,
          contentStyle,
          {
            opacity: fade,
            transform: [{ translateY: lift }],
          },
        ]}
      >
        <View
          style={[
            baseStyles.screenHeaderShell,
            {
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <LinearGradient
            colors={getHeroGradient(colors)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={getCoolFade(colors)}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.24, y: 0.72 }}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={getWarmFade(colors)}
            start={{ x: 0.08, y: 1 }}
            end={{ x: 0.82, y: 0.28 }}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={getSheenGradient(colors, 'strong')}
            start={{ x: 0.08, y: 0 }}
            end={{ x: 0.86, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={baseStyles.screenHeaderContent}>
            <View style={baseStyles.screenHeaderRow}>
              <View style={baseStyles.screenTitleBlock}>
                {eyebrow ? (
                  <Text
                    style={[
                      baseStyles.screenEyebrow,
                      {
                        backgroundColor: colors.pillMuted,
                        borderColor: colors.border,
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    {eyebrow}
                  </Text>
                ) : null}
                <Text style={[baseStyles.screenTitle, { color: colors.text }]}>{title}</Text>
              </View>
              {showThemeToggle ? <ThemeToggle /> : null}
            </View>

            {subtitle ? (
              <Text style={[baseStyles.screenSubtitle, { color: colors.textMuted }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {children}
      </Animated.View>
    </ScrollView>
  );
}

export function Card({
  children,
  style,
  elevated = false,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; elevated?: boolean }>) {
  const { colors } = useNavajaTheme();

  return (
    <View
      style={[
        baseStyles.card,
        {
          borderColor: colors.border,
          shadowColor: colors.shadow,
          backgroundColor: elevated ? colors.panelRaised : colors.panel,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={getSurfaceGradient(colors)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={getCoolFade(colors)}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.28, y: 0.76 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={getWarmFade(colors)}
        start={{ x: 0.04, y: 1 }}
        end={{ x: 0.82, y: 0.34 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={getSheenGradient(colors)}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.82, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0)', colors.borderActive, 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={baseStyles.cardBeam}
      />
      <View style={baseStyles.cardContent}>{children}</View>
    </View>
  );
}

export function SurfaceCard({
  children,
  style,
  contentStyle,
  active = false,
  onPress,
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  active?: boolean;
  onPress?: () => void;
}>) {
  const { colors } = useNavajaTheme();
  const overlayColors = active ? getActiveGradient(colors) : getGlassTint(colors);
  const borderColor = active ? colors.borderActive : colors.border;
  const beamAccent = active ? colors.borderActive : 'rgba(56,189,248,0.16)';

  const inner = (
    <>
      <LinearGradient
        colors={getSurfaceGradient(colors)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={overlayColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={getCoolFade(colors)}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.24, y: 0.72 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={getWarmFade(colors)}
        start={{ x: 0.06, y: 1 }}
        end={{ x: 0.82, y: 0.3 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={getSheenGradient(colors, active ? 'strong' : 'soft')}
        start={{ x: 0.06, y: 0 }}
        end={{ x: 0.84, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0)', beamAccent, 'rgba(244,63,94,0.18)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={baseStyles.surfaceBeam}
      />
      <View style={[baseStyles.surfaceContent, contentStyle]}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          baseStyles.surfaceCard,
          {
            borderColor,
            shadowColor: colors.shadow,
          },
          style,
        ]}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        baseStyles.surfaceCard,
        {
          borderColor,
          shadowColor: colors.shadow,
        },
        style,
      ]}
    >
      {inner}
    </View>
  );
}

export function HeroPanel({
  eyebrow,
  title,
  description,
  children,
  style,
}: PropsWithChildren<{
  eyebrow?: string;
  title: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
}>) {
  const { colors } = useNavajaTheme();

  return (
    <View
      style={[
        baseStyles.heroPanel,
        {
          borderColor: colors.heroBorder,
          shadowColor: colors.shadow,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={getHeroGradient(colors)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={getCoolFade(colors)}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.22, y: 0.76 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={getWarmFade(colors)}
        start={{ x: 0.04, y: 1 }}
        end={{ x: 0.88, y: 0.24 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={getSheenGradient(colors, 'strong')}
        start={{ x: 0.06, y: 0 }}
        end={{ x: 0.86, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={baseStyles.heroContent}>
        {eyebrow ? (
          <Text
            style={[
              baseStyles.heroEyebrow,
              {
                backgroundColor: colors.pillMuted,
                borderColor: colors.border,
                color: colors.textMuted,
              },
            ]}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text style={[baseStyles.heroTitle, { color: colors.text }]}>{title}</Text>
        {description ? (
          <Text style={[baseStyles.heroDescription, { color: colors.textMuted }]}>
            {description}
          </Text>
        ) : null}
        {children}
      </View>
    </View>
  );
}

export function StatTile({
  label,
  value,
  style,
}: {
  label: string;
  value: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useNavajaTheme();

  return (
    <View
      style={[
        baseStyles.statTile,
        {
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={getSurfaceGradient(colors)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={getGlassTint(colors)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={getSheenGradient(colors)}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.84, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0)', colors.borderActive, 'rgba(244,63,94,0.18)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={baseStyles.statBeam}
      />
      <Text style={[baseStyles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[baseStyles.statValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function PillToggle({
  label,
  active,
  onPress,
  compact = false,
}: {
  label: string;
  active: boolean;
  onPress?: () => void;
  compact?: boolean;
}) {
  const { colors } = useNavajaTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        baseStyles.pillToggle,
        compact ? baseStyles.pillToggleCompact : null,
        {
          borderColor: active ? colors.borderActive : colors.borderMuted,
          backgroundColor: 'transparent',
        },
      ]}
    >
      <LinearGradient
        colors={active ? getActiveGradient(colors) : getSecondaryGradient(colors)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Text
        style={[
          baseStyles.pillToggleText,
          compact ? baseStyles.pillToggleTextCompact : null,
          { color: active ? colors.pillTextActive : colors.pillText },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ThemeToggle() {
  const { mode, toggleTheme, colors } = useNavajaTheme();
  const isDark = mode === 'dark';

  return (
    <Pressable
      onPress={() => {
        void toggleTheme();
      }}
      style={[
        baseStyles.themeToggle,
        {
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
    >
      <LinearGradient
        colors={getSecondaryGradient(colors)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={18}
        color={colors.text}
      />
    </Pressable>
  );
}

export function Label({ children }: PropsWithChildren) {
  const { colors } = useNavajaTheme();
  return <Text style={[baseStyles.label, { color: colors.text }]}>{children}</Text>;
}

export function Field(props: TextInputProps) {
  const { colors } = useNavajaTheme();

  return (
    <TextInput
      {...props}
      style={[
        baseStyles.field,
        {
          borderColor: colors.inputBorder,
          backgroundColor: colors.input,
          color: colors.text,
        },
        props.style,
      ]}
      placeholderTextColor={colors.textMuted}
    />
  );
}

export function MultilineField(props: TextInputProps) {
  const { colors } = useNavajaTheme();

  return (
    <TextInput
      {...props}
      multiline
      textAlignVertical="top"
      style={[
        baseStyles.field,
        baseStyles.multilineField,
        {
          borderColor: colors.inputBorder,
          backgroundColor: colors.input,
          color: colors.text,
        },
        props.style,
      ]}
      placeholderTextColor={colors.textMuted}
    />
  );
}

export function ActionButton({
  label,
  onPress,
  disabled,
  variant = 'primary',
  loading = false,
  style,
  textStyle,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const { colors, mode } = useNavajaTheme();
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';

  const borderColor = isSecondary
    ? colors.border
    : isDanger
      ? 'rgba(153, 27, 27, 0.24)'
      : colors.borderMuted;
  const textColor = isSecondary
    ? colors.text
    : isDanger
      ? '#ffffff'
      : mode === 'dark'
        ? '#0f172a'
        : '#ffffff';
  const spinnerColor = isSecondary ? colors.text : textColor;

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        baseStyles.button,
        {
          borderColor,
          shadowColor: colors.shadow,
        },
        disabled ? baseStyles.buttonDisabled : null,
        style,
      ]}
    >
      {isDanger ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: colors.danger,
            },
          ]}
        />
      ) : (
        <LinearGradient
          colors={isSecondary ? getSecondaryGradient(colors) : getPrimaryGradient(colors)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <Text style={[baseStyles.buttonText, { color: textColor }, textStyle]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  tone = 'neutral',
  style,
  textStyle,
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const { colors, mode } = useNavajaTheme();

  const toneStyles =
    tone === 'success'
      ? {
          backgroundColor: mode === 'dark' ? 'rgba(6, 78, 59, 0.26)' : 'rgba(209, 250, 229, 0.76)',
          color: mode === 'dark' ? '#a7f3d0' : '#065f46',
        }
      : tone === 'warning'
        ? {
            backgroundColor: mode === 'dark' ? 'rgba(120, 53, 15, 0.26)' : 'rgba(254, 243, 199, 0.82)',
            color: mode === 'dark' ? '#fde68a' : '#92400e',
          }
        : tone === 'danger'
          ? {
              backgroundColor: mode === 'dark' ? 'rgba(127, 29, 29, 0.25)' : 'rgba(254, 226, 226, 0.82)',
              color: mode === 'dark' ? '#fecaca' : '#991b1b',
            }
          : {
              backgroundColor: colors.pillMuted,
              color: colors.text,
            };

  return (
    <View
      style={[
        baseStyles.chip,
        {
          backgroundColor: toneStyles.backgroundColor,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Text style={[baseStyles.chipText, { color: toneStyles.color }, textStyle]}>{label}</Text>
    </View>
  );
}

export function ErrorText({ message }: { message: string | null }) {
  const { colors } = useNavajaTheme();
  if (!message) {
    return null;
  }

  return (
    <Text
      style={[
        baseStyles.errorText,
        {
          color: colors.mode === 'dark' ? '#fecaca' : '#b91c1c',
        },
      ]}
    >
      {message}
    </Text>
  );
}

export function MutedText({ children }: PropsWithChildren) {
  const { colors } = useNavajaTheme();
  return <Text style={[baseStyles.mutedText, { color: colors.textMuted }]}>{children}</Text>;
}

const baseStyles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollViewport: {
    paddingBottom: 10,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  screenContent: {
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 126,
    gap: 16,
  },
  backdropGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  backdropGlowPrimary: {
    width: 190,
    height: 190,
    top: -62,
    left: -54,
    opacity: 0.5,
  },
  backdropGlowSecondary: {
    width: 152,
    height: 152,
    top: 120,
    right: -54,
    opacity: 0.42,
  },
  backdropGlowWarm: {
    width: 176,
    height: 176,
    bottom: 34,
    left: 32,
    opacity: 0.36,
  },
  screenHeaderShell: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 4,
  },
  screenHeaderGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  screenHeaderGlowPrimary: {
    width: 124,
    height: 124,
    top: -28,
    right: -18,
    opacity: 0.34,
  },
  screenHeaderGlowSecondary: {
    width: 118,
    height: 118,
    bottom: -28,
    left: -10,
    opacity: 0.28,
  },
  screenHeaderContent: {
    gap: 8,
  },
  screenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  screenTitleBlock: {
    flex: 1,
    gap: 6,
  },
  screenEyebrow: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 6,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    overflow: 'hidden',
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.45,
  },
  screenSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 22,
    elevation: 3,
  },
  cardHalo: {
    position: 'absolute',
    width: 104,
    height: 104,
    top: -28,
    right: -14,
    borderRadius: 999,
    opacity: 0.26,
  },
  cardRose: {
    position: 'absolute',
    width: 88,
    height: 88,
    bottom: -18,
    left: -12,
    borderRadius: 999,
    opacity: 0.22,
  },
  cardBeam: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 0,
    height: 1,
  },
  cardContent: {
    gap: 10,
  },
  surfaceCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 2,
  },
  surfaceHalo: {
    position: 'absolute',
    width: 74,
    height: 74,
    top: -18,
    right: -10,
    borderRadius: 999,
    opacity: 0.22,
  },
  surfaceRose: {
    position: 'absolute',
    width: 66,
    height: 66,
    bottom: -16,
    left: -10,
    borderRadius: 999,
    opacity: 0.18,
  },
  surfaceBeam: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 0,
    height: 1,
  },
  surfaceContent: {
    gap: 4,
  },
  heroPanel: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 32,
    borderWidth: 1,
    padding: 18,
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 26,
    elevation: 4,
  },
  heroGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  heroGlowPrimary: {
    width: 132,
    height: 132,
    top: -28,
    right: -16,
    opacity: 0.28,
  },
  heroGlowSecondary: {
    width: 112,
    height: 112,
    bottom: -24,
    left: -14,
    opacity: 0.22,
  },
  heroContent: {
    gap: 9,
  },
  heroEyebrow: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 6,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    overflow: 'hidden',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  statTile: {
    position: 'relative',
    overflow: 'hidden',
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 11,
    gap: 5,
  },
  statBeam: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 9,
    height: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  pillToggle: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillToggleCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillToggleTextCompact: {
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  themeToggle: {
    position: 'relative',
    overflow: 'hidden',
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  field: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  multilineField: {
    minHeight: 100,
  },
  button: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
  mutedText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
