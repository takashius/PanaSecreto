import React from 'react';
import { View, Text } from 'react-native';
import { ShieldCheck, Banknote } from 'lucide-react-native';
import { theme, envelopeStyles as styles } from '../../styles';

interface Props {
  exchangeDateLong: string;
  budgetLabel: string;
}

const STEPS = [
  { title: 'Abre el sobre ✉️', text: 'Descubre el alias secreto de tu pana asignado.' },
  { title: 'Revisa sus deseos 🎯', text: 'Mira qué le gusta y pregúntale en los comentarios de cada deseo si tienes dudas de talla o color.' },
  { title: 'Compra el regalo 🛍️', text: '' },
];

/** Anonimato + "¿Cómo funciona el intercambio?" + presupuesto */
export const HowItWorks: React.FC<Props> = ({ exchangeDateLong, budgetLabel }) => (
  <>
    <View style={[styles.card, styles.infoRow]}>
      <View style={styles.infoIcon}>
        <ShieldCheck size={26} color={theme.colors.primary} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoTitle}>Anonimato 100% blindado 🛡️</Text>
        <Text style={styles.infoText}>
          Tu pana nunca sabrá que eres tú hasta el {exchangeDateLong} en la parranda. ¡Cero sapos en{' '}
          <Text style={styles.strong}>EntrePanas</Text>!
        </Text>
      </View>
    </View>

    <View style={styles.card}>
      <View style={styles.stepsHeader}>
        <Text style={[styles.infoTitle, { flex: 1 }]}>¿Cómo funciona el intercambio?</Text>
        <View style={styles.stepsBadge}>
          <Text style={styles.stepsBadgeText}>3 pasos</Text>
        </View>
      </View>
      {STEPS.map((step, i) => (
        <View key={step.title} style={styles.step}>
          <View style={[styles.stepNumber, i === 1 && styles.stepNumberAlt]}>
            <Text style={styles.stepNumberText}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepText}>
              {i === 2 ? (
                <>
                  Respeta el presupuesto acordado del grupo: <Text style={styles.strong}>{budgetLabel}</Text>.
                </>
              ) : (
                step.text
              )}
            </Text>
          </View>
        </View>
      ))}
    </View>

    <View style={styles.budgetStrip}>
      <Banknote size={20} color={theme.colors.secondaryDark} strokeWidth={2.2} />
      <Text style={styles.budgetStripText}>
        Presupuesto del grupo: <Text style={styles.strong}>{budgetLabel}</Text> · Intercambio en persona
      </Text>
    </View>
  </>
);

export default HowItWorks;
