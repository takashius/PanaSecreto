import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Timer, CalendarDays, MailCheck, VenetianMask, Banknote, Lock, PartyPopper } from 'lucide-react-native';
import { theme, envelopeStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { useCountdown } from '../../hooks/useCountdown';
import { WishPreviewRow } from './WishPreviewRow';
import type { EnvelopeView, WishPreview } from '../../types/session';
import { useTip } from '../../hooks/useTip';

interface Props {
  envelope: EnvelopeView;
  budgetMaxLabel: string;
  onOpenWish: (wish: WishPreview) => void;
  /** Solo después de la revelación */
  onOpenReveal?: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Sobre abierto: cuenta regresiva, alias de mi pana y su lista de deseos */
export const OpenedEnvelope: React.FC<Props> = ({ envelope, budgetMaxLabel, onOpenWish, onOpenReveal }) => {
  const tip = useTip('sobre.lista', 'Pregunta la talla o el color en los comentarios de cada deseo. Tu pana no sabrá que eres tú.');
  const t = useCountdown(envelope.exchangeAt);
  const revealed = !!envelope.revealedName;
  const cells = [
    { value: pad(t.days), unit: 'Días' },
    { value: pad(t.hours), unit: 'Horas' },
    { value: pad(t.minutes), unit: 'Min' },
    { value: pad(t.seconds), unit: 'Seg', accent: true },
  ];

  return (
    <View style={styles.stack}>
      {!t.done && !revealed && (
        <View style={styles.card}>
          <View style={styles.countdownLabel}>
            <Timer size={20} color={theme.colors.secondary} strokeWidth={2.4} />
            <Text style={styles.countdownLabelText}>DESTAPE OFICIAL EN</Text>
          </View>
          <View style={styles.countdownRow}>
            {cells.map((c) => (
              <View key={c.unit} style={styles.countdownCell}>
                <Text style={[styles.countdownValue, c.accent && { color: theme.colors.coral }]}>{c.value}</Text>
                <Text style={styles.countdownUnit}>{c.unit}</Text>
              </View>
            ))}
          </View>
          <View style={styles.countdownDate}>
            <CalendarDays size={18} color={theme.colors.textSecondary} strokeWidth={2.2} />
            <Text style={styles.countdownDateText}>
              {envelope.exchangeDateLong.charAt(0).toUpperCase() + envelope.exchangeDateLong.slice(1)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.giftCard}>
        <View style={styles.giftGlow} />
        <View>
          <View style={styles.giftIcon}>
            {revealed ? (
              <PartyPopper size={32} color={theme.colors.coral} strokeWidth={2.2} />
            ) : (
              <MailCheck size={32} color={theme.colors.secondary} strokeWidth={2.4} />
            )}
          </View>
          <View style={styles.giftMask}>
            <VenetianMask size={15} color={theme.colors.white} strokeWidth={2.2} />
          </View>
        </View>
        <Text style={styles.giftEyebrow}>{revealed ? 'LE REGALASTE A' : 'LE REGALAS A'}</Text>
        <Text style={styles.giftAlias}>{revealed ? envelope.revealedName : envelope.alias}</Text>
        <Text style={styles.giftText}>
          {revealed
            ? `Era ${envelope.alias}. ¡Ya no hay secretos!`
            : `Su identidad se revelará el ${envelope.exchangeDateLong}. Mientras tanto, guíate por su lista de deseos.`}
        </Text>
        {revealed && onOpenReveal && (
          <TouchableOpacity style={[styles.primaryButton, { marginTop: 14 }]} onPress={onOpenReveal} activeOpacity={0.85}>
            <PartyPopper size={22} color={theme.colors.primary} strokeWidth={2.4} />
            <Text style={styles.primaryButtonText}>Ver la revelación</Text>
          </TouchableOpacity>
        )}
        <View style={styles.budgetPill}>
          <Banknote size={18} color={theme.colors.secondaryDark} strokeWidth={2.2} />
          <Text style={styles.budgetPillText}>Presupuesto {budgetMaxLabel}</Text>
        </View>
      </View>

      <View style={styles.listHeader}>
        <View style={styles.listTitleRow}>
          <Text style={styles.listTitle}>Lista de deseos de tu pana</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{envelope.wishes.length}</Text>
          </View>
        </View>
        <Text style={styles.listSubtitle}>Toca un regalo para ver detalles o preguntar</Text>
      </View>

      {envelope.wishes.length > 0 ? (
        envelope.wishes.map((w) => <WishPreviewRow key={w.id} wish={w} onPress={onOpenWish} />)
      ) : (
        <View style={styles.emptyWishes}>
          <Text style={styles.infoTitle}>Tu pana aún no ha agregado deseos</Text>
          <Text style={[styles.infoText, { textAlign: 'center' }]}>
            Te avisaremos cuando agregue el primero. Mientras tanto, puedes darle una pista en el chat del grupo.
          </Text>
        </View>
      )}

      <View style={[styles.card, styles.tipRow]}>
        <Image source={BRAND_ISOTIPO} style={styles.tipMascot} />
        <View style={styles.tipBubble}>
          <Text style={styles.infoText}>
            <Text style={styles.strong}>¡Tip del pana! </Text>
            {tip.text}
          </Text>
        </View>
      </View>

      {!revealed && (
        <View style={styles.footerNote}>
          <Lock size={16} color={theme.colors.textMuted} strokeWidth={2.2} />
          <Text style={styles.footerNoteText}>Quién te regala a ti también es secreto hasta la revelación.</Text>
        </View>
      )}
    </View>
  );
};

export default OpenedEnvelope;
