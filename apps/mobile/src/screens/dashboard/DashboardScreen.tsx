import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, RefreshControl } from 'react-native';
import { Alert } from '../../components/common/AppDialog';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { PartyPopper, PlusCircle, ArrowRight, Crown, Users, Smartphone } from 'lucide-react-native';
import { theme, dashboardStyles } from '../../styles';
import { FloatingTabBar, DashboardTab } from '../../components/common/FloatingTabBar';
import { MainHeader } from '../../components/common/MainHeader';
import { GroupCard } from '../../components/dashboard/GroupCard';
import { EmptyGroups, GroupCardSkeleton, GroupsError } from '../../components/dashboard/GroupListStates';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { useApiQuery } from '../../api/queryStore';
import { fetchMyGroups, MY_GROUPS_KEY } from '../../api/groups';
import { CHAT_UNREAD_KEY, fetchChatUnread, fetchNotificationsUnread, NOTIFICATIONS_UNREAD_KEY } from '../../api/badges';
import { fetchTips, tipsKey } from '../../api/tips';
import { sortGroups } from '../../utils/groupLabels';
import type { SessionUser } from '../../types/session';

/** Tip de respaldo si el servidor aún no tiene tips para esta pantalla */
const FALLBACK_TIP = 'Sube qué te cuadra recibir para que tu pana secreto no te regale unas medias aburridas.';
const fetchGroupTips = () => fetchTips('grupos');

interface DashboardScreenProps {
  user?: SessionUser | null;
  onNavigateToCreateGroup?: () => void;
  /** Cambia de pestaña principal (Chats, Deseos, Perfil) */
  onNavigateTab?: (tab: DashboardTab) => void;
  onOpenNotifications?: () => void;
  /** Abre "Unirse a un grupo" */
  onJoinGroup?: () => void;
  /** Abre el detalle del grupo; 'sobre' entra directo a la pestaña Mi sobre */
  onOpenGroup?: (groupId: string, tab?: 'resumen' | 'sobre') => void;
}

export default function DashboardScreen({
  user,
  onNavigateToCreateGroup,
  onOpenGroup,
  onNavigateTab,
  onOpenNotifications,
  onJoinGroup,
}: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedSegment, setSelectedSegment] = useState<'creados' | 'participo'>('creados');
  const [tipIndex, setTipIndex] = useState(0);
  const [pulling, setPulling] = useState(false);

  const groupsQuery = useApiQuery(MY_GROUPS_KEY, fetchMyGroups);
  const notificationsQuery = useApiQuery(NOTIFICATIONS_UNREAD_KEY, fetchNotificationsUnread);
  const chatQuery = useApiQuery(CHAT_UNREAD_KEY, fetchChatUnread);
  const tipsQuery = useApiQuery(tipsKey('grupos'), fetchGroupTips, { staleMs: 30 * 60_000 });

  const { created, joined } = useMemo(() => {
    const all = sortGroups(groupsQuery.data ?? []);
    return {
      created: all.filter((g) => g.myRole === 'CREATOR'),
      joined: all.filter((g) => g.myRole !== 'CREATOR'),
    };
  }, [groupsQuery.data]);
  const visible = selectedSegment === 'creados' ? created : joined;

  const tips = tipsQuery.data ?? [];
  const tipText = tips.length > 0 ? tips[tipIndex % tips.length].text : FALLBACK_TIP;

  const firstName = user?.nickname || user?.name || 'Pana';

  const refreshAll = async () => {
    setPulling(true);
    await Promise.all([groupsQuery.refetch(), notificationsQuery.refetch(), chatQuery.refetch()]);
    setPulling(false);
  };

  const handleCreateGroup = () => onNavigateToCreateGroup?.();
  const handleEnterCode = () => onJoinGroup?.();
  const handleOpenGroup = (groupId: string, tab: 'resumen' | 'sobre' = 'resumen') => onOpenGroup?.(groupId, tab);

  const segmentCount = (segment: 'creados' | 'participo') =>
    groupsQuery.data ? (segment === 'creados' ? created.length : joined.length) : '–';

  return (
    <SafeAreaView style={dashboardStyles.container} edges={['top']}>
      {/* 1. Top Bar / App Header */}
      <MainHeader
        title="Mis Grupos"
        icon={PartyPopper}
        onBellPress={() =>
          onOpenNotifications ? onOpenNotifications() : Alert.alert('Notificaciones', '¡Todo al día! No tienes notificaciones pendientes.')
        }
        hasNotifications={(notificationsQuery.data ?? 0) > 0}
        onAvatarPress={() => onNavigateTab?.('perfil')}
      />

      {/* 2. Scrollable Dashboard Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pulling}
            onRefresh={() => void refreshAll()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 16) + 90, // Margen suficiente para el tab flotante
        }}
      >
        {/* Saludo & Quick CTA */}
        <View style={dashboardStyles.greetingRow}>
          <View style={dashboardStyles.greetingTextContainer}>
            <Text style={dashboardStyles.greetingSub} numberOfLines={1}>
              ¡Activo pal' intercambio!
            </Text>
            <Text
              style={dashboardStyles.greetingTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              ¡Epa, {firstName}! 👋
            </Text>
          </View>

          <TouchableOpacity
            style={dashboardStyles.btnCreateGroup}
            activeOpacity={0.85}
            onPress={handleCreateGroup}
          >
            <PlusCircle size={18} color={theme.colors.primary} />
            <Text style={dashboardStyles.btnCreateGroupText}>Crear Grupo</Text>
          </TouchableOpacity>
        </View>

        {/* Banner Mascota ("Tip del Guaca") */}
        <View style={dashboardStyles.mascotBanner}>
          <View style={dashboardStyles.mascotBannerGlow} pointerEvents="none">
            <Svg width="200" height="200" viewBox="0 0 200 200">
              <Defs>
                <RadialGradient
                  id="guacaGlowGrad"
                  cx="65%"
                  cy="65%"
                  r="60%"
                  fx="65%"
                  fy="65%"
                >
                  <Stop offset="0%" stopColor="#FEAE10" stopOpacity="0.45" />
                  <Stop offset="35%" stopColor="#FEAE10" stopOpacity="0.22" />
                  <Stop offset="70%" stopColor="#20153A" stopOpacity="0.08" />
                  <Stop offset="100%" stopColor="#20153A" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Rect x="0" y="0" width="200" height="200" fill="url(#guacaGlowGrad)" />
            </Svg>
          </View>
          <View style={dashboardStyles.mascotBannerContent}>
            <View style={dashboardStyles.mascotAvatarWrapper}>
              <Image
                source={BRAND_ISOTIPO}
                style={dashboardStyles.mascotAvatarImage}
              />
              <View style={dashboardStyles.mascotStarBadge}>
                <Text style={dashboardStyles.mascotStarText}>✦</Text>
              </View>
            </View>

            <View style={dashboardStyles.mascotBannerBody}>
              <View style={dashboardStyles.tipBadge}>
                <Text style={dashboardStyles.tipBadgeText}>Tip del Guaca</Text>
              </View>
              <Text style={[dashboardStyles.mascotBannerSub, { fontSize: theme.typography.fontSize.base, lineHeight: 20, marginTop: 4 }]}>
                {tipText}
              </Text>
            </View>

            <TouchableOpacity
              style={dashboardStyles.mascotArrowButton}
              activeOpacity={0.8}
              onPress={() => setTipIndex((i) => i + 1)}
              accessibilityLabel="Otro tip"
              disabled={tips.length < 2}
            >
              <ArrowRight size={18} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Segmented Control / Filtros */}
        <View style={dashboardStyles.segmentedContainer}>
          <TouchableOpacity
            style={[
              dashboardStyles.segmentTab,
              selectedSegment === 'creados' && dashboardStyles.segmentTabActive,
            ]}
            onPress={() => setSelectedSegment('creados')}
            activeOpacity={0.8}
          >
            <Crown
              size={16}
              color={
                selectedSegment === 'creados'
                  ? theme.colors.primary
                  : theme.colors.textMuted
              }
            />
            <Text
              style={[
                dashboardStyles.segmentText,
                selectedSegment === 'creados' && dashboardStyles.segmentTextActive,
              ]}
            >
              Mis Grupos
            </Text>
            <View
              style={[
                dashboardStyles.segmentBadge,
                selectedSegment === 'creados' && dashboardStyles.segmentBadgeActive,
              ]}
            >
              <Text
                style={[
                  dashboardStyles.segmentBadgeText,
                  selectedSegment === 'creados' && dashboardStyles.segmentBadgeTextActive,
                ]}
              >
                {segmentCount('creados')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              dashboardStyles.segmentTab,
              selectedSegment === 'participo' && dashboardStyles.segmentTabActive,
            ]}
            onPress={() => setSelectedSegment('participo')}
            activeOpacity={0.8}
          >
            <Users
              size={16}
              color={
                selectedSegment === 'participo'
                  ? theme.colors.primary
                  : theme.colors.textMuted
              }
            />
            <Text
              style={[
                dashboardStyles.segmentText,
                selectedSegment === 'participo' && dashboardStyles.segmentTextActive,
              ]}
            >
              Participo
            </Text>
            <View
              style={[
                dashboardStyles.segmentBadge,
                selectedSegment === 'participo' && dashboardStyles.segmentBadgeActive,
              ]}
            >
              <Text
                style={[
                  dashboardStyles.segmentBadgeText,
                  selectedSegment === 'participo' && dashboardStyles.segmentBadgeTextActive,
                ]}
              >
                {segmentCount('participo')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Lista de Grupos */}
        <View style={dashboardStyles.cardsList}>
          {groupsQuery.loading ? (
            <>
              <GroupCardSkeleton />
              <GroupCardSkeleton />
            </>
          ) : groupsQuery.error && !groupsQuery.data ? (
            <GroupsError message={groupsQuery.error.message} onRetry={() => void groupsQuery.refetch()} />
          ) : visible.length === 0 ? (
            <EmptyGroups segment={selectedSegment} onCreate={handleCreateGroup} onJoin={handleEnterCode} />
          ) : (
            visible.map((g) => <GroupCard key={g.id} group={g} onOpen={handleOpenGroup} />)
          )}
        </View>

        {/* Banner: ¿Te llegó un código? */}
        <View style={dashboardStyles.inviteBanner}>
          <View style={dashboardStyles.inviteLeft}>
            <View style={dashboardStyles.inviteIconBox}>
              <Smartphone size={20} color={theme.colors.secondaryDark} />
            </View>
            <View style={dashboardStyles.inviteTextContainer}>
              <Text style={dashboardStyles.inviteTitle}>¿Te llegó un código?</Text>
              <Text style={dashboardStyles.inviteSub}>
                Únete al grupo de tus panas con tu enlace
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={dashboardStyles.btnInviteEnter}
            activeOpacity={0.85}
            onPress={handleEnterCode}
          >
            <Text style={dashboardStyles.btnInviteEnterText}>Ingresar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 3. Menú Flotante Inferior (Floating Tab Bar) */}
      <FloatingTabBar
        activeTab="grupos"
        badges={{ chats: chatQuery.data ?? 0 }}
        onTabChange={(newTab) => {
          if (newTab !== 'grupos') onNavigateTab?.(newTab);
        }}
      />
    </SafeAreaView>
  );
}
