import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { colors, spacing } from '@panasecreto/ui-tokens';
import { GroupStatusEnum, GroupStatus } from '@panasecreto/shared';

export default function App() {
  const [currentStatus, setCurrentStatus] = useState<GroupStatus>(GroupStatusEnum.WAITING);

  const toggleStatus = () => {
    const statuses: GroupStatus[] = [
      GroupStatusEnum.WAITING,
      GroupStatusEnum.LOCKED,
      GroupStatusEnum.REVEALED,
      GroupStatusEnum.COMPLETED,
    ];
    const nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    setCurrentStatus(statuses[nextIndex]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header con colores de marca oficial */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>
            Pana<Text style={styles.brandAccent}>Secreto</Text> 🎁
          </Text>
          <Text style={styles.subtitle}>Tu intercambio de amigos sin enredos</Text>
        </View>

        {/* Tarjeta de Sorteo Activo */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Navidad con los Panas 2026</Text>
            <View style={[styles.badge, { backgroundColor: getStatusColor(currentStatus) }]}>
              <Text style={styles.badgeText}>{currentStatus}</Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            Sorteo entre amigos y colegas. El monto sugerido es de $25 USD.
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Código de invitación:</Text>
            <Text style={styles.codeText}>PANA-2026</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Participantes:</Text>
            <Text style={styles.infoValue}>8 panas listos</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tu Asignación:</Text>
            <Text style={[styles.infoValue, { color: colors.accent, fontWeight: '700' }]}>
              {currentStatus === GroupStatusEnum.WAITING
                ? 'Esperando el sorteo ⏳'
                : 'Carlos Pérez 🤫'}
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={toggleStatus}>
            <Text style={styles.primaryButtonText}>Simular Cambio de Estado</Text>
          </TouchableOpacity>
        </View>

        {/* Paleta Oficial en Mobile */}
        <View style={styles.paletteSection}>
          <Text style={styles.sectionTitle}>Tokens Oficiales de PanaSecreto</Text>
          <View style={styles.paletteGrid}>
            <View style={[styles.colorChip, { backgroundColor: colors.primary }]}>
              <Text style={styles.chipTextLight}>Morado Noche</Text>
            </View>
            <View style={[styles.colorChip, { backgroundColor: colors.secondary }]}>
              <Text style={styles.chipTextDark}>Amarillo Araguaney</Text>
            </View>
            <View style={[styles.colorChip, { backgroundColor: colors.accent }]}>
              <Text style={styles.chipTextLight}>Azul Caribe</Text>
            </View>
            <View style={[styles.colorChip, { backgroundColor: colors.danger }]}>
              <Text style={styles.chipTextLight}>Rojo Guacamaya</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatusColor(status: GroupStatus): string {
  switch (status) {
    case GroupStatusEnum.WAITING:
      return colors.secondary;
    case GroupStatusEnum.LOCKED:
      return colors.accent;
    case GroupStatusEnum.REVEALED:
      return colors.primary;
    case GroupStatusEnum.COMPLETED:
      return colors.success;
    default:
      return colors.muted;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    padding: spacing.md,
    backgroundColor: colors.background,
    minHeight: '100%',
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.surface,
  },
  brandAccent: {
    color: colors.secondary,
  },
  subtitle: {
    fontSize: 14,
    color: '#D8D4E5',
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: 12,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  paletteSection: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  colorChip: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  chipTextLight: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextDark: {
    color: colors.textDark,
    fontSize: 11,
    fontWeight: '700',
  },
});
