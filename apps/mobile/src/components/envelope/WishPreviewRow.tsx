import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { ChevronRight, MessageSquareText, CircleHelp } from 'lucide-react-native';
import { theme, envelopeStyles as styles } from '../../styles';
import { WISH_CATEGORIES } from '../../constants/wishCategories';
import type { WishPreview } from '../../types/session';

const CURRENCY = { USD: '$', VES: 'Bs. ' } as const;

interface Props {
  wish: WishPreview;
  onPress: (wish: WishPreview) => void;
}

/** Fila de un deseo en la lista de mi pana: foto o ícono, precio y estado de comentarios */
export const WishPreviewRow: React.FC<Props> = ({ wish, onPress }) => {
  const cat = WISH_CATEGORIES[wish.category];
  const Icon = cat.icon;

  return (
    <TouchableOpacity
      style={styles.wishRow}
      onPress={() => onPress(wish)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${wish.title}, ver detalle`}
    >
      <View style={[styles.wishThumb, { backgroundColor: cat.bg }]}>
        {wish.imageUrl ? (
          <Image source={{ uri: wish.imageUrl }} style={styles.wishImage} />
        ) : (
          <Icon size={26} color={cat.color} strokeWidth={2.2} />
        )}
      </View>

      <View style={styles.wishInfo}>
        <Text style={styles.wishTitle} numberOfLines={1}>
          {wish.title}
        </Text>
        <View style={styles.wishMeta}>
          {wish.price != null && (
            <Text style={styles.wishPrice}>
              ~{CURRENCY[wish.currency]}
              {wish.price.toLocaleString('es-VE')}
            </Text>
          )}
          {wish.commentsCount > 0 ? (
            <View style={styles.commentsChip}>
              <MessageSquareText size={13} color={theme.colors.accentDark} strokeWidth={2.2} />
              <Text style={styles.commentsChipText}>
                {wish.commentsCount} {wish.commentsCount === 1 ? 'comentario' : 'comentarios'}
              </Text>
            </View>
          ) : wish.note ? (
            <Text style={styles.wishNote} numberOfLines={1}>
              {wish.note}
            </Text>
          ) : (
            <View style={styles.askChip}>
              <CircleHelp size={13} color={theme.colors.secondaryDark} strokeWidth={2.2} />
              <Text style={styles.askChipText}>Pregúntale algo</Text>
            </View>
          )}
        </View>
      </View>

      <ChevronRight size={20} color={theme.colors.outline} />
    </TouchableOpacity>
  );
};

export default WishPreviewRow;
