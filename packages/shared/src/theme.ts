/**
 * Palette tokens shared by both Expo apps.
 *
 * Pure data — no React Native imports — so this stays safe to pull into the
 * Next dashboard or a test. Each app wraps it in its own `ThemeProvider`
 * because that needs `useColorScheme` from React Native.
 *
 * Colours are derived from `logo/Yahadeen.png`: a deep blue wordmark with a
 * green cross. The green reads at only 2.6:1 on white, so it is used for fills
 * and never for text — `accentText` is the darkened variant for that.
 */

import { BRAND } from './brand';
import type { StatusTone } from './enums';

/**
 * Structural shape of a palette. Written out rather than inferred because `BRAND`
 * is `as const`: inferring from `lightColors` would pin `primary` to the literal
 * `'#0036B6'` and make the dark palette a type error.
 */
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceStrong: string;
  text: string;
  mutedText: string;
  faintText: string;
  border: string;

  primary: string;
  primarySoft: string;
  primaryDeep: string;
  primaryBright: string;
  onPrimary: string;

  accent: string;
  accentSoft: string;
  accentDeep: string;
  accentText: string;
  onAccent: string;

  glass: string;
  glassStrong: string;
  glassBorder: string;
  glassTint: string;
  blurTint: 'light' | 'dark';

  gradientFrom: string;
  gradientTo: string;

  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;
  onStatus: string;

  shadow: string;
  overlay: string;
  skeleton: string;
}

export const lightColors: ThemeColors = {
  background: '#F5F8FF',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF3FF',
  surfaceStrong: '#E1E9FE',
  text: '#0B1533',
  mutedText: '#5A6885',
  faintText: '#8B98B5',
  border: '#DCE4F5',

  /* brand blue — safe for text (8.6:1 on white) */
  primary: BRAND.blue,
  primarySoft: '#E4EBFF',
  primaryDeep: BRAND.blueDeep,
  primaryBright: BRAND.blueBright,
  onPrimary: '#FFFFFF',

  /* brand green — fills, badges and progress only */
  accent: BRAND.green,
  accentSoft: '#E2FBE9',
  accentDeep: BRAND.greenDeep,
  accentText: BRAND.greenText,
  onAccent: '#FFFFFF',

  /* glassmorphism: translucent fills layered over a blur */
  glass: 'rgba(255,255,255,0.55)',
  glassStrong: 'rgba(255,255,255,0.74)',
  glassBorder: 'rgba(255,255,255,0.70)',
  glassTint: 'rgba(0,54,182,0.07)',
  blurTint: 'light',

  gradientFrom: '#0040D0',
  gradientTo: BRAND.green,

  danger: '#B42318',
  dangerSoft: '#FEE4E2',
  success: '#067647',
  successSoft: '#DCFAE6',
  warning: '#B54708',
  warningSoft: '#FEF0C7',
  info: BRAND.blueDeep,
  infoSoft: '#E4EBFF',
  onStatus: '#FFFFFF',

  shadow: '#0B1533',
  overlay: 'rgba(11,21,51,0.45)',
  skeleton: '#E6ECF8',
};

export const darkColors: ThemeColors = {
  background: '#070B18',
  surface: '#101729',
  surfaceAlt: '#16203A',
  surfaceStrong: '#1D2947',
  text: '#E8EEFF',
  mutedText: '#95A3C4',
  faintText: '#6C7B9E',
  border: '#24314F',

  /* #0036B6 is too dark to read on near-black, so the dark theme lifts it */
  primary: '#4C86FF',
  primarySoft: '#15224A',
  primaryDeep: '#82A9FF',
  primaryBright: '#6E9DFF',
  onPrimary: '#04102B',

  accent: '#2FD65A',
  accentSoft: '#0F2E1C',
  accentDeep: BRAND.greenBright,
  accentText: '#5FE384',
  onAccent: '#04170B',

  glass: 'rgba(16,23,41,0.55)',
  glassStrong: 'rgba(16,23,41,0.74)',
  glassBorder: 'rgba(140,170,220,0.14)',
  glassTint: 'rgba(76,134,255,0.10)',
  blurTint: 'dark',

  gradientFrom: '#0B4BE0',
  gradientTo: '#17C94C',

  danger: '#F97066',
  dangerSoft: '#4A1512',
  success: '#32D583',
  successSoft: '#0C2E1D',
  warning: '#FBBF24',
  warningSoft: '#40300A',
  info: '#82A9FF',
  infoSoft: '#15224A',
  onStatus: '#04102B',

  shadow: '#000000',
  overlay: 'rgba(3,6,14,0.62)',
  skeleton: '#1B2540',
};

/** Resolves a `StatusTone` from `enums.ts` to a foreground/background pair. */
export function toneColors(
  colors: ThemeColors,
  tone: StatusTone,
): { fg: string; bg: string } {
  switch (tone) {
    case 'success':
      return { fg: colors.success, bg: colors.successSoft };
    case 'warning':
      return { fg: colors.warning, bg: colors.warningSoft };
    case 'danger':
      return { fg: colors.danger, bg: colors.dangerSoft };
    case 'info':
      return { fg: colors.info, bg: colors.infoSoft };
    default:
      return { fg: colors.mutedText, bg: colors.surfaceAlt };
  }
}

/** 4/8-point spacing scale. */
export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;

/** Corner radii — `pill` is deliberately larger than any element height. */
export const RADIUS = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 } as const;

/** Type ramp. Weights are strings because React Native wants them that way. */
export const TYPE = {
  display: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.3 },
  heading: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '600' as const },
} as const;
