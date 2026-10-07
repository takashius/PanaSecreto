/**
 * Escala de espaciado estándar para PanaSecreto (Web y Mobile)
 */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
} as const;

export type SpacingKey = keyof typeof spacing;
