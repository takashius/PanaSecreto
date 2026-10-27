import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Alert } from '../../components/common/AppDialog';
import { theme, groupDetailStyles as styles } from '../../styles';
import { useAuth } from '../../auth/AuthContext';
import { fetchQuery, useApiQuery } from '../../api/queryStore';
import { ApiError, errorMessage } from '../../api/client';
import { fetchMyGroups, MY_GROUPS_KEY } from '../../api/groups';
import * as groupApi from '../../api/groupDetail';
import { fetchGroupBundle, groupKey, type ApiGroup } from '../../api/groupDetail';
import { toGroupDetailView } from '../../adapters/groupView';
import type { DashboardTab } from '../../components/common/FloatingTabBar';
import type { GroupDetailTab } from '../../components/groupDetail/GroupDetailTabs';
import type { GroupDetailView, GroupExclusionPreview, WishPreview } from '../../types/session';
import { useChatPreview } from '../chat/ChatScreens';
import GroupDetailScreen from './GroupDetailScreen';
import EditGroupScreen from './EditGroupScreen';
import ExclusionsScreen from './ExclusionsScreen';
import RevealScreen from './RevealScreen';
import { AliasPickerModal } from '../../components/alias/AliasPickerModal';

/**
 * Contenedores de las pantallas del grupo conectadas a la API.
 * Cargan el grupo (con sobre, deseos del pana y revelación), lo adaptan a los tipos de vista
 * y ejecutan las acciones (sortear, quitar panas, editar, exclusiones…).
 */

/** Carga y adapta el grupo; varias pantallas comparten la misma consulta */
export function useGroupDetail(groupId: string) {
  const { user } = useAuth();
  const fetcher = useCallback(() => fetchGroupBundle(groupId), [groupId]);
  // 10 s de margen: volver al grupo no recarga todo; tras cada acción se recarga explícitamente
  const query = useApiQuery(groupKey(groupId), fetcher, { enabled: Boolean(groupId), staleMs: 10_000 });
  const view = useMemo(() => (query.data ? toGroupDetailView(query.data, user?._id ?? '') : null), [query.data, user?._id]);
  return { ...query, view, bundle: query.data };
}

/** Recarga el grupo y la lista del inicio después de un cambio */
export async function refreshGroup(groupId: string) {
  await Promise.all([fetchQuery(groupKey(groupId), () => fetchGroupBundle(groupId)), fetchQuery(MY_GROUPS_KEY, fetchMyGroups)]);
}

/** Ejecuta una acción con indicador de "trabajando" y muestra el error si falla */
function useAction() {
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (label: string, task: () => Promise<unknown>, onError?: (e: unknown) => boolean): Promise<boolean> => {
    setBusy(label);
    try {
      await task();
      return true;
    } catch (error) {
      if (!onError?.(error)) Alert.alert('No se pudo completar', errorMessage(error));
      return false;
    } finally {
      setBusy(null);
    }
  };
  return { busy, run };
}

function BusyOverlay({ label }: { label: string | null }) {
  if (!label) return null;
  return (
    <View style={styles.busyOverlay} pointerEvents="auto">
      <View style={styles.busyCard}>
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={styles.busyText}>{label}</Text>
      </View>
    </View>
  );
}

/** Encabezado + estado (cargando o error) mientras no hay datos */
export function GroupState({
  title,
  loading,
  message,
  onRetry,
  onBack,
}: {
  title: string;
  loading: boolean;
  message?: string;
  onRetry?: () => void;
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack} accessibilityLabel="Volver">
          <ArrowLeft size={22} color={theme.colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerButton} />
      </View>
      <View style={styles.stateCenter}>
        {loading ? (
          <>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.stateText}>Cargando…</Text>
          </>
        ) : (
          <>
            <Text style={styles.stateTitle}>No pudimos abrir esto</Text>
            <Text style={styles.stateText}>{message}</Text>
            {onRetry && (
              <TouchableOpacity style={styles.stateButton} onPress={onRetry} activeOpacity={0.85}>
                <Text style={styles.stateButtonText}>Reintentar</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const notFound = (e: ApiError | null) => e?.status === 404;

/* ==================================================================== Detalle */

interface DetailProps {
  groupId: string;
  initialTab?: GroupDetailTab;
  onTabChange?: (tab: GroupDetailTab) => void;
  onNavigateBack: () => void;
  onNavigateTab?: (tab: DashboardTab) => void;
  /** El grupo ya no existe para mí (lo eliminé, salí o me sacaron) */
  onGroupGone: () => void;
  onEditGroup: () => void;
  onManageExclusions: () => void;
  onOpenReveal: () => void;
  onOpenWish?: (wish: WishPreview) => void;
  onOpenChat?: () => void;
  chatUnread?: number;
  /** Abre la elección del alias apenas carga (al crear o unirse a un grupo) */
  promptAlias?: boolean;
}

export function GroupDetailContainer({ groupId, onGroupGone, promptAlias = false, ...nav }: DetailProps) {
  const detail = useGroupDetail(groupId);
  const chatPreview = useChatPreview(groupId);
  const { busy, run } = useAction();
  const [pulling, setPulling] = useState(false);
  const [aliasOpen, setAliasOpen] = useState(false);
  const [aliasDismissed, setAliasDismissed] = useState(false);
  const autoAlias = promptAlias && !aliasDismissed && detail.view?.status === 'WAITING' && !detail.view.myAlias;
  const closeAlias = () => {
    setAliasOpen(false);
    setAliasDismissed(true);
  };

  if (!detail.view) {
    return (
      <GroupState
        title="Detalle del Grupo"
        loading={detail.loading}
        message={notFound(detail.error) ? 'Este grupo ya no existe o ya no eres parte de él.' : detail.error?.message}
        onRetry={notFound(detail.error) ? undefined : () => void detail.refetch()}
        onBack={nav.onNavigateBack}
      />
    );
  }

  const act = (label: string, task: () => Promise<unknown>, success?: string, onError?: (e: unknown) => boolean) =>
    void run(label, async () => {
      await task();
      await refreshGroup(groupId);
      if (success) Alert.alert(success.split('|')[0], success.split('|')[1]);
    }, onError);

  const drawError = (e: unknown) => {
    if (!(e instanceof ApiError)) return false;
    if (e.code === 'NO_VALID_ASSIGNMENT') {
      const raw = (e.body as { blockedMembers?: unknown } | null)?.blockedMembers;
      const blocked = Array.isArray(raw) ? raw.map(String) : [];
      Alert.alert('El sorteo no cuadra 🤔', `${e.message}${blocked.length ? `\n\nRevisa a: ${blocked.join(', ')}.` : ''}`);
      return true;
    }
    if (e.code === 'NOT_ENOUGH_PARTICIPANTS') {
      Alert.alert('Faltan panas', e.message);
      return true;
    }
    return false;
  };

  return (
    <View style={{ flex: 1 }}>
      <GroupDetailScreen
        key={groupId}
        {...nav}
        group={detail.view}
        chatPreview={chatPreview}
        refreshing={pulling}
        onRefresh={() => {
          setPulling(true);
          void refreshGroup(groupId).finally(() => setPulling(false));
        }}
        onDraw={() => act('Sorteando…', () => groupApi.drawGroup(groupId), '¡Sorteo hecho! 🎉|Los sobres ya están listos. Abre el tuyo en «Mi sobre».', drawError)}
        onResetDraw={() => act('Deshaciendo el sorteo…', () => groupApi.resetDraw(groupId), 'Sorteo deshecho|El grupo vuelve a aceptar panas.')}
        onReveal={() => act('Revelando…', () => groupApi.revealGroup(groupId), '¡Destape! 🎉|Ya todos pueden ver quién era su pana secreto.')}
        onComplete={() => act('Finalizando…', () => groupApi.completeGroup(groupId), 'Intercambio finalizado|El grupo pasó al histórico.')}
        onRemoveMember={(m) => act('Quitando…', () => groupApi.removeMember(groupId, m.id))}
        onOpenEnvelope={() => act('Abriendo tu sobre…', () => groupApi.openEnvelope(groupId))}
        onChooseAlias={() => setAliasOpen(true)}
        onDeleteGroup={() =>
          void run('Eliminando…', async () => {
            await groupApi.deleteGroup(groupId);
            await fetchQuery(MY_GROUPS_KEY, fetchMyGroups);
            onGroupGone();
          })
        }
        onLeaveGroup={() =>
          void run('Saliendo del grupo…', async () => {
            await groupApi.leaveGroup(groupId);
            await fetchQuery(MY_GROUPS_KEY, fetchMyGroups);
            onGroupGone();
          })
        }
      />
      <BusyOverlay label={busy} />
      <AliasPickerModal
        visible={aliasOpen || autoAlias}
        groupId={groupId}
        groupName={detail.view.name}
        currentAlias={detail.view.myAlias}
        onClose={closeAlias}
        onSaved={(alias, emoji) => {
          closeAlias();
          void refreshGroup(groupId);
          Alert.alert('¡Alias listo! 🥸', `En «${detail.view?.name}» ahora eres ${emoji} ${alias}.`);
        }}
      />
    </View>
  );
}

/* ==================================================================== Editar */

/** Solo los campos que cambiaron (las reglas solo antes del sorteo, como exige la API) */
function updatePayload(next: GroupDetailView, current: ApiGroup): groupApi.UpdateGroupInput {
  const body: groupApi.UpdateGroupInput = {};
  if (next.name !== current.name) body.name = next.name;
  if (next.emoji !== (current.emoji || '🎁')) body.emoji = next.emoji;
  if (new Date(next.exchangeAt).getTime() !== new Date(current.exchangeDate).getTime()) body.exchangeDate = new Date(next.exchangeAt).toISOString();
  const nextLocation = next.location?.name?.trim() ? { name: next.location.name.trim(), address: next.location.address?.trim() ?? '' } : null;
  if (JSON.stringify(nextLocation) !== JSON.stringify(current.location)) body.location = nextLocation;
  const nextNote = next.note?.trim() || null;
  if (nextNote !== (current.note || null)) body.note = nextNote;
  if (current.status === 'WAITING') {
    if (next.currency !== current.currency) body.currency = next.currency;
    if (next.budgetMin !== current.budgetMin) body.budgetMin = next.budgetMin;
    if (next.budgetMax !== current.budgetMax) body.budgetMax = next.budgetMax;
    if (next.maxMembers !== current.maxParticipants) body.maxParticipants = next.maxMembers;
  }
  return body;
}

interface EditProps {
  groupId: string;
  onDone: () => void;
  onCancel: () => void;
  onGroupGone: () => void;
}

export function EditGroupContainer({ groupId, onDone, onCancel, onGroupGone }: EditProps) {
  const detail = useGroupDetail(groupId);
  const { busy, run } = useAction();
  if (!detail.view || !detail.bundle) {
    return <GroupState title="Editar grupo" loading={detail.loading} message={detail.error?.message} onRetry={() => void detail.refetch()} onBack={onCancel} />;
  }
  const current = detail.bundle.group;
  return (
    <View style={{ flex: 1 }}>
      <EditGroupScreen
        group={detail.view}
        onCancel={onCancel}
        onSave={(next) => {
          const body = updatePayload(next, current);
          if (Object.keys(body).length === 0) return onDone();
          void run('Guardando…', async () => {
            await groupApi.updateGroup(groupId, body);
            await refreshGroup(groupId);
            onDone();
          });
        }}
        onDelete={() =>
          void run('Eliminando…', async () => {
            await groupApi.deleteGroup(groupId);
            await fetchQuery(MY_GROUPS_KEY, fetchMyGroups);
            onGroupGone();
          })
        }
      />
      <BusyOverlay label={busy} />
    </View>
  );
}

/* ==================================================================== Exclusiones */

interface ExclusionsProps {
  groupId: string;
  onDone: () => void;
  onCancel: () => void;
}

export function ExclusionsContainer({ groupId, onDone, onCancel }: ExclusionsProps) {
  const detail = useGroupDetail(groupId);
  const { busy, run } = useAction();
  if (!detail.view || !detail.bundle) {
    return <GroupState title="Exclusiones" loading={detail.loading} message={detail.error?.message} onRetry={() => void detail.refetch()} onBack={onCancel} />;
  }
  const members = detail.bundle.group.members;

  const save = (rules: GroupExclusionPreview[]) => {
    // Cada pareja es mutua: A no le regala a B y B no le regala a A
    const desired = new Map<string, Set<string>>(members.map((m) => [m.userId, new Set<string>()]));
    for (const rule of rules) {
      if (!rule.aId || !rule.bId) continue;
      desired.get(rule.aId)?.add(rule.bId);
      desired.get(rule.bId)?.add(rule.aId);
    }
    const changed = members.filter((m) => {
      const before = new Set(m.exclusions ?? []);
      const after = desired.get(m.userId)!;
      return before.size !== after.size || [...after].some((x) => !before.has(x));
    });
    if (changed.length === 0) return onDone();
    void run('Guardando exclusiones…', async () => {
      let last: ApiGroup | null = null;
      for (const m of changed) last = await groupApi.setMemberExclusions(groupId, m.userId, [...desired.get(m.userId)!]);
      await refreshGroup(groupId);
      onDone();
      if (last?.drawPossible === false) {
        Alert.alert('Ojo con las exclusiones ⚠️', 'Con estas reglas el sorteo no tiene una combinación posible. Quita alguna antes de sortear.');
      }
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ExclusionsScreen group={detail.view} onSave={save} onCancel={onCancel} />
      <BusyOverlay label={busy} />
    </View>
  );
}

/* ==================================================================== Revelación */

interface RevealProps {
  groupId: string;
  onNavigateBack: () => void;
  onOpenWishlist: () => void;
  onOpenChat: () => void;
}

export function RevealContainer({ groupId, onNavigateBack, onOpenWishlist, onOpenChat }: RevealProps) {
  const detail = useGroupDetail(groupId);
  if (!detail.view) {
    return <GroupState title="El Gran Día" loading={detail.loading} message={detail.error?.message} onRetry={() => void detail.refetch()} onBack={onNavigateBack} />;
  }
  return <RevealScreen group={detail.view} onNavigateBack={onNavigateBack} onOpenWishlist={onOpenWishlist} onOpenChat={onOpenChat} />;
}
