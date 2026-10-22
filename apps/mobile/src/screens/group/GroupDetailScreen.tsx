import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
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
import type { ChatRoomSummary, GroupDetailView, GroupMemberPreview, WishPreview } from '../../types/session';

interface GroupDetailScreenProps {
  onNavigateBack: () => void;
  /** Cambio de pestaña principal desde la barra inferior (Chats, Deseos, Perfil) */
  onNavigateTab?: (tab: DashboardTab) => void;
  initialTab?: GroupDetailTab;
  /** Datos del grupo (vienen de la API, adaptados con toGroupDetailView) */
  group: GroupDetailView;
  onTabChange?: (tab: GroupDetailTab) => void;
  /** Deslizar para recargar */
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Acciones (cada pantalla contenedora llama a la API y recarga) */
  onDraw?: () => void;
  onResetDraw?: () => void;
  onReveal?: () => void;
  onComplete?: () => void;
  onRemoveMember?: (member: GroupMemberPreview) => void;
  onOpenEnvelope?: () => void;
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
  group,
  onTabChange,
  refreshing = false,
  onRefresh,
  onDraw,
  onResetDraw,
  onReveal,
  onComplete,
  onRemoveMember,
  onOpenEnvelope,
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

  const setTab = (next: GroupDetailTab) => {
    setTabState(next);
    onTabChange?.(next);
  };

  const isWaiting = group.status === 'WAITING';
  const canManage = group.isOrganizer && isWaiting;

  const handleMore = () => {
    if (group.isOrganizer) {
      Alert.alert(group.name, undefined, [
        { text: 'Editar grupo', onPress: () => (onEditGroup ? onEditGroup() : soon('Editar grupo')) },
        ...(isWaiting ? [{ text: 'Gestionar exclusiones', onPress: () => (onManageExclusions ? onManageExclusions() : soon('Exclusiones')) }] : []),
        ...(group.status === 'LOCKED'
          ? [
              {
                text: 'Revelar quién era quién',
                onPress: () =>
                  Alert.alert('🎉 ¿Hacemos el destape?', 'Todos verán a quién le regaló cada quien y el chat quedará de solo lectura.', [
                    { text: 'Todavía no', style: 'cancel' },
                    { text: '¡Revelar!', onPress: () => onReveal?.() },
                  ]),
              },
              {
                text: 'Deshacer el sorteo',
                onPress: () =>
                  Alert.alert('¿Deshacer el sorteo?', 'Los sobres actuales dejan de valer, se borran los comentarios y el grupo vuelve a aceptar panas.', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Deshacer', style: 'destructive', onPress: () => onResetDraw?.() },
                  ]),
              },
            ]
          : []),
        ...(group.status === 'LOCKED' || group.status === 'REVEALED'
          ? [
              {
                text: 'Finalizar intercambio',
                onPress: () =>
                  Alert.alert('¿Finalizar el intercambio?', 'El grupo pasará al histórico y ya no se podrá editar.', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Finalizar', onPress: () => onComplete?.() },
                  ]),
              },
            ]
          : []),
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
          Alert.alert(`¿Quitar a ${member.fullname}?`, 'Se borrará su lista de deseos de este grupo y le avisaremos por correo.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Quitar', style: 'destructive', onPress: () => onRemoveMember?.(member) },
          ]),
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
        { text: '¡Dale!', onPress: () => onDraw?.() },
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
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />
          ) : undefined
        }
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
              onSeeAll={() =>
                Alert.alert(
                  `Panas de ${group.name}`,
                  group.members.map((m) => `• ${m.fullname}${m.isOrganizer ? ' (organiza)' : ''}${m.isMe ? ' (tú)' : ''}`).join('\n')
                )
              }
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
            onOpen={() => onOpenEnvelope?.()}
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
