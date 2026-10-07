/**
 * Paleta de colores oficial de PanaSecreto
 */
export const colors = {
  primary: '#1E1338',       // Morado Noche (Brand Primary)
  secondary: '#F7A800',     // Amarillo Araguaney (Brand Secondary)
  accent: '#1D84B5',        // Azul Caribe (Brand Accent)
  danger: '#D62828',        // Rojo Guacamaya (Alert / Error)
  background: '#F8F9FA',    // Hueso Suave (App Background)
  textDark: '#1C1B24',      // Carbón Lente (Primary Text)
  surface: '#FFFFFF',       // Blanco Puro (Card / Surfaces)

  // Variantes funcionales adicionales
  primaryLight: '#2D1D54',
  secondaryLight: '#FFBF33',
  accentLight: '#35A3D6',
  success: '#2A9D8F',
  warning: '#E76F51',
  muted: '#6C757D',
  border: '#E2E8F0',
  surfaceSubtle: '#F1F3F5',
} as const;

export type ColorKey = keyof typeof colors;
