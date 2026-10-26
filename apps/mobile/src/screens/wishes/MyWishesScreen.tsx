import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Alert } from '../../components/common/AppDialog';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Camera, Lock, Gift } from 'lucide-react-native';
import { theme, myWishesStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { MainHeader } from '../../components/common/MainHeader';
import { FloatingTabBar, type DashboardTab } from '../../components/common/FloatingTabBar';
import { MyWishCard } from '../../components/myWishes/MyWishCard';
import { PanaWishlistPanel } from '../../components/myWishes/PanaWishlistPanel';
import { formatBudget } from '../../utils/format';
import type { EnvelopeView, MyWish, MyWishlistGroup, WishPreview } from '../../types/session';
import { TipCard } from '../../components/common/TipCard';

interface MyWishesScreenProps {
  lists: MyWishlistGroup[];
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
  /** Prioridad alta = favorito en la API */
  onTogglePriority: (groupId: string, wish: MyWish) => void;
  onDeleteWish: (groupId: string, wish: MyWish) => void;
  /** Cargando la lista del grupo elegido */
  loadingWishes?: boolean;
  /** Cargando los grupos (primera vez) */
  loadingGroups?: boolean;
  wishesError?: string | null;
  onRetry?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  onOpenWish: (groupId: string, wish: MyWish) => void;
  onAddWish: (groupId: string) => void;
  onEditWish: (groupId: string, wish: MyWish) => void;
  onNavigateTab: (tab: DashboardTab) => void;
  onProfilePress: () => void;
  onOpenNotifications: () => void;
  /** Sobre de cada grupo (a quién le regalo), para la pestaña "Lista de mi pana" */
  envelopes?: Record<string, { envelope?: EnvelopeView | null; opened: boolean }>;
  onOpenPanaWish?: (groupId: string, wish: WishPreview) => void;
  onOpenEnvelope?: (groupId: string) => void;
  hasNotifications?: boolean;
  chatUnread?: number;
}

/** Pestaña "Deseos": una lista por grupo, con estado de los comentarios de cada deseo */
export const MyWishesScreen: React.FC<MyWishesScreenProps> = ({
  lists,
  selectedGroupId,
  onSelectGroup,
  onTogglePriority,
  onDeleteWish,
  loadingWishes = false,
  loadingGroups = false,
  wishesError = null,
  onRetry,
  refreshing = false,
  onRefresh,
  onOpenWish,
  onAddWish,
  onEditWish,
  onNavigateTab,
  onProfilePress,
  onOpenNotifications,
  hasNotifications = false,
  chatUnread = 0,
  envelopes = {},
  onOpenPanaWish,
  onOpenEnvelope,
}) => {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<'mia' | 'pana'>('mia');
  const list = lists.find((l) => l.groupId === selectedGroupId) ?? lists[0];

  if (!list && loadingGroups) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <MainHeader title="Deseos" icon={Heart} onBellPress={onOpenNotifications} hasNotifications={hasNotifications} onAvatarPress={onProfilePress} />
        <View style={[styles.scrollContent, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
        <FloatingTabBar activeTab="deseos" onTabChange={onNavigateTab} badges={{ chats: chatUnread }} />
      </SafeAreaView>
    );
  }

  if (!list) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <MainHeader
          title="Deseos"
          icon={Heart}
          onBellPress={onOpenNotifications}
        hasNotifications={hasNotifications}
          onAvatarPress={onProfilePress}
        />
        <View style={[styles.scrollContent, { flex: 1, justifyContent: 'center' }]}>
          <View style={styles.emptyCard}>
            <Image source={BRAND_ISOTIPO} style={styles.emptyMascot} />
            <Text style={styles.emptyTitle}>Aún no estás en ningún grupo</Text>
            <Text style={styles.emptyText}>Crea un grupo o únete con un código para armar tu lista de deseos.</Text>
          </View>
        </View>
        <FloatingTabBar activeTab="deseos" onTabChange={onNavigateTab} badges={{ chats: chatUnread }} />
      </SafeAreaView>
    );
  }

  const isWaiting = list.status === 'WAITING';
  const count = list.wishes.length;
  const full = count >= list.maxWishes;
  const fill = Math.min(100, Math.round((count / Math.max(list.maxWishes, 1)) * 100));
  const limitLabel = list.budgetMax != null ? `Límite ${formatBudget(list.currency, null, list.budgetMax).replace('Hasta ', '')}` : 'Sin límite';

  const handleMenu = (wish: MyWish) => {
    Alert.alert(wish.title, undefined, [
      { text: 'Editar deseo', onPress: () => onEditWish(list.groupId, wish) },
      {
        text: 'Eliminar deseo',
        style: 'destructive',
        onPress: () =>
          Alert.alert('¿Eliminar este deseo?', 'Se borrarán también sus comentarios.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => onDeleteWish(list.groupId, wish) },
          ]),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MainHeader
        title="Deseos"
        icon={Heart}
        onBellPress={onOpenNotifications}
        hasNotifications={hasNotifications}
        onAvatarPress={onProfilePress}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 96 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />
          ) : undefined
        }
      >
        {/* Selector de grupo */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.groupChipsScroll}
          contentContainerStyle={styles.groupChips}
        >
          {lists.map((l) => {
            const active = l.groupId === list.groupId;
            const pending = l.wishes.some((w) => w.unansweredCount > 0);
            return (
              <TouchableOpacity
                key={l.groupId}
                style={[styles.groupChip, active && styles.groupChipActive]}
                onPress={() => onSelectGroup(l.groupId)}
                activeOpacity={0.85}
                accessibilityState={{ selected: active }}
              >
                <Text style={styles.groupChipEmoji}>{l.emoji}</Text>
                <Text style={[styles.groupChipText, active && styles.groupChipTextActive]}>{l.name}</Text>
                {pending && <View style={styles.groupChipDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Mi lista / Lista de mi pana */}
        <View style={styles.segment} accessibilityRole="tablist">
          {(
            [
              { id: 'mia', label: 'Mi lista', icon: Heart },
              { id: 'pana', label: 'Lista de mi pana', icon: Gift },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = view === id;
            return (
              <TouchableOpacity
                key={id}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
                onPress={() => setView(id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Icon size={17} color={active ? theme.colors.white : theme.colors.outline} strokeWidth={2.2} />
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {view === 'pana' ? (
          <PanaWishlistPanel
            groupName={list.name}
            status={list.status}
            envelope={envelopes[list.groupId]?.envelope}
            opened={!!envelopes[list.groupId]?.opened}
            onOpenEnvelope={() => onOpenEnvelope?.(list.groupId)}
            onOpenWish={(wish) => onOpenPanaWish?.(list.groupId, wish)}
          />
        ) : (
          <>
        {/* Reglas y cupo de la lista */}
            <View style={styles.rulesCard}>
              <View style={styles.rulesGlow} />
              <View style={styles.rulesRow}>
                <Image source={BRAND_ISOTIPO} style={styles.rulesMascot} />
                <View style={{ flex: 1 }}>
                  <View style={styles.rulesTop}>
                    <View style={styles.rulesChip}>
                      <Text style={styles.rulesChipText}>Reglas del sorteo</Text>
                    </View>
                    <Text style={styles.rulesLimit}>{limitLabel}</Text>
                  </View>
                  <Text style={styles.rulesText}>
                    {isWaiting ? 'Cuando se haga el sorteo, tu pana secreto en ' : 'Tu pana secreto en '}
                    <Text style={styles.strong}>{list.name}</Text>
                    {isWaiting ? ' verá esta lista sin saber quién eres.' : ' ve esta lista sin saber quién eres.'}
                  </Text>
                </View>
              </View>
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${fill}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {count} de {list.maxWishes} deseos
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.addButton, full && styles.addButtonDisabled]}
              onPress={() => onAddWish(list.groupId)}
              disabled={full}
              activeOpacity={0.85}
            >
              <Camera size={26} color={theme.colors.primary} strokeWidth={2.4} />
              <Text style={styles.addButtonText}>{full ? 'Lista completa' : '+ Agregar deseo'}</Text>
            </TouchableOpacity>

            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Mi lista en este grupo</Text>
              <View style={styles.listCount}>
                <Text style={styles.listCountText}>
                  {count} {count === 1 ? 'agregado' : 'agregados'}
                </Text>
              </View>
            </View>

            {wishesError && count === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No pudimos cargar tu lista</Text>
                <Text style={styles.emptyText}>{wishesError}</Text>
                {onRetry && (
                  <TouchableOpacity style={[styles.addButton, { marginTop: 8 }]} onPress={onRetry} activeOpacity={0.85}>
                    <Text style={styles.addButtonText}>Reintentar</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : loadingWishes && count === 0 ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : count === 0 ? (
              <View style={styles.emptyCard}>
                <Image source={BRAND_ISOTIPO} style={styles.emptyMascot} />
                <Text style={styles.emptyTitle}>Tu lista está vacía</Text>
                <Text style={styles.emptyText}>
                  Agrega lo que te gustaría recibir, con foto y precio aproximado. Así tu pana secreto no tiene que adivinar.
                </Text>
              </View>
            ) : (
              list.wishes.map((w) => (
                <MyWishCard
                  key={w.id}
                  wish={w}
                  visibleToFriend={!isWaiting}
                  onOpen={(wish) => onOpenWish(list.groupId, wish)}
                  onTogglePriority={(wish) => onTogglePriority(list.groupId, wish)}
                  onMenu={handleMenu}
                />
              ))
            )}
          </>
        )}

        <View style={styles.noteCard}>
          <View style={styles.noteIcon}>
            <Lock size={18} color={theme.colors.primary} strokeWidth={2.4} />
          </View>
          <Text style={styles.noteText}>
            Las preguntas de tu amigo secreto llegan como comentarios en cada deseo.{' '}
            <Text style={styles.strong}>100% anónimo y seguro</Text>: nunca sabrá tu correo ni tu teléfono.
          </Text>
        </View>

        <TipCard
          screen="deseos"
          fallback="Agrega varias opciones de precio: así tu amigo secreto puede elegir según el presupuesto del grupo."
          style={{ marginTop: 12 }}
        />
      </ScrollView>

      <FloatingTabBar activeTab="deseos" onTabChange={onNavigateTab} badges={{ chats: chatUnread }} />
    </SafeAreaView>
  );
};

export default MyWishesScreen;
