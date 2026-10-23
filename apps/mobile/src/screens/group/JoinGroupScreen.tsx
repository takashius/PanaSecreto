import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Alert } from '../../components/common/AppDialog';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CircleHelp, Sparkles, Check, CalendarDays, Banknote, MapPin, Users, ShieldCheck, Pencil, Search } from 'lucide-react-native';
import { theme, wishFormStyles as form, joinGroupStyles as styles, groupDetailStyles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { exchangeLabels, formatBudget, normalizeInviteCode } from '../../utils/format';
import type { JoinPreview } from '../../types/session';
import { joinByCode, previewByCode, type ApiJoinPreview } from '../../api/groupDetail';
import { ApiError, errorMessage } from '../../api/client';

/** Vista previa del grupo + si puedo entrar */
type Preview = JoinPreview & { alreadyMember: boolean; canJoin: boolean; closedReason: string | null };

function toPreview(code: string, p: ApiJoinPreview): Preview {
  const labels = exchangeLabels(p.exchangeDate);
  const full = p.memberCount >= p.maxParticipants;
  return {
    code,
    groupId: p.id,
    emoji: p.emoji || '🎁',
    name: p.name,
    organizerName: p.creatorName,
    exchangeDateLabel: labels.dateLabel,
    exchangeTimeLabel: labels.timeLabel,
    currency: p.currency,
    budgetMin: p.budgetMin,
    budgetMax: p.budgetMax,
    location: p.location,
    membersCount: p.memberCount,
    maxMembers: p.maxParticipants,
    memberInitials: p.members.map((m) => m.initials),
    alreadyMember: p.alreadyMember,
    canJoin: p.canJoin,
    closedReason: p.alreadyMember || p.canJoin
      ? null
      : p.status !== 'WAITING'
        ? 'El sorteo de este grupo ya se hizo, así que no admite panas nuevos.'
        : full
          ? 'El grupo ya llenó su cupo. Pídele a quien organiza que lo amplíe.'
          : 'Este grupo no admite panas nuevos.',
  };
}

const CODE_LENGTH = 12; // PANA-XXXX-XX

interface JoinGroupScreenProps {
  initialCode?: string;
  /** Ya entré: abre el grupo (y la elección del alias) */
  onJoined: (groupId: string) => void;
  onOpenGroup: (groupId: string) => void;
  onNavigateBack: () => void;
}

/** Unirse a un grupo: escribir el código y confirmar con la vista previa del grupo */
export const JoinGroupScreen: React.FC<JoinGroupScreenProps> = ({ initialCode = '', onJoined, onOpenGroup, onNavigateBack }) => {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState(normalizeInviteCode(initialCode));
  const [focused, setFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [joining, setJoining] = useState(false);

  const complete = code.length === CODE_LENGTH;
  const alreadyMember = !!preview?.alreadyMember;

  const search = async () => {
    if (!complete || searching) return;
    setSearching(true);
    setError(null);
    try {
      setPreview(toPreview(code, await previewByCode(code)));
    } catch (e) {
      setError(
        e instanceof ApiError && (e.status === 404 || e.status === 400)
          ? 'No encontramos ningún grupo con ese código. Revisa que esté bien escrito o pídele uno nuevo a quien organiza.'
          : errorMessage(e)
      );
    } finally {
      setSearching(false);
    }
  };

  const join = async () => {
    if (!preview) return;
    if (alreadyMember) return onOpenGroup(preview.groupId);
    if (preview.closedReason) return Alert.alert('No se puede entrar', preview.closedReason);
    setJoining(true);
    try {
      const group = await joinByCode(preview.code);
      onJoined(group.id);
    } catch (e) {
      Alert.alert('No pudimos unirte', errorMessage(e));
    } finally {
      setJoining(false);
    }
  };

  const spots = preview ? preview.maxMembers - preview.membersCount : 0;
  const fill = preview ? Math.round((preview.membersCount / Math.max(preview.maxMembers, 1)) * 100) : 0;

  return (
    <SafeAreaView style={form.container} edges={['top']}>
      <View style={form.header}>
        <TouchableOpacity style={form.headerButton} onPress={onNavigateBack} accessibilityLabel="Volver">
          <ArrowLeft size={22} color={theme.colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={form.headerCenter}>
          <Text style={form.headerSubtitle}>EntrePanas · Amigo Secreto</Text>
          <Text style={form.headerTitle}>Unirse a un grupo</Text>
        </View>
        <TouchableOpacity
          style={form.headerButton}
          onPress={() =>
            Alert.alert('¿Dónde está el código?', 'Quien organiza el grupo lo comparte por WhatsApp, correo o con un link. Tiene la forma PANA-XXXX-XX.')
          }
          accessibilityLabel="Ayuda"
        >
          <CircleHelp size={22} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior="padding" enabled={Platform.OS === 'ios'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={form.scrollContent} keyboardShouldPersistTaps="handled">
          {!preview ? (
            <>
              <View style={form.tipCard}>
                <Image source={BRAND_ISOTIPO} style={form.mascot} />
                <View style={{ flex: 1 }}>
                  <Text style={form.tipTitle}>¿Te llegó un código?</Text>
                  <Text style={form.tipText}>Escríbelo tal cual te lo pasaron. Lo buscamos y te mostramos el grupo antes de entrar.</Text>
                </View>
              </View>
              <View style={form.card}>
                <Text style={form.label}>Código de invitación</Text>
                <TextInput
                  style={[styles.codeInput, focused && styles.codeInputFocus, !!error && styles.codeInputError]}
                  value={code}
                  onChangeText={(v) => {
                    setCode(normalizeInviteCode(v));
                    setError(null);
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="PANA-XXXX-XX"
                  placeholderTextColor={theme.colors.outlineVariant}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={() => void search()}
                />
                {error ? (
                  <Text style={form.errorText}>{error}</Text>
                ) : (
                  <Text style={styles.infoHint}>Tiene la forma PANA-XXXX-XX. No importan mayúsculas ni minúsculas.</Text>
                )}
              </View>
            </>
          ) : (
            <>
              <View style={styles.successHero}>
                <Image source={BRAND_ISOTIPO} style={styles.successMascot} />
                <View style={styles.successChip}>
                  <Sparkles size={14} color={theme.colors.secondaryDark} />
                  <Text style={styles.successChipText}>¡Código verificado!</Text>
                </View>
                <Text style={styles.successTitle}>{alreadyMember ? '¡Ya estás en esta parranda!' : '¡Encontramos tu parranda!'}</Text>
                <Text style={styles.successText}>
                  {alreadyMember
                    ? 'Eres miembro de este grupo. Puedes entrar directo a verlo.'
                    : 'El sobre ya está en la mesa y te están esperando para el sorteo del amigo secreto.'}
                </Text>
                <View style={styles.codePill}>
                  <Check size={16} color={theme.colors.success} strokeWidth={3} />
                  <Text style={styles.codePillText}>Código: {preview.code}</Text>
                </View>
              </View>

              <View style={form.card}>
                <View style={styles.groupRow}>
                  <View style={styles.groupEmoji}>
                    <Text style={{ fontSize: 30 }}>{preview.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupName}>{preview.name}</Text>
                    <Text style={styles.groupOrganizer}>
                      Organizado por <Text style={form.strong}>{preview.organizerName}</Text> ✨
                    </Text>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoBox}>
                    <CalendarDays size={20} color={theme.colors.coral} strokeWidth={2.2} />
                    <Text style={styles.infoLabel}>Intercambio</Text>
                    <Text style={styles.infoValue}>{preview.exchangeDateLabel}</Text>
                    <Text style={styles.infoHint}>{preview.exchangeTimeLabel}</Text>
                  </View>
                  <View style={styles.infoBox}>
                    <Banknote size={20} color={theme.colors.secondaryDark} strokeWidth={2.2} />
                    <Text style={styles.infoLabel}>Presupuesto</Text>
                    <Text style={styles.infoValue}>{formatBudget(preview.currency, preview.budgetMin, preview.budgetMax)}</Text>
                    <Text style={styles.infoHint}>{preview.currency === 'USD' ? 'USD' : 'Bolívares'}</Text>
                  </View>
                </View>

                {!!preview.location && (
                  <View style={[styles.infoBox, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                    <MapPin size={20} color={theme.colors.accentDark} strokeWidth={2.2} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.infoValue}>«{preview.location.name}»</Text>
                      <Text style={styles.infoHint}>{preview.location.address}</Text>
                    </View>
                  </View>
                )}

                <View style={{ gap: 8 }}>
                  <View style={styles.membersTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Users size={18} color={theme.colors.primary} strokeWidth={2.2} />
                      <Text style={form.strong}>Panas confirmados</Text>
                    </View>
                    {spots > 0 && spots <= 3 && (
                      <View style={styles.spotsChip}>
                        <Text style={styles.spotsChipText}>¡Solo quedan {spots} cupos!</Text>
                      </View>
                    )}
                  </View>
                  <View style={groupDetailStyles.progressTrack}>
                    <View style={[groupDetailStyles.progressFill, { width: `${fill}%` }]} />
                  </View>
                  <View style={styles.membersTop}>
                    <View style={styles.avatars}>
                      {preview.memberInitials.slice(0, 5).map((ini, i) => (
                        <View key={ini} style={[styles.avatar, { marginLeft: i ? -8 : 0 }]}>
                          <Text style={styles.avatarText}>{ini}</Text>
                        </View>
                      ))}
                      {preview.membersCount > 5 && (
                        <View style={[styles.avatar, { marginLeft: -8, backgroundColor: theme.colors.primary }]}>
                          <Text style={[styles.avatarText, { color: theme.colors.white }]}>+{preview.membersCount - 5}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.infoHint}>
                      {preview.membersCount} de {preview.maxMembers} panas
                    </Text>
                  </View>
                </View>
              </View>

              <View style={form.privacyCard}>
                <ShieldCheck size={26} color={theme.colors.accentDark} strokeWidth={2.2} />
                <View style={{ flex: 1 }}>
                  <Text style={form.tipTitle}>Anonimato 100% blindado 🛡️</Text>
                  <Text style={form.tipText}>
                    Al unirte, nadie sabrá a quién le regalas ni quién te regala hasta la revelación. Podrás armar tu lista de deseos y
                    lanzar pistas con tu alias secreto.
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <View style={[form.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {!preview ? (
            <TouchableOpacity
              style={[form.saveButton, (!complete || searching) && { opacity: 0.5 }]}
              onPress={() => void search()}
              disabled={!complete || searching}
              activeOpacity={0.85}
            >
              {searching ? <ActivityIndicator color={theme.colors.primary} /> : <Search size={22} color={theme.colors.primary} strokeWidth={2.4} />}
              <Text style={form.saveButtonText}>{searching ? 'Buscando…' : 'Buscar grupo'}</Text>
            </TouchableOpacity>
          ) : (
            <>
              {preview.closedReason ? <Text style={[form.errorText, { textAlign: 'center', marginBottom: 8 }]}>{preview.closedReason}</Text> : null}
              <TouchableOpacity
                style={[form.saveButton, (joining || !!preview.closedReason) && { opacity: 0.5 }]}
                onPress={() => void join()}
                disabled={joining || !!preview.closedReason}
                activeOpacity={0.85}
              >
                {joining ? <ActivityIndicator color={theme.colors.primary} /> : null}
                <Text style={form.saveButtonText}>{alreadyMember ? 'Ver el grupo' : joining ? 'Entrando…' : '¡Unirme al grupo! 🎁'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setPreview(null);
                  setCode('');
                }}
              >
                <Pencil size={16} color={theme.colors.textMuted} />
                <Text style={styles.secondaryButtonText}>No es mi grupo, cambiar código</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default JoinGroupScreen;
