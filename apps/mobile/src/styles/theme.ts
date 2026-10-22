import { spacing, radii } from '@panasecreto/ui-tokens';

/**
 * Paleta y tokens centralizados de EntrePanas Mobile
 * Sincronizados con @panasecreto/ui-tokens (identidad visual en docs/identidad/entrepanas)
 */
export const theme = {
  colors: {
    // Colores Principales de Marca (identidad visual 2026)
    primary: '#0B2D5B',             // Azul Marino
    primaryLight: '#1A4580',
    primaryContainer: '#0E3566',
    onPrimaryContainer: '#9FB8DA',

    secondary: '#FFC107',           // Amarillo Pana
    brandOrange: '#FFC107',         // Amarillo de "Panas" en el logotipo (nombre histórico del token)
    secondaryLight: '#FFD54F',
    secondaryDark: '#8A6400',       // Amarillo oscuro para texto sobre fondos claros
    secondaryContainer: '#FFC93C',
    onSecondaryContainer: '#0B2D5B',

    accent: '#00B4D8',              // Celeste Caribe
    accentLight: '#48CAE4',
    accentDark: '#0090AD',          // Celeste para texto sobre fondos claros
    accentContainer: '#E0F6FB',
    tertiaryContainer: '#0096C7',

    coral: '#FF5A3D',               // Coral Guacamaya (realces, badges)
    coralContainer: '#FFE1DA',

    danger: '#D62828',              // Rojo / Error
    dangerContainer: '#FFDAD6',
    onDangerContainer: '#93000A',
    success: '#2A9D8F',

    // Superficies y Canvas (base crema)
    background: '#F8F7F2',          // Crema
    surface: '#F8F7F2',
    surfaceCard: '#FFFFFF',
    surfaceContainerLow: '#F3F1EA',
    surfaceContainer: '#EEEBE2',
    surfaceContainerHigh: '#E8E5DB',
    surfaceContainerHighest: '#E2DED3',
    surfaceVariant: '#E2DED3',
    secondaryFixed: '#FFE8A3',
    secondarySoft: '#FFF8E1',       // Fondo de notas y avisos cálidos
    secondaryBorder: '#C79100',     // Borde inferior del botón amarillo
    whatsapp: '#128C7E',
    whatsappContainer: '#E6F7EE',

    // Textos y Contraste
    textDark: '#13213A',            // Tinta Marina
    textMuted: '#5B6B80',
    textSecondary: '#3E4C61',
    outline: '#77849A',
    outlineVariant: '#C9CFD9',
    border: '#E3E1D8',
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
    // Familias cargadas en App.tsx con @expo-google-fonts (Fredoka para titulares, Nunito para texto)
    fontFamily: {
      heading: 'Fredoka_700Bold',
      headingSemibold: 'Fredoka_600SemiBold',
      body: 'Nunito_400Regular',
      bodyMedium: 'Nunito_500Medium',
      bodySemibold: 'Nunito_600SemiBold',
      bodyBold: 'Nunito_700Bold',
      bodyExtrabold: 'Nunito_800ExtraBold',
      bodyBlack: 'Nunito_900Black',
    },
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
      shadowColor: '#0B2D5B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    button: {
      shadowColor: '#FFC107',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 3,
    },
    subtle: {
      shadowColor: '#0B2D5B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
  },
};

export default theme;
