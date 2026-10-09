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
});

export default authStyles;
