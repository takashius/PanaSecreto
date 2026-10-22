import { StyleSheet, Platform } from 'react-native';
import { theme } from './theme';

const card = {
  backgroundColor: theme.colors.surfaceCard,
  borderRadius: 28,
  borderWidth: 1,
  borderColor: theme.colors.border,
  ...theme.shadows.subtle,
};

/** Estilos del Detalle del grupo (diseño Stitch «Detalle del Grupo - Nueva Identidad») */
export const groupDetailStyles = StyleSheet.create({
  // Estados de carga del detalle conectado a la API
  stateCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  stateTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textDark,
    textAlign: 'center',
  },
  stateText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  stateButton: {
    marginTop: 8,
    backgroundColor: theme.colors.secondaryContainer,
    paddingHorizontal: 20,
    height: 42,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateButtonText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
  },
  busyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248,247,242,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  busyCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii['2xl'],
    paddingHorizontal: 24,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 10,
  },
  busyText: {
    fontFamily: theme.typography.fontFamily.bodySemibold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textDark,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Barra superior
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.margin,
    paddingVertical: theme.spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceContainer,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },

  scrollContent: {
    paddingHorizontal: theme.spacing.margin,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },

  // Tarjeta principal del grupo
  heroCard: {
    ...card,
    flexDirection: 'row',
    gap: 14,
    padding: 18,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    right: -60,
    bottom: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.secondarySoft,
    opacity: 0.8,
  },
  heroEmojiBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 32,
  },
  heroMascot: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: theme.colors.white,
    backgroundColor: theme.colors.secondary,
  },
  heroInfo: {
    flex: 1,
    gap: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.accentContainer,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },
  statusChipText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accentDark,
  },
  roleChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceContainer,
  },
  roleChipText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  heroTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  heroSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  heroSubtitleStrong: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },

  // Pestañas Resumen / Mi sobre / Chat
  tabs: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 16,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.outline,
  },
  tabTextActive: {
    color: theme.colors.white,
  },
  tabDot: {
    position: 'absolute',
    top: 8,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.coral,
  },

  // Resumen: tres datos clave
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 12,
    gap: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceCard,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontFamily: theme.typography.fontFamily.bodySemibold,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textMuted,
  },
  statValue: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  statHint: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
  },

  // Tarjetas de sección
  sectionCard: {
    ...card,
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceContainer,
  },
  sectionTitleBox: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  sectionSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  sectionCounter: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  linkText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accentDark,
  },
  bodyText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  bodyStrong: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  insetBox: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },

  // Lugar del encuentro
  placeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  placeName: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  placeAddress: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radii.full,
    borderWidth: 1.5,
    borderColor: theme.colors.accentContainer,
    backgroundColor: theme.colors.white,
  },
  pillButtonText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accentDark,
  },
  noteBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.secondaryFixed,
    backgroundColor: theme.colors.secondarySoft,
  },
  noteEmoji: {
    fontSize: 22,
  },
  noteText: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    fontStyle: 'italic',
    lineHeight: 20,
    color: theme.colors.textDark,
  },
  emptyPlace: {
    alignItems: 'center',
    gap: 6,
  },

  // Invitar
  secretChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondaryFixed,
  },
  secretChipText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.secondaryDark,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  codeLabel: {
    fontFamily: theme.typography.fontFamily.bodyExtrabold,
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.extrabold,
    letterSpacing: 1.2,
    color: theme.colors.textMuted,
  },
  codeValue: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 22,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 2,
    color: theme.colors.primary,
    marginTop: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  copyButtonText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  shareRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainer,
  },
  shareButtonText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },

  // Panas confirmados
  progressTrack: {
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
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  memberDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceContainer,
  },
  avatarMe: {
    backgroundColor: theme.colors.primary,
    borderWidth: 2.5,
    borderColor: theme.colors.secondary,
  },
  avatarText: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  avatarTextMe: {
    color: theme.colors.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  memberName: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  meChip: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: theme.colors.secondaryFixed,
  },
  meChipText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.secondaryDark,
  },
  memberSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  memberSubtitleReady: {
    fontFamily: theme.typography.fontFamily.bodySemibold,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.accentDark,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreMembers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  miniAvatars: {
    flexDirection: 'row',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontFamily: theme.typography.fontFamily.bodyExtrabold,
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.extrabold,
    color: theme.colors.primary,
  },
  moreMembersText: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textMuted,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Exclusiones
  exclusionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exclusionPair: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },

  // Hacer el sorteo
  drawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 62,
    borderRadius: 24,
    backgroundColor: theme.colors.secondary,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.secondaryBorder,
    ...theme.shadows.button,
  },
  drawButtonDisabled: {
    opacity: 0.5,
  },
  drawButtonEmoji: {
    fontSize: 22,
  },
  drawButtonText: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  drawHint: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 19,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  waitingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Pestañas aún no maquetadas
  placeholderCard: {
    ...card,
    alignItems: 'center',
    gap: 10,
    padding: 24,
  },
  placeholderImage: {
    width: 72,
    height: 72,
    borderRadius: 20,
  },
  placeholderTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
});

export default groupDetailStyles;
