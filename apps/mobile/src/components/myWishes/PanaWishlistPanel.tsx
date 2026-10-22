import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { VenetianMask, MailOpen, Lock, ArrowRight } from 'lucide-react-native';
import { theme, myWishesStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import { WishPreviewRow } from '../envelope/WishPreviewRow';
import type { EnvelopeView, GroupStatus, WishPreview } from '../../types/session';

interface Props {
  groupName: string;
  status: GroupStatus;
  envelope?: EnvelopeView | null;
  opened: boolean;
  onOpenEnvelope: () => void;
  onOpenWish: (wish: WishPreview) => void;
}

/** "Lista de mi pana" dentro de Deseos: lo que quiere la persona a la que le regalo en este grupo */
export const PanaWishlistPanel: React.FC<Props> = ({ groupName, status, envelope, opened, onOpenEnvelope, onOpenWish }) => {
  // Antes del sorteo todavía no hay a quién regalarle
  if (status === 'WAITING' || !envelope) {
    return (
      <View style={styles.emptyCard}>
        <View style={[styles.panaIcon, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
          <Lock size={24} color={theme.colors.outline} />
        </View>
        <Text style={styles.emptyTitle}>Aún no hay sorteo</Text>
        <Text style={styles.emptyText}>
          Cuando se haga el sorteo de {groupName}, aquí verás la lista de deseos de tu pana secreto.
        </Text>
      </View>
    );
  }

  // Sorteo hecho, pero el sobre sigue cerrado
  if (!opened) {
    return (
      <View style={styles.emptyCard}>
        <Image source={BRAND_ISOTIPO} style={styles.emptyMascot} />
        <Text style={styles.emptyTitle}>¡Ya te tocó un pana!</Text>
        <Text style={styles.emptyText}>Abre tu sobre para descubrir su alias y ver qué le gustaría recibir.</Text>
        <TouchableOpacity style={[styles.replyButton, { marginTop: 6, paddingHorizontal: 20, paddingVertical: 12 }]} onPress={onOpenEnvelope}>
          <MailOpen size={18} color={theme.colors.primary} strokeWidth={2.4} />
          <Text style={styles.replyButtonText}>Abrir mi sobre</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const name = envelope.revealedName ?? envelope.alias;
  return (
    <>
      <TouchableOpacity style={styles.panaCard} onPress={onOpenEnvelope} activeOpacity={0.85}>
        <View style={styles.panaIcon}>
          <VenetianMask size={26} color={theme.colors.secondary} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.panaEyebrow}>{envelope.revealedName ? 'LE REGALASTE A' : 'LE REGALAS A'}</Text>
          <Text style={styles.panaAlias}>{name}</Text>
        </View>
        <ArrowRight size={20} color={theme.colors.primary} />
      </TouchableOpacity>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Lo que quiere tu pana</Text>
        <View style={styles.listCount}>
          <Text style={styles.listCountText}>
            {envelope.wishes.length} {envelope.wishes.length === 1 ? 'deseo' : 'deseos'}
          </Text>
        </View>
      </View>

      {envelope.wishes.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Todavía no ha agregado deseos</Text>
          <Text style={styles.emptyText}>Te avisaremos cuando agregue el primero. Mientras, dale una pista en el chat del grupo.</Text>
        </View>
      ) : (
        envelope.wishes.map((w) => <WishPreviewRow key={w.id} wish={w} onPress={onOpenWish} />)
      )}
    </>
  );
};

export default PanaWishlistPanel;
