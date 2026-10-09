import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const authStyles = StyleSheet.create({
  // Sección del Header con Mascota y Marca
  headerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  mascotWrapper: {
    position: 'relative',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  mascotGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondaryLight,
    opacity: 0.25,
  },
  mascotImage: {
    width: 130,
    height: 130,
    resizeMode: 'contain',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    gap: 6,
  },
  brandTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
    letterSpacing: -0.5,
  },
  brandTitleAccent: {
    color: theme.colors.brandOrange,
    fontWeight: theme.typography.fontWeight.black,
  },
  tagline: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 290,
    marginTop: 4,
    lineHeight: 20,
  },

  // Tarjeta Blanca Principal del Formulario
  card: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii['2xl'],
    padding: theme.spacing.lg,
    marginTop: theme.spacing.xs,
    ...theme.shadows.card,
  },

  // Barra Superior de Navegación (Header de Registro)
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.margin,
    paddingVertical: theme.spacing.sm,
  },
  headerNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceContainer,
  },
  headerNavTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },
  headerNavBrand: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },
  headerNavBrandAccent: {
    color: theme.colors.brandOrange,
    fontWeight: theme.typography.fontWeight.black,
  },

  // Avatar con Mascota e Icono de Foto para Registro
  registerAvatarWrapper: {
    position: 'relative',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    padding: 3,
    ...theme.shadows.subtle,
  },
  registerAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
    resizeMode: 'contain',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surfaceCard,
    ...theme.shadows.subtle,
  },
  registerHeading: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
    textAlign: 'center',
  },
  registerSubheading: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 310,
    alignSelf: 'center',
    lineHeight: 20,
  },
});

export default authStyles;
