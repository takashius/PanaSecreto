import { StyleSheet } from 'react-native';
import { theme } from './theme';

/** Elegir alias del grupo (hoja inferior) y tarjeta del alias en el detalle */
export const aliasPickerStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,45,91,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radii['3xl'],
    borderTopRightRadius: theme.radii['3xl'],
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.outlineVariant,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  mascot: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  title: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize['2xl'],
    color: theme.colors.primary,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  genderRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.radii.full,
    padding: 4,
    marginBottom: 14,
  },
  genderItem: {
    flex: 1,
    height: 34,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderItemActive: {
    backgroundColor: theme.colors.surfaceCard,
  },
  genderText: {
    fontFamily: theme.typography.fontFamily.bodySemibold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  genderTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bodyBold,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii.xl,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  optionActive: {
    borderColor: theme.colors.secondaryContainer,
    backgroundColor: theme.colors.secondaryFixed,
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionText: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.headingSemibold,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textDark,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  linkText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.secondaryDark,
  },
  customCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii.xl,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  input: {
    height: 48,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: 14,
    fontFamily: theme.typography.fontFamily.bodySemibold,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textDark,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emojiChip: {
    width: 38,
    height: 38,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceContainer,
  },
  emojiChipActive: {
    backgroundColor: theme.colors.secondaryFixed,
    borderWidth: 2,
    borderColor: theme.colors.secondaryContainer,
  },
  hint: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  error: {
    fontFamily: theme.typography.fontFamily.bodySemibold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.danger,
    marginBottom: 8,
  },
  saveButton: {
    height: 52,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.primary,
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  laterText: {
    fontFamily: theme.typography.fontFamily.bodySemibold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },

  // Tarjeta "Tu alias" en el detalle del grupo
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii['2xl'],
    padding: 14,
    marginBottom: 14,
  },
  cardPending: {
    backgroundColor: theme.colors.secondaryFixed,
  },
  cardEmojiBox: {
    width: 46,
    height: 46,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontFamily: theme.typography.fontFamily.bodySemibold,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardAlias: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.primary,
  },
  cardText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  cardButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.full,
    paddingHorizontal: 14,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButtonText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
  },
});

export default aliasPickerStyles;
