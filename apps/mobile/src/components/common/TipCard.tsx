import React from 'react';
import { View, Text, Image, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import { tipStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { useTip } from '../../hooks/useTip';
import type { TipScreen } from '../../api/tips';

interface TipCardProps {
  /** Clave de pantalla del backend (los tips se administran en el panel) */
  screen: TipScreen;
  /** Texto si el servidor no responde o no hay tips para esta pantalla */
  fallback: string;
  eyebrow?: string;
  /** Fondo azul marino (para pantallas con tarjetas claras alrededor) */
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** "Tip del pana": un tip al azar del servidor; al tocarlo muestra otro */
export const TipCard: React.FC<TipCardProps> = ({ screen, fallback, eyebrow = 'TIP DEL PANA', dark = false, style }) => {
  const tip = useTip(screen, fallback);
  return (
    <TouchableOpacity
      style={[styles.card, dark && styles.cardDark, style]}
      onPress={tip.next}
      disabled={!tip.canCycle}
      activeOpacity={0.85}
      accessibilityRole={tip.canCycle ? 'button' : undefined}
      accessibilityLabel={tip.canCycle ? `Tip: ${tip.text}. Toca para ver otro` : `Tip: ${tip.text}`}
    >
      <Image source={BRAND_ISOTIPO} style={styles.mascot} />
      <View style={styles.body}>
        <Text style={[styles.eyebrow, dark && styles.eyebrowDark]}>{eyebrow}</Text>
        <Text style={[styles.text, dark && styles.textDark]}>{tip.text}</Text>
        {tip.canCycle && <Text style={[styles.hint, dark && styles.hintDark]}>Toca para otro tip</Text>}
      </View>
    </TouchableOpacity>
  );
};

export default TipCard;
