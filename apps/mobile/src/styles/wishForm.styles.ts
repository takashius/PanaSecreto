import { StyleSheet } from 'react-native';
import { theme } from './theme';

const card = {
  backgroundColor: theme.colors.surfaceCard,
  borderRadius: 28,
  borderWidth: 1,
  borderColor: theme.colors.border,
  padding: 18,
  gap: 14,
  ...theme.shadows.subtle,
};

/** Estilos del formulario Agregar / Editar deseo (diseño Stitch «Agregar deseo») */
export const wishFormStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Encabezado
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.margin,
    paddingTop: 6,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  headerSubtitle: {
    fontFamily: theme.typography.fontFamily.bodySemibold,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 1,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  groupPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.accentLight,
    backgroundColor: theme.colors.accentContainer,
  },
  groupPillName: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accentDark,
  },
  groupPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.coral,
  },
  groupPillYear: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  scrollContent: {
    paddingHorizontal: theme.spacing.margin,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },

  // Tarjetas
  card,
  tipCard: {
    ...card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.colors.secondarySoft,
    borderColor: theme.colors.secondaryFixed,
  },
  mascot: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.secondaryFixed,
  },
  tipTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  tipText: {
    marginTop: 2,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    flexShrink: 1,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  required: {
    color: theme.colors.coral,
  },
  optional: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.textMuted,
  },
  labelHint: {
    marginLeft: 'auto',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  requiredChip: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.coralContainer,
  },
  requiredChipText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.coral,
  },
  errorText: {
    fontFamily: theme.typography.fontFamily.bodySemibold,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.danger,
  },

  // Foto
  dropZone: {
    alignItems: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.accentLight,
    backgroundColor: '#F2FBFD',
  },
  dropZoneError: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerContainer,
  },
  examplePhoto: {
    width: 96,
    height: 96,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 4,
  },
  dropTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  dropText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    lineHeight: 20,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    alignSelf: 'stretch',
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  photoButtonDark: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  photoButtonText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  photoButtonTextLight: {
    color: theme.colors.white,
  },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceContainer,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 10,
  },

  // Campos
  input: {
    minHeight: 54,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textDark,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  inputFlex: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textDark,
  },
  textArea: {
    minHeight: 96,
    paddingTop: 14,
    paddingBottom: 14,
    textAlignVertical: 'top',
    fontSize: theme.typography.fontSize.md,
  },
  counter: {
    alignSelf: 'flex-end',
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    color: theme.colors.textMuted,
  },

  // Precio
  currencyToggle: {
    marginLeft: 'auto',
    flexDirection: 'row',
    padding: 3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  currencyOption: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 11,
  },
  currencyOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  currencyText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textMuted,
  },
  currencyTextActive: {
    color: theme.colors.white,
  },
  pricePrefix: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  priceSuffix: {
    fontFamily: theme.typography.fontFamily.bodySemibold,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textMuted,
  },
  budgetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.secondaryFixed,
    backgroundColor: theme.colors.secondarySoft,
  },
  budgetBoxOver: {
    borderColor: theme.colors.coral,
    backgroundColor: theme.colors.coralContainer,
  },
  budgetText: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    lineHeight: 20,
    color: theme.colors.textDark,
  },
  strong: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },

  // Categorías
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  chipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent,
  },
  chipText: {
    fontFamily: theme.typography.fontFamily.bodySemibold,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },

  // Prioridad
  priorityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    gap: 4,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  priorityOptionActive: {
    borderWidth: 2,
    borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.secondarySoft,
  },
  priorityCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  priorityEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  priorityTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  priorityText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 18,
    color: theme.colors.textMuted,
  },

  // Confidencialidad
  privacyCard: {
    ...card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  // Pie fijo
  footer: {
    paddingHorizontal: theme.spacing.margin,
    paddingTop: 12,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceCard,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 58,
    borderRadius: 22,
    backgroundColor: theme.colors.secondary,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.secondaryBorder,
    ...theme.shadows.button,
  },
  saveButtonText: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textMuted,
  },
});

export default wishFormStyles;
