import React from 'react';
import { View, Text } from 'react-native';
import { CheckCheck, Lightbulb } from 'lucide-react-native';
import { theme, chatsStyles as styles } from '../../styles';
import type { ChatMessage } from '../../types/session';

const hour = (iso: string) => new Date(iso).toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit' });

interface Props {
  message: ChatMessage;
  /** Muestra "Entregado" debajo (solo en mi último mensaje) */
  showDelivered?: boolean;
}

/** Burbuja del chat grupal: los demás a la izquierda con su alias; yo a la derecha en azul marino */
export const MessageBubble: React.FC<Props> = ({ message, showDelivered }) => {
  const pista = message.kind === 'pista';

  if (message.mine) {
    return (
      <View style={styles.mineRow}>
        <View style={styles.bubbleMeta}>
          <Text style={styles.bubbleTime}>{hour(message.at)}</Text>
          <Text style={[styles.bubbleAlias, styles.bubbleAliasMine]}>Tú ({message.alias})</Text>
        </View>
        <View style={[styles.bubbleMine, pista && styles.bubbleMinePista]}>
          {pista && (
            <View style={styles.pistaLabel}>
              <Lightbulb size={13} color={theme.colors.secondary} />
              <Text style={[styles.pistaLabelText, { color: theme.colors.secondary }]}>PISTA PARA QUIEN ME REGALA</Text>
            </View>
          )}
          <Text style={styles.bubbleTextMine}>{message.text}</Text>
        </View>
        {showDelivered && (
          <View style={styles.delivered}>
            <Text style={styles.deliveredText}>Entregado</Text>
            <CheckCheck size={14} color={theme.colors.accent} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.otherRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarEmoji}>{message.avatar}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.bubbleMeta}>
          <Text style={styles.bubbleAlias}>{message.alias}</Text>
          <Text style={styles.bubbleTime}>{hour(message.at)}</Text>
        </View>
        <View style={[styles.bubble, pista && styles.bubblePista]}>
          {pista && (
            <View style={styles.pistaLabel}>
              <Lightbulb size={13} color={theme.colors.secondaryDark} />
              <Text style={styles.pistaLabelText}>PISTA PARA QUIEN LE REGALA</Text>
            </View>
          )}
          <Text style={styles.bubbleText}>{message.text}</Text>
        </View>
      </View>
    </View>
  );
};

export default MessageBubble;
