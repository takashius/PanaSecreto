import { StyleSheet } from 'react-native';
import { theme } from './theme';

/** Estilos de los modales propios (alertas, confirmaciones, calendario, hora, contacto) */
export const dialogStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(11, 45, 91, 0.55)',
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(11, 45, 91, 0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    borderRadius: 30,
    backgroundColor: theme.colors.surfaceCard,
    ...theme.shadows.card,
  },
  sheet: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: theme.colors.surfaceCard,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    marginBottom: 6,
    backgroundColor: theme.colors.outlineVariant,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mascot: {
    width: 68,
    height: 68,
    borderRadius: 20,
    marginBottom: 4,
  },
  title: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  message: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.md,
    lineHeight: 22,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  buttonsRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  buttonsColumn: {
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 10,
  },
  button: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  buttonStacked: {
    flex: 0,
    alignSelf: 'stretch',
  },
  buttonPrimary: {
    backgroundColor: theme.colors.secondary,
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.secondaryBorder,
  },
  buttonCancel: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  buttonDestructive: {
    backgroundColor: theme.colors.danger,
    borderBottomWidth: 3,
    borderBottomColor: '#A61D1D',
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  buttonTextCancel: {
    color: theme.colors.textSecondary,
  },
  buttonTextDestructive: {
    color: theme.colors.white,
  },

  // Calendario
  calHeader: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calNav: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceContainer,
  },
  calMonth: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  calWeek: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    marginTop: 6,
  },
  calWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textMuted,
  },
  calGrid: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayToday: {
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
  },
  calDaySelected: {
    backgroundColor: theme.colors.secondary,
  },
  calDayText: {
    fontFamily: theme.typography.fontFamily.bodySemibold,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textDark,
  },
  calDayTextSelected: {
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  calDayTextDisabled: {
    color: theme.colors.outlineVariant,
  },
  calSelectedLabel: {
    fontFamily: theme.typography.fontFamily.bodySemibold,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.accentDark,
    textAlign: 'center',
  },

  // Hora
  timeColumns: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 10,
    height: 220,
  },
  timeColumn: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
  },
  timeColumnContent: {
    padding: 6,
    gap: 4,
  },
  timeItem: {
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeItemActive: {
    backgroundColor: theme.colors.secondary,
  },
  timeItemText: {
    fontFamily: theme.typography.fontFamily.bodySemibold,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  timeItemTextActive: {
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  timePreview: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: 40,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  timeLabels: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 10,
  },
  timeLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.bodyExtrabold,
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.extrabold,
    letterSpacing: 1,
    color: theme.colors.textMuted,
  },

  // Contacto
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentContainer,
  },
  contactLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  contactValue: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
});

export default dialogStyles;
