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
});

export default formStyles;
