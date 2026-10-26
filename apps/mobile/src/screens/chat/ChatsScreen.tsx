import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessagesSquare, VenetianMask, Lock, Search, CircleCheck, Lightbulb } from 'lucide-react-native';
import { theme, chatsStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { MainHeader } from '../../components/common/MainHeader';
import { FloatingTabBar, type DashboardTab } from '../../components/common/FloatingTabBar';
import { ChatRow } from '../../components/chat/ChatRow';
import type { ChatRoomSummary } from '../../types/session';
import { TipCard } from '../../components/common/TipCard';

interface ChatsScreenProps {
  rooms: ChatRoomSummary[];
  onOpenRoom: (groupId: string) => void;
  onNavigateTab: (tab: DashboardTab) => void;
  onProfilePress: () => void;
  onOpenNotifications: () => void;
  hasNotifications?: boolean;
}

/** Pestaña "Chats": una sala anónima por grupo (no hay chats individuales) */
export const ChatsScreen: React.FC<ChatsScreenProps> = ({
  rooms,
  onOpenRoom,
  onNavigateTab,
  onProfilePress,
  onOpenNotifications,
  hasNotifications = false,
}) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const isActive = (r: ChatRoomSummary) => r.status === 'WAITING' || r.status === 'LOCKED';
  const lastAt = (r: ChatRoomSummary) => r.messages[r.messages.length - 1]?.at ?? '';
  // Activos primero (por último mensaje); archivados al final
  const sorted = [...rooms].sort((a, b) =>
    isActive(a) !== isActive(b) ? (isActive(a) ? -1 : 1) : lastAt(b).localeCompare(lastAt(a))
  );
  const q = query.trim().toLowerCase();
  const visible = q ? sorted.filter((r) => r.name.toLowerCase().includes(q) || r.myAlias.toLowerCase().includes(q)) : sorted;
  const activeCount = rooms.filter(isActive).length;
  const totalUnread = rooms.reduce((n, r) => n + r.unread, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MainHeader
        title="Chats"
        icon={MessagesSquare}
        onBellPress={onOpenNotifications}
        hasNotifications={hasNotifications}
        onAvatarPress={onProfilePress}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 96 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Chats</Text>
          <View style={styles.activeChip}>
            <Text style={styles.activeChipText}>
              {activeCount} {activeCount === 1 ? 'grupo activo' : 'grupos activos'}
            </Text>
          </View>
        </View>

        <View style={styles.introCard}>
          <View style={styles.introGlow} />
          <Image source={BRAND_ISOTIPO} style={styles.introMascot} />
          <View style={{ flex: 1 }}>
            <View style={styles.introChips}>
              <View style={styles.anonChip}>
                <VenetianMask size={14} color={theme.colors.white} strokeWidth={2.2} />
                <Text style={styles.anonChipText}>100% Anónimo</Text>
              </View>
              <View style={styles.privateLabel}>
                <Lock size={13} color={theme.colors.textMuted} strokeWidth={2.2} />
                <Text style={styles.privateLabelText}>Solo tu grupo</Text>
              </View>
            </View>
            <Text style={styles.introText}>En cada grupo hablas con un alias secreto. ¡Nadie sabe quién es quién, mi pana!</Text>
          </View>
        </View>

        <View style={styles.search}>
          <Search size={20} color={theme.colors.textMuted} strokeWidth={2.2} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar grupo…"
            placeholderTextColor={theme.colors.outline}
            returnKeyType="search"
          />
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>TUS RUMBAS Y GRUPOS</Text>
          {totalUnread === 0 && (
            <View style={styles.upToDate}>
              <CircleCheck size={16} color={theme.colors.accent} fill={theme.colors.accentContainer} />
              <Text style={styles.upToDateText}>Al día</Text>
            </View>
          )}
        </View>

        {visible.map((r) => (
          <ChatRow key={r.groupId} room={r} onPress={(room) => onOpenRoom(room.groupId)} />
        ))}
        {visible.length === 0 && <Text style={styles.emptySearch}>No encontramos grupos con «{query}».</Text>}

        <View style={styles.howCard}>
          <View style={styles.howIcon}>
            <Lightbulb size={18} color={theme.colors.primary} strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.howTitle}>¿Cómo funcionan los chats?</Text>
            <Text style={styles.howText}>
              Cada grupo tiene su propia sala donde todos lanzan pistas anónimas. No hay mensajes privados: así el misterio se
              mantiene hasta el día de la entrega.
            </Text>
          </View>
        </View>

        <TipCard
          screen="chat.lista"
          fallback="Lanza pistas en el chat sin delatarte: escribe con tu alias y nunca menciones nombres reales."
          style={{ marginTop: 12 }}
        />
      </ScrollView>

      <FloatingTabBar activeTab="chats" onTabChange={onNavigateTab} badges={{ chats: totalUnread }} />
    </SafeAreaView>
  );
};

export default ChatsScreen;
