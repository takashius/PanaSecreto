import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Camera, Lock } from 'lucide-react-native';
import { theme, myWishesStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { MainHeader } from '../../components/common/MainHeader';
import { FloatingTabBar, type DashboardTab } from '../../components/common/FloatingTabBar';
import { MyWishCard } from '../../components/myWishes/MyWishCard';
import { formatBudget } from '../../utils/format';
import type { MyWish, MyWishlistGroup } from '../../types/session';

interface MyWishesScreenProps {
  lists: MyWishlistGroup[];
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
  /** Cambios locales en una lista (prioridad, eliminar…) mientras no hay API */
  onListChange: (list: MyWishlistGroup) => void;
  onOpenWish: (groupId: string, wish: MyWish) => void;
  onAddWish: (groupId: string) => void;
  onEditWish: (groupId: string, wish: MyWish) => void;
  onNavigateTab: (tab: DashboardTab) => void;
  onProfilePress: () => void;
  chatUnread?: number;
}

/** Pestaña "Mis deseos": una lista por grupo, con estado de los comentarios de cada deseo */
export const MyWishesScreen: React.FC<MyWishesScreenProps> = ({
  lists,
  selectedGroupId,
  onSelectGroup,
  onListChange,
  onOpenWish,
  onAddWish,
  onEditWish,
  onNavigateTab,
  onProfilePress,
  chatUnread = 0,
}) => {
  const insets = useSafeAreaInsets();
  const list = lists.find((l) => l.groupId === selectedGroupId) ?? lists[0];

  if (!list) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <MainHeader
          title="Mis deseos"
          icon={Heart}
          onBellPress={() => Alert.alert('Notificaciones', 'La pantalla de notificaciones se maqueta en un próximo paso.')}
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

  const updateWish = (wishId: string, change: (w: MyWish) => MyWish | null) => {
    const wishes = list.wishes.map((w) => (w.id === wishId ? change(w) : w)).filter((w): w is MyWish => w !== null);
    onListChange({ ...list, wishes });
  };

  const handleMenu = (wish: MyWish) => {
    Alert.alert(wish.title, undefined, [
      { text: 'Editar deseo', onPress: () => onEditWish(list.groupId, wish) },
      {
        text: 'Eliminar deseo',
        style: 'destructive',
        onPress: () =>
          Alert.alert('¿Eliminar este deseo?', 'Se borrarán también sus comentarios.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => updateWish(wish.id, () => null) },
          ]),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MainHeader
        title="Mis deseos"
        icon={Heart}
        onBellPress={() => Alert.alert('Notificaciones', 'La pantalla de notificaciones se maqueta en un próximo paso.')}
        onAvatarPress={onProfilePress}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 96 }]}
        showsVerticalScrollIndicator={false}
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

        {count === 0 ? (
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
              onTogglePriority={(wish) =>
                updateWish(wish.id, (x) => ({ ...x, priority: x.priority === 'alta' ? 'normal' : 'alta' }))
              }
              onMenu={handleMenu}
            />
          ))
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
      </ScrollView>

      <FloatingTabBar activeTab="deseos" onTabChange={onNavigateTab} badges={{ chats: chatUnread }} />
    </SafeAreaView>
  );
};

export default MyWishesScreen;
