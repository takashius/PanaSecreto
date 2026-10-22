import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { EyeOff, Archive, History, CheckCheck, Hand } from 'lucide-react-native';
import { theme, chatsStyles as styles } from '../../styles';
import { chatTime } from '../../utils/format';
import type { ChatRoomSummary } from '../../types/session';

interface Props {
  room: ChatRoomSummary;
  onPress: (room: ChatRoomSummary) => void;
}

/** Fila de la lista de Chats: grupo, último mensaje (firmado con alias) y mi alias en ese grupo */
export const ChatRow: React.FC<Props> = ({ room, onPress }) => {
  const last = room.messages[room.messages.length - 1];
  const archived = room.status === 'REVEALED' || room.status === 'COMPLETED';

  let preview: React.ReactNode;
  if (archived) {
    preview = (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Archive size={15} color={theme.colors.textMuted} />
        <Text style={[styles.chatPreview, styles.chatPreviewEmpty]} numberOfLines={1}>
          Chat archivado · intercambio revelado
        </Text>
      </View>
    );
  } else if (!last) {
    preview = (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Hand size={15} color={theme.colors.secondary} />
        <Text style={[styles.chatPreview, styles.chatPreviewEmpty]} numberOfLines={1}>
          Aún no hay mensajes. ¡Rompe el hielo!
        </Text>
      </View>
    );
  } else {
    preview = (
      <Text style={styles.chatPreview} numberOfLines={1}>
        <Text style={styles.chatPreviewAlias}>{last.mine ? 'Tú' : last.alias}: </Text>
        {last.kind === 'pista' ? '💡 ' : ''}
        {last.text}
      </Text>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.chatRow, archived && styles.chatRowArchived]}
      onPress={() => onPress(room)}
      activeOpacity={0.85}
      accessibilityLabel={`Chat de ${room.name}${room.unread ? `, ${room.unread} sin leer` : ''}`}
    >
      <View style={[styles.chatEmojiBox, archived && { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.border }]}>
        <Text style={styles.chatEmoji}>{room.emoji}</Text>
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatTop}>
          <Text style={styles.chatName} numberOfLines={1}>
            {room.name}
          </Text>
          {!!last && <Text style={styles.chatTime}>{chatTime(last.at)}</Text>}
        </View>
        {preview}
        <View style={styles.chatBottom}>
          {archived ? (
            <View style={styles.aliasChip}>
              <History size={14} color={theme.colors.textMuted} />
              <Text style={styles.aliasChipText}>Finalizado {new Date(room.exchangeAt).getFullYear()}</Text>
            </View>
          ) : (
            <View style={styles.aliasChip}>
              <EyeOff size={14} color={theme.colors.primary} strokeWidth={2.2} />
              <Text style={styles.aliasChipText}>
                Tú: <Text style={styles.aliasChipStrong}>{room.myAlias}</Text>
              </Text>
            </View>
          )}
          {room.unread > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{room.unread > 99 ? '99+' : room.unread}</Text>
            </View>
          ) : !last && !archived ? (
            <Text style={styles.newText}>Nuevo</Text>
          ) : last?.mine && !archived ? (
            <CheckCheck size={18} color={theme.colors.accent} style={{ marginLeft: 'auto' }} />
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ChatRow;
