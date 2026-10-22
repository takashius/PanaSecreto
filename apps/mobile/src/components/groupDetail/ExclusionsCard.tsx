import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Shield, ArrowLeftRight } from 'lucide-react-native';
import { theme, groupDetailStyles as styles } from '../../styles';
import type { GroupExclusionPreview } from '../../types/session';

interface Props {
  exclusions: GroupExclusionPreview[];
  onManage: () => void;
}

/** Reglas para que ciertas personas no se regalen entre sí (solo la organización) */
export const ExclusionsCard: React.FC<Props> = ({ exclusions, onManage }) => {
  const first = exclusions[0];
  const summary =
    exclusions.length === 0
      ? 'Sin reglas activas'
      : `(No se regalan) · ${exclusions.length} ${exclusions.length === 1 ? 'regla activa' : 'reglas activas'}`;

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Shield size={18} color={theme.colors.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.sectionTitleBox}>
          <Text style={styles.sectionTitle}>Exclusiones de sorteo</Text>
          <Text style={styles.sectionSubtitle}>Evita que parejas o panas se regalen entre sí</Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.insetBox, styles.exclusionRow]} onPress={onManage} activeOpacity={0.8}>
        <ArrowLeftRight size={22} color={theme.colors.secondary} strokeWidth={2.4} />
        <View style={{ flex: 1 }}>
          <Text style={styles.exclusionPair}>{first ? `${first.a} ↔ ${first.b}` : 'Agrega una exclusión'}</Text>
          <Text style={styles.sectionSubtitle}>{summary}</Text>
        </View>
        <Text style={styles.linkText}>Gestionar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ExclusionsCard;
