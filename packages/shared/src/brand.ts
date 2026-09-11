/**
 * Yahadeen brand palette, sampled from `logo/Yahadeen.png`.
 *
 * The mark is a blue "Y" crossing a green "P" over a two-tone capsule, so the
 * system runs on a cobalt-blue primary with a leaf-green accent, and uses the
 * blue→green sweep as its signature gradient.
 *
 * Kept dependency-free so the Expo apps, the Next dashboard and any future
 * client all read the same values.
 */
export const BRAND = {
  /** Core cobalt from the Y arm. 8.6:1 on white — safe for body text. */
  blue: '#0036B6',
  blueDeep: '#00279F',
  blueBright: '#0058EC',
  /** Specular highlight along the top of the Y. */
  blueGlint: '#009AFC',

  /** Core leaf green from the P bowl. Fills and badges only — 2.6:1 on white. */
  green: '#10BF41',
  greenDeep: '#038C3F',
  greenBright: '#69ED2F',
  greenPale: '#BAF97E',
  /** Darkened green that clears 4.5:1 on white, for green *text*. */
  greenText: '#07822F',
} as const;

/** The logo's blue→green sweep. Use for hero panels and primary CTAs. */
export const BRAND_GRADIENT = ['#0040D0', BRAND.green] as const;

export type BrandColor = keyof typeof BRAND;
