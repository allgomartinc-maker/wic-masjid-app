/**
 * WIC App Design System
 * Deep navy, ivory/white, elegant gold accents — peaceful, modern, premium, Islamic.
 * Large text, strong contrast, and simple layouts for accessibility (including elderly users).
 */

export const colors = {
  // Core brand palette
  navy: '#0B1F3A',
  navyDark: '#071527',
  navyLight: '#16305A',
  gold: '#C9A24B',
  goldLight: '#E4C978',
  goldDark: '#A6812F',
  ivory: '#FAF7F0',
  white: '#FFFFFF',
  cream: '#F3ECDC',

  // Text
  textPrimary: '#0B1F3A',
  textSecondary: '#3E4C63',
  textOnDark: '#FAF7F0',
  textOnDarkMuted: '#C7CFDC',
  textMuted: '#6B7686',

  // Feedback / priority
  success: '#2E7D5B',
  warning: '#B8860B',
  danger: '#B23B3B',
  emergency: '#8C1C1C',
  info: '#2C5F8A',

  // Surfaces
  background: '#FAF7F0',
  surface: '#FFFFFF',
  surfaceAlt: '#F3ECDC',
  border: '#E4DCC8',
  divider: '#E7E1D2',

  overlay: 'rgba(11, 31, 58, 0.55)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const typography = {
  // Sizes chosen generously for readability by all ages
  display: 34,
  h1: 28,
  h2: 22,
  h3: 19,
  body: 17,
  bodyLarge: 19,
  caption: 14,
  tiny: 12,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadow = {
  card: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  raised: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
};

export const priorityColors: Record<string, string> = {
  low: colors.info,
  normal: colors.info,
  high: colors.warning,
  critical: colors.emergency,
};

export const categoryColors: Record<string, string> = {
  general: colors.info,
  emergency: colors.emergency,
  janazah: colors.navyDark,
  community: colors.gold,
  weather: colors.warning,
  program: colors.success,
  ramadan: colors.goldDark,
  eid: colors.success,
  fundraising: colors.gold,
};
