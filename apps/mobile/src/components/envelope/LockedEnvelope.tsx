import React from 'react';
import { View, Text } from 'react-native';
import { Lock } from 'lucide-react-native';
import { theme, envelopeStyles as styles } from '../../styles';
import { HowItWorks } from './HowItWorks';

interface Props {
  organizerName: string;
  isOrganizer: boolean;
  exchangeDateLong: string;
  budgetLabel: string;
}

/** Antes del sorteo: el sobre todavía no existe */
export const LockedEnvelope: React.FC<Props> = ({ organizerName, isOrganizer, exchangeDateLong, budgetLabel }) => (
  <View style={styles.stack}>
    <View style={[styles.card, styles.centered]}>
      <View style={styles.lockedEnvelope}>
        <Lock size={30} color={theme.colors.outline} strokeWidth={2.2} />
      </View>
      <Text style={styles.bigTitle}>Tu sobre aún no está listo</Text>
      <Text style={styles.lead}>
        {isOrganizer
          ? 'Cuando hagas el sorteo desde el Resumen, cada pana recibirá su sobre secreto.'
          : `Se arma cuando ${organizerName} haga el sorteo. Te avisamos apenas esté listo.`}
      </Text>
    </View>
    <HowItWorks exchangeDateLong={exchangeDateLong} budgetLabel={budgetLabel} />
  </View>
);

export default LockedEnvelope;
