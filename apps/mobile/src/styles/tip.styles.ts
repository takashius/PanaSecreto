import { StyleSheet } from 'react-native';
import { theme } from './theme';

/** Tarjeta "Tip del pana" reutilizable (tips del servidor por pantalla) */
export const tipStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: theme.colors.accentContainer,
  },
  cardDark: {
    backgroundColor: theme.colors.primary,
  },
  mascot: {
    width: 46,
    height: 46,
    borderRadius: 12,
  },
  body: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: theme.typography.fontFamily.bodyExtrabold,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.extrabold,
    letterSpacing: 1,
    color: theme.colors.accentDark,
  },
  eyebrowDark: {
    color: theme.colors.secondary,
  },
  text: {
    marginTop: 2,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    lineHeight: 20,
    color: theme.colors.textDark,
  },
  textDark: {
    color: theme.colors.white,
  },
  hint: {
    marginTop: 4,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  hintDark: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
