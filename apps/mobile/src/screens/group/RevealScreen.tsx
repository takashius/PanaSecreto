import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Animated, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, PartyPopper, Gift, Heart, VenetianMask, ListChecks, MessagesSquare, Banknote, Clock, MapPin } from 'lucide-react-native';
import { theme, revealStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { formatBudget } from '../../utils/format';
import type { GroupDetailView } from '../../types/session';
import { TipCard } from '../../components/common/TipCard';

/** Confeti decorativo fijo (posición %, color, tamaño, giro) */
const CONFETTI = [
  { top: '10%', left: '8%', c: theme.colors.secondary, s: 8, r: '20deg' },
  { top: '18%', left: '82%', c: theme.colors.coral, s: 10, r: '45deg' },
  { top: '70%', left: '12%', c: theme.colors.accent, s: 7, r: '10deg' },
  { top: '78%', left: '88%', c: theme.colors.secondary, s: 9, r: '60deg' },
  { top: '40%', left: '92%', c: theme.colors.accentLight, s: 6, r: '30deg' },
  { top: '48%', left: '4%', c: theme.colors.coral, s: 6, r: '75deg' },
] as const;

interface RevealScreenProps {
  group: GroupDetailView;
  onNavigateBack: () => void;
  onOpenWishlist: () => void;
  onOpenChat: () => void;
}

/** El Gran Día: se revela a quién le regalé y quién me regaló */
export const RevealScreen: React.FC<RevealScreenProps> = ({ group, onNavigateBack, onOpenWishlist, onOpenChat }) => {
  const insets = useSafeAreaInsets();
  const [pop] = useState(() => new Animated.Value(0.6));
  const reveal = group.reveal;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, [pop]);

  const openMap = () => {
    if (!group.location) return;
    const q = encodeURIComponent(`${group.location.name}, ${group.location.address}`);
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onNavigateBack} accessibilityLabel="Volver">
          <ArrowLeft size={24} color={theme.colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {group.emoji} {group.name}
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <View style={styles.hero}>
          {CONFETTI.map((c, i) => (
            <View
              key={i}
              style={[styles.confetti, { top: c.top, left: c.left, width: c.s, height: c.s * 1.6, backgroundColor: c.c, transform: [{ rotate: c.r }] }]}
            />
          ))}
          <View style={styles.heroChip}>
            <PartyPopper size={14} color={theme.colors.primary} />
            <Text style={styles.heroChipText}>INTERCAMBIO REVELADO</Text>
          </View>
          <Text style={styles.heroTitle}>¡Llegó el gran día! 🎄🎉</Text>
          <Text style={styles.heroText}>El misterio terminó. Descubre a quién le estuviste guardando el secreto… y quién te lo guardó a ti.</Text>
        </View>

        {reveal ? (
          <>
            <Animated.View style={[styles.personCard, styles.personCardGift, { transform: [{ scale: pop }] }]}>
              <View style={styles.eyebrow}>
                <Gift size={16} color={theme.colors.primary} strokeWidth={2.4} />
                <Text style={styles.eyebrowText}>LE REGALASTE A</Text>
              </View>
              <View style={styles.bigAvatar}>
                <Text style={styles.bigAvatarText}>{reveal.giftedTo.initials}</Text>
              </View>
              <Text style={styles.personName}>{reveal.giftedTo.fullname}</Text>
              <View style={styles.aliasPill}>
                <VenetianMask size={14} color={theme.colors.textSecondary} />
                <Text style={styles.aliasPillText}>Era «{reveal.giftedTo.alias}»</Text>
              </View>
              <TouchableOpacity style={styles.actionButton} onPress={onOpenWishlist} activeOpacity={0.85}>
                <ListChecks size={20} color={theme.colors.primary} strokeWidth={2.4} />
                <Text style={styles.actionButtonText}>Ver su lista de deseos</Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.personCard}>
              <View style={styles.eyebrow}>
                <Heart size={16} color={theme.colors.coral} fill={theme.colors.coral} />
                <Text style={styles.eyebrowText}>TE REGALÓ</Text>
              </View>
              <View style={[styles.bigAvatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.bigAvatarText}>{reveal.giftedBy.initials}</Text>
              </View>
              <Text style={styles.personName}>{reveal.giftedBy.fullname}</Text>
              <Text style={styles.personText}>Era «Tu amigo secreto», el que te preguntaba en los comentarios. ¡Dale las gracias!</Text>
              <TouchableOpacity style={[styles.actionButton, styles.actionButtonOutline]} onPress={onOpenChat} activeOpacity={0.85}>
                <MessagesSquare size={20} color={theme.colors.primary} strokeWidth={2.2} />
                <Text style={styles.actionButtonText}>Agradecer en el chat</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.personCard}>
            <Image source={BRAND_ISOTIPO} style={{ width: 72, height: 72, borderRadius: 20 }} />
            <Text style={styles.personText}>La revelación todavía no está disponible para este grupo.</Text>
          </View>
        )}

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Detalles del encuentro</Text>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Banknote size={20} color={theme.colors.accentDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Presupuesto acordado</Text>
              <Text style={styles.detailValue}>{formatBudget(group.currency, group.budgetMin, group.budgetMax)}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Clock size={20} color={theme.colors.accentDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Hora pactada · ¡puntualidad, pana!</Text>
              <Text style={styles.detailValue}>
                {group.exchangeDateLabel} · {group.exchangeTimeLabel}
              </Text>
            </View>
          </View>
          {!!group.location && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MapPin size={20} color={theme.colors.accentDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Lugar del intercambio</Text>
                <Text style={styles.detailValue}>{group.location.name}</Text>
                <Text style={styles.detailLabel}>{group.location.address}</Text>
              </View>
              <TouchableOpacity onPress={openMap}>
                <Text style={styles.linkText}>Ver mapa</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TipCard
          screen="revelacion"
          fallback="Toma fotos del intercambio y compártelas en el chat del grupo antes de cerrarlo."
          style={{ marginBottom: 16 }}
        />

        <View style={styles.thanks}>
          <Image source={BRAND_ISOTIPO} style={{ width: 48, height: 48, borderRadius: 14 }} />
          <Text style={styles.thanksText}>¡Gracias por jugar limpio y cero sapos! Nos vemos en la próxima parranda. 🦜</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RevealScreen;
