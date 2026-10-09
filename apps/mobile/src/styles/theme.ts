import { colors, spacing, typography, radii } from '@panasecreto/ui-tokens';

/**
 * Sistema de estilos centralizado de PanaSecreto Mobile
 * Todos los tokens y clases CSS se consumen desde aquí.
 */
export const theme = {
  colors: {
    ...colors,
    // Stitch token aliases
    brandPrimary: colors.primary,         // #1E1338
    brandSecondary: colors.secondary,     // #F7A800
    brandAccent: colors.accent,           // #1D84B5
    brandBackground: colors.background,   // #F8F9FA
    surfaceContainer: '#F0ECF9',
  },
  spacing,
  typography,
  radii,
};

/**
 * Nombres de clases CSS centralizadas definidas en global.css
 */
export const cssClasses = {
  layout: {
    safeArea: 'auth-safe-area',
    scroll: 'auth-scroll-container',
    header: 'auth-header-section',
    card: 'auth-card-body',
  },
  brand: {
    logoBox: 'brand-logo-container',
    logoEmoji: 'brand-logo-emoji',
    title: 'brand-title-text',
    accent: 'brand-title-accent',
    tagline: 'brand-tagline-text',
  },
  typography: {
    title: 'screen-title',
    subtitle: 'screen-subtitle',
  },
  form: {
    group: 'form-group',
    label: 'input-label',
    wrapper: 'input-wrapper',
    wrapperFocused: 'input-wrapper-focused',
    wrapperError: 'input-wrapper-error',
    field: 'input-text-field',
    error: 'input-error-msg',
    forgotPassword: 'forgot-password-container',
    forgotPasswordText: 'forgot-password-text',
  },
  buttons: {
    primary: 'btn-primary',
    primaryText: 'btn-primary-text',
    secondary: 'btn-secondary',
    secondaryText: 'btn-secondary-text',
    outline: 'btn-outline',
    outlineText: 'btn-outline-text',
  },
  divider: {
    row: 'divider-row',
    line: 'divider-line',
    label: 'divider-label',
  },
  footer: {
    row: 'auth-footer-row',
    prompt: 'auth-footer-prompt',
    action: 'auth-footer-action',
  },
} as const;

export default theme;
