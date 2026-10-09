import { colors, spacing, typography, radii } from '@panasecreto/ui-tokens';

/**
 * Paleta y tokens centralizados de PanaSecreto Mobile
 * Sincronizados con @panasecreto/ui-tokens y Stitch DESIGN.md
 */
export const theme = {
  colors: {
    // Colores Principales de Marca
    primary: '#1E1338',             // Morado Noche
    primaryLight: '#2D1D54',
    primaryContainer: '#20153A',
    onPrimaryContainer: '#8A7DA9',

    secondary: '#F7A800',           // Amarillo Araguaney / Naranja oficial del manual
    brandOrange: '#F7A800',         // Naranja Marca PanaSecreto ("Secreto")
    secondaryLight: '#FFBF33',
    secondaryDark: '#815600',
    secondaryContainer: '#FEAE10',
    onSecondaryContainer: '#1E1338',

    accent: '#1D84B5',              // Azul Caribe
    accentLight: '#35A3D6',
    tertiaryContainer: '#2B8CBD',

    danger: '#D62828',              // Rojo Guacamaya / Error
    dangerContainer: '#FFDAD6',
    onDangerContainer: '#93000A',
    success: '#2A9D8F',

    // Superficies y Canvas (Stitch DESIGN.md)
    background: '#FCF8FF',          // Surface base
    surface: '#FCF8FF',
    surfaceCard: '#FFFFFF',         // Container lowest
    surfaceContainerLow: '#F6F1FF',
    surfaceContainer: '#F0ECF9',
    surfaceContainerHigh: '#EAE6F3',
    surfaceVariant: '#E5E0ED',

    // Textos y Contraste
    textDark: '#1C1B24',            // On-surface (Carbón Lente)
    textMuted: '#6C757D',           // On-surface variant
    textSecondary: '#49454E',
    outline: '#7A757E',
    outlineVariant: '#CAC4CE',
    border: '#E2E8F0',
    white: '#FFFFFF',
  },

  spacing: {
    ...spacing,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    margin: 20,
  },

  radii: {
    ...radii,
    sm: 6,
    md: 10,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
  },

  typography: {
    fontSize: {
      xs: 11,
      sm: 13,
      base: 14,
      md: 15,
      lg: 16,
      xl: 18,
      '2xl': 22,
      '3xl': 28,
      '4xl': 34,
    },
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
      black: '900' as const,
    },
  },

  shadows: {
    card: {
      shadowColor: '#1E1338',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    button: {
      shadowColor: '#F7A800',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 3,
    },
    subtle: {
      shadowColor: '#1E1338',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
  },
};

export default theme;
