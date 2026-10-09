import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const formStyles = StyleSheet.create({
  formContainer: {
    gap: theme.spacing.md,
  },
  formGroup: {
    marginBottom: theme.spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textDark,
  },
  forgotPasswordLink: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.secondaryDark,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radii.lg,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputWrapperFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceCard,
    ...theme.shadows.subtle,
  },
  inputWrapperError: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerContainer,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textDark,
    paddingVertical: 0,
    height: '100%',
  },
  toggleEyeButton: {
    padding: 6,
    marginLeft: 4,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.danger,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: theme.typography.fontWeight.medium,
  },
  labelHint: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  labelHintHighlight: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.brandOrange,
    fontWeight: theme.typography.fontWeight.bold,
  },

  // Teléfono con Prefijo de País
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prefixPill: {
    height: 50,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prefixText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textDark,
  },
  phoneInputWrapper: {
    flex: 1,
  },

  // Medidor de Fortaleza de Contraseña
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  strengthBar: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.surfaceContainerHighest,
  },
  strengthBarWeak: {
    backgroundColor: theme.colors.danger,
  },
  strengthBarMedium: {
    backgroundColor: '#FFBA49',
  },
  strengthBarStrong: {
    backgroundColor: theme.colors.success,
  },
  strengthLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    minWidth: 48,
    textAlign: 'right',
  },

  // Mini Banner de Confidencialidad
  confidentialCard: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radii.xl,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  confidentialBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidentialTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },
  confidentialSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // Checkbox de Términos y Condiciones
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: theme.colors.secondaryContainer,
    borderColor: theme.colors.secondaryContainer,
  },
  termsText: {
    flex: 1,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  termsLink: {
    color: theme.colors.secondaryDark,
    fontWeight: theme.typography.fontWeight.bold,
  },
});

export default formStyles;
