import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const commonStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.margin,
    paddingBottom: theme.spacing['2xl'],
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Divisor estándar
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.md,
    position: 'relative',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.surfaceVariant,
  },
  dividerText: {
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surfaceCard,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Insignia de Confidencialidad / Anonimato
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radii.full,
    alignSelf: 'center',
    marginTop: theme.spacing.md,
    gap: 6,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

export default commonStyles;
