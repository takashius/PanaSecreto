import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Alert } from '../../components/common/AppDialog';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MoreVertical } from 'lucide-react-native';
import { theme, groupDetailStyles as styles } from '../../styles';
import { FloatingTabBar, type DashboardTab } from '../../components/common/FloatingTabBar';
import { GroupDetailHero } from '../../components/groupDetail/GroupDetailHero';
import { GroupDetailTabs, type GroupDetailTab } from '../../components/groupDetail/GroupDetailTabs';
import { SummaryStats } from '../../components/groupDetail/SummaryStats';
import { MeetingPlaceCard } from '../../components/groupDetail/MeetingPlaceCard';
import { InviteCard } from '../../components/groupDetail/InviteCard';
import { MembersCard } from '../../components/groupDetail/MembersCard';
import { ExclusionsCard } from '../../components/groupDetail/ExclusionsCard';
import { DrawSection } from '../../components/groupDetail/DrawSection';
import { EnvelopeTab } from '../../components/envelope/EnvelopeTab';
import { ChatTabPreview } from '../../components/chat/ChatTabPreview';
import { MOCK_GROUP_DETAIL } from '../../mocks/groupDetail';
import type { ChatRoomSummary, GroupDetailView, GroupMemberPreview, WishPreview } from '../../types/session';

interface GroupDetailScreenProps {
  onNavigateBack: () => void;
  /** Cambio de pestaña principal desde la barra inferior (Chats, Deseos, Perfil) */
  onNavigateTab?: (tab: DashboardTab) => void;
  initialTab?: GroupDetailTab;
  /** Datos del grupo; mientras no hay API se usan los de ejemplo */
  group?: GroupDetailView;
  /** Avisa cambios locales (sorteo, sobre abierto…) para conservarlos al navegar */
  onGroupChange?: (group: GroupDetailView) => void;
  onTabChange?: (tab: GroupDetailTab) => void;
  onOpenWish?: (wish: WishPreview) => void;
  /** Sala de chat del grupo (para la vista previa de la pestaña Chat) */
  chatRoom?: ChatRoomSummary | null;
  onOpenChat?: () => void;
  /** Organización: editar grupo, exclusiones y eliminar */
  onEditGroup?: () => void;
  onManageExclusions?: () => void;
  onDeleteGroup?: () => void;
  onLeaveGroup?: () => void;
  onOpenReveal?: () => void;
  /** Mensajes sin leer en todos los chats (badge de la barra inferior) */
  chatUnread?: number;
}

const soon = (title: string) => Alert.alert(title, 'Esta pantalla se maqueta en el próximo paso.');

/** Detalle del grupo: Resumen, Mi sobre y Chat (próximo paso) */
export const GroupDetailScreen: React.FC<GroupDetailScreenProps> = ({
  onNavigateBack,
  onNavigateTab,
  initialTab = 'resumen',
  group: initialGroup = MOCK_GROUP_DETAIL,
  onGroupChange,
  onTabChange,
  onOpenWish,
  chatRoom,
  onOpenChat,
  onEditGroup,
  onManageExclusions,
  onDeleteGroup,
  onLeaveGroup,
  onOpenReveal,
  chatUnread = 0,
}) => {
  const insets = useSafeAreaInsets();
  const [tab, setTabState] = useState<GroupDetailTab>(initialTab);
  const [group, setGroupState] = useState<GroupDetailView>(initialGroup);

  const setTab = (next: GroupDetailTab) => {
    setTabState(next);
    onTabChange?.(next);
  };
  const setGroup = (update: (g: GroupDetailView) => GroupDetailView) => {
    const next = update(group);
    setGroupState(next);
    onGroupChange?.(next);
  };

  const isWaiting = group.status === 'WAITING';
  const canManage = group.isOrganizer && isWaiting;

  const handleMore = () => {
    if (group.isOrganizer) {
      Alert.alert(group.name, undefined, [
        { text: 'Editar grupo', onPress: () => (onEditGroup ? onEditGroup() : soon('Editar grupo')) },
        ...(isWaiting ? [{ text: 'Gestionar exclusiones', onPress: () => (onManageExclusions ? onManageExclusions() : soon('Exclusiones')) }] : []),
        {
          text: 'Eliminar grupo',
          style: 'destructive' as const,
          onPress: () =>
            Alert.alert('¿Eliminar el grupo?', `Se borrará «${group.name}» con sus sobres, deseos y chat. No se puede deshacer.`, [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: () => (onDeleteGroup ? onDeleteGroup() : soon('Eliminar grupo')) },
            ]),
        },
        { text: 'Cancelar', style: 'cancel' as const },
      ]);
    } else {
      Alert.alert(group.name, undefined, [
        ...(isWaiting
          ? [{
              text: 'Salir del grupo',
              style: 'destructive' as const,
              onPress: () =>
                Alert.alert('¿Salir del grupo?', `Dejarás «${group.name}» y se borrará tu lista de deseos de este grupo.`, [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Salir', style: 'destructive', onPress: () => (onLeaveGroup ? onLeaveGroup() : soon('Salir del grupo')) },
                ]),
            }]
          : []),
        { text: 'Cancelar', style: 'cancel' as const },
      ]);
    }
  };

  const handleMemberMenu = (member: GroupMemberPreview) => {
    Alert.alert(member.fullname, 'Antes del sorteo puedes quitar a un pana del grupo.', [
      {
        text: 'Quitar del grupo',
        style: 'destructive',
        onPress: () =>
          setGroup((g) => ({
            ...g,
            members: g.members.filter((m) => m.id !== member.id),
            membersCount: g.membersCount - 1,
          })),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleDraw = () => {
    Alert.alert(
      '🎲 ¿Hacemos el sorteo?',
      `Se cerrarán las inscripciones de «${group.name}» y cada pana recibirá su sobre secreto. Nadie sabrá quién le regala a quién hasta el día del intercambio.`,
      [
        { text: 'Todavía no', style: 'cancel' },
        {
          text: '¡Dale!',
          onPress: () => {
            setGroup((g) => ({
              ...g,
              status: 'LOCKED',
              // Sobre de ejemplo mientras no hay API (el backend lo genera al sortear)
              envelope: g.envelope ?? {
                alias: 'Pana Incógnito #07',
                exchangeAt: '2026-12-24T20:00:00-04:00',
                exchangeDateLong: 'jueves 24 de diciembre',
                wishes: [],
              },
            }));
            Alert.alert('¡Sorteo hecho! 🎉', 'Los sobres ya están listos. Abre el tuyo en «Mi sobre».');
          },
        },
      ]
    );
  };

  const handleBottomTab = (next: DashboardTab) => {
    if (next === 'grupos') onNavigateBack();
    else if (onNavigateTab) onNavigateTab(next);
    else soon(next === 'chats' ? 'Chats' : next === 'deseos' ? 'Deseos' : 'Perfil');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onNavigateBack} accessibilityLabel="Volver">
          <ArrowLeft size={22} color={theme.colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Grupo</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleMore} accessibilityLabel="Más opciones">
          <MoreVertical size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 96 }]}
        showsVerticalScrollIndicator={false}
      >
        <GroupDetailHero group={group} />
        <GroupDetailTabs
          active={tab}
          onChange={setTab}
          envelopeLocked={isWaiting}
          unreadChat={chatRoom ? chatRoom.unread : group.unreadChat}
        />

        {tab === 'resumen' && (
          <>
            <SummaryStats group={group} />
            <MeetingPlaceCard
              location={group.location}
              note={group.note}
              canEdit={group.isOrganizer}
              onEdit={() => (onEditGroup ? onEditGroup() : soon('Editar lugar del encuentro'))}
            />
            {isWaiting && (
              <InviteCard
                groupName={group.name}
                code={group.inviteCode}
                missing={Math.max(group.maxMembers - group.membersCount, 0)}
              />
            )}
            <MembersCard
              members={group.members}
              membersCount={group.membersCount}
              maxMembers={group.maxMembers}
              canManage={canManage}
              onMemberMenu={handleMemberMenu}
              onSeeAll={() => soon('Todos los panas')}
            />
            {canManage && <ExclusionsCard exclusions={group.exclusions} onManage={() => (onManageExclusions ? onManageExclusions() : soon('Exclusiones'))} />}
            <DrawSection
              status={group.status}
              isOrganizer={group.isOrganizer}
              organizerName={group.organizerName}
              membersCount={group.membersCount}
              onDraw={handleDraw}
              onOpenEnvelope={() => setTab('sobre')}
            />
          </>
        )}

        {tab === 'sobre' && (
          <EnvelopeTab
            group={group}
            opened={!!group.envelopeOpened}
            // Al conectar la API, abrir el sobre se registrará en el servidor
            onOpen={() => setGroup((g) => ({ ...g, envelopeOpened: true }))}
            onOpenReveal={onOpenReveal}
            onOpenWish={(wish: WishPreview) => (onOpenWish ? onOpenWish(wish) : soon(`Detalle del deseo · ${wish.title}`))}
          />
        )}

        {tab === 'chat' && (
          <ChatTabPreview room={chatRoom} onOpen={() => (onOpenChat ? onOpenChat() : soon('Chat del grupo'))} />
        )}
      </ScrollView>

      <FloatingTabBar activeTab="grupos" onTabChange={handleBottomTab} badges={{ chats: chatUnread }} />
    </SafeAreaView>
  );
};

export default GroupDetailScreen;
