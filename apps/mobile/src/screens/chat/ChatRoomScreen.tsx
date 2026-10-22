import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, EyeOff, VenetianMask, Hand, SendHorizontal, Archive, X } from 'lucide-react-native';
import { theme, chatsStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { daysUntil } from '../../utils/format';
import type { ChatMessage, ChatRoomSummary } from '../../types/session';

const MAX_MESSAGE = 500;
const QUICK_EMOJIS = [
  { emoji: '🫓', label: 'Arepa' },
  { emoji: '🦜', label: 'Guacamaya' },
  { emoji: '🫔', label: 'Hallaca' },
  { emoji: '🎸', label: 'Cuatro' },
  { emoji: '🎭', label: 'Antifaz' },
  { emoji: '🎁', label: 'Regalo' },
];

/** Mensaje propio creado localmente (mientras no hay sockets) */
function localMessage(room: ChatRoomSummary, text: string, kind: ChatMessage['kind']): ChatMessage {
  const now = new Date();
  return { id: `local-${now.getTime()}`, alias: room.myAlias, avatar: room.myAvatar, text, at: now.toISOString(), mine: true, kind };
}

interface ChatRoomScreenProps {
  room: ChatRoomSummary;
  onNavigateBack: () => void;
  /** Conserva los mensajes nuevos al volver (maqueta) */
  onMessagesChange?: (groupId: string, messages: ChatMessage[]) => void;
}

/** Sala del chat grupal anónimo: todos escriben con su alias; las pistas se resaltan */
export const ChatRoomScreen: React.FC<ChatRoomScreenProps> = ({ room, onNavigateBack, onMessagesChange }) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(room.messages);
  const [draft, setDraft] = useState('');
  const [pistaMode, setPistaMode] = useState(false);

  const archived = room.status === 'REVEALED' || room.status === 'COMPLETED';
  const days = daysUntil(room.exchangeAt);
  const lastMineId = [...messages].reverse().find((m) => m.mine)?.id;
  const canSend = draft.trim().length > 0;

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    // Al conectar la app: socket.emit('chat:message', { groupId, text, kind }) y el servidor reparte a la sala
    const next = [...messages, localMessage(room, text, pistaMode ? 'pista' : 'mensaje')];
    setMessages(next);
    setDraft('');
    setPistaMode(false);
    onMessagesChange?.(room.groupId, next);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

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
              Tú eres {room.myAlias} · {room.membersCount} panas
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior="padding" enabled={Platform.OS === 'ios'} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          <View style={styles.protectBanner}>
            <View style={styles.protectIcon}>
              <VenetianMask size={20} color={theme.colors.primary} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.protectTitle}>Identidades 100% protegidas</Text>
              <Text style={styles.protectText}>Nadie sabe quién eres. Vacila, pide pistas y despista sin que te descubran.</Text>
            </View>
          </View>

          {!archived && (
            <View style={styles.daySeparator}>
              <Text style={styles.daySeparatorText}>
                {days > 0 ? `Faltan ${days} ${days === 1 ? 'día' : 'días'} para el destape 🎁` : '¡Hoy es el destape! 🎉'}
              </Text>
            </View>
          )}

          {messages.length === 0 ? (
            <View style={styles.emptyRoom}>
              <Image source={BRAND_ISOTIPO} style={styles.emptyRoomMascot} />
              <Text style={styles.emptyRoomTitle}>¡Rompe el hielo!</Text>
              <Text style={styles.emptyRoomText}>
                Saluda al grupo o lanza una pista para quien te regala. Todos te verán como {room.myAlias}.
              </Text>
            </View>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} showDelivered={m.id === lastMineId} />)
          )}
        </ScrollView>

        {archived ? (
          <View style={[styles.archivedBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <Archive size={18} color={theme.colors.textSecondary} />
            <Text style={styles.archivedText}>Chat archivado: el intercambio ya se reveló. Solo lectura.</Text>
          </View>
        ) : (
          <>
            <View style={styles.pistaCard}>
              <View style={styles.pistaIcon}>
                <Hand size={18} color={theme.colors.primary} strokeWidth={2.4} />
              </View>
              <Text style={styles.pistaText}>
                {pistaMode ? 'Tu próximo mensaje saldrá como pista ✨' : '¿Quieres lanzar una indirecta a quien te regala?'}
              </Text>
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
            </View>

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
                  onPress={send}
                  disabled={!canSend}
                  accessibilityLabel="Enviar mensaje"
                >
                  <SendHorizontal size={22} color={theme.colors.primary} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatRoomScreen;
