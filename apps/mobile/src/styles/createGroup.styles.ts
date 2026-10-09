import { StyleSheet, Platform } from 'react-native';
import { theme } from './theme';

export const createGroupStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },

  // 1. Top Bar / Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.margin,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 19, 56, 0.04)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnBack: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnMore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(254, 174, 16, 0.7)',
    overflow: 'hidden',
  },
  headerAvatarImg: {
    width: '100%',
    height: '100%',
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: theme.spacing.margin,
    paddingTop: theme.spacing.md,
    paddingBottom: 40,
    gap: theme.spacing.lg,
  },

  // 2. Festive Hero Card
  heroCard: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  heroDecoCircle1: {
    position: 'absolute',
    right: -24,
    bottom: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(254, 174, 16, 0.15)',
  },
  heroDecoCircle2: {
    position: 'absolute',
    left: '50%',
    top: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(233, 221, 255, 0.35)',
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondaryContainer,
    marginBottom: 6,
  },
  heroBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },
  heroTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  heroIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  // 3. Card Base
  card: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },
  cardHeaderSub: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  pillBadge: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
  },
  pillBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },

  // Form Fields inside cards
  fieldGroup: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textDark,
  },
  fieldInputContainer: {
    height: 50,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radii.md,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  fieldInput: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textDark,
    padding: 0,
  },
  fieldHint: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textMuted,
    paddingLeft: 2,
  },

  // Date trigger
  dateTrigger: {
    height: 50,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radii.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTriggerText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textDark,
  },

  // Currency selector tabs
  currencyTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radii.md,
    padding: 4,
    gap: 4,
  },
  currencyTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.sm,
  },
  currencyTabActive: {
    backgroundColor: theme.colors.surfaceCard,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  currencyTabText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textMuted,
  },
  currencyTabTextActive: {
    color: theme.colors.textDark,
    fontWeight: theme.typography.fontWeight.bold,
  },

  // Budget dual inputs
  budgetInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  budgetInputCol: {
    flex: 1,
    gap: 4,
  },
  budgetInputSubLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  budgetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
  },
  budgetBoxDisabled: {
    opacity: 0.45,
  },
  budgetSymbol: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textMuted,
    marginRight: 4,
  },
  budgetAmountInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
    padding: 0,
  },
  budgetDivider: {
    paddingTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetDividerText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.outlineVariant,
  },

  // Visual Range Slider Track
  rangeTrackWrap: {
    gap: 6,
    paddingTop: 4,
  },
  rangeTrackBg: {
    height: 8,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 4,
    overflow: 'hidden',
  },
  rangeTrackFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: 4,
  },
  rangeTrackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeTrackLabelText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },

  // Preset Chips
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceContainer,
  },
  presetChipActive: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: theme.colors.secondaryContainer,
  },
  presetChipText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textDark,
  },

  // Switch rows
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  switchTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  switchTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textDark,
  },
  switchSub: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },

  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radii.md,
    padding: 4,
    gap: 6,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  stepperValue: {
    width: 34,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },

  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.surfaceContainer,
    marginVertical: 4,
  },

  // Mascot Delight Banner
  mascotTipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: theme.spacing.md,
    borderRadius: theme.radii.xl,
    backgroundColor: 'rgba(233, 221, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(138, 125, 169, 0.15)',
  },
  mascotTipAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mascotTipText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textDark,
    lineHeight: 18,
  },

  // Primary CTA Action
  submitWrap: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  btnSubmit: {
    width: '100%',
    height: 56,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.secondaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: theme.colors.secondaryContainer,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  btnSubmitText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onSecondaryContainer,
  },
  submitSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },

  // ---------------------------------------------
  // Confirmation Modal / Bottom Sheet Styles
  // ---------------------------------------------
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 27, 36, 0.48)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.surfaceCard,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: theme.spacing.margin,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(202, 196, 206, 0.7)',
    marginBottom: 16,
  },
  modalMascotImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  modalSubBadge: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.extrabold,
    color: theme.colors.secondaryDark,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
    marginBottom: 20,
  },

  // Code Card
  codeCard: {
    width: '100%',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  codeCardLeft: {
    flex: 1,
  },
  codeCardLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: 3,
  },
  codeCardCode: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.extrabold,
    color: theme.colors.textDark,
    letterSpacing: 1.2,
  },
  btnCopyCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceCard,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radii.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  btnCopyCodeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },

  // Modal Actions
  modalActions: {
    width: '100%',
    gap: 10,
  },
  btnWhatsapp: {
    width: '100%',
    height: 52,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  btnWhatsappText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  btnCopyLink: {
    width: '100%',
    height: 52,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnCopyLinkText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textDark,
  },
  btnDismissModal: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnDismissModalText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
});
