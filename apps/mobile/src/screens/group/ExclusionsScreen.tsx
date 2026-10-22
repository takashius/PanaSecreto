import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Alert } from '../../components/common/AppDialog';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CircleHelp, ShieldCheck, TriangleAlert, ArrowLeftRight, Trash2, Ban, Plus, CircleCheck } from 'lucide-react-native';
import { theme, wishFormStyles as form, exclusionsStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { isDrawPossible } from '../../utils/drawFeasibility';
import type { GroupDetailView, GroupExclusionPreview, GroupMemberPreview } from '../../types/session';

const firstName = (m: GroupMemberPreview) => m.fullname.split(' ')[0];
const AVATAR_COLORS = [theme.colors.primary, theme.colors.coral, theme.colors.accentDark, theme.colors.secondaryDark];
const colorFor = (id: string) => AVATAR_COLORS[Math.abs([...id].reduce((n, c) => n + c.charCodeAt(0), 0)) % AVATAR_COLORS.length];
const newRuleId = () => `x-${Date.now()}`;

interface ExclusionsScreenProps {
  group: GroupDetailView;
  onSave: (exclusions: GroupExclusionPreview[]) => void;
  onCancel: () => void;
}

/** Exclusiones del sorteo (solo la organización, antes del sorteo) con validación de que el sorteo siga siendo posible */
export const ExclusionsScreen: React.FC<ExclusionsScreenProps> = ({ group, onSave, onCancel }) => {
  const insets = useSafeAreaInsets();
  const [rules, setRules] = useState<GroupExclusionPreview[]>(group.exclusions);
  const [first, setFirst] = useState<string | null>(null);
  const [second, setSecond] = useState<string | null>(null);

  const members = group.members;
  const byId = (id?: string) => members.find((m) => m.id === id);
  const possible = isDrawPossible(members.map((m) => m.id), rules);
  const dirty = JSON.stringify(rules) !== JSON.stringify(group.exclusions);
  const exists = (a: string, b: string) => rules.some((r) => (r.aId === a && r.bId === b) || (r.aId === b && r.bId === a));
  const canAdd = !!first && !!second && first !== second && !exists(first, second);
  // Avisa antes de agregar si esa regla haría imposible el sorteo
  const wouldBreak = canAdd && !isDrawPossible(members.map((m) => m.id), [...rules, { aId: first, bId: second }]);

  const addRule = () => {
    const a = byId(first ?? undefined);
    const b = byId(second ?? undefined);
    if (!a || !b) return;
    const apply = () => {
      setRules((r) => [...r, { id: newRuleId(), a: firstName(a), b: firstName(b), aId: a.id, bId: b.id }]);
      setFirst(null);
      setSecond(null);
    };
    if (wouldBreak) {
      Alert.alert('¡Ojo con los bloqueos!', 'Con esta regla el sorteo se vuelve imposible. ¿La agregas igual?', [
        { text: 'No', style: 'cancel' },
        { text: 'Agregar igual', style: 'destructive', onPress: apply },
      ]);
    } else apply();
  };

  const handleSave = () => {
    if (!possible) {
      Alert.alert('El sorteo no cuadra', 'Con estas reglas no hay forma de repartir los sobres. Quita alguna exclusión antes de guardar.');
      return;
    }
    // Al conectar la API: PUT /api/group/:id/exclusions
    onSave(rules);
  };

  const handleCancel = () => {
    if (!dirty) return onCancel();
    Alert.alert('¿Descartar cambios?', 'Las reglas que cambiaste no se guardarán.', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: onCancel },
    ]);
  };

  const renderPicker = (selected: string | null, setSelected: (id: string | null) => void, other: string | null) => (
    <View style={form.chips}>
      {members.map((m) => {
        const active = selected === m.id;
        const disabled = m.id === other;
        return (
          <TouchableOpacity
            key={m.id}
            style={[styles.memberChip, active && styles.memberChipActive, disabled && styles.memberChipDisabled]}
            onPress={() => setSelected(active ? null : m.id)}
            disabled={disabled}
            activeOpacity={0.85}
          >
            <View style={styles.memberChipAvatar}>
              <Text style={styles.memberChipAvatarText}>{m.initials}</Text>
            </View>
            <Text style={[styles.memberChipText, active && styles.memberChipTextActive]}>{firstName(m)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={form.container} edges={['top']}>
      <View style={form.header}>
        <TouchableOpacity style={form.headerButton} onPress={handleCancel} accessibilityLabel="Volver">
          <ArrowLeft size={22} color={theme.colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={form.headerCenter}>
          <Text style={form.headerTitle}>Exclusiones</Text>
          <Text style={form.headerSubtitle}>{group.name}</Text>
        </View>
        <TouchableOpacity
          style={form.headerButton}
          onPress={() =>
            Alert.alert('¿Para qué sirven?', 'Evitan que parejas, hermanos o panas que viven juntos se regalen entre sí. La regla funciona en los dos sentidos.')
          }
          accessibilityLabel="Ayuda"
        >
          <CircleHelp size={22} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={form.scrollContent}>
        <View style={form.tipCard}>
          <Image source={BRAND_ISOTIPO} style={form.mascot} />
          <View style={{ flex: 1 }}>
            <Text style={form.tipTitle}>¿Para qué sirven las exclusiones?</Text>
            <Text style={form.tipText}>Evita que parejas o hermanitos se regalen entre sí. El sorteo nunca les tocará el mismo papelito.</Text>
          </View>
        </View>

        <View style={[styles.statusCard, !possible && styles.statusCardBad]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusIcon, !possible && styles.statusIconBad]}>
              {possible ? <ShieldCheck size={22} color={theme.colors.white} /> : <TriangleAlert size={22} color={theme.colors.white} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>{possible ? '¡Todo chévere con el cuadre!' : 'Así el sorteo no cuadra'}</Text>
              <Text style={styles.statusText}>
                {possible
                  ? `El sorteo sigue siendo posible con ${members.length} panas y ${rules.length} ${rules.length === 1 ? 'regla' : 'reglas'}.`
                  : 'Hay demasiadas exclusiones para la cantidad de panas. Quita alguna para poder sortear.'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Reglas activas</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{rules.length}</Text>
          </View>
        </View>
        {rules.length === 0 ? (
          <Text style={styles.emptyRules}>Aún no hay exclusiones. Todos pueden regalarle a cualquiera.</Text>
        ) : (
          rules.map((r) => {
            const a = byId(r.aId);
            const b = byId(r.bId);
            return (
              <View key={r.id} style={styles.ruleCard}>
                <View style={styles.pairAvatars}>
                  <View style={[styles.avatar, { backgroundColor: colorFor(r.aId ?? r.a) }]}>
                    <Text style={styles.avatarText}>{a?.initials ?? r.a.charAt(0)}</Text>
                  </View>
                  <View style={styles.pairLink}>
                    <ArrowLeftRight size={13} color={theme.colors.primary} strokeWidth={2.6} />
                  </View>
                  <View style={[styles.avatar, { backgroundColor: colorFor(r.bId ?? r.b) }]}>
                    <Text style={styles.avatarText}>{b?.initials ?? r.b.charAt(0)}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ruleNames}>
                    {a?.fullname ?? r.a} ↔ {b?.fullname ?? r.b}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ban size={12} color={theme.colors.coral} />
                    <Text style={styles.ruleText}>No se regalan entre sí</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => setRules((list) => list.filter((x) => x.id !== r.id))}
                  accessibilityLabel="Quitar exclusión"
                >
                  <Trash2 size={18} color={theme.colors.coral} />
                </TouchableOpacity>
              </View>
            );
          })
        )}

        <View style={form.card}>
          <View style={form.labelRow}>
            <Plus size={20} color={theme.colors.accentDark} strokeWidth={2.6} />
            <Text style={form.label}>Agregar nueva regla</Text>
          </View>
          <Text style={form.tipText}>Elige a dos panas que no deben regalarse entre sí.</Text>
          <Text style={styles.pickLabel}>Primer pana</Text>
          {renderPicker(first, setFirst, second)}
          <View style={styles.vsChip}>
            <Ban size={13} color={theme.colors.coral} />
            <Text style={styles.vsChipText}>NO SE REGALAN</Text>
          </View>
          <Text style={styles.pickLabel}>Segundo pana</Text>
          {renderPicker(second, setSecond, first)}
          {!!first && !!second && exists(first, second) && <Text style={form.errorText}>Esa regla ya existe.</Text>}
          <TouchableOpacity style={[styles.addButton, !canAdd && { opacity: 0.4 }]} onPress={addRule} disabled={!canAdd} activeOpacity={0.85}>
            <Plus size={20} color={theme.colors.primary} strokeWidth={2.6} />
            <Text style={styles.addButtonText}>Agregar exclusión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.warningCard}>
          <TriangleAlert size={24} color={theme.colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.warningTitle}>¡Ojo con los bloqueos, mi pana!</Text>
            <Text style={styles.warningText}>
              Si agregas demasiadas exclusiones en un grupo de {members.length} personas, el sorteo puede volverse imposible. Te avisamos
              apenas pase.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[form.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TouchableOpacity style={[form.saveButton, !dirty && { opacity: 0.5 }]} onPress={handleSave} disabled={!dirty} activeOpacity={0.85}>
          <CircleCheck size={22} color={theme.colors.primary} strokeWidth={2.4} />
          <Text style={form.saveButtonText}>Guardar cambios</Text>
        </TouchableOpacity>
        <TouchableOpacity style={form.cancelButton} onPress={handleCancel}>
          <Text style={form.cancelText}>Cancelar y volver al grupo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ExclusionsScreen;
