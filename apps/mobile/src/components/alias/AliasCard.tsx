import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { aliasPickerStyles as styles } from '../../styles';

interface Props {
  alias: string | null;
  emoji: string | null;
  /** Antes del sorteo se puede elegir o cambiar */
  editable: boolean;
  onPress: () => void;
}

/** "Tu alias en este grupo" dentro del detalle: elegirlo, cambiarlo o solo verlo tras el sorteo */
export const AliasCard: React.FC<Props> = ({ alias, emoji, editable, onPress }) => {
  if (!alias && !editable) return null;
  const pending = !alias;
  return (
    <View style={[styles.card, pending && styles.cardPending]}>
      <View style={styles.cardEmojiBox}>
        <Text style={{ fontSize: 24 }}>{pending ? '🥸' : emoji || '🎁'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardLabel}>Tu alias en este grupo</Text>
        {pending ? (
          <Text style={styles.cardText}>Aún no lo eliges. Si no, te tocará uno al azar en el sorteo.</Text>
        ) : (
          <Text style={styles.cardAlias} numberOfLines={1}>
            {alias}
          </Text>
        )}
      </View>
      {editable && (
        <TouchableOpacity style={styles.cardButton} onPress={onPress} activeOpacity={0.85} accessibilityRole="button">
          <Text style={styles.cardButtonText}>{pending ? 'Elegir' : 'Cambiar'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AliasCard;
