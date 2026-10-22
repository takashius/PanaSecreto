/**
 * Paleta de colores oficial de EntrePanas (identidad visual 2026).
 * Fuente: docs/identidad/entrepanas/README.md
 */
export const colors = {
  primary: '#0B2D5B',       // Azul Marino (Brand Primary)
  secondary: '#FFC107',     // Amarillo Pana (Brand Secondary)
  accent: '#00B4D8',        // Celeste Caribe (Brand Accent)
  coral: '#FF5A3D',         // Coral Guacamaya (realces, badges)
  danger: '#D62828',        // Rojo (Alert / Error)
  background: '#F8F7F2',    // Crema (App Background)
  textDark: '#13213A',      // Tinta Marina (Primary Text)
  surface: '#FFFFFF',       // Blanco Puro (Card / Surfaces)

  // Variantes funcionales adicionales
  primaryLight: '#1A4580',
  primaryDark: '#071E3D',
  secondaryLight: '#FFD54F',
  secondaryDark: '#C79100',
  accentLight: '#48CAE4',
  accentDark: '#0090AD',
  coralLight: '#FF8A73',
  success: '#2A9D8F',
  warning: '#FF8F3D',
  muted: '#5B6B80',
  border: '#E3E1D8',
  surfaceSubtle: '#F1EFE7',
} as const;

export type ColorKey = keyof typeof colors;
