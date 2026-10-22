import { StyleSheet } from 'react-native';
import { theme } from './theme';

const card = {
  backgroundColor: theme.colors.surfaceCard,
  borderRadius: 28,
  borderWidth: 1,
  borderColor: theme.colors.border,
  ...theme.shadows.subtle,
};

/** Estilos de "Deseos" (diseño Stitch «Mis Deseos - Nueva Identidad», ahora pestaña «Deseos») */
export const myWishesStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.margin,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.md,
  },

  // Selector de grupo
  groupChips: {
    gap: 10,
    paddingHorizontal: theme.spacing.margin,
  },
  groupChipsScroll: {
    marginHorizontal: -theme.spacing.margin,
    flexGrow: 0,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceCard,
  },
  groupChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  groupChipEmoji: {
    fontSize: 18,
  },
  groupChipText: {
    fontFamily: theme.typography.fontFamily.bodySemibold,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },
  groupChipTextActive: {
    color: theme.colors.white,
  },
  groupChipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
  },

  // Selector "Mi lista / Lista de mi pana"
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 16,
  },
  segmentItemActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.outline,
  },
  segmentTextActive: {
    color: theme.colors.white,
  },
  panaCard: {
    ...card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderColor: theme.colors.secondaryFixed,
    backgroundColor: theme.colors.secondarySoft,
  },
  panaIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  panaEyebrow: {
    fontFamily: theme.typography.fontFamily.bodyExtrabold,
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.extrabold,
    letterSpacing: 1.5,
    color: theme.colors.textMuted,
  },
  panaAlias: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },

  // Reglas del grupo
  rulesCard: {
    ...card,
    padding: 16,
    gap: 14,
    overflow: 'hidden',
  },
  rulesGlow: {
    position: 'absolute',
    right: -60,
    bottom: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: theme.colors.secondarySoft,
  },
  rulesRow: {
    flexDirection: 'row',
    gap: 14,
  },
  rulesMascot: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rulesTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rulesChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.accentContainer,
  },
  rulesChipText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accentDark,
  },
  rulesLimit: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textMuted,
  },
  rulesText: {
    marginTop: 6,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
  strong: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceContainer,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
  },
  progressText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textSecondary,
  },

  // Agregar deseo
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 62,
    borderRadius: 24,
    backgroundColor: theme.colors.secondary,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.secondaryBorder,
    ...theme.shadows.button,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },

  // Encabezado de la lista
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  listTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  listCount: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.accentContainer,
  },
  listCountText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accentDark,
  },

  // Tarjeta de deseo
  wishCard: {
    ...card,
    overflow: 'hidden',
  },
  wishBody: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  thumb: {
    width: 96,
    height: 96,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  priorityTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  priorityTagText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  wishInfo: {
    flex: 1,
    gap: 6,
  },
  wishTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.accentContainer,
  },
  categoryChipText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accentDark,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishTitle: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  wishBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  wishPrice: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    flexShrink: 1,
  },
  storeChipText: {
    flexShrink: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  wishFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  wishFooterAlert: {
    marginHorizontal: 0,
    paddingHorizontal: 14,
    borderTopColor: theme.colors.secondaryFixed,
    backgroundColor: theme.colors.secondarySoft,
  },
  footerText: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textMuted,
  },
  footerTextStrong: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  footerNote: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    maxWidth: '50%',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondary,
  },
  replyButtonText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  linkText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accentDark,
  },

  // Lista vacía y nota final
  emptyCard: {
    ...card,
    alignItems: 'center',
    gap: 8,
    padding: 24,
  },
  emptyMascot: {
    width: 72,
    height: 72,
    borderRadius: 20,
  },
  emptyTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    lineHeight: 20,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceCard,
  },
  noteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondaryFixed,
  },
  noteText: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
});

export default myWishesStyles;
