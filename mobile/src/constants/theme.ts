import type { TextStyle } from 'react-native';

// Palette from the "Na Régua App" design (Claude Design). oklch values converted to sRGB hex.
export const Colors = {
  ink: '#1c1a17',
  background: '#f6f4f0',
  surface: '#ffffff',
  muted: '#6b655c',
  textSecondary: '#4a453e',
  faint: '#8a8378',
  placeholder: '#e5e0d7',
  line: 'rgba(28,26,23,0.08)',
  lineStrong: 'rgba(28,26,23,0.1)',
  border: 'rgba(28,26,23,0.15)',
  borderStrong: 'rgba(28,26,23,0.18)',
  fill: 'rgba(28,26,23,0.07)',
  overlay: 'rgba(20,18,15,0.4)',
  onInk: '#f6f4f0',
  onInkMuted: 'rgba(246,244,240,0.7)',
  onInkLine: 'rgba(246,244,240,0.15)',
  accent: '#c0571e',
  accentText: '#a53e00',
  success: '#0a7e3a',
  successLight: '#7ccd8e',
  successBg: '#d9f3dd',
  successText: '#005820',
  danger: '#a83634',
  dangerBorder: '#b94642',
  dangerBg: '#ffe4e1',
  warningBg: '#ffe6d1',
  warningText: '#844100',
  switchOff: 'rgba(28,26,23,0.2)',
} as const;

// Loaded in the root layout via @expo-google-fonts. Custom fonts pick weight by family name.
export const Fonts = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  extrabold: 'Archivo_800ExtraBold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const;

export const Type = {
  eyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.44,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  mono12: { fontFamily: Fonts.monoMedium, fontSize: 12, color: Colors.muted },
  display: { fontFamily: Fonts.extrabold, fontSize: 32, lineHeight: 34, letterSpacing: -0.64, color: Colors.ink },
  title: { fontFamily: Fonts.extrabold, fontSize: 28, lineHeight: 31, letterSpacing: -0.56, color: Colors.ink },
  sheetTitle: { fontFamily: Fonts.extrabold, fontSize: 22, color: Colors.ink },
  rowTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.ink },
  body: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 21, color: Colors.muted },
  small: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted },
  caption: { fontFamily: Fonts.regular, fontSize: 12, lineHeight: 18, color: Colors.muted },
} satisfies Record<string, TextStyle>;

export const Spacing = {
  screen: 20,
} as const;
