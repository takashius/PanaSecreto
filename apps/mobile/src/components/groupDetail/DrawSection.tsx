import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Hourglass, MailOpen } from 'lucide-react-native';
import { theme, groupDetailStyles as styles } from '../../styles';
import { BRAND_ISOTIPO } from '../../constants/brand';
import type { GroupStatus } from '../../types/session';

const MIN_MEMBERS = 3;

interface Props {
  status: GroupStatus;
  isOrganizer: boolean;
  organizerName: string;
  membersCount: number;
  onDraw: () => void;
  onOpenEnvelope: () => void;
}

/** Acción principal según estado y rol: hacer el sorteo, esperar o ir al sobre */
export const DrawSection: React.FC<Props> = ({ status, isOrganizer, organizerName, membersCount, onDraw, onOpenEnvelope }) => {
  if (status === 'WAITING' && isOrganizer) {
    const canDraw = membersCount >= MIN_MEMBERS;
    return (
      <View style={{ gap: 10 }}>
        <TouchableOpacity
          style={[styles.drawButton, !canDraw && styles.drawButtonDisabled]}
          onPress={onDraw}
          disabled={!canDraw}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.drawButtonEmoji}>🎲</Text>
          <Text style={styles.drawButtonText}>Hacer el sorteo</Text>
        </TouchableOpacity>
        <Text style={styles.drawHint}>
          {canDraw
            ? 'Mínimo 3 panas. Al hacer el sorteo se cerrarán las inscripciones y se generarán los sobres secretos con anonimato 100% blindado.'
            : `Necesitas al menos ${MIN_MEMBERS} panas para hacer el sorteo. ¡Invita a más gente!`}
        </Text>
      </View>
    );
  }

  if (status === 'WAITING') {
    return (
      <View style={[styles.sectionCard, styles.waitingBox]}>
        <Hourglass size={22} color={theme.colors.secondaryDark} strokeWidth={2.2} />
        <Text style={[styles.bodyText, { flex: 1 }]}>
          Esperando que <Text style={styles.bodyStrong}>{organizerName}</Text> haga el sorteo. Mientras tanto, arma tu lista
          de deseos.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.sectionCard, styles.waitingBox]}>
      <Image source={BRAND_ISOTIPO} style={{ width: 44, height: 44, borderRadius: 12 }} />
      <Text style={[styles.bodyText, { flex: 1 }]}>
        {status === 'LOCKED' ? '¡Ya se hizo el sorteo! Tu sobre te espera.' : 'Ya se revelaron los amigos secretos.'}
      </Text>
      <TouchableOpacity style={styles.pillButton} onPress={onOpenEnvelope} activeOpacity={0.8}>
        <MailOpen size={16} color={theme.colors.accentDark} strokeWidth={2.2} />
        <Text style={styles.pillButtonText}>Mi sobre</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DrawSection;
