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

  // Stepper / Barra de Progreso de Recuperación
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stepperTextStep: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.brandOrange,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stepperTextTitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  stepperBarContainer: {
    height: 6,
    width: '100%',
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  stepperBarFill: {
    height: '100%',
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: 3,
  },

  // Tarjeta de Tranquilidad con Mascota ("Cero estrés")
  reassuranceCard: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.subtle,
  },
  reassuranceMascotWrapper: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reassuranceMascotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  reassuranceContent: {
    flex: 1,
  },
  reassuranceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  reassuranceBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.secondaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  reassuranceTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
    lineHeight: 20,
  },

  // Banner Informativo / Consejo
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  tipText: {
    flex: 1,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },

  // Micro-tarjeta de Garantía / Seguridad
  guaranteeCard: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  guaranteeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guaranteeTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },
  guaranteeSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },

  // Reenviar Código y Temporizador
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  timerText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  timerHighlight: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },
  resendButton: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.brandOrange,
  },

  // Requisitos de Seguridad (Badges)
  rulesContainer: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radii.lg,
    padding: 10,
    marginTop: 6,
  },
  rulesHeader: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  rulesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ruleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceContainer,
  },
  ruleBadgeActive: {
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.success,
    borderWidth: 1,
  },
  ruleBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
});

export default authStyles;
