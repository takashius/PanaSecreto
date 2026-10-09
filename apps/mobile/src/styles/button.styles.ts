import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const buttonStyles = StyleSheet.create({
  // Botón Principal ("Entrar al Intercambio 🎁")
  btnPrimary: {
    height: 52,
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...theme.shadows.button,
  },
  btnPrimaryText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onSecondaryContainer,
    marginRight: 6,
  },
  btnPrimaryEmoji: {
    fontSize: 20,
    lineHeight: 22,
  },

  // Botones Sociales (Google, Apple)
  socialButtonContainer: {
    gap: 10,
    marginTop: 2,
  },
  btnGoogle: {
    height: 48,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnGoogleText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textDark,
    marginLeft: 10,
  },

  // Enlace del pie ("¿Aún no eres parte? Regístrate aquí")
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  footerPrompt: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    marginRight: 6,
  },
  footerLink: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.secondaryDark,
  },
});

export default buttonStyles;
