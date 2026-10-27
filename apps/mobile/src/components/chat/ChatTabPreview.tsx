import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MessagesSquare, VenetianMask } from 'lucide-react-native';
import { theme, groupDetailStyles, chatsStyles as styles } from '../../styles';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '../../types/session';

export interface ChatPreviewData {
  myAlias: string | null;
  unread: number;
  /** Últimos mensajes de la sala (del más viejo al más nuevo) */
  messages: ChatMessage[];
  loading?: boolean;
}

interface Props {
  preview?: ChatPreviewData | null;
  onOpen: () => void;
}

/** Pestaña "Chat" del detalle del grupo: últimos mensajes y acceso a la sala completa */
export const ChatTabPreview: React.FC<Props> = ({ preview, onOpen }) => {
  const recent = preview?.messages.slice(-3) ?? [];

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.protectBanner}>
        <View style={styles.protectIcon}>
          <VenetianMask size={20} color={theme.colors.primary} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.protectTitle}>
            {preview?.myAlias ? `En este grupo eres ${preview.myAlias}` : 'Chat anónimo del grupo'}
          </Text>
          <Text style={styles.protectText}>Un solo chat por grupo, con alias secretos hasta la revelación.</Text>
        </View>
      </View>

      {preview?.loading && recent.length === 0 ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : recent.length > 0 ? (
        recent.map((m) => <MessageBubble key={m.id} message={m} />)
      ) : (
        <Text style={[groupDetailStyles.bodyText, { textAlign: 'center' }]}>Aún no hay mensajes. ¡Rompe el hielo!</Text>
      )}

      <TouchableOpacity style={groupDetailStyles.drawButton} onPress={onOpen} activeOpacity={0.85}>
        <MessagesSquare size={22} color={theme.colors.primary} strokeWidth={2.4} />
        <Text style={[groupDetailStyles.drawButtonText, { fontSize: theme.typography.fontSize.xl }]}>
          {preview && preview.unread > 0 ? `Entrar al chat · ${preview.unread} nuevos` : 'Entrar al chat'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChatTabPreview;
