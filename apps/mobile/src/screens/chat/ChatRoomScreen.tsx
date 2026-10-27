import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, EyeOff, VenetianMask, Hand, SendHorizontal, Archive, X, WifiOff, UserRound } from 'lucide-react-native';
import { theme, chatsStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { daysUntil } from '../../utils/format';
import { useKeyboardLiftStyle } from '../../hooks/useKeyboardLiftStyle';
import type { ChatMessage, ChatRoomSummary } from '../../types/session';

/** Igual que CHAT_MESSAGE_MAX_LENGTH del backend */
const MAX_MESSAGE = 500;
const QUICK_EMOJIS = [
  { emoji: '🫓', label: 'Arepa' },
  { emoji: '🦜', label: 'Guacamaya' },
  { emoji: '🫔', label: 'Hallaca' },
  { emoji: '🎸', label: 'Cuatro' },
  { emoji: '🎭', label: 'Antifaz' },
  { emoji: '🎁', label: 'Regalo' },
];

export type ClueAvailability = 'enabled' | 'notYet' | 'disabled';

interface ChatRoomScreenProps {
  room: Pick<ChatRoomSummary, 'groupId' | 'name' | 'emoji' | 'membersCount' | 'exchangeAt' | 'myAlias'>;
  messages: ChatMessage[];
  /** Primera carga del historial */
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  hasMore?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
  /** Después de la revelación: solo lectura */
  readOnly: boolean;
  /** Pistas: activas (grupo sorteado y con pistas), aún no (antes del sorteo) o apagadas en el grupo */
  clues: ClueAvailability;
  /** false mientras se reconecta el tiempo real */
  online?: boolean;
  /** Envía el mensaje; devuelve false si no salió (el texto vuelve al cuadro) */
  onSend: (text: string, kind: 'mensaje' | 'pista') => Promise<boolean>;
  /** Sin alias no se puede escribir */
  onChooseAlias?: () => void;
  onNavigateBack: () => void;
}

/** Sala del chat grupal anónimo: todos escriben con su alias; las pistas se resaltan */
export const ChatRoomScreen: React.FC<ChatRoomScreenProps> = ({
  room,
  messages,
  loading = false,
  error = null,
  onRetry,
  hasMore = false,
  loadingOlder = false,
  onLoadOlder,
  readOnly,
  clues,
  online = true,
  onSend,
  onChooseAlias,
  onNavigateBack,
}) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const scrollToEnd = useCallback(() => scrollRef.current?.scrollToEnd({ animated: true }), []);
  const keyboardLiftStyle = useKeyboardLiftStyle({ onKeyboardShow: scrollToEnd });
  const [draft, setDraft] = useState('');
  const [pistaMode, setPistaMode] = useState(false);

  const days = daysUntil(room.exchangeAt);
  const lastMineId = [...messages].reverse().find((m) => m.mine && !m.pending)?.id;
  const canSend = draft.trim().length > 0;
  const lastId = messages[messages.length - 1]?.id ?? null;

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    const kind = pistaMode && clues === 'enabled' ? 'pista' : 'mensaje';
    setDraft('');
    setPistaMode(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    const ok = await onSend(text, kind);
    if (!ok) setDraft((d) => d || text);
  };

  // Baja al final al abrir y cuando llega un mensaje nuevo (cargar anteriores no cambia el último)
  useEffect(() => {
    if (!lastId) return;
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 60);
    return () => clearTimeout(t);
  }, [lastId]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.roomHeader}>
        <TouchableOpacity style={styles.headerButton} onPress={onNavigateBack} accessibilityLabel="Volver">
          <ArrowLeft size={24} color={theme.colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={styles.roomEmoji}>
          <Text style={{ fontSize: 22 }}>{room.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {room.name}
          </Text>
          <View style={styles.roomSubtitle}>
            <EyeOff size={13} color={theme.colors.textMuted} />
            <Text style={styles.roomSubtitleText} numberOfLines={1}>
              {room.myAlias ? `Tú eres ${room.myAlias}` : 'Aún sin alias'} · {room.membersCount} panas
            </Text>
          </View>
        </View>
      </View>

      <Animated.View style={[{ flex: 1 }, keyboardLiftStyle]}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
        >
          {!online && (
            <View style={styles.offlineBanner}>
              <WifiOff size={15} color={theme.colors.textSecondary} />
              <Text style={styles.offlineText}>Reconectando… los mensajes se envían igual.</Text>
            </View>
          )}

          <View style={styles.protectBanner}>
            <View style={styles.protectIcon}>
              <VenetianMask size={20} color={theme.colors.primary} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.protectTitle}>Identidades 100% protegidas</Text>
              <Text style={styles.protectText}>Nadie sabe quién eres. Vacila, pide pistas y despista sin que te descubran.</Text>
            </View>
          </View>

          {hasMore && (
            <TouchableOpacity style={styles.olderButton} onPress={onLoadOlder} disabled={loadingOlder} activeOpacity={0.8}>
              {loadingOlder ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={styles.olderText}>Ver mensajes anteriores</Text>
              )}
            </TouchableOpacity>
          )}

          {!readOnly && (
            <View style={styles.daySeparator}>
              <Text style={styles.daySeparatorText}>
                {days > 0 ? `Faltan ${days} ${days === 1 ? 'día' : 'días'} para el destape 🎁` : '¡Hoy es el destape! 🎉'}
              </Text>
            </View>
          )}

          {loading ? (
            <View style={styles.emptyRoom}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : error && messages.length === 0 ? (
            <View style={styles.emptyRoom}>
              <Image source={BRAND_ISOTIPO} style={styles.emptyRoomMascot} />
              <Text style={styles.emptyRoomTitle}>No pudimos cargar el chat</Text>
              <Text style={styles.emptyRoomText}>{error}</Text>
              {onRetry && (
                <TouchableOpacity onPress={onRetry} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.olderText}>Reintentar</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyRoom}>
              <Image source={BRAND_ISOTIPO} style={styles.emptyRoomMascot} />
              <Text style={styles.emptyRoomTitle}>¡Rompe el hielo!</Text>
              <Text style={styles.emptyRoomText}>
                {readOnly
                  ? 'Este chat cerró sin mensajes.'
                  : room.myAlias
                    ? `Saluda al grupo o lanza una pista para quien te regala. Todos te verán como ${room.myAlias}.`
                    : 'Elige tu alias y saluda al grupo. Nadie sabrá que eres tú.'}
              </Text>
            </View>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} showDelivered={m.id === lastMineId} />)
          )}
        </ScrollView>

        {readOnly ? (
          <View style={[styles.archivedBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <Archive size={18} color={theme.colors.textSecondary} />
            <Text style={styles.archivedText}>Chat archivado: el intercambio ya se reveló. Solo lectura.</Text>
          </View>
        ) : !room.myAlias ? (
          <View style={[styles.archivedBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <UserRound size={18} color={theme.colors.textSecondary} />
            <Text style={styles.archivedText}>Elige tu alias para escribir en el chat.</Text>
            {onChooseAlias && (
              <TouchableOpacity style={styles.pistaButton} onPress={onChooseAlias} activeOpacity={0.85}>
                <Text style={styles.pistaButtonText}>Elegir alias</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {clues !== 'disabled' && (
            <View style={styles.pistaCard}>
              <View style={styles.pistaIcon}>
                <Hand size={18} color={theme.colors.primary} strokeWidth={2.4} />
              </View>
              <Text style={styles.pistaText}>
                {clues === 'notYet'
                  ? 'Las pistas se activan después del sorteo 🎲'
                  : pistaMode
                    ? 'Tu próximo mensaje saldrá como pista ✨'
                    : '¿Quieres lanzar una indirecta a quien te regala?'}
              </Text>
              {clues === 'enabled' && (
              <TouchableOpacity
                style={[styles.pistaButton, pistaMode && styles.pistaButtonActive]}
                onPress={() => setPistaMode((v) => !v)}
                activeOpacity={0.85}
              >
                {pistaMode ? (
                  <X size={16} color={theme.colors.white} strokeWidth={2.6} />
                ) : (
                  <Text style={styles.pistaButtonText}>Tirar pista</Text>
                )}
              </TouchableOpacity>
              )}
            </View>
            )}

            <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
                {QUICK_EMOJIS.map((q) => (
                  <TouchableOpacity
                    key={q.label}
                    style={styles.quickChip}
                    onPress={() => setDraft((d) => `${d}${q.emoji}`)}
                    activeOpacity={0.8}
                  >
                    <Text>{q.emoji}</Text>
                    <Text style={styles.quickChipText}>{q.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.composerRow}>
                <TextInput
                  style={[styles.input, pistaMode && styles.inputPista]}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={pistaMode ? 'Escribe tu pista…' : 'Escribe un mensaje anónimo…'}
                  placeholderTextColor={theme.colors.outline}
                  multiline
                  maxLength={MAX_MESSAGE}
                />
                <TouchableOpacity
                  style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                  onPress={() => void send()}
                  disabled={!canSend}
                  accessibilityLabel="Enviar mensaje"
                >
                  <SendHorizontal size={22} color={theme.colors.primary} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

export default ChatRoomScreen;
