import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { CalendarDays, Gift, Lock, Hand, MailCheck } from 'lucide-react-native';
import { theme, envelopeStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { HowItWorks } from './HowItWorks';

interface Props {
  exchangeDateLong: string;
  budgetLabel: string;
  year: number;
  onOpen: () => void;
}

/** Después del sorteo, antes de abrirlo: sobre amarillo con sello de la guacamaya */
export const SealedEnvelope: React.FC<Props> = ({ exchangeDateLong, budgetLabel, year, onOpen }) => {
  // Valores animados creados una sola vez (useState con inicializador perezoso)
  const [scale] = useState(() => new Animated.Value(1));
  const [opacity] = useState(() => new Animated.Value(1));
  const [opening, setOpening] = useState(false);
  const [half, setHalf] = useState(150);

  // Pequeña animación de "romper el sello" antes de mostrar el contenido
  const handleOpen = () => {
    if (opening) return;
    setOpening(true);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.06, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.85, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]),
    ]).start(() => onOpen());
  };

  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <View style={styles.dateChip}>
          <CalendarDays size={16} color={theme.colors.accentDark} strokeWidth={2.4} />
          <Text style={styles.dateChipText}>DESTAPE: {exchangeDateLong.toUpperCase()}</Text>
        </View>

        <Animated.View style={{ transform: [{ scale }], opacity }}>
          <TouchableOpacity activeOpacity={0.9} onPress={handleOpen} accessibilityLabel="Abrir mi sobre">
            <View style={styles.envelope} onLayout={(e) => setHalf(e.nativeEvent.layout.width / 2)}>
              <View style={[styles.envelopeFlapLeft, { borderLeftWidth: half }]} />
              <View style={[styles.envelopeFlapRight, { borderRightWidth: half }]} />
              <View style={styles.envelopeRibbon}>
                <Text style={styles.envelopeRibbonText}>PANA {year}</Text>
              </View>
              <View style={styles.seal}>
                <Image source={BRAND_ISOTIPO} style={styles.sealImage} />
                <View style={styles.tapBadge}>
                  <Hand size={13} color={theme.colors.coral} strokeWidth={2.4} />
                  <Text style={styles.tapBadgeText}>Toca</Text>
                </View>
              </View>
              <View style={styles.confidentialStrip}>
                <Gift size={22} color={theme.colors.coral} strokeWidth={2.2} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.confidentialLabel}>DESTINATARIO CONFIDENCIAL</Text>
                  <Text style={styles.confidentialTitle}>Tu amigo secreto asignado</Text>
                </View>
                <Lock size={20} color={theme.colors.secondaryDark} strokeWidth={2.2} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.bigTitle}>¡Ya te tocó un pana!</Text>
        <Text style={styles.lead}>
          Toca el sello para abrir tu sobre. Solo tú vas a ver a quién te toca regalarle en este intercambio.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleOpen} activeOpacity={0.85} disabled={opening}>
          <MailCheck size={24} color={theme.colors.primary} strokeWidth={2.4} />
          <Text style={styles.primaryButtonText}>Abrir mi sobre ✨</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>🔒 El sobre queda guardado para revisarlo cuando quieras</Text>
      </View>

      <HowItWorks exchangeDateLong={exchangeDateLong} budgetLabel={budgetLabel} />
    </View>
  );
};

export default SealedEnvelope;
