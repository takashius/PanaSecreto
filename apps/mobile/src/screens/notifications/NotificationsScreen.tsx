import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MessageSquareText,
  VenetianMask,
  MailOpen,
  UserPlus,
  Clock,
  PartyPopper,
  MessagesSquare,
  BellRing,
  type LucideIcon,
} from 'lucide-react-native';
import { theme, notificationsStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { timeAgo } from '../../utils/format';
import type { AppNotification, NotificationKind } from '../../types/session';
import { useTip } from '../../hooks/useTip';

type Filter = 'todas' | 'comentarios' | 'grupos';

const KIND: Record<NotificationKind, { icon: LucideIcon; color: string; bg: string; filter: Exclude<Filter, 'todas'> }> = {
  comment: { icon: MessageSquareText, color: theme.colors.primary, bg: theme.colors.secondaryFixed, filter: 'comentarios' },
  reply: { icon: VenetianMask, color: theme.colors.white, bg: theme.colors.primary, filter: 'comentarios' },
  chat: { icon: MessagesSquare, color: theme.colors.accentDark, bg: theme.colors.accentContainer, filter: 'comentarios' },
  draw: { icon: MailOpen, color: theme.colors.primary, bg: theme.colors.secondary, filter: 'grupos' },
  join: { icon: UserPlus, color: theme.colors.accentDark, bg: theme.colors.accentContainer, filter: 'grupos' },
  reminder: { icon: Clock, color: theme.colors.textSecondary, bg: theme.colors.surfaceContainer, filter: 'grupos' },
  reveal: { icon: PartyPopper, color: theme.colors.coral, bg: theme.colors.coralContainer, filter: 'grupos' },
};

const DAY = 86_400_000;

/** Resalta lo que va entre «» */
function RichText({ text, unread }: { text: string; unread: boolean }) {
  const parts = text.split(/(«[^»]+»)/g);
  return (
    <Text style={[styles.itemText, unread && styles.itemTextUnread]}>
      {parts.map((p, i) => (p.startsWith('«') ? <Text key={i} style={styles.itemQuote}>{p}</Text> : p))}
    </Text>
  );
}

interface NotificationsScreenProps {
  notifications: AppNotification[];
  onOpen: (n: AppNotification) => void;
  onMarkAllRead: () => void;
  onNavigateBack: () => void;
}

/** Notificaciones (no son en tiempo real): filtros, agrupadas por fecha y con destino al tocarlas */
export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ notifications, onOpen, onMarkAllRead, onNavigateBack }) => {
  const tip = useTip('notificaciones', '¡Pilas, mi pana! En EntrePanas nadie sabe quién le regala a quién hasta el destape final.');
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('todas');
  const [now] = useState(() => Date.now());

  const unread = notifications.filter((n) => !n.read);
  const visible = notifications
    .filter((n) => filter === 'todas' || KIND[n.kind].filter === filter)
    .sort((a, b) => b.at.localeCompare(a.at));
  const sections = [
    { title: 'Hoy', items: visible.filter((n) => now - new Date(n.at).getTime() < DAY) },
    { title: 'Esta semana', items: visible.filter((n) => { const d = now - new Date(n.at).getTime(); return d >= DAY && d < 7 * DAY; }) },
    { title: 'Antes', items: visible.filter((n) => now - new Date(n.at).getTime() >= 7 * DAY) },
  ].filter((s) => s.items.length > 0);

  const filters: Array<{ id: Filter; label: string }> = [
    { id: 'todas', label: 'Todas' },
    { id: 'comentarios', label: 'Comentarios' },
    { id: 'grupos', label: 'Grupos' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onNavigateBack} accessibilityLabel="Volver">
          <ArrowLeft size={24} color={theme.colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {unread.length > 0 && (
          <TouchableOpacity onPress={onMarkAllRead} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.markAll}>Marcar todo leído</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filters}>
        {filters.map((f) => {
          const active = filter === f.id;
          const hasUnread = unread.some((n) => f.id === 'todas' || KIND[n.kind].filter === f.id);
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.filter, active && styles.filterActive]}
              onPress={() => setFilter(f.id)}
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
              {hasUnread && <View style={styles.filterDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        {unread.length > 0 && (
          <View style={styles.unreadBanner}>
            <View style={styles.unreadBannerDot} />
            <Text style={styles.unreadBannerText}>
              Tienes <Text style={styles.strong}>{unread.length} {unread.length === 1 ? 'notificación' : 'notificaciones'}</Text> sin leer
            </Text>
            <BellRing size={18} color={theme.colors.coral} />
          </View>
        )}

        {sections.length === 0 ? (
          <View style={styles.empty}>
            <Image source={BRAND_ISOTIPO} style={{ width: 72, height: 72, borderRadius: 20 }} />
            <Text style={styles.emptyTitle}>¡Todo al día!</Text>
            <Text style={styles.emptyText}>No tienes notificaciones en esta categoría.</Text>
          </View>
        ) : (
          sections.map((section) => {
            const newCount = section.items.filter((n) => !n.read).length;
            return (
              <View key={section.title} style={{ gap: 10 }}>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {newCount > 0 && (
                    <View style={styles.newChip}>
                      <Text style={styles.newChipText}>
                        {newCount} {newCount === 1 ? 'nueva' : 'nuevas'}
                      </Text>
                    </View>
                  )}
                </View>
                {section.items.map((n) => {
                  const k = KIND[n.kind];
                  const Icon = k.icon;
                  return (
                    <TouchableOpacity
                      key={n.id}
                      style={[styles.item, !n.read && styles.itemUnread]}
                      onPress={() => onOpen(n)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.itemIcon, { backgroundColor: k.bg }]}>
                        <Icon size={20} color={k.color} strokeWidth={2.2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <RichText text={n.text} unread={!n.read} />
                        <View style={styles.itemMeta}>
                          <Text style={styles.itemGroup}>{n.groupName}</Text>
                          <Text style={styles.itemTime}>· {timeAgo(n.at, now)}</Text>
                        </View>
                      </View>
                      {!n.read && <View style={styles.unreadDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })
        )}

        <View style={styles.tipCard}>
          <Image source={BRAND_ISOTIPO} style={styles.tipMascot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipEyebrow}>CERO SAPOS</Text>
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen;
